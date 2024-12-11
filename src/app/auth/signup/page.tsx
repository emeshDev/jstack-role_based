"use client";
// src/app/auth/signup/page.tsx

import { useAuth } from "@/hooks/use-auth";
import { signUpSchema, type SignUpForm } from "@/lib/schemas/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

export default function SignUp() {
  const router = useRouter();
  const { signUp, isLoading, error } = useAuth();

  const [formData, setFormData] = useState<SignUpForm>({
    email: "",
    password: "",
    fullName: "",
  });
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof SignUpForm, string>>
  >({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      const validatedData = signUpSchema.parse(formData);
      await signUp(validatedData.email, validatedData.password, {
        full_name: validatedData.fullName,
      });
      router.push("/auth/verify-email");
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
      } else {
        console.error("Sign up failed:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
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
                   text-gray-900 placeholder-gray-400 
                   focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                   dark:bg-gray-800 dark:text-white dark:border-gray-600"
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
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                   text-gray-900 placeholder-gray-400 
                   focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                   dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
                {validationErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.fullName}
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
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                   text-gray-900 placeholder-gray-400 
                   focus:outline-none focus:ring-indigo-500 focus:border-indigo-500
                   dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {validationErrors.password}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Password must be at least 8 characters with letters, numbers,
                  and special characters
                </p>
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
                {isLoading ? "Creating account..." : "Sign up"}
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
                  Already have an account?{" "}
                  <a
                    href="/auth/signin"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Sign in
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
