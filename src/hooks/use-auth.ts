import { supabase, setupAuthListeners } from "@/lib/auth";
import { client } from "@/lib/client";
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

      await syncAuthSession({
        userId: user.id,
        email: user.email ?? "",
        name: user.user_metadata?.full_name ?? "User",
        emailVerified: user.email_confirmed_at
          ? new Date(user.email_confirmed_at).toISOString()
          : null,
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
      await logout();

      // 2. Clear Supabase auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 4. Reset redux store
      dispatch(resetState());

      // 3. Clear Redux persist storage
      persistor.purge();

      // 5. Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.clear();
      }

      // 6. Redirect dan refresh
      router.replace(options.redirectTo || "/auth/signin");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setError({
        message: err instanceof Error ? err.message : "Failed to sign out",
      });
      // Tetap lanjutkan logout client-side meskipun ada error di server
      router.replace(options.redirectTo || "/auth/signin");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signOut,
    isLoading,
    error,
  };
};
