"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/auth";
import { getDeviceId } from "@/lib/device";
import { useSyncAuthSessionMutation } from "@/lib/store/api";

export default function AuthCallback() {
  const router = useRouter();
  const [syncAuthSession] = useSyncAuthSessionMutation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get session setelah email verification
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          const deviceId = getDeviceId();
          if (!deviceId) throw new Error("Failed to generate device ID");

          // Sync user data ke database
          await syncAuthSession({
            userId: session.user.id,
            email: session.user.email ?? "",
            name: session.user.user_metadata?.full_name ?? "User",
            emailVerified: session.user.email_confirmed_at
              ? new Date(session.user.email_confirmed_at).toISOString()
              : null,
            deviceId,
          });

          // Redirect ke home setelah berhasil
          router.replace("/");
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        router.replace("/auth/signin");
      }
    };

    handleCallback();
  }, [router, syncAuthSession]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Verifying your email...</h2>
        <p className="text-gray-600">
          Please wait while we complete the process.
        </p>
      </div>
    </div>
  );
}
