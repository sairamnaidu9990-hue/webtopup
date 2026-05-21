"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Card from "@/app/components/ui/Card";
import SectionTitle from "@/app/components/ui/SectionTitle";
import { parseJsonSafely } from "@/app/lib/http";
import { getBackendWebSocketUrl } from "@/lib/realtime";

const MAX_CHAT_ATTACHMENTS = 4;
const MAX_CHAT_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_CHAT_TOTAL_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_CHAT_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

type AdminProfile = {
  adminId: string;
  name: string;
  email: string;
  role: string;
};

type TeamChatAttachment = {
  id: string;
  kind: "image" | "file";
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
};

type TeamChatSeenEntry = AdminProfile & {
  seenAt?: string | null;
};

type TeamChatMessage = {
  _id: string;
  roomKey: string;
  text: string;
  sender: AdminProfile;
  attachments: TeamChatAttachment[];
  seenBy: TeamChatSeenEntry[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ChatImagePreview = {
  attachment: TeamChatAttachment;
  senderName: string;
  sentAt?: string | null;
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

function formatFileSize(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
}

function buildAttachmentId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageAttachment(attachment: TeamChatAttachment) {
  return attachment.kind === "image" || attachment.mimeType.startsWith("image/");
}

function hasMessageBeenSeenByOthers(
  message: TeamChatMessage,
  currentAdminId: string | null
) {
  return message.seenBy.some(
    (entry) =>
      entry.adminId &&
      entry.adminId !== currentAdminId &&
      entry.adminId !== message.sender.adminId
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal membaca file lampiran"));
      }
    };

    reader.onerror = () => reject(new Error("Gagal membaca file lampiran"));
    reader.readAsDataURL(file);
  });
}

export default function TeamChatPageClient() {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [onlineAdmins, setOnlineAdmins] = useState<AdminProfile[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminProfile | null>(null);
  const [messageText, setMessageText] = useState("");
  const [draftAttachments, setDraftAttachments] = useState<TeamChatAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "fallback"
  >("connecting");
  const [error, setError] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [imagePreview, setImagePreview] = useState<ChatImagePreview | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentAdminRef = useRef<AdminProfile | null>(null);
  const messagesRef = useRef<TeamChatMessage[]>([]);
  const shouldStickToBottomRef = useRef(true);
  const forceScrollToBottomRef = useRef(true);

  useEffect(() => {
    currentAdminRef.current = currentAdmin;
  }, [currentAdmin]);

  useEffect(() => {
    if (!imagePreview) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImagePreview(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imagePreview]);

  useEffect(() => {
    messagesRef.current = messages;

    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    if (!forceScrollToBottomRef.current && !shouldStickToBottomRef.current) {
      return;
    }

    const scrollFrame = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      forceScrollToBottomRef.current = false;
    });

    return () => {
      window.cancelAnimationFrame(scrollFrame);
    };
  }, [messages]);

  const updateStickToBottomState = useCallback(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldStickToBottomRef.current = distanceFromBottom <= 80;
  }, []);

  const getUnreadMessageIds = useCallback((sourceMessages?: TeamChatMessage[]) => {
    const adminId = currentAdminRef.current?.adminId || "";

    if (!adminId) {
      return [];
    }

    return (sourceMessages || messagesRef.current)
      .filter((message) => message.sender.adminId !== adminId)
      .filter(
        (message) =>
          !message.seenBy.some((entry) => entry.adminId === adminId)
      )
      .map((message) => message._id);
  }, []);

  const applyReadReceiptLocally = useCallback(
    (messageIds: string[], seenBy: TeamChatSeenEntry) => {
      if (!seenBy?.adminId || messageIds.length === 0) {
        return;
      }

      setMessages((current) =>
        current.map((message) => {
          if (!messageIds.includes(message._id)) {
            return message;
          }

          if (message.seenBy.some((entry) => entry.adminId === seenBy.adminId)) {
            return message;
          }

          return {
            ...message,
            seenBy: [...message.seenBy, seenBy],
          };
        })
      );
    },
    []
  );

  const markMessagesSeen = useCallback(
    async (messageIds?: string[]) => {
      const admin = currentAdminRef.current;

      if (!admin) {
        return;
      }

      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }

      const targetIds = Array.from(new Set(messageIds || getUnreadMessageIds()));

      if (targetIds.length === 0) {
        return;
      }

      try {
        const response = await fetch("/api/admin-team-chat", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageIds: targetIds,
          }),
        });

        const payload = await parseJsonSafely<{
          updatedIds?: string[];
          message?: string;
          error?: string;
        }>(response);

        if (!response.ok) {
          throw new Error(
            payload?.error ||
              payload?.message ||
              "Status baca chat gagal diperbarui"
          );
        }

        const updatedIds = Array.isArray(payload?.updatedIds)
          ? payload.updatedIds
          : targetIds;

        applyReadReceiptLocally(updatedIds, {
          adminId: admin.adminId,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          seenAt: new Date().toISOString(),
        });
      } catch {
        // Silently ignore read receipt errors to keep chat responsive.
      }
    },
    [applyReadReceiptLocally, getUnreadMessageIds]
  );

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

        const nextAdmin = {
          adminId: String(mePayload.admin.id || ""),
          name: String(mePayload.admin.name || "").trim(),
          email: String(mePayload.admin.email || "").trim(),
          role: String(mePayload.admin.role || "").trim(),
        };

        forceScrollToBottomRef.current = true;
        setCurrentAdmin(nextAdmin);
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

    const handleFocusRead = () => {
      void markMessagesSeen();
    };

    void markMessagesSeen();

    document.addEventListener("visibilitychange", handleFocusRead);
    window.addEventListener("focus", handleFocusRead);

    return () => {
      document.removeEventListener("visibilitychange", handleFocusRead);
      window.removeEventListener("focus", handleFocusRead);
    };
  }, [currentAdmin?.adminId, markMessagesSeen]);

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
              const nextMessage = payload.message as TeamChatMessage;

              setMessages((current) => {
                const exists = current.some((item) => item._id === nextMessage._id);
                return exists ? current : [...current, nextMessage];
              });

              if (nextMessage.sender.adminId === currentAdminRef.current?.adminId) {
                forceScrollToBottomRef.current = true;
              } else if (
                typeof document !== "undefined" &&
                document.visibilityState === "visible"
              ) {
                void markMessagesSeen([nextMessage._id]);
              }
              return;
            }

            if (payload?.type === "team-chat.presence") {
              setOnlineAdmins(Array.isArray(payload.onlineAdmins) ? payload.onlineAdmins : []);
              return;
            }

            if (payload?.type === "team-chat.read" && payload?.payload) {
              applyReadReceiptLocally(
                Array.isArray(payload.payload.messageIds)
                  ? payload.payload.messageIds
                  : [],
                payload.payload.seenBy as TeamChatSeenEntry
              );
              return;
            }

            if (payload?.type === "team-chat.cleared") {
              setMessages([]);
              setDraftAttachments([]);
              setMessageText("");
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
  }, [applyReadReceiptLocally, currentAdmin?.adminId, markMessagesSeen]);

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextFiles = Array.from(event.target.files || []);

    if (nextFiles.length === 0) {
      return;
    }

    if (draftAttachments.length + nextFiles.length > MAX_CHAT_ATTACHMENTS) {
      setError(`Lampiran maksimal ${MAX_CHAT_ATTACHMENTS} file per pesan.`);
      event.target.value = "";
      return;
    }

    try {
      setUploadingFiles(true);
      setError("");

      const attachments = await Promise.all(
        nextFiles.map(async (file) => {
          const mimeType = String(file.type || "application/octet-stream")
            .trim()
            .toLowerCase();

          if (!ACCEPTED_CHAT_FILE_TYPES.includes(mimeType) && !mimeType.startsWith("image/")) {
            throw new Error("Jenis file ini belum didukung untuk chat tim.");
          }

          if (mimeType === "image/svg+xml") {
            throw new Error("Format SVG belum didukung untuk keamanan chat.");
          }

          if (file.size > MAX_CHAT_ATTACHMENT_SIZE_BYTES) {
            throw new Error("Ukuran file maksimal 5 MB untuk setiap lampiran.");
          }

          return {
            id: buildAttachmentId(),
            kind: mimeType.startsWith("image/") ? "image" : "file",
            name: file.name,
            mimeType,
            size: file.size,
            dataUrl: await readFileAsDataUrl(file),
          } satisfies TeamChatAttachment;
        })
      );

      const currentTotalSize = draftAttachments.reduce(
        (sum, attachment) => sum + Number(attachment.size || 0),
        0
      );
      const nextTotalSize =
        currentTotalSize +
        attachments.reduce(
          (sum, attachment) => sum + Number(attachment.size || 0),
          0
        );

      if (nextTotalSize > MAX_CHAT_TOTAL_ATTACHMENT_SIZE_BYTES) {
        throw new Error("Total ukuran lampiran maksimal 10 MB per pesan.");
      }

      setDraftAttachments((current) => [...current, ...attachments]);
      forceScrollToBottomRef.current = false;
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Lampiran chat gagal diproses"
      );
    } finally {
      setUploadingFiles(false);
      event.target.value = "";
    }
  };

  const removeDraftAttachment = (attachmentId: string) => {
    setDraftAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  const openImagePreview = (
    attachment: TeamChatAttachment,
    senderName: string,
    sentAt?: string | null
  ) => {
    setImagePreview({
      attachment,
      senderName,
      sentAt,
    });
  };

  const sendMessage = async () => {
    const nextMessage = messageText
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
      .join("\n")
      .trim();

    if (!nextMessage && draftAttachments.length === 0) {
      return;
    }

    try {
      setSending(true);
      setError("");
      forceScrollToBottomRef.current = true;

      const response = await fetch("/api/admin-team-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: nextMessage,
          attachments: draftAttachments,
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
      setDraftAttachments([]);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Pesan chat gagal dikirim"
      );
    } finally {
      setSending(false);
    }
  };

  const clearAllMessages = async () => {
    if (messages.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Yakin ingin menghapus seluruh chat tim? Tindakan ini tidak bisa dibatalkan."
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError("");

      const response = await fetch("/api/admin-team-chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomKey: "global" }),
      });
      const payload = await parseJsonSafely<{
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Chat tim gagal dibersihkan"
        );
      }

      setMessages([]);
      setDraftAttachments([]);
      setMessageText("");
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Chat tim gagal dibersihkan"
      );
    } finally {
      setClearing(false);
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
      {imagePreview ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#06070b]/88 p-4 backdrop-blur-md sm:p-6">
          <button
            type="button"
            aria-label="Tutup preview gambar"
            onClick={() => setImagePreview(null)}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative z-[121] flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#12141b] text-white shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold sm:text-lg">
                  {imagePreview.attachment.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/65 sm:text-sm">
                  <span>Dikirim oleh {imagePreview.senderName}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-flex" />
                  <span>{formatFileSize(imagePreview.attachment.size)}</span>
                  {imagePreview.sentAt ? (
                    <>
                      <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:inline-flex" />
                      <span>{formatDateTime(imagePreview.sentAt)}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={imagePreview.attachment.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Buka Tab Baru
                </a>
                <a
                  href={imagePreview.attachment.dataUrl}
                  download={imagePreview.attachment.name}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#d33b3b] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative flex min-h-[320px] flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#2c3445_0%,#151922_55%,#0f1218_100%)] p-4 sm:min-h-[560px] sm:p-8">
              <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:min-h-[520px]">
                <Image
                  src={imagePreview.attachment.dataUrl}
                  alt={imagePreview.attachment.name}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SectionTitle
          title="Team Chat"
          subtitle="Ruang obrolan admin KITAGG."
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
            <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Chat realtime untuk semua admin
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Pesan, file, dan gambar akan dikirim ke semua admin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void clearAllMessages()}
                disabled={clearing || loading || messages.length === 0}
                className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearing ? "Membersihkan..." : "Clear Chat Semua"}
              </button>
            </div>

            <div
              ref={messagesContainerRef}
              onScroll={updateStickToBottomState}
              className="h-[52vh] min-h-[420px] overflow-y-auto rounded-3xl border border-gray-200 bg-[#f8fafc] p-4"
            >
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
                    const seenByOthers = hasMessageBeenSeenByOthers(
                      message,
                      currentAdmin?.adminId || null
                    );

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-sm ${
                            isMine
                              ? "bg-red-500 text-white"
                              : "border border-gray-200 bg-white text-gray-900"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <p className="text-xs font-semibold">
                              {isMine
                                ? "Kamu"
                                : message.sender.name || message.sender.email}
                            </p>
                            <span
                              className={`text-[11px] ${
                                isMine ? "text-red-100" : "text-gray-400"
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </span>
                          </div>

                          {message.text ? (
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.text}
                            </p>
                          ) : null}

                          {message.attachments.length > 0 ? (
                            <div
                              className={`mt-3 grid gap-3 ${
                                message.attachments.length > 1
                                  ? "sm:grid-cols-2"
                                  : ""
                              }`}
                            >
                              {message.attachments.map((attachment) =>
                                isImageAttachment(attachment) ? (
                                  <button
                                    key={attachment.id}
                                    type="button"
                                    onClick={() =>
                                      openImagePreview(
                                        attachment,
                                        isMine
                                          ? "Kamu"
                                          : message.sender.name || message.sender.email,
                                        message.createdAt
                                      )
                                    }
                                    className={`group overflow-hidden rounded-2xl border ${
                                      isMine
                                        ? "border-white/15 bg-white/8"
                                        : "border-gray-200 bg-gray-50"
                                    } text-left transition hover:-translate-y-[1px] hover:shadow-lg`}
                                  >
                                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                                      <Image
                                        src={attachment.dataUrl}
                                        alt={attachment.name}
                                        fill
                                        sizes="280px"
                                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                                      />
                                    </div>
                                    <div className="px-3 py-2 text-xs">
                                      <p className="truncate font-semibold">
                                        {attachment.name}
                                      </p>
                                      <p
                                        className={`mt-1 ${
                                          isMine ? "text-red-100" : "text-gray-500"
                                        }`}
                                      >
                                        Klik untuk lihat penuh
                                      </p>
                                    </div>
                                  </button>
                                ) : (
                                  <a
                                    key={attachment.id}
                                    href={attachment.dataUrl}
                                    download={attachment.name}
                                    className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${
                                      isMine
                                        ? "border-white/15 bg-white/8"
                                        : "border-gray-200 bg-gray-50"
                                    }`}
                                  >
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                        isMine
                                          ? "bg-white/12 text-white"
                                          : "bg-white text-red-500"
                                      }`}
                                    >
                                      ⤓
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold">
                                        {attachment.name}
                                      </p>
                                      <p
                                        className={`mt-1 text-xs ${
                                          isMine ? "text-red-100" : "text-gray-500"
                                        }`}
                                      >
                                        {formatFileSize(attachment.size)}
                                      </p>
                                    </div>
                                  </a>
                                )
                              )}
                            </div>
                          ) : null}

                          {isMine ? (
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <span className="text-[11px] text-red-100/85">
                                {seenByOthers ? "Dilihat" : "Terkirim"}
                              </span>
                              <span
                                className={`text-sm font-semibold ${
                                  seenByOthers ? "text-sky-200" : "text-red-100/90"
                                }`}
                              >
                                {seenByOthers ? "✓✓" : "✓"}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Lampiran
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Kirim gambar atau file langsung di obrolan tim.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.csv,.zip,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelection}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      uploadingFiles ||
                      draftAttachments.length >= MAX_CHAT_ATTACHMENTS
                    }
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingFiles ? "Memproses File..." : "Tambah File / Gambar"}
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Maks {MAX_CHAT_ATTACHMENTS} file, 5 MB per file, total 10 MB
                  </span>
                </div>
              </div>

              {draftAttachments.length > 0 ? (
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  {draftAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                    >
                      {isImageAttachment(attachment) ? (
                        <button
                          type="button"
                          onClick={() =>
                            openImagePreview(attachment, "Draft Lampiran", null)
                          }
                          className="relative block aspect-[4/3] w-full overflow-hidden border-b border-gray-200"
                        >
                          <Image
                            src={attachment.dataUrl}
                            alt={attachment.name}
                            fill
                            sizes="260px"
                            className="object-cover transition duration-300 hover:scale-[1.02]"
                          />
                        </button>
                      ) : null}

                      <div className="flex items-start gap-3 px-3 py-3">
                        {!isImageAttachment(attachment) ? (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm">
                            ⤓
                          </div>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {attachment.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDraftAttachment(attachment.id)}
                          className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-500 transition hover:border-red-200 hover:text-red-500"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

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
                placeholder="Halo"
                className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 shadow-sm outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100 md:text-sm"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500">
                  Tekan <span className="font-semibold">Enter</span> untuk kirim,
                  <span className="font-semibold"> Shift + Enter</span> untuk baris
                  baru.
                </div>

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={
                    sending ||
                    (!messageText.trim() && draftAttachments.length === 0)
                  }
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
              {messages.length > 0
                ? ` Update terakhir: ${formatDateTime(messages[messages.length - 1]?.createdAt)}.`
                : ""}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
