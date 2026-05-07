import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const WebsiteSettingsPageClient = dynamic(
  () => import("./WebsiteSettingsPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat website settings"
        subtitle="Form pengaturan storefront sedang disiapkan."
        statsCount={2}
        showTable={false}
        showSidebar
      />
    ),
  }
);

export default function WebsiteSettingsPage() {
  return <WebsiteSettingsPageClient />;
}
