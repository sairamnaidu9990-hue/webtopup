import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";

export default function DashboardPage() {
  return (
    <div>
      <SectionTitle
        title="Dashboard"
        subtitle="Ringkasan singkat aktivitas admin panel."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Products">
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">Belum ada data produk</p>
        </Card>

        <Card title="Total Orders">
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">Belum ada data order</p>
        </Card>

        <Card title="Pending Orders">
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">Order menunggu proses</p>
        </Card>

        <Card title="Success Orders">
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="mt-2 text-sm text-gray-500">Order berhasil diproses</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Quick Overview">
          <p className="text-sm leading-6 text-gray-600">
            Panel admin ini sudah siap untuk pengelolaan produk, transaksi,
            dan pengembangan fitur berikutnya.
          </p>
        </Card>

        <Card title="Next Step">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Integrasi data produk dari backend</li>
            <li>• Menampilkan daftar transaksi</li>
            <li>• Menambahkan statistik real-time</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}