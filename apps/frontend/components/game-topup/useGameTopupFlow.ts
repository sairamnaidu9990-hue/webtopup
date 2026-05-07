"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import type { AppliedPromoCode } from "@/components/PromoCodeSection";
import { useCustomerSession } from "@/components/customer-auth/CustomerSessionProvider";
import createOrderDraft from "@/components/game-topup/createOrderDraft";
import {
  buildPaymentMethodGroups,
  buildVariantGroups,
  createInitialInputValues,
  getBangjeffInputs,
  getPaymentTotal,
  isInputValueComplete,
} from "@/components/game-topup/helpers";
import type {
  StorefrontGameDetail,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/siteData";

type GameDetail = StorefrontGameDetail["game"];

export default function useGameTopupFlow({
  game,
  variants,
  paymentMethods,
}: {
  game: GameDetail;
  variants: StorefrontVariant[];
  paymentMethods: StorefrontPaymentMethod[];
}) {
  const router = useRouter();
  const { customer, refresh } = useCustomerSession();
  const resolvedInputs = useMemo(() => getBangjeffInputs(game), [game]);
  const isVoucherCategory =
    String(game.category || "").trim().toLowerCase() === "voucher";
  const showAccountStep = !isVoucherCategory;
  const [accountValues, setAccountValues] = useState<Record<string, string>>(
    () => createInitialInputValues(resolvedInputs)
  );
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethodCode, setPaymentMethodCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const contactPhoneCode = "+62";
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [selectionAlert, setSelectionAlert] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
  } | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromoCode | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isMobileSummaryExpanded, setIsMobileSummaryExpanded] = useState(false);
  const [mobileCheckoutMounted, setMobileCheckoutMounted] = useState(false);
  const [mobileContentTab, setMobileContentTab] = useState<
    "transaction" | "detail"
  >("transaction");
  const [openFaqItems, setOpenFaqItems] = useState<Record<number, boolean>>({});
  const [openPaymentGroups, setOpenPaymentGroups] = useState<
    Record<string, boolean>
  >({});
  const [highlightedStep, setHighlightedStep] = useState<
    "account" | "variant" | "quantity" | "payment" | "contact" | null
  >(null);
  const accountStepRef = useRef<HTMLDivElement | null>(null);
  const variantStepRef = useRef<HTMLDivElement | null>(null);
  const quantityStepRef = useRef<HTMLDivElement | null>(null);
  const paymentStepRef = useRef<HTMLDivElement | null>(null);
  const contactStepRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const selectedVariant =
    variants.find((variant) => variant._id === selectedVariantId) || null;
  const variantGroups = useMemo(
    () => buildVariantGroups(game, variants),
    [game, variants]
  );
  const paymentMethodGroups = useMemo(
    () => buildPaymentMethodGroups(paymentMethods),
    [paymentMethods]
  );
  const variantStepNumber = showAccountStep ? 2 : 1;
  const quantityStepNumber = variantStepNumber + 1;
  const paymentStepNumber = quantityStepNumber + 1;
  const contactStepNumber = paymentStepNumber + 1;
  const promoStepNumber = contactStepNumber + 1;
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.code === paymentMethodCode) || null;
  const safeQuantity = Math.min(Math.max(Number(quantity || 1), 1), 10);
  const baseSubtotal = (selectedVariant?.price || 0) * safeQuantity;
  const promoDiscount = Math.min(
    Number(appliedPromo?.discountAmount || 0),
    baseSubtotal
  );
  const subtotalAfterDiscount = Math.max(baseSubtotal - promoDiscount, 0);
  const paymentFee = selectedVariant
    ? getPaymentTotal(subtotalAfterDiscount, selectedPaymentMethod) -
      subtotalAfterDiscount
    : 0;
  const totalPayment = subtotalAfterDiscount + paymentFee;
  const reviewPageHref = `/reviews?game=${encodeURIComponent(
    String(game.code || "").trim().toUpperCase()
  )}&name=${encodeURIComponent(game.name)}`;
  const isBalancePayment = paymentMethodCode === "KITAGG_BALANCE";
  const isAccountDataReady =
    !showAccountStep ||
    (resolvedInputs.length > 0 &&
      resolvedInputs.every((gameInput) =>
        isInputValueComplete(
          gameInput,
          accountValues[gameInput.name || gameInput.title] || ""
        )
      ));
  const mobileBottomSpacing =
    mobileContentTab !== "transaction"
      ? "pb-0 md:pb-0"
      : selectedVariant
        ? isMobileSummaryExpanded
          ? "pb-[148px] md:pb-0"
          : "pb-[104px] md:pb-0"
        : "pb-[72px] md:pb-0";

  const showAlert = useCallback((message: string) => {
    setSuccessToast(null);
    setSelectionAlert({
      id: Date.now(),
      message,
    });
  }, []);

  const clearCreatedOrder = useCallback(() => {
    setCreatedOrder(null);
    setSuccessToast(null);
  }, []);

  const handlePromoChange = useCallback((promoCode: AppliedPromoCode | null) => {
    setCreatedOrder(null);
    setSuccessToast(null);
    setSelectionAlert(null);
    setAppliedPromo(promoCode);
  }, []);

  useEffect(() => {
    if (!selectionAlert) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectionAlert(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [selectionAlert]);

  useEffect(() => {
    if (!successToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessToast(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [successToast]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setMobileCheckoutMounted(true);
  }, []);

  useEffect(() => {
    setOpenPaymentGroups((current) => {
      const next: Record<string, boolean> = {};
      let firstOpenAssigned = false;

      paymentMethodGroups.forEach((group) => {
        const containsSelected = group.methods.some(
          (paymentMethod) => paymentMethod.code === paymentMethodCode
        );
        const defaultOpen = containsSelected || !firstOpenAssigned;
        next[group.id] = containsSelected ? true : current[group.id] ?? defaultOpen;

        if (next[group.id]) {
          firstOpenAssigned = true;
        }
      });

      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(next);
      const isSameShape =
        currentKeys.length === nextKeys.length &&
        nextKeys.every((key) => current[key] === next[key]);

      return isSameShape ? current : next;
    });
  }, [paymentMethodCode, paymentMethodGroups]);

  const focusStep = useCallback(
    (
      step: "account" | "variant" | "quantity" | "payment" | "contact",
      ref: RefObject<HTMLDivElement | null>
    ) => {
      setMobileContentTab("transaction");

      const element = ref.current;

      if (!element) {
        return;
      }

      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      setHighlightedStep(step);

      const headerOffset = window.innerWidth < 768 ? 86 : 106;
      const nextTop = Math.max(
        0,
        element.getBoundingClientRect().top + window.scrollY - headerOffset
      );

      window.scrollTo({
        top: nextTop,
        behavior: "smooth",
      });

      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedStep((current) => (current === step ? null : current));
      }, 1600);
    },
    []
  );

  const handleVariantSelect = useCallback(
    (variantId: string) => {
      if (!isAccountDataReady) {
        showAlert(
          resolvedInputs.length === 0
            ? "Input akun untuk game ini belum tersedia."
            : "Silakan isi data akun terlebih dahulu."
        );
        focusStep("account", accountStepRef);
        return;
      }

      clearCreatedOrder();
      setSelectionAlert(null);
      setSelectedVariantId(variantId);
      setIsMobileSummaryExpanded(false);

      window.requestAnimationFrame(() => {
        focusStep("quantity", quantityStepRef);
      });
    },
    [
      clearCreatedOrder,
      focusStep,
      isAccountDataReady,
      quantityStepRef,
      resolvedInputs.length,
      showAlert,
    ]
  );

  const handlePaymentMethodSelect = useCallback(
    (methodCode: string) => {
      if (!selectedVariant) {
        showAlert("Silakan pilih nominal terlebih dahulu.");
        focusStep("variant", variantStepRef);
        return;
      }

      const nextPaymentMethod =
        paymentMethods.find((method) => method.code === methodCode) || null;
      const isKitaggBalanceMethod = methodCode === "KITAGG_BALANCE";

      if (isKitaggBalanceMethod && !customer) {
        showAlert("Login diperlukan untuk memakai saldo KITAGG.");
        focusStep("payment", paymentStepRef);
        return;
      }

      if (isKitaggBalanceMethod && nextPaymentMethod) {
        const nextTotal = getPaymentTotal(subtotalAfterDiscount, nextPaymentMethod);
        const availableBalance = Number(customer?.balance || 0);

        if (availableBalance < nextTotal) {
          showAlert(
            `Saldo tidak cukup, silakan topup terlebih dahulu. Saldo tersedia Rp${availableBalance.toLocaleString(
              "id-ID"
            )}.`
          );
          focusStep("payment", paymentStepRef);
          return;
        }
      }

      clearCreatedOrder();
      setSelectionAlert(null);
      setPaymentMethodCode(methodCode);

      window.requestAnimationFrame(() => {
        focusStep("contact", contactStepRef);
      });
    },
    [
      clearCreatedOrder,
      customer,
      focusStep,
      paymentMethods,
      paymentStepRef,
      selectedVariant,
      showAlert,
      subtotalAfterDiscount,
      variantStepRef,
    ]
  );

  const handleOrderClick = useCallback(async () => {
    if (!isAccountDataReady) {
      showAlert(
        resolvedInputs.length === 0
          ? "Input akun untuk game ini belum tersedia."
          : "Silakan isi data akun terlebih dahulu."
      );
      focusStep("account", accountStepRef);
      return;
    }

    if (!selectedVariant) {
      showAlert("Silakan pilih nominal terlebih dahulu.");
      focusStep("variant", variantStepRef);
      return;
    }

    if (paymentMethods.length === 0) {
      showAlert("Metode pembayaran belum tersedia.");
      focusStep("payment", paymentStepRef);
      return;
    }

    if (!paymentMethodCode) {
      showAlert("Silakan pilih metode pembayaran terlebih dahulu.");
      focusStep("payment", paymentStepRef);
      return;
    }

    if (!contactPhoneNumber.trim()) {
      showAlert("Silakan isi nomor kontak terlebih dahulu.");
      focusStep("contact", contactStepRef);
      return;
    }

    if (isBalancePayment && !customer) {
      showAlert("Login diperlukan untuk memakai saldo KITAGG.");
      focusStep("payment", paymentStepRef);
      return;
    }

    if (isBalancePayment && Number(customer?.balance || 0) < totalPayment) {
      showAlert(
        `Saldo KITAGG tidak cukup. Saldo tersedia Rp${Number(
          customer?.balance || 0
        ).toLocaleString("id-ID")}`
      );
      focusStep("payment", paymentStepRef);
      return;
    }

    try {
      setIsCreatingOrder(true);
      setSelectionAlert(null);
      setSuccessToast(null);

      const draftOrder = await createOrderDraft({
        payload: {
          gameCode: game.code,
          variantId: selectedVariant._id,
          quantity: safeQuantity,
          paymentMethodCode,
          promoCode: appliedPromo?.code || "",
          customerInputs: resolvedInputs.map((input) => {
            const key = input.name || input.title;

            return {
              name: input.name,
              title: input.title,
              type: input.type,
              value: accountValues[key] || "",
            };
          }),
          contactDetail: {
            email: contactEmail,
            phoneCountryCode: contactPhoneCode,
            phoneNumber: contactPhoneNumber,
          },
        },
        fallbackTotalAmount: totalPayment,
        fallbackCurrency: selectedVariant.currency,
      });

      if (draftOrder.invoiceNumber) {
        if (isBalancePayment) {
          await refresh();
        }
        router.push(`/invoice/${encodeURIComponent(draftOrder.invoiceNumber)}`);
        return;
      }

      setCreatedOrder({
        invoiceNumber: draftOrder.invoiceNumber,
        totalAmount: draftOrder.totalAmount,
        currency: draftOrder.currency,
      });
      setSuccessToast({
        id: Date.now(),
        message: draftOrder.invoiceNumber
          ? `Order draft berhasil dibuat. Invoice: ${draftOrder.invoiceNumber}`
          : "Order draft berhasil dibuat.",
      });
    } catch (error) {
      showAlert(
        error instanceof Error ? error.message : "Gagal membuat order draft."
      );
    } finally {
      setIsCreatingOrder(false);
    }
  }, [
    accountValues,
    appliedPromo?.code,
    contactPhoneCode,
    contactPhoneNumber,
    contactEmail,
    focusStep,
    game.code,
    customer,
    isAccountDataReady,
    isBalancePayment,
    paymentMethodCode,
    paymentMethods.length,
    refresh,
    resolvedInputs,
    router,
    selectedVariant,
    showAlert,
    safeQuantity,
    totalPayment,
  ]);

  return {
    accountStepRef,
    accountValues,
    appliedPromo,
    baseSubtotal,
    clearCreatedOrder,
    contactEmail,
    contactPhoneCode,
    contactPhoneNumber,
    contactStepNumber,
    contactStepRef,
    createdOrder,
    quantity: safeQuantity,
    quantityStepNumber,
    quantityStepRef,
    handleOrderClick,
    handlePaymentMethodSelect,
    handlePromoChange,
    handleVariantSelect,
    highlightedStep,
    isCreatingOrder,
    isMobileSummaryExpanded,
    mobileBottomSpacing,
    mobileCheckoutMounted,
    mobileContentTab,
    openFaqItems,
    openPaymentGroups,
    paymentFee,
    paymentMethodCode,
    paymentMethodGroups,
    paymentStepNumber,
    paymentStepRef,
    promoDiscount,
    promoStepNumber,
    resolvedInputs,
    reviewPageHref,
    selectedPaymentMethod,
    selectedVariant,
    selectionAlert,
    setAccountValues,
    setContactEmail,
    setContactPhoneNumber,
    setIsMobileSummaryExpanded,
    setMobileContentTab,
    setOpenFaqItems,
    setOpenPaymentGroups,
    setSelectionAlert,
    showAccountStep,
    successToast,
    totalPayment,
    variantGroups,
    variantStepNumber,
    variantStepRef,
    handleAccountValueChange: (key: string, nextValue: string) => {
      clearCreatedOrder();
      setSelectionAlert(null);
      setAccountValues((current) => ({
        ...current,
        [key]: nextValue,
      }));
    },
    handleContactEmailChange: (nextValue: string) => {
      clearCreatedOrder();
      setSelectionAlert(null);
      setContactEmail(nextValue);
    },
    handleContactPhoneChange: (nextValue: string) => {
      clearCreatedOrder();
      setSelectionAlert(null);
      setContactPhoneNumber(nextValue);
    },
    handleQuantityChange: (nextQuantity: number) => {
      clearCreatedOrder();
      setSelectionAlert(null);
      setQuantity(Math.min(Math.max(Number(nextQuantity || 1), 1), 10));
    },
    toggleFaqItem: (index: number) =>
      setOpenFaqItems((current) => ({
        ...current,
        [index]: !current[index],
      })),
  };
}
