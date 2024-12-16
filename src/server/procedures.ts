// src/server/procedures.ts
import { j } from "./__internals/j";
import { HTTPException } from "hono/http-exception";
import { supabase } from "../lib/auth";
import { Redis } from "@upstash/redis";
import { Role } from "@prisma/client";
import { db } from "@/db";
import { User } from "@supabase/supabase-js";
import { Bindings, getServerEnv } from "./env";

interface AuthContext {
  supabaseUser: User; // Gunakan tipe User dari @supabase/supabase-js
  token: string;
}

interface AuthContextWithRole extends AuthContext {
  userRole: Role;
}

const authMiddleware = j.middleware<{}, AuthContext>(async ({ c, next }) => {
  try {
    const cookieHeader = c.req.header("cookie");
    const cookies = cookieHeader
      ?.split(";")
      .reduce<Record<string, string>>((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) acc[key] = decodeURIComponent(value);
        return acc;
      }, {});

    // Dapatkan projectRef dari SUPABASE_URL
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
      /https:\/\/(.*?)\.supabase/
    )?.[1];
    if (!projectRef) {
      throw new Error("Invalid Supabase URL");
    }

    const fullAuthCookie = cookies?.[`sb-${projectRef}-auth-token`];

    if (!fullAuthCookie) {
      throw new HTTPException(401, { message: "Missing auth token" });
    }

    const authData = JSON.parse(fullAuthCookie);
    const accessToken = authData.access_token;

    if (!accessToken) {
      throw new HTTPException(401, { message: "Invalid auth data" });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new HTTPException(401, {
        message: error?.message || "Invalid or expired token",
      });
    }

    return next({
      supabaseUser: data.user,
      token: accessToken,
    });
  } catch (error) {
    throw new HTTPException(401, {
      message: error instanceof Error ? error.message : "Unauthorized",
    });
  }
});

// You can make any middlewares , such us rate limiting or server's webhook
// to Server's Middleware
// Memory fallback jika tidak ada Redis
class MemoryStore {
  private store: Map<string, { count: number; expires: number }>;

  constructor() {
    this.store = new Map();
  }

  async increment(key: string, ttl: number): Promise<number> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.expires < now) {
      this.store.set(key, {
        count: 1,
        expires: now + ttl * 1000,
      });
      return 1;
    }

    record.count += 1;
    return record.count;
  }

  async get(key: string): Promise<number | null> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.expires < now) {
      this.store.delete(key);
      return null;
    }

    return record.count;
  }
}

// // Helper untuk get env variables dengan prioritas
// const getEnvVar = (c: any, key: string): string => {
//   return c?.env[key] || process.env[key] || "";
// };
// Ubah helper getEnvVar
const getEnvVar = (c: any, key: string): string => {
  // Prioritaskan process.env karena kita tidak pakai edge
  return getServerEnv(key as keyof Bindings);
};

// Factory untuk rate limiter
const createRateLimiter = (c: any) => {
  let redis: Redis | null = null;
  let memoryStore: MemoryStore | null = null;

  try {
    // Coba inisialisasi Redis jika env tersedia
    const REDIS_URL = getEnvVar(c, "REDIS_URL");
    const REDIS_TOKEN = getEnvVar(c, "REDIS_TOKEN");

    if (REDIS_URL && REDIS_TOKEN) {
      redis = new Redis({
        url: REDIS_URL,
        token: REDIS_TOKEN,
      });
      console.log("✅ Redis rate limiter initialized");
    } else {
      // Fallback ke memory store
      memoryStore = new MemoryStore();
      console.log("ℹ️ Using memory rate limiter");
    }
  } catch (error) {
    console.warn("⚠️ Redis initialization failed, using memory store:", error);
    memoryStore = new MemoryStore();
  }

  return async (
    key: string
  ): Promise<{ current: number; isLimited: boolean }> => {
    const MAX_REQUESTS = 100;
    const WINDOW_SECONDS = 60 * 15; // 15 minutes

    try {
      let current: number;

      if (redis) {
        // Gunakan Redis jika tersedia
        current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, WINDOW_SECONDS);
        }
      } else {
        // Fallback ke memory store
        current = await memoryStore!.increment(key, WINDOW_SECONDS);
      }

      return {
        current,
        isLimited: current > MAX_REQUESTS,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Jika error, izinkan request (fail open)
      return { current: 1, isLimited: false };
    }
  };
};

// Rate limiting middleware dengan fallback
const rateLimitMiddleware = j.middleware(async ({ c, ctx, next }) => {
  try {
    // Inisialisasi rate limiter
    const rateLimiter = createRateLimiter(c);

    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "127.0.0.1";

    const key = `rate-limit:${ip}:${c.req.path}`;

    // Check rate limit
    const { current, isLimited } = await rateLimiter(key);

    if (isLimited) {
      throw new HTTPException(429, {
        message: "Too Many Requests",
      });
    }

    // Set headers
    c.header("X-RateLimit-Limit", "100");
    c.header("X-RateLimit-Remaining", (100 - current).toString());

    return next(ctx);
  } catch (error) {
    // Jika error adalah rate limit, throw
    if (error instanceof HTTPException && error.status === 429) {
      throw error;
    }

    // Untuk error lainnya, log dan lanjutkan
    console.error("Rate limiting error:", error);
    return next(ctx);
  }
});

const checkRole = (allowedRoles: Role[]) =>
  j.middleware<AuthContext, AuthContextWithRole>(async ({ c, ctx, next }) => {
    try {
      // Ambil role dari metadata Supabase dulu
      const userRole = ctx.supabaseUser.user_metadata?.role as Role;

      const user = await db.user.findUnique({
        where: { id: ctx.supabaseUser.id },
        select: { role: true },
      });

      if (!user) {
        throw new HTTPException(404, { message: "User not found" });
      }

      // Prioritaskan role dari database, fallback ke metadata jika perlu
      const effectiveRole = user.role || userRole || Role.USER;

      if (!allowedRoles.includes(effectiveRole)) {
        throw new HTTPException(403, {
          message: "You don't have permission to perform this action",
        });
      }

      return next({
        ...ctx,
        userRole: user.role,
      });
    } catch (error) {
      throw new HTTPException(401, {
        message: error instanceof Error ? error.message : "Unauthorized",
      });
    }
  });

export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure.use(rateLimitMiddleware);
export const privateProcedure = publicProcedure.use(authMiddleware);

// Predefined procedures for different role combinations
export const adminProcedure = privateProcedure.use(
  checkRole(["ADMIN", "SUPER_ADMIN"])
);

export const superAdminProcedure = privateProcedure.use(
  checkRole(["SUPER_ADMIN"])
);
