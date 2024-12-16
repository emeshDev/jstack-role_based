// src/server/env.ts
/**
 * Define your environment variables here
 *
 * Access these in your API (fully type-safe):
 * @see https://hono.dev/docs/helpers/adapter#env
 */

export type Bindings = {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
};

// Helper function untuk mendapatkan env vars dari manapun
export const getServerEnv = (key: keyof Bindings): string => {
  return process.env[key] || "";
};
