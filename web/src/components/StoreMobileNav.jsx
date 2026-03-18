import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getCartCount } from "../lib/storeCart";

const navItems = [
  {
    to: "/store",
    label: "Toko",
    match: (pathname) => pathname === "/" || pathname === "/store",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current">
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
    ),
  },
  {
    to: "/store/cart",
    label: "Cart",
    match: (pathname) => pathname.startsWith("/store/cart"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current">
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
    ),
  },
  {
    to: "/store/orders/status",
    label: "Status",
    match: (pathname) => pathname.startsWith("/store/orders/status"),
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current">
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
    ),
  },
];

function StoreMobileNav() {
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => setCartCount(getCartCount());
    sync();
    window.addEventListener("store-cart-updated", sync);
    return () => window.removeEventListener("store-cart-updated", sync);
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur-xl sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 rounded-[1.4rem] bg-slate-100/90 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/store"}
            className={({ isActive }) => {
              const active = isActive || item.match(location.pathname);
              return `flex flex-col items-center gap-1 rounded-[1rem] px-3 py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)]"
                  : "text-slate-500"
              }`;
            }}
          >
            <span className="relative">
              {item.icon}
              {item.to === "/store/cart" && cartCount > 0 ? (
                <span className="absolute -right-2 -top-2 min-w-[1.1rem] rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-bold leading-none text-slate-950">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default StoreMobileNav;
