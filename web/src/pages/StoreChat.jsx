import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import logoCommerce from "../assets/logo-gezy-commerce-transparent.png";
import StoreHeaderActions from "../components/StoreHeaderActions";
import StoreMobileNav from "../components/StoreMobileNav";
import { useStoreAuth } from "../context/StoreAuthContext";
import {
  getStoreChat,
  listStoreChatMessages,
  markStoreChatRead,
  sendStoreChatMessage,
} from "../lib/api";
import { getCartCount } from "../lib/storeCart";

function StoreChat() {
  const { token, customer, isAuthenticated, logout } = useStoreAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(false);

  const formatTime = (value) => {
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

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  };

  useEffect(() => {
    setCartCount(getCartCount());
    const sync = () => setCartCount(getCartCount());
    window.addEventListener("store-cart-updated", sync);
    return () => window.removeEventListener("store-cart-updated", sync);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined;

    let cancelled = false;

    const loadConversation = async (silent = false) => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      if (!silent) {
        setLoading(true);
      }

      try {
        const [conversationResponse, messagesResponse] = await Promise.all([
          getStoreChat({ token }),
          listStoreChatMessages({ token, skip: 0, limit: 100 }),
        ]);
        if (cancelled) return;

        const nextConversation = conversationResponse?.data ?? null;
        const nextMessages = messagesResponse?.data?.messages || [];
        setConversation(nextConversation);
        setMessages(nextMessages);
        setError("");

        if ((nextConversation?.customer_unread_count || 0) > 0) {
          markStoreChatRead({ token }).catch(() => {});
          setConversation((current) =>
            current ? { ...current, customer_unread_count: 0 } : current,
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
        setError(fetchError?.message || "Chat belum bisa dimuat.");
      } finally {
        pollingRef.current = false;
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConversation();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadConversation(true);
      }
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadConversation(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, logout, token]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!draft.trim() || sending) return;

    setSending(true);
    try {
      const response = await sendStoreChatMessage(draft, { token });
      const created = response?.data;
      if (created) {
        setMessages((current) => [...current, created]);
        setConversation((current) =>
          current
            ? {
                ...current,
                last_message_at: created.created_at,
                last_message_preview: created.body,
                customer_unread_count: 0,
              }
            : current,
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
      setError(sendError?.message || "Pesan gagal dikirim.");
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/store/login?redirect=/store/chat" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe,_transparent_20%),radial-gradient(circle_at_top_right,_#fde68a,_transparent_24%),linear-gradient(180deg,_#fffef9_0%,_#f8fafc_48%,_#eef2ff_100%)] pb-28 text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] dark:text-slate-100 lg:pb-10">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logoCommerce}
              alt="GEZY Commerce"
              className="h-10 w-auto object-contain sm:h-11"
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
                Store Chat
              </p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                Komunikasi cepat dengan admin toko
              </p>
            </div>
          </div>
          <StoreHeaderActions cartCount={cartCount} showHome />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Halo {customer?.name || "Pelanggan"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              Tanyakan stok, pengiriman, atau kendala order langsung ke admin.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              MVP chat ini masih berbasis polling. Pesan baru akan muncul
              otomatis tiap beberapa detik saat tab aktif.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
                  Status Percakapan
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {conversation?.status || "open"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">
                  Balasan Belum Dibaca
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {conversation?.customer_unread_count || 0}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
              <p>Tips cepat:</p>
              <ul className="mt-3 space-y-2">
                <li>Sebutkan nama produk atau kebutuhanmu langsung.</li>
                <li>
                  Gunakan satu pesan singkat per pertanyaan agar mudah dibalas.
                </li>
                <li>
                  Untuk cek order, kamu juga bisa buka halaman status pesanan.
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-soft-xl dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
                  Percakapan Aktif
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
                  Chat dengan admin toko
                </h2>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p>Pesan: {messages.length}</p>
                <p>
                  Update terakhir: {formatTime(conversation?.last_message_at)}
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-[linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-4 py-5 dark:bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] sm:px-6">
              {loading ? (
                <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  Memuat percakapan...
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 && !loading ? (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    Belum ada pesan. Mulai percakapanmu dengan admin toko.
                  </div>
                ) : null}

                {messages.map((message) => {
                  const isCustomer = message.sender_type === "customer";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isCustomer ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 shadow-sm ${
                          isCustomer
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-sky-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                          {isCustomer ? "Anda" : "Admin"}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {message.body}
                        </p>
                        <p className="mt-2 text-[11px] opacity-70">
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800"
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Tulis pesan ke admin toko..."
                  className="w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/20"
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {draft.trim().length}/2000 karakter
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/store/orders/status"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cek order
                    </Link>
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-cyan-600 dark:disabled:bg-slate-700"
                    >
                      {sending ? "Mengirim..." : "Kirim"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <StoreMobileNav />
    </div>
  );
}

export default StoreChat;
