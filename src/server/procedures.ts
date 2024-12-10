import { j } from "./__internals/j";
import { HTTPException } from "hono/http-exception";
import { supabase } from "../lib/auth";
import { db } from "@/db";

const authMiddleware = j.middleware(async ({ c, next }) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "Missing auth token" });
    }

    const token = authHeader.split(" ")[1];

    // Verifikasi token
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new HTTPException(401, {
        message: error?.message || "Invalid or expired token",
      });
    }

    // Hanya attach data ke context
    return next({
      supabaseUser: data.user,
      token,
    });
  } catch (error) {
    throw new HTTPException(401, {
      message: error instanceof Error ? error.message : "Unauthorized",
    });
  }
});

export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure;
export const privateProcedure = publicProcedure.use(authMiddleware);
