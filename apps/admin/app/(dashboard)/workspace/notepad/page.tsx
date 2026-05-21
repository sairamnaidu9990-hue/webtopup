import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const WorkspaceNotepadPageClient = dynamic(
  () => import("@/app/components/workspace/WorkspaceNotepadPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat Notepad Internal"
        subtitle="Catatan tim sedang disiapkan."
        statsCount={3}
      />
    ),
  }
);

export default function WorkspaceNotepadPage() {
  return <WorkspaceNotepadPageClient />;
}
