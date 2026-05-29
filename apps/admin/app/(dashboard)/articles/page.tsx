import dynamic from "next/dynamic";

import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

const ArticlesPageClient = dynamic(
  () => import("@/app/components/articles/ArticlesPageClient"),
  {
    loading: () => (
      <AdminPageSkeleton
        title="Memuat artikel"
        subtitle="Konten homepage dan halaman artikel sedang disiapkan."
        statsCount={4}
      />
    ),
  }
);

export default function ArticlesPage() {
  return <ArticlesPageClient />;
}
