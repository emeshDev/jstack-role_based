// src/types/index.ts
export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: Date | null;
}

export interface Session {
  user: User;
}

export interface AuthError extends Error {
  name: string;
  status: number;
}

export interface SessionError extends AuthError {
  message: string;
}
