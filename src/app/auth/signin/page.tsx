// src/app/auth/signin/page.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { signInSchema, type SignInForm } from "@/lib/schemas/auth";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

export default function SignIn() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const { signIn, isLoading, error } = useAuth({
    redirectTo: from,
  });

  const [formData, setFormData] = useState<SignInForm>({
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof SignInForm, string>>
  >({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      const validatedData = signInSchema.parse(formData);
      await signIn(validatedData.email, validatedData.password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.reduce(
          (acc, curr) => ({
            ...acc,
            [curr.path[0]]: curr.message,
          }),
          {}
        );
        setValidationErrors(errors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                    text-gray-900
                    placeholder-gray-400 
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                    dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Enter your email"
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                    text-gray-900
                    placeholder-gray-400 
                    focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                    dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="Enter your password"
                />
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.password}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error.message}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm 
                  font-medium text-white bg-indigo-600 hover:bg-indigo-700 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?{" "}
                  <a
                    href="/auth/signup"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Sign up
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
