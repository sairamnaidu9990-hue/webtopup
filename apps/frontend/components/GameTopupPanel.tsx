"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PromoCodeSection, {
  type AppliedPromoCode,
} from "@/components/PromoCodeSection";
import type {
  StorefrontGameDetail,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/siteData";

type GameDetail = StorefrontGameDetail["game"];

type GameTopupPanelProps = {
  game: GameDetail;
  variants: StorefrontVariant[];
  paymentMethods: StorefrontPaymentMethod[];
  categoryDescription?: string;
  gameFaqs?: Array<{
    question: string;
    answer: string;
  }>;
};

function getBangjeffInputs(game: GameDetail) {
  return Array.isArray(game.inputs)
    ? game.inputs.filter(
        (input) =>
          String(input?.name || "").trim() || String(input?.title || "").trim()
      )
    : [];
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "IDR"} ${value}`;
  }
}

function getPaymentTotal(
  baseAmount: number,
  paymentMethod?: StorefrontPaymentMethod | null
) {
  if (!paymentMethod) {
    return baseAmount;
  }

  const feeFixed = Number(paymentMethod.feeFixed || 0);
  const feePercent = Math.ceil(
    (baseAmount * Number(paymentMethod.feePercent || 0)) / 100
  );
  const fee = feeFixed + feePercent;

  return baseAmount + fee;
}

function createInitialInputValues(inputs: GameDetail["inputs"]) {
  return inputs.reduce<Record<string, string>>((acc, input) => {
    const key = input.name || input.title;
    acc[key] = input.type === "select" ? input.options[0]?.value || "" : "";
    return acc;
  }, {});
}

function buildInputPlaceholder(title: string) {
  const cleanTitle = String(title || "").trim();

  if (!cleanTitle) {
    return "Masukkan data";
  }

  return `Masukkan ${cleanTitle}`;
}

function isInputValueComplete(
  gameInput: GameDetail["inputs"][number],
  value: string
) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return false;
  }

  if (gameInput.minLength > 0 && normalizedValue.length < gameInput.minLength) {
    return false;
  }

  return true;
}

function getSortedVariantCategories(game: GameDetail) {
  return Array.isArray(game.variantCategories)
    ? [...game.variantCategories]
        .filter(
          (category) =>
            String(category?._id || "").trim() &&
            String(category?.name || "").trim()
        )
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    : [];
}

function buildVariantGroups(
  game: GameDetail,
  variants: StorefrontVariant[]
): Array<{
  id: string;
  name: string;
  variants: StorefrontVariant[];
}> {
  if (variants.length === 0) {
    return [];
  }

  const categories = getSortedVariantCategories(game);

  if (categories.length === 0) {
    return [
      {
        id: "topup",
        name: "Topup",
        variants,
      },
    ];
  }

  const groups = categories.map((category) => ({
    id: category._id,
    name: category.name,
    variants: [] as StorefrontVariant[],
  }));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const fallbackGroupName =
    categories.find((category) =>
      String(category.name || "")
        .trim()
        .toLowerCase()
        .includes("topup")
    )?.name || "Topup";
  const ungroupedVariants: StorefrontVariant[] = [];

  variants.forEach((variant) => {
    const categoryId = String(variant.variantCategoryId || "").trim();
    const targetGroup = categoryId ? groupMap.get(categoryId) : null;

    if (targetGroup) {
      targetGroup.variants.push(variant);
      return;
    }

    ungroupedVariants.push(variant);
  });

  const visibleGroups = groups.filter((group) => group.variants.length > 0);

  if (ungroupedVariants.length > 0) {
    visibleGroups.push({
      id: "topup-fallback",
      name: fallbackGroupName,
      variants: ungroupedVariants,
    });
  }

  return visibleGroups;
}

function buildPaymentMethodGroups(paymentMethods: StorefrontPaymentMethod[]) {
  const groups = new Map<
    string,
    {
      id: string;
      title: string;
      order: number;
      methods: StorefrontPaymentMethod[];
    }
  >();

  paymentMethods.forEach((paymentMethod) => {
    const categoryId = String(paymentMethod.category?._id || "").trim();
    const groupId = categoryId || "other";
    const groupTitle = paymentMethod.category?.name || "Metode Lainnya";
    const groupOrder = Number(paymentMethod.category?.order || 9999);
    const currentGroup = groups.get(groupId);

    if (currentGroup) {
      currentGroup.methods.push(paymentMethod);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      title: groupTitle,
      order: groupOrder,
      methods: [paymentMethod],
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      methods: [...group.methods].sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function PaymentMethodLogo({
  paymentMethod,
  compact = false,
}: {
  paymentMethod: StorefrontPaymentMethod;
  compact?: boolean;
}) {
  const wrapperClassName = compact
    ? "inline-flex h-6 items-center rounded-[6px] bg-white px-1.5 shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
    : "inline-flex items-center rounded-[10px] bg-white px-2 py-1.5 shadow-[0_8px_16px_rgba(0,0,0,0.12)]";
  const imageClassName = compact
    ? "h-3.5 w-auto max-w-[52px] object-contain object-left"
    : "h-7 w-auto max-w-[92px] object-contain object-left";

  if (paymentMethod.logo) {
    return (
      <div className={wrapperClassName}>
        <Image
          src={paymentMethod.logo}
          alt={paymentMethod.name}
          width={compact ? 52 : 92}
          height={compact ? 14 : 28}
          sizes={compact ? "52px" : "92px"}
          className={imageClassName}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center bg-white font-semibold text-[#1f2024] ${
        compact
          ? "h-6 min-w-[52px] rounded-[6px] px-1.5 text-[9px] shadow-[0_6px_12px_rgba(0,0,0,0.12)]"
          : "h-10 min-w-[92px] rounded-[10px] px-3 text-[11px] shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
      }`}
    >
      {paymentMethod.name}
    </div>
  );
}

function renderInputControl(
  gameInput: GameDetail["inputs"][number],
  value: string,
  onChange: (nextValue: string) => void
) {
  const commonClassName =
    "h-11 w-full rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] sm:h-[42px] sm:text-[13px]";

  if (gameInput.type === "select") {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${commonClassName} appearance-none`}
      >
        {gameInput.options.length > 0 ? (
          gameInput.options.map((option) => (
            <option key={`${gameInput.name}-${option.value}`} value={option.value}>
              {option.title || option.value}
            </option>
          ))
        ) : (
          <option value="">Pilih {gameInput.title || gameInput.name}</option>
        )}
      </select>
    );
  }

  const type =
    gameInput.type === "number" || gameInput.type === "password"
      ? gameInput.type
      : "text";

  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={
        gameInput.placeholder ||
        buildInputPlaceholder(gameInput.title || gameInput.name)
      }
      minLength={gameInput.minLength > 0 ? gameInput.minLength : undefined}
      maxLength={gameInput.maxLength > 0 ? gameInput.maxLength : undefined}
      pattern={gameInput.regexValidation || undefined}
      inputMode={type === "number" ? "numeric" : undefined}
      className={`${commonClassName} ${type === "number" ? "topup-number-input" : ""}`}
    />
  );
}

function StepPanel({
  number,
  title,
  children,
  className = "",
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition-[border-color,box-shadow,transform] duration-300 ${className}`}
    >
      <div className="flex min-h-[39px] items-stretch border-b border-white/8 bg-[#474747] sm:min-h-[40px]">
        <div className="flex w-8 shrink-0 items-center justify-center bg-[var(--accent)] text-[12px] font-bold text-white sm:w-9 sm:text-[13px]">
          {number}
        </div>
        <div className="flex min-w-0 items-center px-3 sm:px-3.5">
          <h2 className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
            {title}
          </h2>
        </div>
      </div>

      <div className="bg-[#2d2d31] p-3 sm:p-3.5">{children}</div>
    </section>
  );
}

function DetailInfoPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
      <div className="flex min-h-[39px] items-stretch border-b border-white/8 bg-[#474747] sm:min-h-[40px]">
        <div className="w-8 shrink-0 bg-[var(--accent-soft)] sm:w-9" />
        <div className="flex min-w-0 items-center px-3 sm:px-3.5">
          <h2 className="truncate text-[11px] font-semibold text-white sm:text-[12px]">
            {title}
          </h2>
        </div>
      </div>

      <div className="bg-[#2d2d31] px-4 py-4 text-[13px] leading-7 text-white/88 sm:px-5 sm:py-4 sm:text-[14px]">
        {children}
      </div>
    </section>
  );
}

export default function GameTopupPanel({
  game,
  variants,
  paymentMethods,
  categoryDescription = "",
  gameFaqs = [],
}: GameTopupPanelProps) {
  const router = useRouter();
  const resolvedInputs = getBangjeffInputs(game);
  const isVoucherCategory =
    String(game.category || "").trim().toLowerCase() === "voucher";
  const showAccountStep = !isVoucherCategory;
  const [accountValues, setAccountValues] = useState<Record<string, string>>(
    () => createInitialInputValues(resolvedInputs)
  );
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [paymentMethodCode, setPaymentMethodCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhoneCode] = useState("+62");
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
  const [openFaqItems, setOpenFaqItems] = useState<Record<number, boolean>>({});
  const [openPaymentGroups, setOpenPaymentGroups] = useState<
    Record<string, boolean>
  >({});
  const [highlightedStep, setHighlightedStep] = useState<
    "account" | "variant" | "payment" | "contact" | null
  >(null);
  const accountStepRef = useRef<HTMLDivElement | null>(null);
  const variantStepRef = useRef<HTMLDivElement | null>(null);
  const paymentStepRef = useRef<HTMLDivElement | null>(null);
  const contactStepRef = useRef<HTMLDivElement | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const selectedVariant =
    variants.find((variant) => variant._id === selectedVariantId) || null;
  const variantGroups = buildVariantGroups(game, variants);
  const paymentMethodGroups = buildPaymentMethodGroups(paymentMethods);
  const variantStepNumber = showAccountStep ? 2 : 1;
  const paymentStepNumber = variantStepNumber + 1;
  const contactStepNumber = paymentStepNumber + 1;
  const promoStepNumber = contactStepNumber + 1;
  const selectedPaymentMethod =
    paymentMethods.find((method) => method.code === paymentMethodCode) ||
    null;
  const baseSubtotal = selectedVariant?.price || 0;
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
  const isAccountDataReady =
    !showAccountStep ||
    (resolvedInputs.length > 0 &&
      resolvedInputs.every((gameInput) =>
        isInputValueComplete(
          gameInput,
          accountValues[gameInput.name || gameInput.title] || ""
        )
      ));
  const mobileBottomSpacing = selectedVariant
    ? isMobileSummaryExpanded
      ? "pb-[148px] md:pb-0"
      : "pb-[104px] md:pb-0"
    : "pb-[72px] md:pb-0";

  const showAlert = (message: string) => {
    setSuccessToast(null);
    setSelectionAlert({
      id: Date.now(),
      message,
    });
  };

  const clearCreatedOrder = () => {
    setCreatedOrder(null);
    setSuccessToast(null);
  };

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
  }, [paymentMethods, paymentMethodCode]);

  const focusStep = (
    step: "account" | "variant" | "payment" | "contact",
    ref: React.RefObject<HTMLDivElement | null>
  ) => {
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
  };

  const handleVariantSelect = (variantId: string) => {
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
      focusStep("payment", paymentStepRef);
    });
  };

  const handlePaymentMethodSelect = (methodCode: string) => {
    if (!selectedVariant) {
      showAlert("Silakan pilih nominal terlebih dahulu.");
      focusStep("variant", variantStepRef);
      return;
    }

    clearCreatedOrder();
    setSelectionAlert(null);
    setPaymentMethodCode(methodCode);

    window.requestAnimationFrame(() => {
      focusStep("contact", contactStepRef);
    });
  };

  const handleOrderClick = async () => {
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

    try {
      setIsCreatingOrder(true);
      setSelectionAlert(null);
      setSuccessToast(null);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameCode: game.code,
          variantId: selectedVariant._id,
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
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload && typeof payload === "object" && "message" in payload
            ? String(payload.message || "Gagal membuat order draft")
            : "Gagal membuat order draft"
        );
      }

      const invoiceNumber =
        payload &&
        typeof payload === "object" &&
        "order" in payload &&
        payload.order &&
        typeof payload.order === "object" &&
        "invoiceNumber" in payload.order
          ? String(payload.order.invoiceNumber || "")
          : "";
      const totalAmount =
        payload &&
        typeof payload === "object" &&
        "order" in payload &&
        payload.order &&
        typeof payload.order === "object" &&
        "price" in payload.order &&
        payload.order.price &&
        typeof payload.order.price === "object" &&
        "totalAmount" in payload.order.price
          ? Number(payload.order.price.totalAmount || totalPayment)
          : totalPayment;
      const currency =
        payload &&
        typeof payload === "object" &&
        "order" in payload &&
        payload.order &&
        typeof payload.order === "object" &&
        "price" in payload.order &&
        payload.order.price &&
        typeof payload.order.price === "object" &&
        "currency" in payload.order.price
          ? String(payload.order.price.currency || selectedVariant.currency)
          : selectedVariant.currency;

      if (invoiceNumber) {
        router.push(`/invoice/${encodeURIComponent(invoiceNumber)}`);
        return;
      }

      setCreatedOrder({
        invoiceNumber,
        totalAmount,
        currency,
      });
      setSuccessToast({
        id: Date.now(),
        message: invoiceNumber
          ? `Order draft berhasil dibuat. Invoice: ${invoiceNumber}`
          : "Order draft berhasil dibuat.",
      });
    } catch (error) {
      showAlert(
        error instanceof Error ? error.message : "Gagal membuat order draft."
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="site-shell pt-8 sm:pt-10">
      <div className="xl:grid xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] xl:items-start xl:gap-8">
        <div className={`space-y-6 ${mobileBottomSpacing}`}>
          {selectionAlert ? (
            <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex w-full -translate-x-1/2 justify-center px-4 md:top-4">
              <div className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-[14px] border border-red-100 bg-white px-4 py-3 text-[13px] font-medium text-[#454545] shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff5a52] text-[13px] font-bold text-white">
                  ×
                </span>
                <span>{selectionAlert.message}</span>
              </div>
            </div>
          ) : null}

          {successToast ? (
            <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex w-full -translate-x-1/2 justify-center px-4 md:top-4">
              <div className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-[14px] border border-emerald-100 bg-white px-4 py-3 text-[13px] font-medium text-[#454545] shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[12px] font-bold text-white">
                  ✓
                </span>
                <span>{successToast.message}</span>
              </div>
            </div>
          ) : null}

          {showAccountStep ? (
            <div ref={accountStepRef}>
              <StepPanel
                number={1}
                title="Masukkan Data Akun"
                className={
                  highlightedStep === "account"
                    ? "border-[rgba(211,59,59,0.55)] shadow-[0_0_0_1px_rgba(211,59,59,0.22),0_18px_32px_rgba(0,0,0,0.18)]"
                    : ""
                }
              >
                {resolvedInputs.length > 0 ? (
                  <div
                    className={`grid gap-3 ${
                      resolvedInputs.length > 1 ? "grid-cols-2" : ""
                    }`}
                  >
                    {resolvedInputs.map((gameInput) => {
                      const key = gameInput.name || gameInput.title;

                      return (
                        <label key={key} className="block">
                          <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
                            {gameInput.title || gameInput.name}
                            <span className="text-[11px] text-white/45">ⓘ</span>
                          </span>
                          {renderInputControl(
                            gameInput,
                            accountValues[key] || "",
                            (nextValue) => {
                              clearCreatedOrder();
                              setSelectionAlert(null);
                              setAccountValues((current) => ({
                                ...current,
                                [key]: nextValue,
                              }));
                            }
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] leading-6 text-white/58">
                    Input akun untuk game ini belum tersedia Jalankan{" "}
                    <span className="font-semibold text-white/82">Sync Details</span>{" "}
                    dari provider agar field input asli masuk ke game ini.
                  </div>
                )}
              </StepPanel>
            </div>
          ) : null}

          <div ref={variantStepRef}>
            <StepPanel
              number={variantStepNumber}
              title="Pilih Nominal"
              className={
                highlightedStep === "variant"
                  ? "border-[rgba(211,59,59,0.55)] shadow-[0_0_0_1px_rgba(211,59,59,0.22),0_18px_32px_rgba(0,0,0,0.18)]"
                  : ""
              }
            >
              {variantGroups.length > 0 ? (
                <div className="space-y-3.5">
                  {variantGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      {group.name ? (
                        <div className="flex items-center">
                          <h3 className="text-[12px] font-semibold text-white/92 sm:text-[13px]">
                            {group.name}
                          </h3>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                        {group.variants.map((variant) => {
                          const isSelected = selectedVariant?._id === variant._id;
                          const variantLogo = variant.logo || "";

                          return (
                            <button
                              key={variant._id}
                              type="button"
                              onClick={() => handleVariantSelect(variant._id)}
                              className={`group relative overflow-hidden rounded-[14px] border text-left transition ${
                                isSelected
                                  ? "border-[var(--accent)] bg-[#34353b] shadow-[0_0_0_1px_var(--accent-glow)]"
                                  : "border-white/8 bg-[#34353b] hover:border-[rgba(211,59,59,0.6)]"
                              }`}
                            >
                              <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:10px_10px]" />

                              <div className="relative p-2.5 sm:p-3">
                                <p className="line-clamp-2 min-h-[1.65rem] text-[9.5px] font-medium leading-[1.04rem] text-white/92 sm:min-h-[1.8rem] sm:text-[11px] sm:leading-[1.12rem]">
                                  {variant.name}
                                </p>

                                <div className="mt-1.5 flex items-center gap-2">
                                  {variantLogo ? (
                                    <Image
                                      src={variantLogo}
                                      alt={variant.name}
                                      width={28}
                                      height={28}
                                      sizes="(max-width: 640px) 24px, 28px"
                                      className="h-6 w-6 shrink-0 rounded-[8px] object-cover object-center sm:h-7 sm:w-7"
                                    />
                                  ) : (
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-white/10 text-[11px] text-white/84 sm:h-7 sm:w-7 sm:text-xs">
                                      ◆
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <p className="text-[0.88rem] font-bold leading-none text-[var(--accent-strong)] sm:text-[1.04rem]">
                                      {formatCurrency(variant.price, variant.currency)}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-2 flex justify-end">
                                  <span className="rounded-[7px] bg-white px-2 py-[5px] text-[8px] font-semibold text-[#3f3f3f] sm:text-[9px]">
                                    {variant.duration > 0
                                      ? `${variant.duration} min`
                                      : "Instant"}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] text-white/52">
                  Belum ada variant aktif untuk game ini.
                </div>
              )}
            </StepPanel>
          </div>

          <div ref={paymentStepRef}>
            <StepPanel
              number={paymentStepNumber}
              title="Pilih Pembayaran"
              className={
                highlightedStep === "payment"
                  ? "border-[rgba(211,59,59,0.55)] shadow-[0_0_0_1px_rgba(211,59,59,0.22),0_18px_32px_rgba(0,0,0,0.18)]"
                  : ""
              }
            >
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethodGroups.map((group) => {
                    const isOpen = openPaymentGroups[group.id] ?? false;
                    const hasSelectedMethod = group.methods.some(
                      (paymentMethod) => paymentMethod.code === paymentMethodCode
                    );

                    return (
                      <div
                        key={group.id}
                        className={`overflow-hidden rounded-[16px] border transition ${
                          hasSelectedMethod
                            ? "border-[var(--accent)] bg-[#3a3a3f] shadow-[0_0_0_1px_var(--accent-glow)]"
                            : "border-white/8 bg-[#333338]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenPaymentGroups((current) => ({
                              ...current,
                              [group.id]: !isOpen,
                            }))
                          }
                          className="flex w-full items-center justify-between gap-4 bg-[#26262b] px-4 py-3 text-left"
                        >
                          <span className="text-[12px] font-semibold text-white">
                            {group.title}
                          </span>
                          <span className="text-sm text-white/72">
                            {isOpen ? "▴" : "▾"}
                          </span>
                        </button>

                        {isOpen ? (
                          <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
                            {group.methods.map((paymentMethod) => {
                              const isSelected =
                                paymentMethodCode === paymentMethod.code;
                              const totalByMethod = selectedVariant
                                ? getPaymentTotal(
                                    selectedVariant.price,
                                    paymentMethod
                                  )
                                : 0;

                              return (
                                <button
                                  key={paymentMethod.code}
                                  type="button"
                                  onClick={() =>
                                    handlePaymentMethodSelect(paymentMethod.code)
                                  }
                                  className={`rounded-[14px] border px-3 py-3 text-left transition ${
                                    isSelected
                                      ? "border-[var(--accent)] bg-[#4b4b50] shadow-[0_0_0_1px_var(--accent-glow)]"
                                      : "border-white/8 bg-[#4a4a4f] hover:border-[rgba(211,59,59,0.55)]"
                                  }`}
                                >
                                  <div className="flex min-h-[44px] items-start">
                                    <PaymentMethodLogo paymentMethod={paymentMethod} />
                                  </div>

                                  <p className="mt-3 text-[12px] font-medium text-white/88">
                                    {paymentMethod.name}
                                  </p>

                                  <p className="mt-2 text-[12px] font-semibold text-white">
                                    {selectedVariant
                                      ? formatCurrency(
                                          totalByMethod,
                                          paymentMethod.currency ||
                                            selectedVariant.currency
                                        )
                                      : "Pilih nominal dulu"}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="overflow-x-auto px-4 py-3">
                            <div className="flex min-w-max items-center justify-end gap-2">
                              {group.methods.map((paymentMethod) => (
                                <div
                                  key={paymentMethod.code}
                                  className={`rounded-[8px] transition ${
                                    paymentMethodCode === paymentMethod.code
                                      ? "ring-1 ring-[var(--accent)]"
                                      : ""
                                  }`}
                                >
                                  <PaymentMethodLogo
                                    paymentMethod={paymentMethod}
                                    compact
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] text-white/58">
                  Belum ada metode pembayaran aktif yang tersedia.
                </div>
              )}
            </StepPanel>
          </div>

          <div ref={contactStepRef}>
            <StepPanel
              number={contactStepNumber}
              title="Detail Kontak"
              className={
                highlightedStep === "contact"
                  ? "border-[rgba(211,59,59,0.55)] shadow-[0_0_0_1px_rgba(211,59,59,0.22),0_18px_32px_rgba(0,0,0,0.18)]"
                  : ""
              }
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
                    Email
                    <span className="text-[11px] text-white/45">(opsional)</span>
                  </span>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => {
                      clearCreatedOrder();
                      setSelectionAlert(null);
                      setContactEmail(event.target.value);
                    }}
                    placeholder="example@gmail.com"
                    className="h-11 w-full rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-base text-white outline-none transition placeholder:text-white/28 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] sm:h-[42px] sm:text-[13px]"
                  />
                </label>

                <div className="space-y-2">
                  <label className="block">
                    <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
                      No. Kontak
                      <span className="text-[11px] text-[var(--accent-soft)]">*</span>
                    </span>
                    <div className="flex h-11 overflow-hidden rounded-[14px] border border-white/8 bg-[#3a3b40] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-glow)] sm:h-[42px]">
                      <div className="flex min-w-[74px] items-center gap-2 border-r border-white/8 px-3 text-[13px] text-white/84">
                        <span>ID</span>
                        <span>{contactPhoneCode}</span>
                      </div>

                      <input
                        type="tel"
                        value={contactPhoneNumber}
                        onChange={(event) => {
                          clearCreatedOrder();
                          setSelectionAlert(null);
                          setContactPhoneNumber(
                            event.target.value.replace(/[^0-9]/g, "")
                          );
                        }}
                        placeholder="81234567890"
                        inputMode="numeric"
                        required
                        className="topup-number-input h-full w-full bg-transparent px-3.5 text-base text-white outline-none placeholder:text-white/28 sm:text-[13px]"
                      />
                    </div>
                  </label>

                  <p className="text-[11px] italic text-white/45">
                    *Nomor ini akan dihubungi jika terjadi masalah.
                  </p>
                </div>

                <div className="rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 py-3 text-[12px] text-white/62">
                  Jika email diisi, bukti transaksi akan dikirim ke email tersebut.
                </div>
              </div>
            </StepPanel>
          </div>

          <div>
            <StepPanel number={promoStepNumber} title="Kode Promo">
              <PromoCodeSection
                category={game.category || ""}
                subtotal={baseSubtotal}
                currency={selectedVariant?.currency || "IDR"}
                disabled={!selectedVariant}
                onPromoChange={handlePromoChange}
              />
            </StepPanel>
          </div>
        </div>

        <div className="hidden space-y-3 md:block">
          <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
            {selectedVariant ? (
              <div className="space-y-4 p-4 sm:p-[18px]">
                {createdOrder ? (
                  <div className="rounded-[14px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-3 text-[12px] text-emerald-100">
                    <p className="font-semibold text-white">
                      Draft order berhasil dibuat
                    </p>
                    <p className="mt-1">
                      Invoice:{" "}
                      <span className="font-semibold text-white">
                        {createdOrder.invoiceNumber}
                      </span>
                    </p>
                  </div>
                ) : null}

                <div className="flex items-start gap-3">
                  <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#34353b]">
                    {selectedVariant.logo ? (
                      <Image
                        src={selectedVariant.logo}
                        alt={selectedVariant.name}
                        width={58}
                        height={58}
                        sizes="58px"
                        className="h-[58px] w-[58px] object-cover object-center"
                      />
                    ) : (
                      <div className="flex h-[58px] w-[58px] items-center justify-center bg-[#34353b] text-xl text-white/78">
                        ◆
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[14px] font-semibold leading-5 text-white">
                      {game.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-white/75">
                      {selectedVariant.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-[13px] text-white/84">
                  <div className="flex items-center justify-between gap-4">
                    <span>Harga</span>
                    <span className="font-medium text-white">
                      {formatCurrency(baseSubtotal, selectedVariant.currency)}
                    </span>
                  </div>

                  {appliedPromo ? (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <span>Kode Promo</span>
                        <span className="font-medium text-white">
                          {appliedPromo.code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span>Diskon Promo</span>
                        <span className="font-medium text-[var(--accent-soft)]">
                          -{formatCurrency(
                            promoDiscount,
                            selectedVariant.currency
                          )}
                        </span>
                      </div>
                    </>
                  ) : null}

                  <div className="flex items-center justify-between gap-4">
                    <span>Jumlah Pembelian</span>
                    <span className="font-medium text-white">1</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Biaya</span>
                    <span className="font-medium text-white">
                      {formatCurrency(paymentFee, selectedVariant.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span>Pembayaran</span>
                    <span className="font-medium text-white">
                      {selectedPaymentMethod?.name || "-"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/8 pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-semibold text-white">
                      Total Pembayaran
                    </span>
                    <span className="text-[1.2rem] font-bold leading-none text-[var(--accent-strong)]">
                      {formatCurrency(totalPayment, selectedVariant.currency)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-5 text-[13px] text-white/58">
                Belum ada product yang dipilih.
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={handleOrderClick}
            disabled={isCreatingOrder}
            className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-4 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreatingOrder ? "Membuat Order..." : "Pesan Sekarang"}
          </button>
        </div>

        {categoryDescription ? (
          <div className="xl:col-span-2">
            <DetailInfoPanel title={`Deskripsi ${game.name}`}>
              <div className="whitespace-pre-line">{categoryDescription}</div>
            </DetailInfoPanel>
          </div>
        ) : null}

        {gameFaqs.length > 0 ? (
          <div className="xl:col-span-2">
            <section className="space-y-4">
              <div>
                <h2 className="text-[1rem] font-semibold text-white sm:text-[1.06rem]">
                  Kamu Punya Pertanyaan?
                </h2>
              </div>

              <div className="space-y-3">
                {gameFaqs.map((item, index) => {
                  const isOpen = openFaqItems[index] ?? false;

                  return (
                    <section
                      key={`game-faq-${index}`}
                      className="overflow-hidden rounded-[16px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqItems((current) => ({
                            ...current,
                            [index]: !isOpen,
                          }))
                        }
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                      >
                        <span className="text-[13px] font-semibold leading-6 text-white sm:text-[14px]">
                          {item.question}
                        </span>
                        <span className="shrink-0 text-[15px] text-white/72">
                          {isOpen ? "▴" : "▾"}
                        </span>
                      </button>

                      {isOpen ? (
                        <div className="border-t border-white/8 px-4 py-4 text-[13px] leading-7 text-white/76 sm:px-5 sm:text-[14px]">
                          <div className="whitespace-pre-line">{item.answer}</div>
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}
      </div>

      {mobileCheckoutMounted
        ? createPortal(
            <div
              className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[rgba(20,22,27,0.96)] md:hidden"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
              }}
            >
              <div className="site-shell space-y-3 pt-3">
                {createdOrder ? (
                  <div className="rounded-[14px] border border-emerald-400/20 bg-emerald-500/10 px-3.5 py-3 text-[12px] text-emerald-100">
                    <p className="font-semibold text-white">
                      Draft order berhasil dibuat
                    </p>
                    <p className="mt-1">
                      Invoice:{" "}
                      <span className="font-semibold text-white">
                        {createdOrder.invoiceNumber}
                      </span>
                    </p>
                  </div>
                ) : null}

                <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
                  {selectedVariant ? (
                    <button
                      type="button"
                      onClick={() =>
                        setIsMobileSummaryExpanded((current) => !current)
                      }
                      className="block w-full p-3.5 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="overflow-hidden rounded-[12px] border border-white/8 bg-[#34353b]">
                          {selectedVariant.logo ? (
                            <Image
                              src={selectedVariant.logo}
                              alt={selectedVariant.name}
                              width={46}
                              height={46}
                              sizes="46px"
                              className="h-[46px] w-[46px] object-cover object-center"
                            />
                          ) : (
                            <div className="flex h-[46px] w-[46px] items-center justify-center bg-[#34353b] text-base text-white/78">
                              ◆
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-[13px] font-semibold text-white">
                                {selectedVariant.name}
                              </p>
                              <p className="mt-1 text-[15px] font-bold leading-none text-[var(--accent-strong)]">
                                {formatCurrency(
                                  totalPayment,
                                  selectedVariant.currency
                                )}
                              </p>
                            </div>

                            <span className="text-sm text-white/54">
                              {isMobileSummaryExpanded ? "▴" : "▾"}
                            </span>
                          </div>

                          {isMobileSummaryExpanded ? (
                            <div className="mt-3 space-y-2 border-t border-white/8 pt-3 text-[12px] text-white/78">
                              <div className="flex items-center justify-between gap-3">
                                <span>Harga</span>
                                <span className="font-medium text-white">
                                  {formatCurrency(
                                    baseSubtotal,
                                    selectedVariant.currency
                                  )}
                                </span>
                              </div>

                              {appliedPromo ? (
                                <>
                                  <div className="flex items-center justify-between gap-3">
                                    <span>Kode Promo</span>
                                    <span className="font-medium text-white">
                                      {appliedPromo.code}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <span>Diskon Promo</span>
                                    <span className="font-medium text-[var(--accent-soft)]">
                                      -{formatCurrency(
                                        promoDiscount,
                                        selectedVariant.currency
                                      )}
                                    </span>
                                  </div>
                                </>
                              ) : null}

                              <div className="flex items-center justify-between gap-3">
                                <span>Biaya</span>
                                <span className="font-medium text-white">
                                  {formatCurrency(
                                    paymentFee,
                                    selectedVariant.currency
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-white">
                                  Total Pembayaran
                                </span>
                                <span className="text-[14px] font-bold leading-none text-[var(--accent-strong)]">
                                  {formatCurrency(
                                    totalPayment,
                                    selectedVariant.currency
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="px-4 py-4 text-center text-[13px] text-white/58">
                      Belum ada product yang dipilih.
                    </div>
                  )}
                </section>

                <button
                  type="button"
                  onClick={handleOrderClick}
                  disabled={isCreatingOrder}
                  className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-4 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingOrder ? "Membuat Order..." : "Pesan Sekarang"}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
