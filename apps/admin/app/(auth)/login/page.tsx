import LoginForm from "../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-500">
            Masuk untuk mengakses panel admin WebTopup.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}