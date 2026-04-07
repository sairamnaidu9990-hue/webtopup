"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/app/components/products/ProductForm";
import ProductList from "@/app/components/products/ProductList";

const API = process.env.NEXT_PUBLIC_API_URL;

type Game = {
  _id: string;
  name: string;
};

type Product = {
  _id: string;
  name: string;
  basePrice: number;
  markup: number;
  providerCode?: string;
  logo?: string;
  game?: {
    _id: string;
    name: string;
  };
};

export default function ProductsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        fetch(`${API}/api/games`),
        fetch(`${API}/api/products`),
      ]);

      const gamesData = await gRes.json();
      const productsData = await pRes.json();

      setGames(gamesData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DELETE
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus product ini?")) return;

    await fetch(`${API}/api/products/${id}`, {
      method: "DELETE",
    });

    fetchData();
  };

  // EDIT
  const handleEdit = (p: Product) => {
    setEditingId(p._id);
    setName(p.name);
    setBasePrice(String(p.basePrice));
    setMarkup(String(p.markup));
    setProviderCode(p.providerCode || "");
    setLogo(p.logo || "");
    setGameId(p.game?._id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameId) return alert("Pilih game dulu");

    const url = editingId
      ? `${API}/api/products/${editingId}`
      : `${API}/api/products`;

    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
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

    // reset
    setEditingId(null);
    setName("");
    setBasePrice("");
    setMarkup("10");
    setProviderCode("");
    setLogo("");
    setGameId("");

    fetchData();
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
      />

      {loading ? (
        <p>Loading...</p>
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