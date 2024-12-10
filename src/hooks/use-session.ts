// src/hooks/use-session.ts
import { useState, useEffect, useCallback } from "react";
import { Session, SessionError } from "@/types";
import { getSession, supabase } from "@/lib/auth";

interface RawSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    emailVerified?: string | Date | null;
  };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<SessionError | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedSession = (await getSession()) as RawSession | null;

      if (fetchedSession?.user) {
        const safeSession: Session = {
          user: {
            id: fetchedSession.user.id,
            email: fetchedSession.user.email,
            name: fetchedSession.user.name ?? null,
            emailVerified: fetchedSession.user.emailVerified
              ? new Date(fetchedSession.user.emailVerified)
              : null,
          },
        };
        setSession(safeSession);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error("Session fetch error:", err);
      setError(
        err instanceof Error
          ? (err as SessionError)
          : (new Error("Failed to fetch session") as SessionError)
      );
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto refresh window setiap 50 menit (10 menit sebelum token expire)
  useEffect(() => {
    if (!session) return;

    const refreshTimer = setInterval(() => {
      window.location.reload();
    }, 50 * 60 * 1000); // 50 menit

    return () => clearInterval(refreshTimer);
  }, [session]);
  // Listen untuk auth state changes
  useEffect(() => {
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("Auth state changed:", event);
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        await fetchSession();
      } else if (event === "SIGNED_OUT") {
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession]);

  return {
    session,
    isLoading,
    error,
    refetch: fetchSession,
  };
}
