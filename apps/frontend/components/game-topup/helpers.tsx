"use client";

import type {
  StorefrontGameDetail,
  StorefrontPaymentMethod,
  StorefrontVariant,
} from "@/lib/siteData";

type GameDetail = StorefrontGameDetail["game"];

export type VariantGroup = {
  id: string;
  name: string;
  variants: StorefrontVariant[];
};

export type PaymentMethodGroup = {
  id: string;
  title: string;
  order: number;
  methods: StorefrontPaymentMethod[];
};

export function getBangjeffInputs(game: GameDetail) {
  return Array.isArray(game.inputs)
    ? game.inputs.filter(
        (input) =>
          String(input?.name || "").trim() || String(input?.title || "").trim()
      )
    : [];
}

export function formatCurrency(value: number, currency: string) {
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

export function getPaymentTotal(
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

export function createInitialInputValues(inputs: GameDetail["inputs"]) {
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

export function isInputValueComplete(
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

export function buildVariantGroups(
  game: GameDetail,
  variants: StorefrontVariant[]
): VariantGroup[] {
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

export function buildPaymentMethodGroups(
  paymentMethods: StorefrontPaymentMethod[]
): PaymentMethodGroup[] {
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

export function renderInputControl(
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
