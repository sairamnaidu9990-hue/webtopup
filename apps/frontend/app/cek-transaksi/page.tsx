import InvoiceLookupSection from "@/components/InvoiceLookupSection";
import RecentTransactionsSection from "@/components/RecentTransactionsSection";
import { getRecentPublicOrders } from "@/lib/siteData";

export default async function CheckTransactionPage() {
  const recentOrders = await getRecentPublicOrders(10);

  return (
    <main className="pb-10 pt-4 sm:pb-12 sm:pt-6">
      <div className="site-shell space-y-6">
        <InvoiceLookupSection />
        <RecentTransactionsSection initialOrders={recentOrders} />
      </div>
    </main>
  );
}
