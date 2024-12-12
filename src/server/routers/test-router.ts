// src/server/routers/test-router.ts
import { router } from "../__internals/router";
import { publicProcedure } from "../procedures";
import { HTTPException } from "hono/http-exception";
import { Redis } from "@upstash/redis";

export const testRouter = router({
  "rate-limit": publicProcedure.query(async ({ c }) => {
    console.log("📝 Handler executing");
    return c.json({
      data: {
        ok: true,
        message: "Test endpoint",
      },
    });
  }),
});
