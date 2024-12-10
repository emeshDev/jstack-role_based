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
    if (!isLoading && !session) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?from=${returnUrl}`);
    }
  }, [session, isLoading, router, pathname, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
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
