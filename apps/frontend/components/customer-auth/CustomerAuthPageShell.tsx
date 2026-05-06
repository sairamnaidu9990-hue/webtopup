"use client";

export default function CustomerAuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="site-shell py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[32px] border border-white/10 bg-[#191b22] p-6 shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
              Akun KITAGG
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-white/60">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
