"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import VariantForm from "./VariantForm";
import VariantList from "./VariantList";
import { Variant } from "@/app/types/Variant";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";

const PAGE_LIMIT = 20;

type Game = {
  _id: string;
  name: string;
  code: string;
  variantCategories?: Array<{
    _id: string;
    name: string;
    order: number;
  }>;
};

type Props = {
  syncSource?: "bangjeff" | "manual";
  allowCreate?: boolean;
};

export default function VariantsPageClient({
  syncSource,
  allowCreate = true,
}: Props) {
  const fetchRequestIdRef = useRef(0);
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [gameId, setGameId] = useState("");
  const [name, setName] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [variantCategoryId, setVariantCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [markup, setMarkup] = useState("0");
  const [logo, setLogo] = useState("");
  const [region, setRegion] = useState("ID");
  const [currency, setCurrency] = useState("IDR");
  const [duration, setDuration] = useState("0");
  const [status, setStatus] = useState("ACTIVE");
  const providerQuery = syncSource ? `syncSource=${syncSource}` : "";
  const deferredSearch = useDeferredValue(search);

  const fetchGames = async () => {
    try {
      const response = await fetch(
        `/api/games${providerQuery ? `?${providerQuery}` : ""}`,
        {
          cache: "no-store",
        }
      );
      const payload = await parseJsonSafely<Game[]>(response);
      setGames(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [providerQuery]);

  const fetchVariants = async () => {
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

      if (gameFilter !== "ALL") {
        params.set("game", gameFilter);
      }

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/variants?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: Variant[];
        totalItems?: number;
        totalPages?: number;
        page?: number;
      }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal ambil variant"));
      }

      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      setVariants(Array.isArray(payload?.items) ? payload.items : []);
      setTotalItems(Number(payload?.totalItems || 0));
      setTotalPages(Number(payload?.totalPages || 1));
      setPage(Number(payload?.page || 1));
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      console.error(error);
      setVariants([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchVariants();
  }, [page, syncSource, deferredSearch, gameFilter, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setGameId("");
    setName("");
    setProviderCode("");
    setVariantCategoryId("");
    setBasePrice("");
    setMarkup("0");
    setLogo("");
    setRegion("ID");
    setCurrency("IDR");
    setDuration("0");
    setStatus("ACTIVE");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleGameFilterChange = (value: string) => {
    setGameFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleEdit = (variant: Variant) => {
    setSuccess("");
    setEditingId(variant._id);
    setGameId(variant.game?._id || "");
    setName(variant.name);
    setProviderCode(variant.providerCode || "");
    setVariantCategoryId(variant.variantCategoryId || "");
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
      await fetch(`/api/variants/${id}`, {
        method: "DELETE",
      });

      if (variants.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        fetchVariants();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId ? `/api/variants/${editingId}` : "/api/variants";
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
          variantCategoryId,
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
      fetchVariants();
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
          variantCategoryId={variantCategoryId}
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
          setVariantCategoryId={setVariantCategoryId}
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

      <VariantList
        games={games}
        variants={variants}
        search={search}
        gameFilter={gameFilter}
        statusFilter={statusFilter}
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        loading={loading}
        onSearchChange={handleSearchChange}
        onGameFilterChange={handleGameFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onPageChange={setPage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
