"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/app/components/products/ProductForm";
import ProductList from "@/app/components/products/ProductList";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import { Product } from "@/app/types/Product";

type Game = {
  _id: string;
  name: string;
};

export default function ProductsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [markup, setMarkup] = useState("10");
  const [providerCode, setProviderCode] = useState("");
  const [logo, setLogo] = useState("");
  const [gameId, setGameId] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  // FETCH
  const fetchData = async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        fetch("/api/games", {
          cache: "no-store",
        }),
        fetch("/api/products", {
          cache: "no-store",
        }),
      ]);

      const gamesData = await parseJsonSafely<Game[]>(gRes);
      const productsData = await parseJsonSafely<Product[]>(pRes);

      if (!gRes.ok) {
        throw new Error(getResponseMessage(gamesData, "Gagal ambil data game"));
      }

      if (!pRes.ok) {
        throw new Error(
          getResponseMessage(productsData, "Gagal ambil data produk")
        );
      }

      setGames(Array.isArray(gamesData) ? gamesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error(err);
      setGames([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menghapus produk"));
      }

      fetchData();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal menghapus produk");
    }
  };

  // EDIT
  const handleEdit = (p: Product) => {
    setEditingId(p._id);
    setName(p.name);
    setBasePrice(String(p.basePrice));
    setMarkup(String(p.markup));
    setProviderCode(p.providerCode || "");
    setLogo(p.logo || "");
    setGameId(p.game?._id || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameId) return alert("Pilih game dulu");

    setSubmitting(true);

    const url = editingId ? `/api/products/${editingId}` : "/api/products";

    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          game: gameId,
          basePrice: Number(basePrice),
          markup: Number(markup),
          providerCode,
          logo,
        }),
      });

      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, "Gagal menyimpan produk"));
      }

      setSuccess(
        editingId ? "Produk berhasil diperbarui" : "Produk berhasil ditambahkan"
      );

      setEditingId(null);
      setName("");
      setBasePrice("");
      setMarkup("10");
      setProviderCode("");
      setLogo("");
      setGameId("");

      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan produk");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductForm
        name={name}
        basePrice={basePrice}
        markup={markup}
        providerCode={providerCode}
        logo={logo}
        gameId={gameId}
        games={games}
        setName={setName}
        setBasePrice={setBasePrice}
        setMarkup={setMarkup}
        setProviderCode={setProviderCode}
        setLogo={setLogo}
        setGameId={setGameId}
        onSubmit={handleSubmit}
        editingId={editingId}
        submitting={submitting}
        success={success}
      />

      {loading ? (
        <p className="text-sm text-gray-500">Memuat data produk...</p>
      ) : (
        <ProductList
          products={products}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}
