import Link from "next/link";

export default function CustomerDashboardAuthPrompt() {
  return (
    <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(211,59,59,0.12)_0%,rgba(17,18,23,0.98)_100%)] px-6 py-10 text-center shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:px-8">
          <div className="inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-200">
            Dashboard Member
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">
            Halo, Gamer!
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/65 sm:text-[15px]">
            Masuk dulu untuk lihat dashboard kamu, cek riwayat transaksi, dan topup
            saldo KITAGG!
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/masuk"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d33b3b_0%,#a51f1f_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(211,59,59,0.28)] transition hover:brightness-110"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-white"
            >
              Buat Akun
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
