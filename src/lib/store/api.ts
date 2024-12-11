// src/lib/store/api.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { client } from "@/lib/client";
import type { User, Session } from "@prisma/client";

interface AuthSessionResponse {
  success: boolean;
  user: User;
  session: Session;
}

interface UpdateSessionResponse {
  success: boolean;
  session: Session;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args: unknown) => {
    try {
      const result = await args;
      return { data: result };
    } catch (error) {
      return { error };
    }
  },
  endpoints: (builder) => ({
    syncAuthSession: builder.mutation<
      AuthSessionResponse,
      {
        userId: string;
        email: string;
        name?: string;
        emailVerified: string | null;
        deviceId: string;
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
        }),
      transformResponse: (response: any): AuthSessionResponse => {
        // Ensure the response matches the AuthSessionResponse interface
        return {
          success: true,
          user: response.user, // Assuming the response directly contains the full User object
          session: response.session, // Assuming the response directly contains the full Session object
        };
      },
    }),

    updateSession: builder.mutation<
      UpdateSessionResponse,
      { token: string; expiresAt: number }
    >({
      query: (data) => client.authsession.updateSession.$post(data),
      transformResponse: (response: any): UpdateSessionResponse => {
        return {
          success: true,
          session: response.session,
        };
      },
    }),

    cleanupSessions: builder.mutation<
      { success: boolean },
      { deviceId: string }
    >({
      query: (data) => client.authsession.cleanupSessions.$post(data),
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => client.authsession.logout.$post(),
    }),

    clearAuthCookies: builder.mutation<{ success: boolean }, void>({
      query: () => client.authsession.clearAuthCookies.$post(),
    }),
  }),
});

export const {
  useSyncAuthSessionMutation,
  useUpdateSessionMutation,
  useLogoutMutation,
  useClearAuthCookiesMutation,
} = api;
