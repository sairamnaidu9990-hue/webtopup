import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const DashboardPageClient = dynamic(
  () => import("@/app/components/dashboard/DashboardPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat ringkasan dashboard"
        subtitle="Statistik order dan data operasional sedang disiapkan."
        statsCount={6}
      />
    ),
  }
);

export default function DashboardPage() {
  return <DashboardPageClient />;
}
