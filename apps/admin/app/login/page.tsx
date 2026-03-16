import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">

      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">

        <h1 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h1>

        <LoginForm />

      </div>

    </div>
  );
}