import { j } from "./__internals/j";
import { HTTPException } from "hono/http-exception";
import { supabase } from "../lib/auth";

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

export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure;
export const privateProcedure = publicProcedure.use(authMiddleware);
