// src/types/index.ts
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  emailVerified?: Date | null;
  deviceId?: string | null;
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

export interface RawSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: Role;
    emailVerified?: string | Date | null;
    deviceId?: string | null;
  };
}
