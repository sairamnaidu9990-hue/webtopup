"use client";

import { useEffect, useState } from "react";
import SyncPanel from "@/app/components/bangjeff/SyncPanel";
import VariantForm from "@/app/components/variants/VariantForm";
import VariantList from "@/app/components/variants/VariantList";
import { Variant } from "@/app/types/Variant";

const API = process.env.NEXT_PUBLIC_API_URL;

type Game = {
  _id: string;
  name: string;
  code: string;
};

export default function VariantsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

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

  const fetchData = async () => {
    try {
      const [gamesResponse, variantsResponse] = await Promise.all([
        fetch(`${API}/api/games`),
        fetch(`${API}/api/variants`),
      ]);

      const gamesPayload = await gamesResponse.json();
      const variantsPayload = await variantsResponse.json();

      setGames(gamesPayload);
      setVariants(variantsPayload);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus variant ini?")) return;

    try {
      await fetch(`${API}/api/variants/${id}`, {
        method: "DELETE",
      });

      fetchData();
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

      setSuccess(editingId ? "Variant berhasil diupdate" : "Variant berhasil ditambahkan");
      resetForm();
      fetchData();
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
      <SyncPanel
        apiBase={API || ""}
        onSynced={fetchData}
        title="BangJeff Variant Sync"
        description="Ambil data game, detail, dan variant terbaru lalu cek hasilnya di bawah."
      />

      <VariantForm
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
      />

      {loading ? (
        <p className="text-sm text-gray-500">Loading variants...</p>
      ) : (
        <VariantList
          variants={variants}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
