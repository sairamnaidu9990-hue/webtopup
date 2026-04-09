import Link from "next/link";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";

const summaryCards = [
  {
    title: "Total Order",
    value: 0,
    note: "Jumlah seluruh order yang tercatat pada sistem transaksi.",
    variant: "info" as const,
  },
  {
    title: "Sukses",
    value: 0,
    note: "Order yang selesai diproses dan valid untuk direkonsiliasi.",
    variant: "success" as const,
  },
  {
    title: "Failed",
    value: 0,
    note: "Order yang gagal diproses dan memerlukan tindak lanjut.",
    variant: "danger" as const,
  },
  {
    title: "Process",
    value: 0,
    note: "Order yang masih menunggu penyelesaian dari sistem atau provider.",
    variant: "warning" as const,
  },
];

export default function DashboardPage() {
  const quickLinks = [
    {
      title: "Provider Control",
      href: "/provider-control",
      description:
        "Kelola struktur provider seperti BangJeff dan Manual dari satu area navigasi yang siap dikembangkan.",
    },
    {
      title: "Monitoring Order",
      href: "/orders",
      description:
        "Tinjau status transaksi, identifikasi order gagal, dan pantau order yang masih diproses.",
    },
    {
      title: "BangJeff Games",
      href: "/provider-control/bangjeff/games",
      description:
        "Masuk ke katalog game BangJeff untuk mengelola metadata internal seperti provider, logo, dan status katalog.",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Dashboard"
        subtitle="Ringkasan operasional untuk memantau transaksi dan mengakses area kontrol katalog provider."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.title} title={item.title} variant={item.variant}>
            <p className="text-4xl font-bold tracking-tight">{item.value}</p>
            <p className="mt-2 text-sm text-white/80">{item.note}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <Card title="Navigasi Cepat">
          <div className="space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition hover:border-gray-300 hover:bg-white"
              >
                <p className="font-semibold text-gray-900">{link.title}</p>
                <p className="mt-1 text-sm text-gray-600">{link.description}</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Catatan Operasional">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">Definisi Metrik</p>
              <p className="mt-1">
                Empat kartu di atas merepresentasikan status transaksi utama:
                total order, sukses, gagal, dan masih diproses.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">Kontrol Provider</p>
              <p className="mt-1">
                Sinkronisasi katalog provider ditempatkan pada menu terpisah
                agar area monitoring transaksi dan area manajemen katalog tidak
                saling bercampur.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">Status Integrasi</p>
              <p className="mt-1">
                Ringkasan order ini dirancang untuk membaca data transaksi dari
                backend admin. Jika seluruh nilai masih 0, periksa integrasi
                sumber data order pada backend.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
