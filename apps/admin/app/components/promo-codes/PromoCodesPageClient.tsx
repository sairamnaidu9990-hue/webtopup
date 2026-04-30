"use client";

import { useCallback, useDeferredValue, useEffect, useState } from "react";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import PromoCodeForm from "@/app/components/promo-codes/PromoCodeForm";
import PromoCodeList from "@/app/components/promo-codes/PromoCodeList";
import type {
  PromoCode,
  PromoCodeDiscountType,
  PromoCodeGameScope,
} from "@/app/types/PromoCode";

const PAGE_LIMIT = 20;

function resetNumber(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized === "" ? fallback : normalized;
}

function sortCategories(categories: string[]) {
  return [...categories].sort((a, b) => a.localeCompare(b));
}

function normalizeGameOptions(items: unknown): PromoCodeGameScope[] {
  const source = Array.isArray(items) ? items : [];

  return source
    .map((item) => {
      const value = item as Record<string, unknown>;
      return {
        _id: String(value?._id || "").trim(),
        name: String(value?.name || "").trim(),
        code: String(value?.code || "")
          .trim()
          .toUpperCase(),
        category: String(value?.category || "").trim(),
        logo: String(value?.logo || "").trim(),
      };
    })
    .filter((item) => item._id && item.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function deriveCategoriesFromGames(
  selectedGameIds: string[],
  availableGames: PromoCodeGameScope[]
) {
  const selectedIdSet = new Set(selectedGameIds);
  const categories = availableGames
    .filter((game) => selectedIdSet.has(game._id))
    .map((game) => game.category || "")
    .filter(Boolean);

  return sortCategories(Array.from(new Set(categories)));
}

export default function PromoCodesPageClient() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [availableGames, setAvailableGames] = useState<PromoCodeGameScope[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [gameFilter, setGameFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] =
    useState<PromoCodeDiscountType>("fixed");
  const [discountValue, setDiscountValue] = useState("0");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState("0");
  const [maxDailyUses, setMaxDailyUses] = useState("0");
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);
  const [applicableGameIds, setApplicableGameIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState("9999");

  const deferredSearch = useDeferredValue(search);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setCode("");
    setDescription("");
    setDiscountType("fixed");
    setDiscountValue("0");
    setMinimumOrderAmount("0");
    setMaxDailyUses("0");
    setApplicableCategories([]);
    setApplicableGameIds([]);
    setIsActive(true);
    setOrder("9999");
  };

  const fetchGameScopes = useCallback(async () => {
    try {
      const response = await fetch("/api/games?status=ACTIVE", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<unknown>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal ambil data game"));
      }

      const normalizedGames = normalizeGameOptions(payload);
      const normalizedCategories = sortCategories(
        Array.from(
          new Set(
            normalizedGames
              .map((game) => game.category || "")
              .filter(Boolean)
          )
        )
      );

      setAvailableGames(normalizedGames);
      setCategories(normalizedCategories);
    } catch (fetchError) {
      console.error(fetchError);
      setAvailableGames([]);
      setCategories([]);
    }
  }, []);

  const fetchPromoCodes = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });

      if (deferredSearch.trim()) {
        params.set("search", deferredSearch.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (categoryFilter !== "ALL") {
        params.set("category", categoryFilter);
      }

      if (gameFilter !== "ALL") {
        params.set("gameId", gameFilter);
      }

      const response = await fetch(`/api/promo-codes?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: PromoCode[];
        totalItems?: number;
        totalPages?: number;
        page?: number;
      }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal ambil promo code"));
      }

      setPromoCodes(Array.isArray(payload?.items) ? payload.items : []);
      setTotalItems(Number(payload?.totalItems || 0));
      setTotalPages(Number(payload?.totalPages || 1));
      setPage(Number(payload?.page || 1));
    } catch (fetchError) {
      setPromoCodes([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal ambil promo code"
      );
    } finally {
      setLoading(false);
    }
  }, [page, deferredSearch, statusFilter, categoryFilter, gameFilter]);

  useEffect(() => {
    setLoading(true);
    void fetchPromoCodes();
  }, [fetchPromoCodes]);

  useEffect(() => {
    void fetchGameScopes();
  }, [fetchGameScopes]);

  useEffect(() => {
    setApplicableCategories((current) => {
      const next = current.filter((item) => categories.includes(item));
      return next.length === current.length ? current : next;
    });
  }, [categories]);

  useEffect(() => {
    setApplicableGameIds((current) => {
      if (current.length === 0) {
        return current;
      }

      const allowedGames = availableGames.filter((game) => {
        if (applicableCategories.length === 0) {
          return true;
        }

        return applicableCategories.includes(game.category || "");
      });
      const allowedGameIds = new Set(allowedGames.map((game) => game._id));
      const next = current.filter((item) => allowedGameIds.has(item));

      return next.length === current.length ? current : next;
    });
  }, [availableGames, applicableCategories]);

  useEffect(() => {
    if (gameFilter === "ALL") {
      return;
    }

    const selectedGame = availableGames.find((game) => game._id === gameFilter);

    if (!selectedGame) {
      setGameFilter("ALL");
      return;
    }

    if (
      categoryFilter !== "ALL" &&
      selectedGame.category !== categoryFilter
    ) {
      setGameFilter("ALL");
    }
  }, [availableGames, categoryFilter, gameFilter]);

  const handleEdit = (promoCode: PromoCode) => {
    const derivedCategories = deriveCategoriesFromGames(
      Array.isArray(promoCode.applicableGameIds)
        ? promoCode.applicableGameIds
        : [],
      Array.isArray(promoCode.applicableGames) ? promoCode.applicableGames : []
    );

    setSuccess("");
    setEditingId(promoCode._id);
    setTitle(promoCode.title || "");
    setCode(promoCode.code || "");
    setDescription(promoCode.description || "");
    setDiscountType(promoCode.discountType || "fixed");
    setDiscountValue(String(promoCode.discountValue || 0));
    setMinimumOrderAmount(String(promoCode.minimumOrderAmount || 0));
    setMaxDailyUses(String(promoCode.maxDailyUses || 0));
    setApplicableCategories(
      Array.isArray(promoCode.applicableCategories) &&
        promoCode.applicableCategories.length > 0
        ? promoCode.applicableCategories
        : derivedCategories
    );
    setApplicableGameIds(
      Array.isArray(promoCode.applicableGameIds)
        ? promoCode.applicableGameIds
        : []
    );
    setIsActive(Boolean(promoCode.isActive));
    setOrder(String(promoCode.order ?? 9999));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus promo code ini?")) return;

    try {
      const response = await fetch(`/api/promo-codes/${id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal hapus promo code"));
      }

      if (promoCodes.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        fetchPromoCodes();
      }
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal hapus promo code"
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const categoryScope =
        applicableCategories.length > 0
          ? applicableCategories
          : deriveCategoriesFromGames(applicableGameIds, availableGames);
      const url = editingId
        ? `/api/promo-codes/${editingId}`
        : "/api/promo-codes";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          code,
          description,
          discountType,
          discountValue: Number(resetNumber(discountValue, "0")),
          minimumOrderAmount: Number(resetNumber(minimumOrderAmount, "0")),
          maxDailyUses: Number(resetNumber(maxDailyUses, "0")),
          applicableCategories: categoryScope,
          applicableGameIds,
          isActive,
          order: Number(resetNumber(order, "9999")),
        }),
      });

      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal simpan promo code"));
      }

      setSuccess(
        editingId
          ? "Promo code berhasil diperbarui"
          : "Promo code berhasil ditambahkan"
      );
      resetForm();
      fetchPromoCodes();
      setTimeout(() => setSuccess(""), 3000);
    } catch (submitError) {
      alert(
        submitError instanceof Error
          ? submitError.message
          : "Gagal simpan promo code"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Promo Codes"
        subtitle="Kelola kode promo dengan potongan tetap atau persen, batas pemakaian harian, minimal transaksi, serta kategori atau game mana saja yang boleh menggunakan promo."
      />

      <PromoCodeForm
        isOpen={formOpen}
        editingId={editingId}
        success={success}
        submitting={submitting}
        title={title}
        code={code}
        description={description}
        discountType={discountType}
        discountValue={discountValue}
        minimumOrderAmount={minimumOrderAmount}
        maxDailyUses={maxDailyUses}
        applicableCategories={applicableCategories}
        applicableGameIds={applicableGameIds}
        availableCategories={categories}
        availableGames={availableGames}
        isActive={isActive}
        order={order}
        setTitle={setTitle}
        setCode={setCode}
        setDescription={setDescription}
        setDiscountType={setDiscountType}
        setDiscountValue={setDiscountValue}
        setMinimumOrderAmount={setMinimumOrderAmount}
        setMaxDailyUses={setMaxDailyUses}
        setApplicableCategories={setApplicableCategories}
        setApplicableGameIds={setApplicableGameIds}
        setIsActive={setIsActive}
        setOrder={setOrder}
        onSubmit={handleSubmit}
        onOpen={() => {
          setSuccess("");
          resetForm();
          setFormOpen(true);
        }}
        onClose={() => {
          setFormOpen(false);
          setSuccess("");
          resetForm();
        }}
      />

      {loading ? (
        <div className="rounded-[24px] border border-[#f1d6d6] bg-white px-5 py-6 text-sm text-[#7a6363] shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:px-6">
          Memuat promo code...
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-[0_20px_44px_rgba(125,19,19,0.08)] sm:px-6">
          {error}
        </div>
      ) : (
        <PromoCodeList
          promoCodes={promoCodes}
          categories={categories}
          availableGames={availableGames}
          search={search}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          gameFilter={gameFilter}
          totalItems={totalItems}
          page={page}
          totalPages={totalPages}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onCategoryFilterChange={(value) => {
            setCategoryFilter(value);
            setPage(1);
          }}
          onGameFilterChange={(value) => {
            setGameFilter(value);
            setPage(1);
          }}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
