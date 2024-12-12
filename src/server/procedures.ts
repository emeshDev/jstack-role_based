// src/server/procedures.ts
import { j } from "./__internals/j";
import { HTTPException } from "hono/http-exception";
import { supabase } from "../lib/auth";
import { Redis } from "@upstash/redis";

const authMiddleware = j.middleware(async ({ c, next }) => {
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
export const rateLimitMiddleware = j.middleware(async ({ c, next }) => {
  try {
    const redisUrl = c.env?.REDIS_URL || process.env.REDIS_URL;
    const redisToken = c.env?.REDIS_TOKEN || process.env.REDIS_TOKEN;

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
      automaticDeserialization: false,
    });

    const ip =
      c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "127.0.0.1";

    const key = `rate-limit:${ip}:${c.req.path}`;
    const RATE_LIMIT = 100;

    const current = (await redis.get<number>(key)) || 0;

    if (current >= RATE_LIMIT) {
      throw new HTTPException(429, {
        message: "Too Many Requests",
      });
    }

    await redis.incr(key);

    if (current === 0) {
      await redis.expire(key, 15 * 60);
    }

    c.header("X-RateLimit-Limit", RATE_LIMIT.toString());
    c.header("X-RateLimit-Remaining", (RATE_LIMIT - current - 1).toString());

    return next({});
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, {
      message: "Internal Server Error during rate limiting",
    });
  }
});

export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure.use(rateLimitMiddleware);
export const privateProcedure = publicProcedure.use(authMiddleware);
