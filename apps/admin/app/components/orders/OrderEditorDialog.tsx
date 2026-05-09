"use client";

import { useEffect, useState } from "react";
import { getResponseMessage, parseJsonSafely } from "@/app/lib/http";
import type { Order, OrderStatus, PaymentStatus } from "@/app/types/Order";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "UNPAID",
  "PAID",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
  "EXPIRED",
];

const PROVIDER_STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "UNKNOWN",
] as const;
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "UNPAID",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
];

type FeedbackTone = "success" | "error" | "info";

type FeedbackState = {
  tone: FeedbackTone;
  message: string;
} | null;

type EditableCustomerInput = {
  name?: string;
  title?: string;
  type?: string;
  value: string;
};

type DraftState = {
  customerInputs: EditableCustomerInput[];
  contactDetail: {
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
  };
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  providerStatus: (typeof PROVIDER_STATUS_OPTIONS)[number];
  providerMessage: string;
  notes: string;
};

type OrderActionPayload = {
  message?: string;
  warning?: string;
  order?: Order;
};

type OrderEditorDialogProps = {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderMutated: (nextOrder?: Order) => void;
};

function serializeDraft(draft: DraftState) {
  return {
    customerInputs: draft.customerInputs.map((input) => ({
      name: input.name || "",
      title: input.title || "",
      type: input.type || "text",
      value: input.value,
    })),
    contactDetail: {
      email: draft.contactDetail.email,
      phoneCountryCode: draft.contactDetail.phoneCountryCode,
      phoneNumber: draft.contactDetail.phoneNumber,
    },
    paymentStatus: draft.paymentStatus,
    status: draft.status,
    providerStatus: draft.providerStatus,
    providerMessage: draft.providerMessage,
    notes: draft.notes,
  };
}

function buildDraft(order: Order): DraftState {
  return {
    customerInputs: Array.isArray(order.customerInputs)
      ? order.customerInputs.map((item) => ({
          name: item.name,
          title: item.title,
          type: item.type,
          value: String(item.value || ""),
        }))
      : [],
    contactDetail: {
      email: String(order.contactDetail?.email || ""),
      phoneCountryCode: String(order.contactDetail?.phoneCountryCode || "+62"),
      phoneNumber: String(order.contactDetail?.phoneNumber || ""),
    },
    paymentStatus: (order.paymentStatus || "UNPAID") as PaymentStatus,
    status: (order.status || "UNPAID") as OrderStatus,
    providerStatus: (
      order.providerStatus || "PENDING"
    ) as (typeof PROVIDER_STATUS_OPTIONS)[number],
    providerMessage: String(order.providerMessage || ""),
    notes: String(order.notes || ""),
  };
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusTone(status?: string) {
  switch (status) {
    case "SUCCESS":
    case "PAID":
      return "bg-green-100 text-green-700";
    case "FAILED":
    case "EXPIRED":
      return "bg-red-100 text-red-700";
    case "PROCESSING":
      return "bg-amber-100 text-amber-700";
    case "REFUNDED":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getFeedbackClasses(tone: FeedbackTone) {
  switch (tone) {
    case "success":
      return "border-green-200 bg-green-50 text-green-700";
    case "error":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function canResendProviderOrder({
  provider,
  paymentStatus,
  status,
}: {
  provider?: string;
  paymentStatus?: string;
  status?: string;
}) {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const normalizedPaymentStatus = String(paymentStatus || "")
    .trim()
    .toUpperCase();
  const normalizedOrderStatus = String(status || "").trim().toUpperCase();

  return (
    normalizedProvider === "bangjeff" &&
    normalizedPaymentStatus === "PAID" &&
    normalizedOrderStatus !== "SUCCESS" &&
    normalizedOrderStatus !== "PROCESSING"
  );
}

function canRefundOrderToBalance({
  orderType,
  customerId,
  paymentStatus,
  status,
  providerStatus,
  refundedToBalanceAt,
  refundBalanceTransactionId,
}: {
  orderType?: string;
  customerId?: string | null;
  paymentStatus?: string;
  status?: string;
  providerStatus?: string;
  refundedToBalanceAt?: string | null;
  refundBalanceTransactionId?: string | null;
}) {
  const normalizedOrderType = String(orderType || "PURCHASE")
    .trim()
    .toUpperCase();
  const normalizedPaymentStatus = String(paymentStatus || "")
    .trim()
    .toUpperCase();
  const normalizedOrderStatus = String(status || "").trim().toUpperCase();
  const normalizedProviderStatus = String(providerStatus || "")
    .trim()
    .toUpperCase();

  return (
    normalizedOrderType === "PURCHASE" &&
    Boolean(String(customerId || "").trim()) &&
    normalizedPaymentStatus === "PAID" &&
    (normalizedOrderStatus === "FAILED" ||
      normalizedProviderStatus === "FAILED") &&
    !refundedToBalanceAt &&
    !refundBalanceTransactionId
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  loading,
  variant = "secondary",
}: {
  label: string;
  onClick: () => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "success" | "warning";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-black text-white hover:bg-gray-800"
      : variant === "success"
        ? "bg-green-600 text-white hover:bg-green-700"
        : variant === "warning"
          ? "bg-amber-500 text-white hover:bg-amber-600"
          : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${variantClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? "Memproses..." : label}
    </button>
  );
}

export default function OrderEditorDialog({
  open,
  order,
  onClose,
  onOrderMutated,
}: OrderEditorDialogProps) {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState("");

  useEffect(() => {
    if (!open || !order) {
      return;
    }

    setDraft(buildDraft(order));
    setFeedback(null);
  }, [open, order]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !actionKey) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [actionKey, onClose, open, saving]);

  if (!open || !order || !draft) {
    return null;
  }

  const hasUnsavedChanges =
    JSON.stringify(serializeDraft(draft)) !==
    JSON.stringify(serializeDraft(buildDraft(order)));
  const linkedCustomerId =
    order.customer || order.customerAccountSnapshot?.customerId || "";

  const persistDraft = async (announceSuccess = true) => {
    const response = await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(serializeDraft(draft)),
    });
    const payload = await parseJsonSafely<OrderActionPayload>(response);

    if (!response.ok) {
      throw new Error(getResponseMessage(payload, "Gagal menyimpan order"));
    }

    if (payload?.order) {
      onOrderMutated(payload.order);
      setDraft(buildDraft(payload.order));
    } else {
      onOrderMutated();
    }

    if (announceSuccess) {
      setFeedback({
        tone: "success",
        message: getResponseMessage(payload, "Perubahan order berhasil disimpan"),
      });
    }

    return payload?.order || null;
  };

  const runAction = async (
    key: string,
    request: (orderId: string) => Promise<Response>,
    fallbackMessage: string
  ) => {
    try {
      setActionKey(key);
      setFeedback(null);

      const latestOrder = hasUnsavedChanges
        ? await persistDraft(false)
        : order;
      const response = await request(latestOrder?._id || order._id);
      const payload = await parseJsonSafely<OrderActionPayload>(response);

      if (!response.ok) {
        throw new Error(getResponseMessage(payload, fallbackMessage));
      }

      if (payload?.order) {
        onOrderMutated(payload.order);
      } else {
        onOrderMutated();
      }

      if (payload?.order) {
        setDraft(buildDraft(payload.order));
      }

      setFeedback({
        tone: payload?.warning ? "info" : "success",
        message: [payload?.message, payload?.warning].filter(Boolean).join(" "),
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : fallbackMessage,
      });
    } finally {
      setActionKey("");
    }
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      setFeedback({
        tone: "info",
        message: "Belum ada perubahan baru yang perlu disimpan.",
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await persistDraft(true);
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Gagal menyimpan order",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[3px]">
      <div className="flex h-full items-start justify-center overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_36px_90px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_42%),linear-gradient(135deg,_#ffffff,_#f8fafc)] px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    Order Editor
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {order.invoiceNumber}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Perbarui data tujuan, kontak pelanggan, serta status order
                    dan pembayaran secara manual. Pengiriman ulang ke provider
                    hanya berjalan saat kamu menekan aksi khususnya.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span
                    className={`rounded-full px-3 py-1 ${getStatusTone(order.status)}`}
                  >
                    Order {order.status || "UNPAID"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${getStatusTone(
                      order.paymentStatus
                    )}`}
                  >
                    Payment {order.paymentStatus || "UNPAID"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${getStatusTone(
                      order.providerStatus
                    )}`}
                  >
                    Provider {order.providerStatus || "PENDING"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Tutup editor order"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Game
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {order.gameSnapshot?.name || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {order.variantSnapshot?.name || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Kontak
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {order.contactDetail?.email || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {(order.contactDetail?.phoneCountryCode || "+62").trim()}{" "}
                  {order.contactDetail?.phoneNumber || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Invoice Provider
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {order.providerInvoiceNumber || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ref: {order.providerReferenceNumber || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Timeline
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Dibuat {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Diupdate {formatDate(order.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
              <div className="space-y-6">
                <section className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Data Tujuan Order
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Perbaiki user ID, zone ID, atau data akun lain jika pelanggan
                        salah isi sebelum order dikirim ulang.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {draft.customerInputs.length > 0 ? (
                      draft.customerInputs.map((input, index) => (
                        <label key={`${input.name || input.title || "input"}-${index}`} className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">
                            {input.title || input.name || `Input ${index + 1}`}
                          </span>
                          <input
                            type="text"
                            value={input.value}
                            onChange={(event) => {
                              const nextValue = event.target.value;

                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      customerInputs: current.customerInputs.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              value: nextValue,
                                            }
                                          : item
                                      ),
                                    }
                                  : current
                              );
                            }}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                            placeholder={`Isi ${input.title || input.name || `input ${index + 1}`}`}
                          />
                        </label>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                        Order ini tidak memiliki field data akun tambahan yang bisa diedit.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Kontak Pelanggan
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Digunakan untuk follow up invoice, manual handling, dan investigasi
                    order bila diperlukan.
                  </p>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1fr_1.2fr]">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Kode Negara
                      </span>
                      <input
                        type="text"
                        value={draft.contactDetail.phoneCountryCode}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  contactDetail: {
                                    ...current.contactDetail,
                                    phoneCountryCode: event.target.value,
                                  },
                                }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                        placeholder="+62"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Nomor Kontak
                      </span>
                      <input
                        type="text"
                        value={draft.contactDetail.phoneNumber}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  contactDetail: {
                                    ...current.contactDetail,
                                    phoneNumber: event.target.value,
                                  },
                                }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                        placeholder="81234567890"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Email
                      </span>
                      <input
                        type="email"
                        value={draft.contactDetail.email}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  contactDetail: {
                                    ...current.contactDetail,
                                    email: event.target.value,
                                  },
                                }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                        placeholder="email@pelanggan.com"
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Catatan Operasional
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Simpan catatan investigasi, alasan gagal, atau update manual dari tim.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Pesan Provider
                      </span>
                      <textarea
                        value={draft.providerMessage}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  providerMessage: event.target.value,
                                }
                              : current
                          )
                        }
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                        placeholder="Contoh: saldo provider sempat kurang atau user ID perlu diperbaiki."
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Catatan Internal
                      </span>
                      <textarea
                        value={draft.notes}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  notes: event.target.value,
                                }
                              : current
                          )
                        }
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                        placeholder="Catatan untuk follow up internal, bukti manual paid, atau investigasi callback."
                      />
                    </label>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-[26px] border border-slate-200 bg-slate-900 p-5 text-white">
                  <h3 className="text-base font-semibold">Kontrol Status</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Ubah status pembayaran, order, dan provider secara manual.
                    Menyimpan perubahan di sini tidak akan mengirim ulang order
                    atau memanggil provider.
                  </p>

                  <div className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">
                        Status Pembayaran
                      </span>
                      <select
                        value={draft.paymentStatus}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  paymentStatus: event.target.value as PaymentStatus,
                                }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/60"
                      >
                        {PAYMENT_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option} className="text-slate-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">
                        Status Order
                      </span>
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  status: event.target.value as OrderStatus,
                                }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/60"
                      >
                        {ORDER_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option} className="text-slate-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">
                        Status Provider
                      </span>
                      <select
                        value={draft.providerStatus}
                        onChange={(event) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  providerStatus: event.target.value as (typeof PROVIDER_STATUS_OPTIONS)[number],
                                }
                              : current
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-white/60"
                      >
                        {PROVIDER_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option} className="text-slate-900">
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Provider
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {(order.provider || "manual").toUpperCase()}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Data Draft Siap Kirim
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {canResendProviderOrder({
                            provider: order.provider,
                            paymentStatus: draft.paymentStatus,
                            status: draft.status,
                          })
                            ? "Siap resend ke provider"
                            : "Belum siap resend"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Action Operasional
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Aksi cepat untuk pembenahan order tanpa harus keluar dari editor.
                  </p>

                  <div className="mt-5 grid gap-3">
                    <ActionButton
                      label="Simpan Perubahan"
                      onClick={handleSave}
                      loading={saving}
                      disabled={Boolean(actionKey) || !hasUnsavedChanges}
                      variant="primary"
                    />

                    <ActionButton
                      label="Refund ke Saldo KITAGG"
                      onClick={() =>
                        runAction(
                          "refund-balance",
                          (orderId) =>
                            fetch(`/api/orders/${orderId}/refund-balance`, {
                              method: "POST",
                            }),
                          "Gagal refund order ke saldo KITAGG"
                        )
                      }
                      disabled={
                        !canRefundOrderToBalance({
                          orderType: order.orderType,
                          customerId: linkedCustomerId,
                          paymentStatus: draft.paymentStatus,
                          status: draft.status,
                          providerStatus: draft.providerStatus,
                          refundedToBalanceAt: order.refundedToBalanceAt,
                          refundBalanceTransactionId:
                            order.refundBalanceTransactionId,
                        }) || saving
                      }
                      loading={actionKey === "refund-balance"}
                      variant="success"
                    />

                    <ActionButton
                      label="Resend Callback"
                      onClick={() =>
                        runAction(
                          "resend-callback",
                          (orderId) =>
                            fetch(`/api/orders/${orderId}/resend-callback`, {
                              method: "POST",
                            }),
                          "Gagal menjalankan ulang callback order"
                        )
                      }
                      disabled={saving}
                      loading={actionKey === "resend-callback"}
                    />

                    <ActionButton
                      label="Kirim Ulang Order"
                      onClick={() =>
                        runAction(
                          "resend-provider",
                          (orderId) =>
                            fetch(`/api/orders/${orderId}/resend-provider`, {
                              method: "POST",
                            }),
                          "Gagal mengirim ulang order ke provider"
                        )
                      }
                      disabled={
                        !canResendProviderOrder({
                          provider: order.provider,
                          paymentStatus: draft.paymentStatus,
                          status: draft.status,
                        }) || saving
                      }
                      loading={actionKey === "resend-provider"}
                      variant="warning"
                    />
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-xs leading-5 text-slate-500">
                    <p>
                      `Refund ke Saldo KITAGG` hanya aktif untuk order login
                      yang `PAID + FAILED`. Refund akan mengembalikan nominal
                      tanpa fee payment dan tidak mengirim ulang ke provider.
                    </p>
                    <p>
                      `Simpan Perubahan` hanya menyimpan data dan status manual.
                      Tidak ada submit ulang ke provider dari aksi ini.
                    </p>
                    <p>
                      `Resend Callback` akan menarik ulang status terbaru dari payment gateway
                      dan provider jika datanya tersedia.
                    </p>
                    <p>
                      `Kirim Ulang Order` aktif jika payment draft sudah `PAID`
                      dan order belum `SUCCESS/PROCESSING`. Cocok untuk kasus
                      user ID salah, zone salah, atau saldo provider sempat kurang.
                    </p>
                  </div>

                  {feedback ? (
                    <div
                      className={`mt-4 rounded-2xl border px-4 py-4 text-sm leading-6 ${getFeedbackClasses(
                        feedback.tone
                      )}`}
                    >
                      {feedback.message}
                    </div>
                  ) : null}
                </section>

                <section className="rounded-[26px] border border-slate-200 bg-white p-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Timeline Status
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-4">
                      <span>Paid</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(order.paidAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Processing</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(order.processingAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Completed</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(order.completedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Failed</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(order.failedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Expired</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(order.expiredAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Refunded</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(order.refundedToBalanceAt)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
