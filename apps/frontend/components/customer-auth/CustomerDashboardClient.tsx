"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCustomerSession } from "@/components/customer-auth/CustomerSessionProvider";
import type {
  StorefrontBalanceTransaction,
  StorefrontCustomerPointTransaction,
  StorefrontCustomerRewardSummary,
  StorefrontPaymentMethod,
} from "@/lib/siteData";

import CustomerBalanceTopupSection from "@/components/customer-auth/dashboard/CustomerBalanceTopupSection";
import CustomerBalanceTransactionsSection from "@/components/customer-auth/dashboard/CustomerBalanceTransactionsSection";
import CustomerDashboardAuthPrompt from "@/components/customer-auth/dashboard/CustomerDashboardAuthPrompt";
import CustomerDashboardHero from "@/components/customer-auth/dashboard/CustomerDashboardHero";
import CustomerRewardsSection from "@/components/customer-auth/dashboard/CustomerRewardsSection";
import CustomerDashboardSkeleton from "@/components/customer-auth/dashboard/CustomerDashboardSkeleton";
import CustomerOrdersSection from "@/components/customer-auth/dashboard/CustomerOrdersSection";
import type { CustomerOrder } from "@/components/customer-auth/dashboard/types";
import {
  MAX_TOPUP_AMOUNT,
  MIN_TOPUP_AMOUNT,
} from "@/components/customer-auth/dashboard/utils";

export default function CustomerDashboardClient() {
  const router = useRouter();
  const { customer, loading, refresh } = useCustomerSession();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [balanceTransactions, setBalanceTransactions] = useState<
    StorefrontBalanceTransaction[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<StorefrontPaymentMethod[]>([]);
  const [rewardSummary, setRewardSummary] =
    useState<StorefrontCustomerRewardSummary | null>(null);
  const [pointTransactions, setPointTransactions] = useState<
    StorefrontCustomerPointTransaction[]
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [error, setError] = useState("");
  const [topupFeedback, setTopupFeedback] = useState("");
  const [rewardFeedback, setRewardFeedback] = useState("");
  const [balanceLogoUrl, setBalanceLogoUrl] = useState("");
  const [topupAmount, setTopupAmount] = useState(String(MIN_TOPUP_AMOUNT));
  const [topupPaymentMethodCode, setTopupPaymentMethodCode] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [redeemBalancePoints, setRedeemBalancePoints] = useState("100");
  const [redeemPromoPoints, setRedeemPromoPoints] = useState("100");
  const [redeemSubmitting, setRedeemSubmitting] = useState<
    "balance" | "promo" | null
  >(null);
  const [dashboardReloadNonce, setDashboardReloadNonce] = useState(0);

  useEffect(() => {
    if (!customer?.id) {
      return;
    }

    void refresh();
  }, [customer?.id, refresh]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!customer) {
      setOrders([]);
      setBalanceTransactions([]);
      setPaymentMethods([]);
      setRewardSummary(null);
      setPointTransactions([]);
      setTopupPaymentMethodCode("");
      setOrdersLoading(false);
      setBalanceLoading(false);
      setPaymentMethodsLoading(false);
      setRewardsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchDashboardData = async () => {
      try {
        setOrdersLoading(true);
        setBalanceLoading(true);
        setPaymentMethodsLoading(true);
        setRewardsLoading(true);
        setError("");

        const [
          ordersResponse,
          balanceResponse,
          paymentMethodsResponse,
          siteSettingResponse,
          rewardsResponse,
        ] = await Promise.all([
          fetch("/api/customer-orders/me?limit=20", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/customer-balance/transactions?limit=20", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/payment-methods/public", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/site-settings/public", {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/customer-rewards/me?limit=20", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        const [
          ordersPayload,
          balancePayload,
          paymentMethodsPayload,
          siteSettingPayload,
          rewardsPayload,
        ] = await Promise.all([
          ordersResponse.json().catch(() => ({
            items: [],
            message: "Respons riwayat transaksi tidak valid",
          })),
          balanceResponse.json().catch(() => ({
            items: [],
            message: "Respons histori saldo tidak valid",
          })),
          paymentMethodsResponse.json().catch(() => ({
            items: [],
            message: "Respons metode pembayaran tidak valid",
          })),
          siteSettingResponse.json().catch(() => ({
            siteSetting: null,
          })),
          rewardsResponse.json().catch(() => ({
            summary: null,
            pointTransactions: [],
            message: "Respons rewards tidak valid",
          })),
        ]);

        if (!ordersResponse.ok) {
          throw new Error(
            ordersPayload.message || "Gagal mengambil riwayat transaksi"
          );
        }

        if (!balanceResponse.ok) {
          throw new Error(
            balancePayload.message || "Gagal mengambil histori saldo"
          );
        }

        if (!paymentMethodsResponse.ok) {
          throw new Error(
            paymentMethodsPayload.message || "Gagal mengambil metode pembayaran"
          );
        }

        if (!rewardsResponse.ok) {
          throw new Error(
            rewardsPayload.message || "Gagal mengambil data referral dan loyalty"
          );
        }

        const nextPaymentMethods = Array.isArray(paymentMethodsPayload.items)
          ? paymentMethodsPayload.items.filter(
              (paymentMethod: StorefrontPaymentMethod) =>
                paymentMethod.code !== "KITAGG_BALANCE"
            )
          : [];

        setOrders(Array.isArray(ordersPayload.items) ? ordersPayload.items : []);
        setBalanceTransactions(
          Array.isArray(balancePayload.items) ? balancePayload.items : []
        );
        setBalanceLogoUrl(
          String(
            siteSettingPayload?.siteSetting?.kitaggBalanceLogoUrl ||
              siteSettingPayload?.siteSetting?.siteLogoUrl ||
              siteSettingPayload?.siteSetting?.siteFaviconUrl ||
              ""
          ).trim()
        );
        setPaymentMethods(nextPaymentMethods);
        setRewardSummary(rewardsPayload.summary || null);
        setPointTransactions(
          Array.isArray(rewardsPayload.pointTransactions)
            ? rewardsPayload.pointTransactions
            : []
        );
        setTopupPaymentMethodCode((current) => {
          if (
            current &&
            nextPaymentMethods.some(
              (paymentMethod: StorefrontPaymentMethod) =>
                paymentMethod.code === current
            )
          ) {
            return current;
          }

          return nextPaymentMethods[0]?.code || "";
        });
      } catch (fetchError) {
        if ((fetchError as Error).name !== "AbortError") {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Gagal mengambil data dashboard user"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setOrdersLoading(false);
          setBalanceLoading(false);
          setPaymentMethodsLoading(false);
          setRewardsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => controller.abort();
  }, [customer, dashboardReloadNonce, loading]);

  const purchaseOrders = useMemo(
    () => orders.filter((order) => order.orderType !== "BALANCE_TOPUP"),
    [orders]
  );

  const successfulOrders = useMemo(
    () => purchaseOrders.filter((order) => order.status === "SUCCESS").length,
    [purchaseOrders]
  );

  const totalSpent = useMemo(
    () =>
      purchaseOrders.reduce(
        (sum, order) =>
          sum + Number(order.price?.totalAmount || order.price?.sellPrice || 0),
        0
      ),
    [purchaseOrders]
  );

  const totalTopupCredits = useMemo(
    () =>
      balanceTransactions
        .filter((transaction) => transaction.type === "CREDIT")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [balanceTransactions]
  );

  const handleRedeemRewards = async (mode: "balance" | "promo") => {
    const rawPoints = mode === "balance" ? redeemBalancePoints : redeemPromoPoints;
    const points = Math.round(Number(rawPoints || 0));
    const minimumRedeemPoints = Number(rewardSummary?.minimumRedeemPoints || 100);

    if (!Number.isFinite(points) || points < minimumRedeemPoints) {
      setError(
        `Minimal tukar poin adalah ${minimumRedeemPoints.toLocaleString("id-ID")} poin`
      );
      return;
    }

    try {
      setRedeemSubmitting(mode);
      setRewardFeedback("");
      setError("");

      const response = await fetch(`/api/customer-rewards/redeem-${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ points }),
      });
      const payload = await response.json().catch(() => ({
        message: "Respons rewards tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal menukar poin member");
      }

      setRewardFeedback(
        payload?.promoCode?.code
          ? `${payload.message || "Poin berhasil ditukar"}. Kode promo: ${
              payload.promoCode.code
            }`
          : payload.message || "Poin berhasil ditukar"
      );
      if (mode === "balance") {
        setRedeemBalancePoints(String(minimumRedeemPoints));
      } else {
        setRedeemPromoPoints(String(minimumRedeemPoints));
      }
      await refresh();
      setDashboardReloadNonce((current) => current + 1);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menukar poin member"
      );
    } finally {
      setRedeemSubmitting(null);
    }
  };

  const handleTopupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Math.round(Number(topupAmount || 0));

    if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT) {
      setError(
        `Nominal topup minimal Rp${MIN_TOPUP_AMOUNT.toLocaleString("id-ID")}`
      );
      return;
    }

    if (amount > MAX_TOPUP_AMOUNT) {
      setError(
        `Nominal topup maksimal Rp${MAX_TOPUP_AMOUNT.toLocaleString("id-ID")}`
      );
      return;
    }

    if (!topupPaymentMethodCode) {
      setError("Pilih metode pembayaran untuk topup saldo terlebih dahulu.");
      return;
    }

    try {
      setTopupSubmitting(true);
      setTopupFeedback("");
      setError("");

      const response = await fetch("/api/customer-balance/topups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentMethodCode: topupPaymentMethodCode,
        }),
      });

      const payload = await response.json().catch(() => ({
        message: "Respons topup saldo tidak valid",
      }));

      if (!response.ok) {
        throw new Error(payload.message || "Gagal membuat invoice topup saldo");
      }

      const invoiceNumber =
        payload &&
        typeof payload === "object" &&
        payload.order &&
        typeof payload.order === "object"
          ? String(payload.order.invoiceNumber || "")
          : "";

      if (!invoiceNumber) {
        throw new Error("Invoice topup saldo tidak ditemukan");
      }

      setTopupFeedback(payload.message || "Invoice topup saldo berhasil dibuat.");
      router.push(`/invoice/${encodeURIComponent(invoiceNumber)}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal membuat invoice topup saldo"
      );
    } finally {
      setTopupSubmitting(false);
    }
  };

  if (loading) {
    return <CustomerDashboardSkeleton />;
  }

  if (!customer) {
    return <CustomerDashboardAuthPrompt />;
  }

  return (
    <main className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="site-shell space-y-6">
        <CustomerDashboardHero
          customer={customer}
          balanceLogoUrl={balanceLogoUrl}
          successfulOrders={successfulOrders}
          totalSpent={totalSpent}
          totalTopupCredits={totalTopupCredits}
          referredCustomersCount={Number(rewardSummary?.referredCustomersCount || 0)}
        />

        {topupFeedback ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {topupFeedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {rewardFeedback ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {rewardFeedback}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <CustomerBalanceTopupSection
            balance={customer.balance}
            balanceLogoUrl={balanceLogoUrl}
            topupAmount={topupAmount}
            topupPaymentMethodCode={topupPaymentMethodCode}
            paymentMethods={paymentMethods}
            paymentMethodsLoading={paymentMethodsLoading}
            topupSubmitting={topupSubmitting}
            onTopupAmountChange={setTopupAmount}
            onTopupPaymentMethodChange={setTopupPaymentMethodCode}
            onSubmit={handleTopupSubmit}
          />

          <CustomerBalanceTransactionsSection
            balanceTransactions={balanceTransactions}
            balanceLoading={balanceLoading}
          />
        </section>

        <CustomerRewardsSection
          summary={rewardSummary}
          pointTransactions={pointTransactions}
          loading={rewardsLoading}
          redeemBalancePoints={redeemBalancePoints}
          redeemPromoPoints={redeemPromoPoints}
          redeemSubmitting={redeemSubmitting}
          onRedeemBalancePointsChange={setRedeemBalancePoints}
          onRedeemPromoPointsChange={setRedeemPromoPoints}
          onRedeemBalance={() => void handleRedeemRewards("balance")}
          onRedeemPromo={() => void handleRedeemRewards("promo")}
        />

        <CustomerOrdersSection orders={orders} ordersLoading={ordersLoading} />
      </div>
    </main>
  );
}
