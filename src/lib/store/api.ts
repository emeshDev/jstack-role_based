// src/lib/store/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { client } from "@/lib/client";
import type { User, Session } from "@prisma/client";
import { Role } from "@/types";

interface AuthSessionResponse {
  success: boolean;
  user: User & {
    role: Role; // Add role to user type
  };
  session: Session;
}

interface UpdateSessionResponse {
  success: boolean;
  session: Session;
}

interface GetRoleResponse {
  success: boolean;
  role: Role;
}

interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  emailVerified: string | null;
  createdAt: string;
}

interface GetUsersResponse {
  success: boolean;
  users: UserResponse[];
}

interface UpdateRoleResponse {
  success: boolean;
  user: User;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args: unknown) => {
    try {
      const result = await args;
      console.log("baseQuery response:", result);
      return { data: result };
    } catch (error) {
      return { error };
    }
  },
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    syncAuthSession: builder.mutation<
      AuthSessionResponse,
      {
        userId: string;
        email: string;
        name?: string;
        emailVerified: string | null;
        deviceId: string;
        role?: Role; // Optional role parameter
      }
    >({
      query: (data) =>
        client.authsession.v1.$post({
          userId: data.userId,
          email: data.email,
          name: data.name,
          deviceId: data.deviceId,
          emailVerified: data.emailVerified
            ? new Date(data.emailVerified).toISOString()
            : null,
          role: data.role, // Pass role if provided
        }),
    }),

    // New endpoint to get user role
    getRole: builder.query<GetRoleResponse, void>({
      query: () => client.authsession.getRole.$get(),
    }),

    getUsers: builder.query<GetUsersResponse, void>({
      query: () => client.users.getUsers.$get(),
      async transformResponse(baseQueryReturnValue: any) {
        console.log("Transform input:", baseQueryReturnValue);

        const data = await baseQueryReturnValue.json();
        console.log("Transformed data:", data);

        return data as GetUsersResponse;
      },
      providesTags: ["Users"],
    }),

    // New endpoint to update user role (SUPER_ADMIN only)
    updateUserRole: builder.mutation<
      UpdateRoleResponse,
      {
        userId: string;
        role: Role.ADMIN | Role.USER;
      }
    >({
      query: (data) => client.users.updateRole.$post(data),
      invalidatesTags: ["Users"],
    }),

    updateSession: builder.mutation<
      UpdateSessionResponse,
      { token: string; expiresAt: number }
    >({
      query: (data) => client.authsession.updateSession.$post(data),
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => client.authsession.logout.$post(),
    }),
  }),
});

export const {
  useSyncAuthSessionMutation,
  useGetRoleQuery,
  useUpdateUserRoleMutation,
  useUpdateSessionMutation,
  useLogoutMutation,
  useGetUsersQuery,
} = api;
