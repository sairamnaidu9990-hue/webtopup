import AdminPageSkeleton from "@/app/components/ui/AdminPageSkeleton";

export default function AdminRootLoading() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <AdminPageSkeleton
        title="Memuat halaman admin"
        subtitle="Shell admin sedang disiapkan."
      />
    </div>
  );
}
