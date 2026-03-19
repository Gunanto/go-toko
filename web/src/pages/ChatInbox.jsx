import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  listAdminChatConversations,
  listAdminChatMessages,
  markAdminChatRead,
  sendAdminChatMessage,
} from "../lib/api";

function ChatInbox() {
  const { token, user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const inboxPollingRef = useRef(false);
  const threadPollingRef = useRef(false);

  const formatDateTime = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ||
      null,
    [activeConversationId, conversations],
  );

  const adminUnreadTotal = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + Number(conversation.admin_unread_count || 0),
        0,
      ),
    [conversations],
  );

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    const loadInbox = async (silent = false) => {
      if (inboxPollingRef.current) return;
      inboxPollingRef.current = true;
      if (!silent) {
        setInboxLoading(true);
      }

      try {
        const response = await listAdminChatConversations({
          token,
          skip: 0,
          limit: 100,
          status: "open",
        });
        if (cancelled) return;

        const nextConversations = response?.data?.conversations || [];
        setConversations(nextConversations);
        setError("");

        if (nextConversations.length > 0) {
          setActiveConversationId((current) => {
            if (current && nextConversations.some((item) => item.id === current)) {
              return current;
            }
            return nextConversations[0].id;
          });
        } else {
          setActiveConversationId(null);
        }
      } catch (fetchError) {
        if (cancelled) return;
        if (fetchError?.status === 401 || fetchError?.status === 403) {
          logout();
          return;
        }
        setError(fetchError?.message || "Inbox chat belum bisa dimuat.");
      } finally {
        inboxPollingRef.current = false;
        if (!cancelled) {
          setInboxLoading(false);
        }
      }
    };

    loadInbox();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadInbox(true);
      }
    }, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadInbox(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [logout, token]);

  useEffect(() => {
    if (!token || !activeConversationId) {
      setMessages([]);
      return undefined;
    }

    let cancelled = false;

    const loadThread = async (silent = false) => {
      if (threadPollingRef.current) return;
      threadPollingRef.current = true;
      if (!silent) {
        setThreadLoading(true);
      }

      try {
        const response = await listAdminChatMessages(activeConversationId, {
          token,
          skip: 0,
          limit: 100,
        });
        if (cancelled) return;

        const nextMessages = response?.data?.messages || [];
        setMessages(nextMessages);
        setError("");

        const selectedConversation = conversations.find(
          (conversation) => conversation.id === activeConversationId,
        );
        if ((selectedConversation?.admin_unread_count || 0) > 0) {
          markAdminChatRead(activeConversationId, { token }).catch(() => {});
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === activeConversationId
                ? { ...conversation, admin_unread_count: 0 }
                : conversation,
            ),
          );
        }

        if (!silent) {
          scrollToBottom();
        }
      } catch (fetchError) {
        if (cancelled) return;
        if (fetchError?.status === 401 || fetchError?.status === 403) {
          logout();
          return;
        }
        setError(fetchError?.message || "Isi percakapan belum bisa dimuat.");
      } finally {
        threadPollingRef.current = false;
        if (!cancelled) {
          setThreadLoading(false);
        }
      }
    };

    loadThread();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadThread(true);
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeConversationId, conversations, logout, token]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!activeConversationId || !draft.trim() || sending) return;

    setSending(true);
    try {
      const response = await sendAdminChatMessage(activeConversationId, draft, {
        token,
      });
      const created = response?.data;
      if (created) {
        setMessages((current) => [...current, created]);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeConversationId
              ? {
                  ...conversation,
                  last_message_at: created.created_at,
                  last_message_preview: created.body,
                  customer_unread_count:
                    Number(conversation.customer_unread_count || 0) + 1,
                  admin_unread_count: 0,
                }
              : conversation,
          ),
        );
      }
      setDraft("");
      setError("");
      scrollToBottom();
    } catch (sendError) {
      if (sendError?.status === 401 || sendError?.status === 403) {
        logout();
        return;
      }
      setError(sendError?.message || "Balasan gagal dikirim.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_#082f49_0%,_#0f172a_45%,_#111827_100%)] p-6 text-white shadow-soft-xl dark:border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Admin Chat Inbox
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              Pantau pertanyaan pelanggan dan balas dari satu panel.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Inbox ini memakai polling dasar. Daftar percakapan refresh tiap 10
              detik dan thread aktif tiap 5 detik saat tab sedang aktif.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.3rem] border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Admin Login
              </p>
              <p className="mt-2 text-lg font-semibold">{user?.name || "-"}</p>
            </div>
            <div className="rounded-[1.3rem] border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                Percakapan
              </p>
              <p className="mt-2 text-lg font-semibold">{conversations.length}</p>
            </div>
            <div className="rounded-[1.3rem] border border-amber-300/20 bg-amber-300/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-200">
                Unread Admin
              </p>
              <p className="mt-2 text-lg font-semibold">{adminUnreadTotal}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              Daftar Percakapan
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
              Inbox Pelanggan
            </h2>
          </div>

          <div className="max-h-[42rem] overflow-y-auto p-3">
            {inboxLoading ? (
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Memuat inbox...
              </div>
            ) : null}

            {!inboxLoading && conversations.length === 0 ? (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Belum ada percakapan dari customer.
              </div>
            ) : null}

            <div className="space-y-3">
              {conversations.map((conversation) => {
                const active = conversation.id === activeConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      active
                        ? "border-sky-300 bg-sky-50 shadow-sm dark:border-sky-500/50 dark:bg-sky-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {conversation.customer_name || "Customer"}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                          {conversation.customer_phone ||
                            conversation.customer_email ||
                            `Customer #${conversation.customer_id}`}
                        </p>
                      </div>
                      {Number(conversation.admin_unread_count || 0) > 0 ? (
                        <span className="rounded-full bg-amber-300 px-2 py-1 text-[11px] font-bold text-slate-950">
                          {conversation.admin_unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {conversation.last_message_preview || "Belum ada pesan"}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      <span>{conversation.status}</span>
                      <span>{formatDateTime(conversation.last_message_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
              Thread Aktif
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
              {activeConversation?.customer_name || "Pilih percakapan"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeConversation
                ? activeConversation.customer_phone ||
                  activeConversation.customer_email ||
                  `Customer #${activeConversation.customer_id}`
                : "Pilih percakapan dari panel kiri untuk mulai membalas."}
            </p>
          </div>

          <div className="space-y-4 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-4 py-5 dark:bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6">
            {threadLoading ? (
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Memuat thread...
              </div>
            ) : null}

            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {!activeConversation ? (
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Belum ada thread yang dipilih.
                </div>
              ) : null}

              {activeConversation && messages.length === 0 && !threadLoading ? (
                <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Belum ada pesan di thread ini.
                </div>
              ) : null}

              {messages.map((message) => {
                const isAdmin = message.sender_type === "admin";
                return (
                  <div
                    key={message.id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 shadow-sm ${
                        isAdmin
                          ? "bg-slate-950 text-white dark:bg-sky-500 dark:text-slate-950"
                          : "border border-slate-200 bg-amber-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                        {isAdmin ? "Admin" : "Customer"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {message.body}
                      </p>
                      <p className="mt-2 text-[11px] opacity-70">
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={4}
                maxLength={2000}
                disabled={!activeConversation}
                placeholder="Tulis balasan untuk customer..."
                className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-500/20 dark:disabled:bg-slate-900"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {draft.trim().length}/2000 karakter
                </div>
                <button
                  type="submit"
                  disabled={!activeConversation || sending || !draft.trim()}
                  className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                >
                  {sending ? "Mengirim..." : "Kirim balasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ChatInbox;
