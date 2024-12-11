// src/lib/auth.ts
import { createClient } from "@supabase/supabase-js";
import { store } from "./store/store";
import { api } from "./store/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie helper
const cookieStorage = {
  getItem: async (key: string) => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie
      .split("; ")
      .reduce<Record<string, string>>((acc, cookie) => {
        const [k, v] = cookie.split("=");
        if (k && v) acc[k] = decodeURIComponent(v);
        return acc;
      }, {});
    return cookies[key] || null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === "undefined") return Promise.resolve();
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; path=/; max-age=86400; secure; samesite=strict`;
    return Promise.resolve();
  },
  removeItem: async (key: string) => {
    if (typeof document === "undefined") return Promise.resolve();

    const removeCookie = (name: string) => {
      const cookies = [
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=-1; secure; samesite=strict`,
        `${name}=; path=/; domain=localhost; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=-1; secure; samesite=strict`,
      ];
      cookies.forEach((cookie) => {
        document.cookie = cookie;
      });
    };

    if (key === "supabase-auth-token") {
      const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase/)?.[1];
      removeCookie("supabase-auth-token");
      if (projectRef) {
        removeCookie(`sb-${projectRef}-auth-token`);
      }
    }
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
  },
});

export async function refreshSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      if (error.message !== "Auth session missing!") {
        console.error("Refresh session error:", error);
      }
      return null;
    }

    if (session) {
      try {
        // Gunakan RTK Query
        await store.dispatch(
          api.endpoints.updateSession.initiate({
            token: session.access_token,
            expiresAt: session.expires_at!,
          })
        );
      } catch (updateError) {
        console.error("Failed to update session in database:", updateError);
        // Tetap return session meski update gagal
      }

      return session;
    }

    return null;
  } catch (error) {
    console.error("Session refresh error:", error);
    return null;
  }
}

export async function getSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      // Hanya log error jika bukan masalah session missing
      if (error.message !== "Auth session missing!") {
        console.error("Get session error:", error);
      }
      return null;
    }

    if (!session) {
      return null; // Jika tidak ada session, biarkan komponen handle redirect
    }

    // Check jika session akan expire dalam 5 menit
    const expiresAt = new Date(session.expires_at! * 1000);
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt.getTime() - Date.now() < fiveMinutes) {
      return await refreshSession();
    }

    return session;
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

export const setupAuthListeners = () => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      // Clear database session
      console.log("User signed out");

      // Force clean any remaining cookies
      const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase/)?.[1];
      if (projectRef) {
        document.cookie = `sb-${projectRef}-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=-1`;
      }
      document.cookie = `supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=-1`;
    }

    if (event === "TOKEN_REFRESHED" && session) {
      try {
        // Gunakan store.dispatch karena ini bukan dalam context React
        await store.dispatch(
          api.endpoints.updateSession.initiate({
            token: session.access_token,
            expiresAt: session.expires_at!,
          })
        );
      } catch (error) {
        console.error("Failed to update session in database:", error);
      }
    }
  });
};
