import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const WorkspaceFileManagerPageClient = dynamic(
  () => import("@/app/components/workspace/WorkspaceFileManagerPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat File Manager Internal"
        subtitle="Dokumen tim sedang disiapkan."
        statsCount={3}
      />
    ),
  }
);

export default function WorkspaceFilesPage() {
  return <WorkspaceFileManagerPageClient />;
}
