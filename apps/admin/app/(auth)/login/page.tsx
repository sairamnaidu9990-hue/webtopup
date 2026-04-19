import LoginForm from "../../components/auth/LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionExpired = resolvedSearchParams?.reason === "session-expired";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111217] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white sm:text-[28px]">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Masuk ke dashboard WebTopup
          </p>
        </div>

        <LoginForm sessionExpired={sessionExpired} />
      </div>
    </div>
  );
}
