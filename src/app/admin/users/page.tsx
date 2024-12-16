// src/app/admin/users/page.tsx
"use client";

import { ProtectedRoute } from "@/components/protected-route";
import UserTable from "@/components/user-management/user-table";
import { Role } from "@/types";

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
      <div className="py-10">
        <UserTable />
      </div>
    </ProtectedRoute>
  );
}
