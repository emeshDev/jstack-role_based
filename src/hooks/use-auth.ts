import { supabase, setupAuthListeners } from "@/lib/auth";
import { getDeviceId } from "@/lib/device";
import { useLogoutMutation, useSyncAuthSessionMutation } from "@/lib/store/api";
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

      // 1. Clear database session menggunakan auth header dari client.ts
      await logout();

      // 2. Clear Supabase session
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) throw supabaseError;

      // 3. Reset redux store
      dispatch(resetState());

      // 4. Clear Redux persist storage
      await persistor.purge();

      // 5. Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
      }

      // 6. Hard redirect
      if (typeof window !== "undefined") {
        const redirectPath = options.redirectTo || "/auth/signin";
        window.location.replace(redirectPath);
      }
    } catch (err) {
      console.error("Logout error:", err);
      setError({
        message: err instanceof Error ? err.message : "Failed to sign out",
      });

      if (typeof window !== "undefined") {
        window.location.replace(options.redirectTo || "/auth/signin");
      }
    }
  };

  return {
    signIn,
    signOut,
    isLoading,
    error,
  };
};
