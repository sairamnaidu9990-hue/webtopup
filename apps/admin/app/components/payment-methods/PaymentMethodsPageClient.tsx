"use client";

import { useDeferredValue, useEffect, useState } from "react";
import PaymentMethodCategoryManager from "./PaymentMethodCategoryManager";
import PaymentMethodForm from "./PaymentMethodForm";
import PaymentMethodList from "./PaymentMethodList";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type {
  PaymentFeeType,
  PaymentMethod,
  PaymentMethodCategory,
  PaymentMethodType,
} from "@/app/types/PaymentMethod";

const PAGE_LIMIT = 20;

function resetNumber(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized === "" ? fallback : normalized;
}

export default function PaymentMethodsPageClient() {
  const [categories, setCategories] = useState<PaymentMethodCategory[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryEditingId, setCategoryEditingId] = useState<string | null>(null);
  const [categorySuccess, setCategorySuccess] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryOrder, setCategoryOrder] = useState("9999");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIsActive, setCategoryIsActive] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [provider, setProvider] = useState("manual");
  const [categoryId, setCategoryId] = useState("");
  const [logo, setLogo] = useState("");
  const [type, setType] = useState<PaymentMethodType>("bank_transfer");
  const [feeType, setFeeType] = useState<PaymentFeeType>("fixed");
  const [feeValue, setFeeValue] = useState("0");
  const [currency, setCurrency] = useState("IDR");
  const [gatewayChannelCode, setGatewayChannelCode] = useState("");
  const [description, setDescription] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState("9999");
  const [error, setError] = useState("");

  const deferredSearch = useDeferredValue(search);

  const resetCategoryForm = () => {
    setCategoryEditingId(null);
    setCategoryName("");
    setCategoryCode("");
    setCategoryOrder("9999");
    setCategoryDescription("");
    setCategoryIsActive(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCode("");
    setProvider("manual");
    setCategoryId("");
    setLogo("");
    setType("bank_transfer");
    setFeeType("fixed");
    setFeeValue("0");
    setCurrency("IDR");
    setGatewayChannelCode("");
    setDescription("");
    setAccountHolderName("");
    setAccountNumber("");
    setIsActive(true);
    setOrder("9999");
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/payment-method-categories", {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<PaymentMethodCategory[]>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal ambil kategori pembayaran")
        );
      }

      setCategories(Array.isArray(payload) ? payload : []);
    } catch (fetchError) {
      console.error(fetchError);
      setCategories([]);
    }
  };

  const fetchPaymentMethods = async () => {
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

      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      if (categoryFilter !== "ALL") {
        params.set("category", categoryFilter);
      }

      const response = await fetch(`/api/payment-methods?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await parseJsonSafely<{
        items?: PaymentMethod[];
        totalItems?: number;
        totalPages?: number;
        page?: number;
        message?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal ambil metode pembayaran")
        );
      }

      setPaymentMethods(Array.isArray(payload?.items) ? payload.items : []);
      setTotalItems(Number(payload?.totalItems || 0));
      setTotalPages(Number(payload?.totalPages || 1));
      setPage(Number(payload?.page || 1));
    } catch (fetchError) {
      setPaymentMethods([]);
      setTotalItems(0);
      setTotalPages(1);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal ambil metode pembayaran"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPaymentMethods();
  }, [page, deferredSearch, statusFilter, typeFilter, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setSuccess("");
    setEditingId(paymentMethod._id);
    setName(paymentMethod.name);
    setCode(paymentMethod.code);
    setProvider(paymentMethod.provider || "manual");
    setCategoryId(paymentMethod.category?._id || "");
    setLogo(paymentMethod.logo || "");
    setType(paymentMethod.type);
    setFeeType(paymentMethod.feeType);
    setFeeValue(String(paymentMethod.feeValue ?? 0));
    setCurrency(paymentMethod.currency || "IDR");
    setGatewayChannelCode(paymentMethod.gatewayChannelCode || "");
    setDescription(paymentMethod.description || "");
    setAccountHolderName(paymentMethod.accountHolderName || "");
    setAccountNumber(paymentMethod.accountNumber || "");
    setIsActive(Boolean(paymentMethod.isActive));
    setOrder(String(paymentMethod.order ?? 9999));
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryEdit = (category: PaymentMethodCategory) => {
    setCategorySuccess("");
    setCategoryEditingId(category._id);
    setCategoryName(category.name);
    setCategoryCode(category.code);
    setCategoryOrder(String(category.order ?? 9999));
    setCategoryDescription(category.description || "");
    setCategoryIsActive(Boolean(category.isActive));
    setCategoryFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus metode pembayaran ini?")) return;

    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal hapus metode pembayaran")
        );
      }

      if (paymentMethods.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        fetchPaymentMethods();
      }
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal hapus metode pembayaran"
      );
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kategori pembayaran ini?")) return;

    try {
      const response = await fetch(`/api/payment-method-categories/${id}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal hapus kategori pembayaran")
        );
      }

      await Promise.all([fetchCategories(), fetchPaymentMethods()]);
    } catch (deleteError) {
      alert(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal hapus kategori pembayaran"
      );
    }
  };

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const url = categoryEditingId
        ? `/api/payment-method-categories/${categoryEditingId}`
        : "/api/payment-method-categories";
      const method = categoryEditingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: categoryName,
          code: categoryCode,
          description: categoryDescription,
          isActive: categoryIsActive,
          order: Number(resetNumber(categoryOrder, "9999")),
        }),
      });

      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal simpan kategori pembayaran")
        );
      }

      setCategorySuccess(
        categoryEditingId
          ? "Kategori pembayaran berhasil diperbarui"
          : "Kategori pembayaran berhasil ditambahkan"
      );
      resetCategoryForm();
      await fetchCategories();
      setTimeout(() => setCategorySuccess(""), 3000);
    } catch (submitError) {
      alert(
        submitError instanceof Error
          ? submitError.message
          : "Gagal simpan kategori pembayaran"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId
        ? `/api/payment-methods/${editingId}`
        : "/api/payment-methods";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          code,
          provider,
          category: categoryId,
          logo,
          type,
          feeType,
          feeValue: Number(resetNumber(feeValue, "0")),
          currency,
          gatewayChannelCode,
          description,
          accountHolderName,
          accountNumber,
          isActive,
          order: Number(resetNumber(order, "9999")),
        }),
      });

      const payload = await parseJsonSafely<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(
          getResponseMessage(payload, "Gagal simpan metode pembayaran")
        );
      }

      setSuccess(
        editingId
          ? "Metode pembayaran berhasil diperbarui"
          : "Metode pembayaran berhasil ditambahkan"
      );
      resetForm();
      fetchPaymentMethods();
      setTimeout(() => setSuccess(""), 3000);
    } catch (submitError) {
      alert(
        submitError instanceof Error
          ? submitError.message
          : "Gagal simpan metode pembayaran"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Payment Methods"
        subtitle="Kelola kategori pembayaran, logo bank, biaya, dan urutan tampil agar storefront siap mengikuti flow payment gateway yang rapi."
      />

      <PaymentMethodCategoryManager
        categories={categories}
        isOpen={categoryFormOpen}
        editingId={categoryEditingId}
        success={categorySuccess}
        submitting={submitting}
        name={categoryName}
        code={categoryCode}
        order={categoryOrder}
        description={categoryDescription}
        isActive={categoryIsActive}
        setName={setCategoryName}
        setCode={setCategoryCode}
        setOrder={setCategoryOrder}
        setDescription={setCategoryDescription}
        setIsActive={setCategoryIsActive}
        onSubmit={handleCategorySubmit}
        onOpen={() => {
          setCategorySuccess("");
          resetCategoryForm();
          setCategoryFormOpen(true);
        }}
        onClose={() => {
          setCategoryFormOpen(false);
          setCategorySuccess("");
          resetCategoryForm();
        }}
        onEdit={handleCategoryEdit}
        onDelete={handleCategoryDelete}
      />

      <PaymentMethodForm
        isOpen={formOpen}
        editingId={editingId}
        success={success}
        submitting={submitting}
        name={name}
        code={code}
        provider={provider}
        categoryId={categoryId}
        categories={categories}
        logo={logo}
        type={type}
        feeType={feeType}
        feeValue={feeValue}
        currency={currency}
        gatewayChannelCode={gatewayChannelCode}
        description={description}
        accountHolderName={accountHolderName}
        accountNumber={accountNumber}
        isActive={isActive}
        order={order}
        setName={setName}
        setCode={setCode}
        setProvider={setProvider}
        setCategoryId={setCategoryId}
        setLogo={setLogo}
        setType={setType}
        setFeeType={setFeeType}
        setFeeValue={setFeeValue}
        setCurrency={setCurrency}
        setGatewayChannelCode={setGatewayChannelCode}
        setDescription={setDescription}
        setAccountHolderName={setAccountHolderName}
        setAccountNumber={setAccountNumber}
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
        <div className="rounded-2xl border bg-white px-5 py-6 text-sm text-gray-500 sm:px-6">
          Memuat metode pembayaran...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 sm:px-6">
          {error}
        </div>
      ) : (
        <PaymentMethodList
          categories={categories}
          paymentMethods={paymentMethods}
          search={search}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          categoryFilter={categoryFilter}
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
          onTypeFilterChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
          onCategoryFilterChange={(value) => {
            setCategoryFilter(value);
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
