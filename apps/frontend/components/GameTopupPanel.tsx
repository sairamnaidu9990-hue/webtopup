"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type {
  StorefrontGameDetail,
  StorefrontVariant,
} from "@/lib/siteData";

type GameDetail = StorefrontGameDetail["game"];

type GameTopupPanelProps = {
  game: GameDetail;
  variants: StorefrontVariant[];
};

const PAYMENT_METHOD_OPTIONS = [
  { code: "BCA_VA", name: "BCA Virtual Account" },
  { code: "MANDIRI_VA", name: "Mandiri Virtual Account" },
  { code: "BNI_VA", name: "BNI Virtual Account" },
  { code: "BRI_VA", name: "BRI Virtual Account" },
  { code: "PERMATA_VA", name: "Permata Virtual Account" },
  { code: "QRIS", name: "QRIS" },
];

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

export default function GameTopupPanel({
  game,
  variants,
}: GameTopupPanelProps) {
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
  const [isMobileSummaryExpanded, setIsMobileSummaryExpanded] = useState(false);
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
  const variantStepNumber = showAccountStep ? 2 : 1;
  const paymentStepNumber = variantStepNumber + 1;
  const contactStepNumber = paymentStepNumber + 1;
  const paymentFee = 0;
  const totalPayment = (selectedVariant?.price || 0) + paymentFee;
  const selectedPaymentMethod =
    PAYMENT_METHOD_OPTIONS.find((method) => method.code === paymentMethodCode) ||
    null;
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
    setSelectionAlert({
      id: Date.now(),
      message,
    });
  };

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
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

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

    setSelectionAlert(null);
    setSelectedVariantId(variantId);
    setIsMobileSummaryExpanded(false);

    window.requestAnimationFrame(() => {
      focusStep("payment", paymentStepRef);
    });
  };

  const handleOrderClick = () => {
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

    if (!paymentMethodCode) {
      showAlert("Silakan pilih metode pembayaran terlebih dahulu.");
      focusStep("payment", paymentStepRef);
      return;
    }

    if (!contactPhoneNumber.trim()) {
      showAlert("Silakan isi nomor kontak terlebih dahulu.");
      focusStep("contact", contactStepRef);
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
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/88">
                    Bank Pembayaran
                  </span>
                  <select
                    value={paymentMethodCode}
                    onChange={(event) => {
                      setSelectionAlert(null);
                      setPaymentMethodCode(event.target.value);
                    }}
                    className="h-11 w-full rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-base text-white outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] sm:h-[42px] sm:text-[13px]"
                  >
                    <option value="">Pilih metode pembayaran</option>
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <option key={method.code} value={method.code}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
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

          <div className="hidden space-y-3 md:block">
            <section className="overflow-hidden rounded-[18px] border border-white/8 bg-[#2a2a2f] shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
              {selectedVariant ? (
                <div className="space-y-4 p-4 sm:p-[18px]">
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
                        {formatCurrency(
                          selectedVariant.price,
                          selectedVariant.currency
                        )}
                      </span>
                    </div>

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
                        {formatCurrency(
                          totalPayment,
                          selectedVariant.currency
                        )}
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
              className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-4 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition hover:brightness-105"
            >
              Pesan Sekarang
            </button>
          </div>
        </div>

        <aside className="mt-6 hidden xl:block xl:mt-0" aria-hidden="true">
          <div className="min-h-[520px] rounded-[24px] border border-transparent" />
        </aside>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[rgba(20,22,27,0.94)] backdrop-blur-xl md:hidden"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <div className="site-shell space-y-3 pt-3">
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
                            selectedVariant.price,
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
                              selectedVariant.price,
                              selectedVariant.currency
                            )}
                          </span>
                        </div>

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
            className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,var(--accent-strong)_0%,var(--accent)_100%)] px-4 text-[14px] font-semibold text-white shadow-[0_14px_28px_var(--accent-glow)] transition active:scale-[0.99]"
          >
            Pesan Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
