import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <SectionTitle
        title="Orders"
        subtitle="Area monitoring transaksi untuk meninjau status order, verifikasi penyelesaian, dan investigasi kegagalan."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Status Integrasi">
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Halaman ini disiapkan sebagai pusat monitoring order untuk tim
              operasional.
            </p>
            <p>
              Saat ini data transaksi belum terhubung ke backend admin, sehingga
              tabel order dan ringkasan status belum ditampilkan.
            </p>
          </div>
        </Card>

        <Card title="Ruang Lingkup">
          <div className="space-y-3 text-sm text-gray-600">
            <p>Halaman order dirancang untuk memuat data berikut:</p>
            <p>Status pembayaran, status provider, nilai transaksi, waktu order, dan detail akun pelanggan.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
