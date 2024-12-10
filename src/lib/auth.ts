// src/lib/auth.ts
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { store } from "./store/store";
import { api } from "./store/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase-auth-token",
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
