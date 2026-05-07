import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const OrdersPageClient = dynamic(
  () => import("@/app/components/orders/OrdersPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat data order"
        subtitle="Daftar order dan aksi operasional sedang disiapkan."
        statsCount={4}
      />
    ),
  }
);

export default function OrdersPage() {
  return <OrdersPageClient />;
}
