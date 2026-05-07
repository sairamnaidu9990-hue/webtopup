import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const CustomersPageClient = dynamic(
  () => import("@/app/components/customers/CustomersPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat data user"
        subtitle="Profil member dan histori saldo sedang disiapkan."
        statsCount={3}
        showSidebar
      />
    ),
  }
);

export default function CustomersPage() {
  return <CustomersPageClient />;
}
