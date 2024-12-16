// src/components/user-management/user-table.tsx
"use client";

import { useGetUsersQuery, useUpdateUserRoleMutation } from "@/lib/store/api";
import { Role } from "@/types";
import { format } from "date-fns";

export default function UserTable() {
  const { data, isLoading, error } = useGetUsersQuery();
  const [updateRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();

  // Debug logs
  console.log("RTK Query state:", {
    hasData: !!data,
    dataContent: data,
    isLoading,
    error,
    errorMessage: error instanceof Error ? error.message : "Unknown error",
  });

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (newRole === Role.SUPER_ADMIN) return; // Extra safety check

    try {
      await updateRole({
        userId,
        role: newRole as Role.ADMIN | Role.USER,
      }).unwrap();
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <p className="text-sm text-red-700">
          Error:{" "}
          {error instanceof Error ? error.message : "Failed to load users"}
        </p>
      </div>
    );
  }

  if (!data?.success || !Array.isArray(data?.users)) {
    console.log("Invalid data structure:", data);
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <p className="text-sm text-red-700">
          Invalid response format. Please try again.
        </p>
      </div>
    );
  }

  // Debug log setelah validasi
  console.log("Valid users data:", data.users);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Role
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Email Verified
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Joined
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data?.users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.name || "N/A"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as Role)
                        }
                        disabled={isUpdating}
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      >
                        <option value={Role.ADMIN}>Admin</option>
                        <option value={Role.USER}>User</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.emailVerified ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {format(new Date(user.createdAt), "PP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
