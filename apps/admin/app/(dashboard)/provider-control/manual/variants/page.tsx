import VariantsPageClient from "@/app/components/variants/VariantsPageClient";

export default function ManualVariantsPage() {
  return <VariantsPageClient syncSource="manual" allowCreate />;
}
