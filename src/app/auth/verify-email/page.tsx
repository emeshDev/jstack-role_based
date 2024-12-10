"use client";

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Check your email
          </h2>
          <p className="text-gray-600 mb-4">
            We've sent you an email with a confirmation link. Please check your
            inbox and click the link to verify your email address.
          </p>
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-indigo-600 hover:text-indigo-500"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
