import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const WorkspaceSpreadsheetPageClient = dynamic(
  () => import("@/app/components/workspace/WorkspaceSpreadsheetPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat Spreadsheet Internal"
        subtitle="Sheet kerja tim sedang disiapkan."
        statsCount={3}
      />
    ),
  }
);

export default function WorkspaceSpreadsheetsPage() {
  return <WorkspaceSpreadsheetPageClient />;
}
