"use client";

// src/components/protected-route.tsx
import { useSession } from "@/hooks/use-session";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/auth/signin",
}: ProtectedRouteProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Gunakan session timeout
  useSessionTimeout();

  useEffect(() => {
    // Hanya redirect jika benar-benar tidak ada session dan loading selesai
    if (!isLoading && !session) {
      const returnUrl = encodeURIComponent(pathname);
      // router.replace(`${redirectTo}?from=${returnUrl}`);
      // Gunakan window.location.replace untuk memastikan full page refresh
      window.location.replace(`${redirectTo}?from=${returnUrl}`);
    }
  }, [session, isLoading, router, pathname, redirectTo]);

  // Tampilkan children selama loading atau ada session
  // Ini mencegah flash of blank page
  if (isLoading || session) {
    return <>{children}</>;
  }

  // Jangan render apapun saat akan redirect
  return null;
}

export function useSessionTimeout() {
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;

    // Set timeout untuk redirect 5 menit sebelum token expire
    const timeout = setTimeout(() => {
      router.refresh(); // Force refresh page untuk revalidate session
    }, 3300 * 1000); // 55 menit

    return () => clearTimeout(timeout);
  }, [session, router]);
}
