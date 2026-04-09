"use client";

import { useEffect, useState } from "react";
import VariantForm from "./VariantForm";
import VariantList from "./VariantList";
import { Variant } from "@/app/types/Variant";
import {
  isSessionCacheFresh,
  readSessionCache,
  writeSessionCache,
} from "@/app/lib/sessionCache";
import {
  CATALOG_CACHE_TTL_MS,
  GAMES_CACHE_KEY,
  VARIANTS_CACHE_KEY,
} from "@/app/lib/catalogCache";

const API = process.env.NEXT_PUBLIC_API_URL;

type Game = {
  _id: string;
  name: string;
  code: string;
};

type Props = {
  syncSource?: "bangjeff" | "manual";
  allowCreate?: boolean;
};

export default function VariantsPageClient({
  syncSource,
  allowCreate = true,
}: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [gameId, setGameId] = useState("");
  const [name, setName] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [markup, setMarkup] = useState("0");
  const [logo, setLogo] = useState("");
  const [region, setRegion] = useState("ID");
  const [currency, setCurrency] = useState("IDR");
  const [duration, setDuration] = useState("0");
  const [status, setStatus] = useState("ACTIVE");
  const gamesCacheKey = syncSource
    ? `${GAMES_CACHE_KEY}:${syncSource}`
    : GAMES_CACHE_KEY;
  const variantsCacheKey = syncSource
    ? `${VARIANTS_CACHE_KEY}:${syncSource}`
    : VARIANTS_CACHE_KEY;
  const providerQuery = syncSource ? `syncSource=${syncSource}` : "";

  const fetchData = async ({
    refreshGames = true,
    refreshVariants = true,
  }: {
    refreshGames?: boolean;
    refreshVariants?: boolean;
  } = {}) => {
    try {
      const requests: Array<Promise<Response>> = [];

      if (refreshGames) {
        requests.push(
          fetch(
            `${API}/api/games${providerQuery ? `?${providerQuery}` : ""}`
          )
        );
      }

      if (refreshVariants) {
        requests.push(
          fetch(
            `${API}/api/variants${providerQuery ? `?${providerQuery}` : ""}`
          )
        );
      }

      const responses = await Promise.all(requests);
      let responseIndex = 0;

      if (refreshGames) {
        const gamesResponse = responses[responseIndex++];
        const gamesPayload = await gamesResponse.json();
        const nextGames = Array.isArray(gamesPayload) ? gamesPayload : [];

        setGames(nextGames);
        writeSessionCache(gamesCacheKey, nextGames);
      }

      if (refreshVariants) {
        const variantsResponse = responses[responseIndex++];
        const variantsPayload = await variantsResponse.json();
        const nextVariants = Array.isArray(variantsPayload)
          ? variantsPayload
          : [];

        setVariants(nextVariants);
        writeSessionCache(variantsCacheKey, nextVariants);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedGames = readSessionCache<Game[]>(gamesCacheKey);
    const cachedVariants = readSessionCache<Variant[]>(variantsCacheKey);

    const hasCachedGames =
      !!cachedGames?.data && Array.isArray(cachedGames.data);
    const hasCachedVariants =
      !!cachedVariants?.data && Array.isArray(cachedVariants.data);

    if (hasCachedGames) {
      setGames(cachedGames.data);
    }

    if (hasCachedVariants) {
      setVariants(cachedVariants.data);
    }

    if (hasCachedGames || hasCachedVariants) {
      setLoading(false);
    }

    const shouldRefreshGames =
      !hasCachedGames ||
      !isSessionCacheFresh(cachedGames.savedAt, CATALOG_CACHE_TTL_MS);
    const shouldRefreshVariants =
      !hasCachedVariants ||
      !isSessionCacheFresh(cachedVariants.savedAt, CATALOG_CACHE_TTL_MS);

    if (shouldRefreshGames || shouldRefreshVariants) {
      fetchData({
        refreshGames: shouldRefreshGames,
        refreshVariants: shouldRefreshVariants,
      });
    }
  }, [gamesCacheKey, variantsCacheKey, providerQuery]);

  const resetForm = () => {
    setEditingId(null);
    setGameId("");
    setName("");
    setProviderCode("");
    setBasePrice("");
    setMarkup("0");
    setLogo("");
    setRegion("ID");
    setCurrency("IDR");
    setDuration("0");
    setStatus("ACTIVE");
  };

  const handleEdit = (variant: Variant) => {
    setSuccess("");
    setEditingId(variant._id);
    setGameId(variant.game?._id || "");
    setName(variant.name);
    setProviderCode(variant.providerCode || "");
    setBasePrice(String(variant.basePrice ?? ""));
    setMarkup(String(variant.markup ?? 0));
    setLogo(variant.logo || "");
    setRegion(variant.region || "ID");
    setCurrency(variant.currency || "IDR");
    setDuration(String(variant.duration ?? 0));
    setStatus(variant.status || "ACTIVE");
    setFormOpen(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus variant ini?")) return;

    try {
      await fetch(`${API}/api/variants/${id}`, {
        method: "DELETE",
      });

      fetchData({
        refreshGames: false,
        refreshVariants: true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId
        ? `${API}/api/variants/${editingId}`
        : `${API}/api/variants`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game: gameId,
          name,
          providerCode,
          basePrice: Number(basePrice),
          markup: Number(markup),
          logo,
          region,
          currency,
          duration: Number(duration),
          status,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal simpan variant");
      }

      setSuccess(
        editingId ? "Variant berhasil diperbarui" : "Variant berhasil ditambahkan"
      );
      resetForm();
      fetchData({
        refreshGames: false,
        refreshVariants: true,
      });
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal simpan variant");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {allowCreate || editingId || formOpen ? (
        <VariantForm
          isOpen={formOpen}
          allowCreate={allowCreate}
          name={name}
          providerCode={providerCode}
          basePrice={basePrice}
          markup={markup}
          logo={logo}
          region={region}
          currency={currency}
          duration={duration}
          status={status}
          gameId={gameId}
          games={games}
          editingId={editingId}
          success={success}
          submitting={submitting}
          setName={setName}
          setProviderCode={setProviderCode}
          setBasePrice={setBasePrice}
          setMarkup={setMarkup}
          setLogo={setLogo}
          setRegion={setRegion}
          setCurrency={setCurrency}
          setDuration={setDuration}
          setStatus={setStatus}
          setGameId={setGameId}
          onSubmit={handleSubmit}
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
        <p className="text-sm text-gray-500">Memuat data variant...</p>
      ) : (
        <VariantList
          games={games}
          variants={variants}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
