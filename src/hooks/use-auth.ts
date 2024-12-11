"use client";
import { supabase, setupAuthListeners } from "@/lib/auth";
import { getDeviceId } from "@/lib/device";
import {
  useClearAuthCookiesMutation,
  useLogoutMutation,
  useSyncAuthSessionMutation,
} from "@/lib/store/api";
import { resetState } from "@/lib/store/rootReducer";
import { persistor } from "@/lib/store/store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

interface UseAuthOptions {
  redirectTo?: string;
}

interface AuthError {
  message: string;
}

export const useAuth = (options: UseAuthOptions = {}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [syncAuthSession] = useSyncAuthSessionMutation();
  const dispatch = useDispatch();
  const [logout] = useLogoutMutation();
  const [clearCookies] = useClearAuthCookiesMutation();

  useEffect(() => {
    setupAuthListeners();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session, user },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!session || !user) throw new Error("No session created");

      const deviceId = getDeviceId();
      if (!deviceId) throw new Error("Failed to generate device ID");

      await syncAuthSession({
        userId: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? "User",
        emailVerified: user.email_confirmed_at
          ? new Date(user.email_confirmed_at).toISOString()
          : null,
        deviceId,
      });

      if (options.redirectTo) {
        // Use Next.js router for client-side navigation
        router.push(options.redirectTo);
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to sign in",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      // 1. Clear database session
      await logout().unwrap();

      // 2. Reset redux store and storage
      dispatch(resetState());
      await persistor.purge();

      // 3. Clear Supabase session
      await supabase.auth.signOut();

      // 4. Direct redirect tanpa reload
      window.location.replace(options.redirectTo || "/auth/signin");
    } catch (err) {
      console.error("Sign out error:", err);

      // Force redirect even on error
      window.location.replace(options.redirectTo || "/auth/signin");
    } finally {
      // Make sure loading is set to false
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Langsung redirect ke verify-email page
      // Tidak perlu sync session dulu
      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Failed to sign up",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  return {
    signIn,
    signOut,
    signUp,
    isLoading,
    error,
  };
};
