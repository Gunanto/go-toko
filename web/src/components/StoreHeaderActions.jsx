import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStoreAuth } from "../context/StoreAuthContext";
import { useTheme } from "../context/ThemeContext";
import { getStoreChat } from "../lib/api";

function StoreHeaderActions({
  cartCount = 0,
  showHome = false,
  showStatus = true,
  showCart = true,
  showChat = true,
  homeLabel = "Katalog",
  homeTo = "/store",
}) {
  const { isAuthenticated, token, logout } = useStoreAuth();
  const { theme, toggleTheme } = useTheme();
  const [now, setNow] = useState(() => new Date());
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const visibleChatUnreadCount =
    isAuthenticated && showChat ? chatUnreadCount : 0;

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token || !showChat) return undefined;

    let cancelled = false;

    const loadUnread = async () => {
      try {
        const response = await getStoreChat({ token });
        if (cancelled) return;
        setChatUnreadCount(Number(response?.data?.customer_unread_count || 0));
      } catch (error) {
        if (cancelled) return;
        if (error?.status === 401 || error?.status === 403) {
          logout();
        }
      }
    };

    loadUnread();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadUnread();
      }
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, logout, showChat, token]);

  const dayDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return (
    <div className="grid w-full grid-cols-[auto,1fr,auto,auto,auto,auto] items-center gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
        aria-label={
          theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap"
        }
      >
        <span className="flex items-center justify-center gap-2">
          <span aria-hidden="true" className="inline-flex h-4 w-4 items-center">
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 stroke-current"
              >
                <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
                <path
                  d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 stroke-current"
              >
                <path
                  d="M20.5 14.25A8.25 8.25 0 1 1 9.75 3.5a6.75 6.75 0 0 0 10.75 10.75Z"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="hidden sm:inline">
            {theme === "dark" ? "Terang" : "Gelap"}
          </span>
        </span>
      </button>
      <div className="min-w-0 rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900 sm:px-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 sm:text-[11px] sm:tracking-[0.2em]">
          {dayDate}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {time}
        </p>
      </div>
      {showHome ? (
        <Link
          to={homeTo}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
          aria-label={homeLabel}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 stroke-current"
            >
              <path
                d="M3 10.5 12 3l9 7.5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.25 9.75v9.75h13.5V9.75"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">{homeLabel}</span>
          </span>
        </Link>
      ) : null}
      {showStatus ? (
        <Link
          to="/store/orders/status"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
          aria-label="Cek Status"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 stroke-current"
            >
              <path
                d="M12 6v6l3.75 2.25"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="8.25"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Cek Status</span>
          </span>
        </Link>
      ) : null}
      {showChat ? (
        <Link
          to={
            isAuthenticated
              ? "/store/chat"
              : "/store/login?redirect=/store/chat"
          }
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
          aria-label="Chat toko"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 stroke-current"
              >
                <path
                  d="M6.75 7.5A2.25 2.25 0 0 1 9 5.25h6A2.25 2.25 0 0 1 17.25 7.5v4.125A2.25 2.25 0 0 1 15 13.875h-3.31L8.25 16.5v-2.625A2.25 2.25 0 0 1 6 11.625V7.5h.75Z"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {visibleChatUnreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-amber-300 px-1 py-0.5 text-[9px] font-bold leading-none text-slate-950 sm:hidden">
                  {visibleChatUnreadCount > 99 ? "99+" : visibleChatUnreadCount}
                </span>
              ) : null}
            </span>
            <span className="hidden sm:inline">
              Chat{" "}
              {visibleChatUnreadCount > 0 ? `(${visibleChatUnreadCount})` : ""}
            </span>
          </span>
        </Link>
      ) : null}
      <Link
        to={
          isAuthenticated
            ? "/store/account"
            : "/store/login?redirect=/store/account"
        }
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
        aria-label={isAuthenticated ? "Akun" : "Masuk"}
      >
        <span className="inline-flex items-center justify-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-4 w-4 stroke-current"
          >
            <path
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2.25c-3.451 0-6.25 1.959-6.25 4.375V20h12.5v-1.375c0-2.416-2.799-4.375-6.25-4.375Z"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">
            {isAuthenticated ? "Akun" : "Masuk"}
          </span>
        </span>
      </Link>
      {showCart ? (
        <Link
          to="/store/cart"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-sky-500 dark:text-slate-950 sm:h-auto sm:w-auto sm:px-4 sm:py-2"
          aria-label={cartCount > 0 ? `Keranjang (${cartCount})` : "Keranjang"}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 stroke-current"
              >
                <path
                  d="M3.75 5.25h1.5l1.5 9h10.5l1.5-6.75H6.375"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9.25"
                  cy="18.25"
                  r="1.25"
                  fill="currentColor"
                  stroke="none"
                />
                <circle
                  cx="16.75"
                  cy="18.25"
                  r="1.25"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              {cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 min-w-[1rem] rounded-full bg-amber-300 px-1 py-0.5 text-[9px] font-bold leading-none text-slate-950 dark:bg-slate-950 dark:text-sky-300 sm:hidden">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </span>
            <span className="hidden sm:inline">
              Keranjang {cartCount > 0 ? `(${cartCount})` : ""}
            </span>
          </span>
        </Link>
      ) : null}
    </div>
  );
}

StoreHeaderActions.propTypes = {
  cartCount: PropTypes.number,
  showHome: PropTypes.bool,
  showStatus: PropTypes.bool,
  showCart: PropTypes.bool,
  showChat: PropTypes.bool,
  homeLabel: PropTypes.string,
  homeTo: PropTypes.string,
};

export default StoreHeaderActions;
