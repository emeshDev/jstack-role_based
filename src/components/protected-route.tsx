"use client";

// src/components/protected-route.tsx
import { useSession } from "@/hooks/use-session";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: Role[]; // Optional array of allowed roles
}

export function ProtectedRoute({
  children,
  redirectTo = "/auth/signin",
  allowedRoles, // Jika tidak diset, berarti route hanya butuh authentication
}: ProtectedRouteProps) {
  const { session, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Gunakan session timeout
  useSessionTimeout();

  useEffect(() => {
    console.log("Session user:", session?.user);
    console.log("User role:", session?.user?.role);

    if (!isLoading) {
      if (!session) {
        // Redirect ke login jika tidak ada session
        const returnUrl = encodeURIComponent(pathname);
        window.location.replace(`${redirectTo}?from=${returnUrl}`);
      } else if (allowedRoles && !allowedRoles.includes(session.user.role)) {
        console.log("Role check failed:", {
          userRole: session.user.role,
          allowedRoles,
        }); // Debug log
        // Redirect ke home atau halaman unauthorized jika role tidak sesuai
        window.location.replace("/unauthorized");
      }
    }
  }, [session, isLoading, router, pathname, redirectTo, allowedRoles]);

  // Show children if:
  // 1. Still loading, OR
  // 2. Has session AND either:
  //    - No role restrictions, OR
  //    - Has required role
  if (
    isLoading ||
    (session && (!allowedRoles || allowedRoles.includes(session.user.role)))
  ) {
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

    const timeout = setTimeout(() => {
      router.refresh();
    }, 3300 * 1000); // 55 menit

    return () => clearTimeout(timeout);
  }, [session, router]);
}

// Untuk route yang hanya butuh authentication
{
  /* <ProtectedRoute>
  <UserDashboard />
</ProtectedRoute>

// Untuk route yang membutuhkan role admin atau super admin
<ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
  <AdminPanel />
</ProtectedRoute>

// Untuk route yang hanya bisa diakses super admin
<ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
  <SuperAdminSettings />
</ProtectedRoute> */
}
