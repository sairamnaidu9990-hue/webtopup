"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { parseJsonSafely } from "@/app/lib/http";
import { getBackendWebSocketUrl } from "@/lib/realtime";

type AdminProfile = {
  adminId: string;
  name: string;
  email: string;
  role: string;
};

type TeamChatMessage = {
  _id: string;
  roomKey: string;
  text: string;
  sender: AdminProfile;
  createdAt?: string | null;
};

function formatTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
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

export default function TeamChatPageClient() {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [onlineAdmins, setOnlineAdmins] = useState<AdminProfile[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile | null>(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "fallback"
  >("connecting");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        setLoading(true);
        setError("");

        const [meResponse, messagesResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/admin-team-chat?limit=100", { cache: "no-store" }),
        ]);

        const mePayload = await parseJsonSafely<{
          admin?: {
            id?: string;
            name?: string;
            email?: string;
            role?: string;
          };
          message?: string;
        }>(meResponse);
        const messagesPayload = await parseJsonSafely<{
          items?: TeamChatMessage[];
          message?: string;
          error?: string;
        }>(messagesResponse);

        if (!meResponse.ok || !mePayload?.admin?.id) {
          throw new Error(mePayload?.message || "Gagal mengambil data admin");
        }

        if (!messagesResponse.ok) {
          throw new Error(
            messagesPayload?.error ||
              messagesPayload?.message ||
              "Gagal mengambil pesan chat tim"
          );
        }

        if (!active) {
          return;
        }

        setCurrentAdmin({
          adminId: String(mePayload.admin.id || ""),
          name: String(mePayload.admin.name || "").trim(),
          email: String(mePayload.admin.email || "").trim(),
          role: String(mePayload.admin.role || "").trim(),
        });
        setMessages(Array.isArray(messagesPayload?.items) ? messagesPayload.items : []);
      } catch (bootstrapError) {
        if (active) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : "Gagal memuat chat tim"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentAdmin?.adminId) {
      return;
    }

    let closedManually = false;
    let socket: WebSocket | null = null;

    async function connect() {
      try {
        setConnectionState("connecting");

        const tokenResponse = await fetch("/api/realtime/admin-token", {
          method: "POST",
          cache: "no-store",
        });
        const tokenPayload = await parseJsonSafely<{ token?: string }>(tokenResponse);

        if (!tokenResponse.ok || !tokenPayload?.token) {
          throw new Error("Realtime token admin gagal dibuat");
        }

        socket = new WebSocket(getBackendWebSocketUrl());

        socket.addEventListener("open", () => {
          setConnectionState("connected");
        });

        socket.addEventListener("message", (event) => {
          try {
            const payload = JSON.parse(String(event.data || "{}"));

            if (payload?.type === "ready") {
              socket?.send(
                JSON.stringify({
                  type: "auth.admin",
                  token: tokenPayload.token,
                })
              );
              return;
            }

            if (payload?.type === "auth.success") {
              socket?.send(JSON.stringify({ type: "subscribe.admin.team-chat" }));
              return;
            }

            if (payload?.type === "team-chat.message" && payload?.message) {
              setMessages((current) => {
                const exists = current.some((item) => item._id === payload.message._id);
                return exists ? current : [...current, payload.message];
              });
              return;
            }

            if (payload?.type === "team-chat.presence") {
              setOnlineAdmins(Array.isArray(payload.onlineAdmins) ? payload.onlineAdmins : []);
            }
          } catch {
            // Ignore malformed realtime payloads.
          }
        });

        socket.addEventListener("close", () => {
          if (!closedManually) {
            setConnectionState("fallback");
          }
        });

        socket.addEventListener("error", () => {
          setConnectionState("fallback");
        });
      } catch {
        setConnectionState("fallback");
      }
    }

    void connect();

    return () => {
      closedManually = true;
      socket?.close();
    };
  }, [currentAdmin?.adminId]);

  const sendMessage = async () => {
    const nextMessage = messageText.replace(/\s+/g, " ").trim();

    if (!nextMessage) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch("/api/admin-team-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: nextMessage,
        }),
      });
      const payload = await parseJsonSafely<{
        item?: TeamChatMessage;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Pesan chat gagal dikirim"
        );
      }

      const createdMessage = payload?.item;

      if (connectionState !== "connected" && createdMessage) {
        setMessages((current) => {
          const exists = current.some((item) => item._id === createdMessage._id);
          return exists ? current : [...current, createdMessage];
        });
      }

      setMessageText("");
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Pesan chat gagal dikirim"
      );
    } finally {
      setSending(false);
    }
  };

  const orderedOnlineAdmins = useMemo(() => {
    const unique = new Map<string, AdminProfile>();

    onlineAdmins.forEach((admin) => {
      if (admin?.adminId) {
        unique.set(admin.adminId, admin);
      }
    });

    return Array.from(unique.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "id-ID")
    );
  }, [onlineAdmins]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SectionTitle
          title="Team Chat"
          subtitle="Ruang obrolan realtime internal untuk seluruh admin KITAGG."
        />

        <div className="inline-flex w-full max-w-xs items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm shadow-sm">
          <span className="font-medium text-gray-600">Koneksi realtime</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              connectionState === "connected"
                ? "bg-emerald-50 text-emerald-700"
                : connectionState === "connecting"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {connectionState === "connected"
              ? "Terhubung"
              : connectionState === "connecting"
                ? "Menghubungkan..."
                : "Fallback"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card title="Admin Online" className="h-fit">
          <div className="space-y-3">
            {orderedOnlineAdmins.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                Belum ada admin online terdeteksi.
              </div>
            ) : (
              orderedOnlineAdmins.map((admin) => {
                const isCurrentAdmin = admin.adminId === currentAdmin?.adminId;

                return (
                  <div
                    key={admin.adminId}
                    className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-sm font-bold text-red-600">
                      {admin.name?.slice(0, 1)?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {admin.name || admin.email}
                        </p>
                        {isCurrentAdmin ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600">
                            Kamu
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-gray-500">{admin.email}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                        {admin.role || "admin"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card title="Ruang Chat Tim" className="overflow-hidden">
          <div className="flex flex-col gap-4">
            <div className="h-[52vh] min-h-[420px] overflow-y-auto rounded-3xl border border-gray-200 bg-[#f8fafc] p-4">
              {loading ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
                  Memuat pesan chat tim...
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
                  Belum ada pesan. Mulai obrolan pertama untuk timmu.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMine = message.sender.adminId === currentAdmin?.adminId;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${
                            isMine
                              ? "bg-red-500 text-white"
                              : "border border-gray-200 bg-white text-gray-900"
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <p className="text-xs font-semibold">
                              {isMine ? "Kamu" : message.sender.name || message.sender.email}
                            </p>
                            <span
                              className={`text-[11px] ${
                                isMine ? "text-red-100" : "text-gray-400"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {message.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Tulis pesan ke tim
              </label>
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={4}
                placeholder="Ketik update, reminder, atau koordinasi cepat untuk tim..."
                className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 md:text-sm"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500">
                  Tekan <span className="font-semibold">Enter</span> untuk kirim,
                  <span className="font-semibold"> Shift + Enter</span> untuk baris baru.
                </div>

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending || !messageText.trim()}
                  className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(239,68,68,0.22)] transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Mengirim..." : "Kirim Pesan"}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              Histori menampilkan pesan terbaru tim. Pesan dikirim realtime ke semua
              admin yang sedang membuka halaman ini.
              {messages.length > 0 ? ` Update terakhir: ${formatDateTime(messages[messages.length - 1]?.createdAt)}.` : ""}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
