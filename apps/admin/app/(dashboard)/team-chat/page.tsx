import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const TeamChatPageClient = dynamic(
  () => import("@/app/components/team-chat/TeamChatPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat chat tim"
        subtitle="Pesan internal dan presence admin sedang disiapkan."
        statsCount={2}
        showSidebar
      />
    ),
  }
);

export default function TeamChatPage() {
  return <TeamChatPageClient />;
}
