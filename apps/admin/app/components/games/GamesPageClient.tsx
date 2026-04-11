"use client";

import { useEffect, useState } from "react";
import GameForm from "./GameForm";
import GameList from "./GameList";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import {
  isSessionCacheFresh,
  readSessionCache,
  writeSessionCache,
} from "@/app/lib/sessionCache";
import { CATALOG_CACHE_TTL_MS, GAMES_CACHE_KEY } from "@/app/lib/catalogCache";

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
};

const API = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_CATEGORY_OPTIONS = [
  "Topup Game",
  "Topup Pulsa",
  "Voucher",
  "Live Streaming",
];

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
  const [games, setGames] = useState<Game[]>([]);
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const gamesCacheKey = syncSource
    ? `${GAMES_CACHE_KEY}:${syncSource}`
    : GAMES_CACHE_KEY;
  const gamesQuery = syncSource ? `?syncSource=${syncSource}` : "";

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
  };

  const fetchGames = async () => {
    try {
      const res = await fetch(`${API}/api/games${gamesQuery}`);
      const data = await parseJsonSafely<unknown[]>(res);
      const nextGames = Array.isArray(data) ? (data as Game[]) : [];

      setGames(nextGames);
      writeSessionCache(gamesCacheKey, nextGames);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
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
    const cachedGames = readSessionCache<Game[]>(gamesCacheKey);

    if (cachedGames?.data && Array.isArray(cachedGames.data)) {
      setGames(cachedGames.data);
      setLoading(false);

      if (!isSessionCacheFresh(cachedGames.savedAt, CATALOG_CACHE_TTL_MS)) {
        fetchGames();
      }

      return;
    }

    fetchGames();
  }, [gamesCacheKey, gamesQuery]);

  useEffect(() => {
    fetchCategoryOptions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus game ini?")) return;

    try {
      await fetch(`${API}/api/games/${id}`, {
        method: "DELETE",
      });
      fetchGames();
    } catch (err) {
      console.error("Delete error:", err);
    }
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
    setFormOpen(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const url = editingId
        ? `${API}/api/games/${editingId}`
        : `${API}/api/games`;

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

      {loading ? (
        <p className="text-sm text-gray-500">Memuat data game...</p>
      ) : (
        <GameList games={games} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}
