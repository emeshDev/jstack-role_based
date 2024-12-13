// src/server/routers/test-router.ts
import { router } from "../__internals/router";
import { publicProcedure } from "../procedures";
import { HTTPException } from "hono/http-exception";
import { Redis } from "@upstash/redis";

export const testRouter = router({
  "rate-limit": publicProcedure
    .use(async ({ c, ctx, next }) => {
      console.log("🔍 Rate limit middleware start");

      try {
        // Pastikan ada fallback
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
        console.log("Key:", key);

        const current = (await redis.get<number>(key)) || 0;
        console.log("Current count:", current);

        const RATE_LIMIT = 100;
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
        c.header(
          "X-RateLimit-Remaining",
          (RATE_LIMIT - current - 1).toString()
        );

        console.log("🔍 Rate limit check passed");
        return next(ctx);
      } catch (error) {
        console.error("⚠️ Rate limit error:", error);

        // Tambahkan penanganan error yang lebih spesifik
        if (error instanceof HTTPException) {
          throw error;
        }

        throw new HTTPException(500, {
          message: "Internal Server Error during rate limiting",
          cause: error,
        });
      }
    })
    .query(async ({ c }) => {
      console.log("📝 Handler executing");
      return c.json({
        data: {
          ok: true,
          message: "Test endpoint",
        },
      });
    }),
});
