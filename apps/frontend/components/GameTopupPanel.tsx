"use client";

import { useState } from "react";
import type {
  StorefrontGameDetail,
  StorefrontVariant,
} from "@/lib/siteData";

type GameDetail = StorefrontGameDetail["game"];

type GameTopupPanelProps = {
  game: GameDetail;
  variants: StorefrontVariant[];
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

function renderInputControl(
  gameInput: GameDetail["inputs"][number],
  value: string,
  onChange: (nextValue: string) => void
) {
  const commonClassName =
    "h-11 w-full rounded-[14px] border border-white/8 bg-[#3a3b40] px-3.5 text-[13px] text-white outline-none transition placeholder:text-white/28 focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/18 sm:h-[42px]";

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
      className={commonClassName}
    />
  );
}

function StepPanel({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-white/8 bg-[#2a2a2f] shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
      <div className="flex min-h-[46px] items-stretch border-b border-white/8 bg-[#474747] sm:min-h-[48px]">
        <div className="flex w-9 shrink-0 items-center justify-center bg-[#ff7a1a] text-sm font-bold text-white sm:w-10 sm:text-[15px]">
          {number}
        </div>
        <div className="flex min-w-0 items-center px-3.5 sm:px-4">
          <h2 className="truncate text-[13px] font-semibold text-white sm:text-sm">
            {title}
          </h2>
        </div>
      </div>

      <div className="bg-[#2d2d31] p-3.5 sm:p-4">{children}</div>
    </section>
  );
}

export default function GameTopupPanel({
  game,
  variants,
}: GameTopupPanelProps) {
  const resolvedInputs = getBangjeffInputs(game);
  const [accountValues, setAccountValues] = useState<Record<string, string>>(
    () => createInitialInputValues(resolvedInputs)
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants[0]?._id || ""
  );

  const selectedVariant =
    variants.find((variant) => variant._id === selectedVariantId) ||
    variants[0] ||
    null;

  return (
    <div className="site-shell pt-8 sm:pt-10">
      <div className="xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] xl:items-start xl:gap-7">
        <div className="space-y-6">
          <StepPanel number={1} title="Masukkan Data Akun">
            {resolvedInputs.length > 0 ? (
              <div
                className={`grid gap-4 ${
                  resolvedInputs.length > 1 ? "md:grid-cols-2" : ""
                }`}
              >
                {resolvedInputs.map((gameInput) => {
                  const key = gameInput.name || gameInput.title;

                  return (
                  <label key={key} className="block">
                    <span className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/88">
                      {gameInput.title || gameInput.name}
                      <span className="text-[11px] text-white/45">ⓘ</span>
                    </span>
                      {renderInputControl(
                        gameInput,
                        accountValues[key] || "",
                        (nextValue) =>
                          setAccountValues((current) => ({
                            ...current,
                            [key]: nextValue,
                          }))
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] leading-6 text-white/58">
                Input akun untuk game ini belum tersedia di database storefront.
                Jalankan <span className="font-semibold text-white/82">Sync Details</span>{" "}
                dari provider BangJeff agar field input asli dari BangJeff masuk ke
                game ini.
              </div>
            )}
          </StepPanel>

          <StepPanel number={2} title="Pilih Nominal">
            {variants.length > 0 ? (
              <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?._id === variant._id;
                  const variantLogo = variant.logo || game.logo || "";

                  return (
                    <button
                      key={variant._id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant._id)}
                      className={`group relative overflow-hidden rounded-[18px] border text-left transition ${
                        isSelected
                          ? "border-[#ff7a1a] bg-[#34353b] shadow-[0_0_0_1px_rgba(255,122,26,0.18)]"
                          : "border-white/8 bg-[#34353b] hover:border-[#ff7a1a]/60"
                      }`}
                    >
                      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:10px_10px]" />

                      <div className="relative p-3.5 sm:p-4">
                        <p className="line-clamp-2 min-h-[2.15rem] text-[12px] font-medium leading-[1.35rem] text-white/92 sm:text-[13px]">
                          {variant.name}
                        </p>

                        <div className="mt-2.5 flex items-center gap-2.5">
                          {variantLogo ? (
                            <img
                              src={variantLogo}
                              alt={variant.name}
                              className="h-8 w-8 shrink-0 rounded-[10px] object-cover object-center sm:h-9 sm:w-9"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-base text-white/84 sm:h-9 sm:w-9 sm:text-lg">
                              ◆
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-lg font-bold leading-none text-[#ff8d2a] sm:text-[1.75rem]">
                              {formatCurrency(variant.price, variant.currency)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-white/48 sm:text-[11px]">
                          <span>{variant.region || "ID"}</span>
                          <span className="rounded-[9px] bg-white px-2.5 py-1 font-semibold text-[#3f3f3f]">
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
            ) : (
              <div className="rounded-[16px] border border-dashed border-white/10 bg-[#242429] px-4 py-4 text-[13px] text-white/52">
                Belum ada variant aktif untuk game ini.
              </div>
            )}
          </StepPanel>
        </div>

        <aside className="mt-6 hidden xl:block xl:mt-0" aria-hidden="true">
          <div className="min-h-[520px] rounded-[24px] border border-transparent" />
        </aside>
      </div>
    </div>
  );
}
