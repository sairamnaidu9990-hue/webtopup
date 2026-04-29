import Link from "next/link";

export default function InvoiceNotFoundState({
  invoiceNumber,
}: {
  invoiceNumber: string;
}) {
  return (
    <main className="site-shell py-8 sm:py-10">
      <section className="rounded-[24px] border border-white/8 bg-[linear-gradient(135deg,#1d2027_0%,#17191f_100%)] px-5 py-8 text-center shadow-[0_18px_42px_rgba(0,0,0,0.18)] sm:px-6 sm:py-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--accent-soft)]">
          Invoice Tidak Ditemukan
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[1.6rem] font-bold tracking-tight text-white sm:text-[2rem]">
          Invoice {invoiceNumber} tidak tersedia.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/62 sm:text-base">
          Pastikan nomor invoice yang kamu masukkan sudah benar, lalu coba cek
          kembali melalui halaman cek transaksi.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/cek-transaksi"
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105"
          >
            Cek Invoice Lagi
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-white/8 bg-white/5 px-5 text-[13px] font-medium text-white transition hover:bg-white/8"
          >
            Kembali ke Home
          </Link>
        </div>
      </section>
    </main>
  );
}
