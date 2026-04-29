"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SectionTitle from "../../components/ui/SectionTitle";
import Card from "../../components/ui/Card";
import type { AdminAccount } from "@/app/types/Admin";

const emptyForm = {
  name: "",
  email: "",
  role: "admin" as AdminAccount["role"],
  isActive: true,
  password: "",
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [passwordTarget, setPasswordTarget] = useState<AdminAccount | null>(null);
  const [targetPassword, setTargetPassword] = useState("");
  const [targetPasswordConfirm, setTargetPasswordConfirm] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const fetchPageData = useCallback(async () => {
    try {
      const [meRes, adminsRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/admins", { cache: "no-store" }),
      ]);

      const mePayload = await meRes.json();
      const adminsPayload = await adminsRes.json();

      if (meRes.ok) {
        setCurrentAdmin(mePayload.admin || null);
      }

      if (!adminsRes.ok) {
        throw new Error(adminsPayload.message || "Gagal mengambil data admin");
      }

      setAdmins(Array.isArray(adminsPayload.admins) ? adminsPayload.admins : []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Gagal memuat data admin"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPageData();
  }, [fetchPageData]);

  const activeAdmins = useMemo(
    () => admins.filter((admin) => admin.isActive).length,
    [admins]
  );
  const superAdmins = useMemo(
    () => admins.filter((admin) => admin.role === "super_admin").length,
    [admins]
  );

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setFeedback("");
    setError("");
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (admin: AdminAccount) => {
    setFeedback("");
    setError("");
    setEditId(admin.id);
    setForm({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      password: "",
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAdminForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    setError("");

    try {
      const isEditing = Boolean(editId);
      const response = await fetch(isEditing ? `/api/admins/${editId}` : "/api/admins", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          ...(!isEditing ? { password: form.password } : {}),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal menyimpan admin");
      }

      setFeedback(payload.message || "Data admin berhasil disimpan");
      resetForm();
      setFormOpen(false);
      await fetchPageData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gagal menyimpan admin"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (admin: AdminAccount) => {
    if (!confirm(`Hapus akun admin ${admin.name}?`)) {
      return;
    }

    setFeedback("");
    setError("");

    try {
      const response = await fetch(`/api/admins/${admin.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal menghapus admin");
      }

      setFeedback(payload.message || "Admin berhasil dihapus");
      await fetchPageData();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Gagal menghapus admin"
      );
    }
  };

  const submitOwnPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSubmitting(true);
    setFeedback("");
    setError("");

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Konfirmasi password baru tidak cocok");
      }

      const response = await fetch("/api/admins/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal mengubah password");
      }

      setFeedback(payload.message || "Password berhasil diperbarui");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Gagal mengubah password"
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const submitTargetPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordTarget) {
      return;
    }

    setPasswordSubmitting(true);
    setFeedback("");
    setError("");

    try {
      if (targetPassword !== targetPasswordConfirm) {
        throw new Error("Konfirmasi password admin tidak cocok");
      }

      const response = await fetch(`/api/admins/${passwordTarget.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: targetPassword,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Gagal memperbarui password admin");
      }

      setFeedback(payload.message || "Password admin berhasil diperbarui");
      setPasswordTarget(null);
      setTargetPassword("");
      setTargetPasswordConfirm("");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Gagal memperbarui password admin"
      );
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Admin Management"
        subtitle="Kelola akun admin."
      />
      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total Admin" variant="info">
          <p className="text-4xl font-bold tracking-tight">{admins.length}</p>
        </Card>

        <Card title="Admin Aktif" variant="success">
          <p className="text-4xl font-bold tracking-tight">{activeAdmins}</p>
        </Card>

        <Card title="Super Admin" variant="warning">
          <p className="text-4xl font-bold tracking-tight">{superAdmins}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title={editId ? "Edit Admin" : "Tambah Admin"}>
          {!formOpen ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-white transition hover:bg-gray-800"
              aria-label="Tampilkan form tambah admin"
            >
              +
            </button>
          ) : (
            <form onSubmit={submitAdminForm} className="grid gap-4 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nama admin"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                required
              />

              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Email admin"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                required
              />

              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as AdminAccount["role"],
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              >
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>

              <select
                value={form.isActive ? "true" : "false"}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.value === "true",
                  }))
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              >
                <option value="true">ACTIVE</option>
                <option value="false">INACTIVE</option>
              </select>

              {!editId ? (
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Password awal minimal 8 karakter"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 md:col-span-2"
                  required
                />
              ) : null}

              <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editId
                    ? "Simpan Perubahan"
                    : "Tambah Admin"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Tutup Form
                </button>
              </div>
            </form>
          )}
        </Card>

        <Card title="Ubah Password Saya">
          <form onSubmit={submitOwnPassword} className="space-y-4">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Password lama"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />

            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Password baru"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Konfirmasi password baru"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />

            <button
              type="submit"
              disabled={passwordSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {passwordSubmitting ? "Memproses..." : "Perbarui Password"}
            </button>
          </form>
        </Card>
      </div>

      {passwordTarget ? (
        <Card title={`Ubah Password ${passwordTarget.name}`}>
          <form onSubmit={submitTargetPassword} className="grid gap-4 md:grid-cols-2">
            <input
              type="password"
              value={targetPassword}
              onChange={(event) => setTargetPassword(event.target.value)}
              placeholder="Password baru admin"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />

            <input
              type="password"
              value={targetPasswordConfirm}
              onChange={(event) => setTargetPasswordConfirm(event.target.value)}
              placeholder="Konfirmasi password admin"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              required
            />

            <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {passwordSubmitting ? "Memproses..." : "Simpan Password Baru"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasswordTarget(null);
                  setTargetPassword("");
                  setTargetPasswordConfirm("");
                }}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Batal
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Daftar Admin">
        {loading ? (
          <p className="text-sm text-gray-500">Memuat data admin...</p>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{admin.name}</p>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      {admin.role}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        admin.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {admin.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    {currentAdmin?.id === admin.id ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        Akun Login
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-gray-600">{admin.email}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Dibuat: {formatDate(admin.createdAt)} • Diperbarui:{" "}
                    {formatDate(admin.updatedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(admin)}
                    className="text-sm font-medium text-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordTarget(admin);
                      setTargetPassword("");
                      setTargetPasswordConfirm("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-sm font-medium text-amber-600"
                  >
                    Password
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(admin)}
                    className="text-sm font-medium text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
