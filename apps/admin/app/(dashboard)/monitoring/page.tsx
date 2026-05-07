import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const MonitoringPageClient = dynamic(
  () => import("../../components/monitoring/MonitoringPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat monitoring"
        subtitle="Log aplikasi dan sinyal operasional sedang disiapkan."
        statsCount={3}
      />
    ),
  }
);

export default function MonitoringPage() {
  return <MonitoringPageClient />;
}
