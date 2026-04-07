"use client";

import { useEffect, useState } from "react";
import GameForm from "../../components/games/GameForm";
import GameList from "../../components/games/GameList";
type Game = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  provider?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [logo, setLogo] = useState("");
  const [provider, setProvider] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  // FETCH GAMES
  const fetchGames = async () => {
    try {
      const res = await fetch(`${API}/api/games`);
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // DELETE GAME
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus game?")) return;

    try {
      await fetch(`${API}/api/games/${id}`, {
        method: "DELETE",
      });
      fetchGames();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // EDIT GAME
  const handleEdit = (game: Game) => {
    setEditingId(game._id);
    setName(game.name);
    setCode(game.code);
    setLogo(game.logo || "");
    setProvider(game.provider || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SUBMIT FORM
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
  body: JSON.stringify({ name, code, logo, provider }),
});

const data = await res.json();
console.log("RESPONSE:", data);
console.log("STATUS:", res.status);

      setSuccess(
        editingId
          ? "Game berhasil diupdate"
          : "Game berhasil ditambahkan"
      );

      // reset form
      setEditingId(null);
      setName("");
      setCode("");
      setLogo("");
      setProvider("");

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
      {/* FORM */}
      <GameForm
        name={name}
        code={code}
        logo={logo}
        provider={provider}
        editingId={editingId}
        setName={setName}
        setCode={setCode}
        setLogo={setLogo}
        setProvider={setProvider}
        onSubmit={handleSubmit}
        success={success}
        submitting={submitting}
      />

      {/* LIST */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading games...</p>
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