import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";

export default function DashboardPage() {
  return (
    <div>
      <SectionTitle
        title="Dashboard"
        subtitle="Ringkasan aktivitas admin panel."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Menunggu" variant="warning">
          <p className="text-4xl font-bold tracking-tight">0</p>
        </Card>

        <Card title="Dalam Proses" variant="info">
          <p className="text-4xl font-bold tracking-tight">0</p>
        </Card>

        <Card title="Berhasil" variant="success">
          <p className="text-4xl font-bold tracking-tight">0</p>
        </Card>

        <Card title="Gagal" variant="danger">
          <p className="text-4xl font-bold tracking-tight">0</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Overview">
          <p className="text-sm text-gray-600">
            Dashboard ini akan menampilkan data produk, transaksi, dan statistik
            secara real-time setelah integrasi backend selesai.
          </p>
        </Card>

        <Card title="Next Step">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Integrasi API produk</li>
            <li>• Menampilkan data transaksi</li>
            <li>• Statistik realtime</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}