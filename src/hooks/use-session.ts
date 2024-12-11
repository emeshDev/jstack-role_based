"use client";
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
    deviceId?: string | null;
  };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<SessionError | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      // Jangan set loading ke true setiap fetch
      // Hanya set loading di awal mounting
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
    }
  }, []);

  // Initial fetch saat mount
  useEffect(() => {
    setIsLoading(true);
    fetchSession().finally(() => {
      setIsLoading(false);
    });
  }, [fetchSession]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && session) {
        // Hanya fetch jika sebelumnya ada session
        await fetchSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSession, session]);

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      console.log("Auth state changed:", event);
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        await fetchSession();
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        window.location.reload();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession]);

  // Auto refresh token setiap 50 menit
  useEffect(() => {
    if (!session) return;

    const refreshTimer = setInterval(() => {
      fetchSession();
    }, 50 * 60 * 1000);

    return () => clearInterval(refreshTimer);
  }, [session, fetchSession]);

  return {
    session,
    isLoading,
    error,
    refetch: fetchSession,
  };
}
