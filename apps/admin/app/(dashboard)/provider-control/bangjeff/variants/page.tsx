import VariantsPageClient from "@/app/components/variants/VariantsPageClient";

export default function BangjeffVariantsPage() {
  return <VariantsPageClient syncSource="bangjeff" allowCreate={false} />;
}
