"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import GameForm from "./GameForm";
import GameList from "./GameList";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";

type Game = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  bannerUrl?: string;
  category?: string;
  provider?: string;
  status?: string;
  isTrending?: boolean;
  trendingOrder?: number;
  catalogOrder?: number;
  syncSource?: string;
  inputs?: Array<{
    name: string;
    type?: string;
    title?: string;
    options?: Array<{ value: string; title: string }>;
  }>;
  variantCategories?: Array<{
    _id?: string;
    name: string;
    order: number;
  }>;
};

const DEFAULT_CATEGORY_OPTIONS = [
  "Topup Game",
  "Topup Pulsa",
  "Voucher",
  "Live Streaming",
];
const PAGE_LIMIT = 20;

type Props = {
  syncSource?: "bangjeff" | "manual";
  allowCreate?: boolean;
};

function toOptionalOrderValue(value: string) {
  const normalized = value.trim();
  return normalized === "" ? undefined : Number(normalized);
}

export default function GamesPageClient({
  syncSource,
  allowCreate = true,
}: Props) {
  const fetchRequestIdRef = useRef(0);
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [logo, setLogo] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState("Topup Game");
  const [categoryOptions, setCategoryOptions] = useState<string[]>(
    DEFAULT_CATEGORY_OPTIONS
  );
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [isTrending, setIsTrending] = useState(false);
  const [trendingOrder, setTrendingOrder] = useState("9999");
  const [catalogOrder, setCatalogOrder] = useState("9999");
  const [variantCategories, setVariantCategories] = useState<
    Array<{
      _id?: string;
      name: string;
      order: number;
    }>
  >([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const deferredSearch = useDeferredValue(search);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setLogo("");
    setBannerUrl("");
    setCategory(categoryOptions[0] || "Topup Game");
    setProvider("");
    setStatus("ACTIVE");
    setIsTrending(false);
    setTrendingOrder("9999");
    setCatalogOrder("9999");
    setVariantCategories([]);
  };

  const fetchGames = async () => {
    const requestId = ++fetchRequestIdRef.current;

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });

      if (syncSource) {
        params.set("syncSource", syncSource);
      }

      if (deferredSearch.trim()) {
        params.set("search", deferredSearch.trim());
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (categoryFilter !== "ALL") {
        params.set("category", categoryFilter);
      }

      const res = await fetch(`/api/games?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await parseJsonSafely<{
        items?: Game[];
        totalItems?: number;
        totalPages?: number;
        page?: number;
      }>(res);

      if (!res.ok) {
        throw new Error(getResponseMessage(data, "Gagal ambil data game"));
      }

      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      setGames(Array.isArray(data?.items) ? data.items : []);
      setTotalItems(Number(data?.totalItems || 0));
      setTotalPages(Number(data?.totalPages || 1));
      setPage(Number(data?.page || 1));
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      console.error("Fetch error:", err);
      setGames([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchCategoryOptions = async () => {
    try {
      const response = await fetch("/api/site-settings", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        siteSetting?: { gameCategories?: string[] };
      }>(response);
      const nextOptions = Array.isArray(payload?.siteSetting?.gameCategories)
        ? payload.siteSetting.gameCategories
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        : [];

      if (nextOptions.length > 0) {
        setCategoryOptions(nextOptions);
        setCategory((current) =>
          nextOptions.includes(current) ? current : nextOptions[0]
        );
      }
    } catch (error) {
      console.error("Category fetch error:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGames();
  }, [page, syncSource, deferredSearch, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchCategoryOptions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus game ini?")) return;

    try {
      await fetch(`/api/games/${id}`, {
        method: "DELETE",
      });

      if (games.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        fetchGames();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleEdit = (game: Game) => {
    setSuccess("");
    setEditingId(game._id);
    setName(game.name);
    setCode(game.code);
    setLogo(game.logo || "");
    setBannerUrl(game.bannerUrl || "");
    setCategory(game.category || "Topup Game");
    setProvider(game.provider || "");
    setStatus(game.status || "ACTIVE");
    setIsTrending(Boolean(game.isTrending));
    setTrendingOrder(String(game.trendingOrder ?? 9999));
    setCatalogOrder(String(game.catalogOrder ?? 9999));
    setVariantCategories(
      Array.isArray(game.variantCategories)
        ? [...game.variantCategories]
            .map((item, index) => ({
              _id: item._id,
              name: String(item.name || "").trim(),
              order: Number(item.order || index + 1),
            }))
            .filter((item) => item.name)
            .sort((a, b) => a.order - b.order)
        : []
    );
    setFormOpen(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const url = editingId ? `/api/games/${editingId}` : "/api/games";

      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          code,
          logo,
          bannerUrl,
          category,
          provider,
          status,
          isTrending,
          ...(toOptionalOrderValue(trendingOrder) != null
            ? { trendingOrder: toOptionalOrderValue(trendingOrder) }
            : {}),
          ...(toOptionalOrderValue(catalogOrder) != null
            ? { catalogOrder: toOptionalOrderValue(catalogOrder) }
            : {}),
          variantCategories,
        }),
      });

      const data = await parseJsonSafely<{ message?: string }>(res);

      if (!res.ok) {
        throw new Error(getResponseMessage(data, "Gagal simpan game"));
      }

      setSuccess(
        editingId ? "Game berhasil diperbarui" : "Game berhasil ditambahkan"
      );

      resetForm();
      fetchGames();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {allowCreate || editingId || formOpen ? (
        <GameForm
          isOpen={formOpen}
          allowCreate={allowCreate}
          name={name}
          code={code}
          logo={logo}
          bannerUrl={bannerUrl}
          category={category}
          categoryOptions={categoryOptions}
          provider={provider}
          status={status}
          isTrending={isTrending}
          trendingOrder={trendingOrder}
          catalogOrder={catalogOrder}
          variantCategories={variantCategories}
          editingId={editingId}
          setName={setName}
          setCode={setCode}
          setLogo={setLogo}
          setBannerUrl={setBannerUrl}
          setCategory={setCategory}
          setProvider={setProvider}
          setStatus={setStatus}
          setIsTrending={setIsTrending}
          setTrendingOrder={setTrendingOrder}
          setCatalogOrder={setCatalogOrder}
          setVariantCategories={setVariantCategories}
          onSubmit={handleSubmit}
          success={success}
          submitting={submitting}
          onOpen={() => {
            setSuccess("");
            setFormOpen(true);
          }}
          onClose={() => {
            setSuccess("");
            resetForm();
            setFormOpen(false);
          }}
        />
      ) : null}

      <GameList
        games={games}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        categoryOptions={categoryOptions}
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        loading={loading}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
