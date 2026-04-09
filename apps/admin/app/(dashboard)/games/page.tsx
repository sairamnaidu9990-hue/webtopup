"use client";

import { useEffect, useState } from "react";
import GameForm from "../../components/games/GameForm";
import GameList from "../../components/games/GameList";
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
  provider?: string;
  status?: string;
  syncSource?: string;
  inputs?: Array<{
    name: string;
    type?: string;
    title?: string;
    options?: Array<{ value: string; title: string }>;
  }>;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [logo, setLogo] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setLogo("");
    setProvider("");
    setStatus("ACTIVE");
  };

  const fetchGames = async ({
    background = false,
  }: {
    background?: boolean;
  } = {}) => {
    try {
      const res = await fetch(`${API}/api/games`);
      const data = await res.json();
      const nextGames = Array.isArray(data) ? data : [];

      setGames(nextGames);
      writeSessionCache(GAMES_CACHE_KEY, nextGames);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedGames = readSessionCache<Game[]>(GAMES_CACHE_KEY);

    if (cachedGames?.data && Array.isArray(cachedGames.data)) {
      setGames(cachedGames.data);
      setLoading(false);

      if (!isSessionCacheFresh(cachedGames.savedAt, CATALOG_CACHE_TTL_MS)) {
        fetchGames({ background: true });
      }

      return;
    }

    fetchGames({ background: false });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus game ini?")) return;

    try {
      await fetch(`${API}/api/games/${id}`, {
        method: "DELETE",
      });
      fetchGames({ background: true });
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
    setProvider(game.provider || "");
    setStatus(game.status || "ACTIVE");
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
        body: JSON.stringify({ name, code, logo, provider, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal simpan game");
      }

      setSuccess(
        editingId ? "Game berhasil diperbarui" : "Game berhasil ditambahkan"
      );

      resetForm();

      fetchGames({ background: true });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <GameForm
        isOpen={formOpen}
        name={name}
        code={code}
        logo={logo}
        provider={provider}
        status={status}
        editingId={editingId}
        setName={setName}
        setCode={setCode}
        setLogo={setLogo}
        setProvider={setProvider}
        setStatus={setStatus}
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

      {loading ? (
        <p className="text-sm text-gray-500">Memuat data game...</p>
      ) : (
        <GameList
          games={games}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
