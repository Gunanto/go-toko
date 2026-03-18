import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useStoreAuth } from "../context/StoreAuthContext";

function StoreHeaderActions({
  cartCount = 0,
  showHome = false,
  showStatus = true,
  showCart = true,
  homeLabel = "Katalog",
  homeTo = "/store",
}) {
  const { isAuthenticated } = useStoreAuth();

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
      {showHome ? (
        <Link
          to={homeTo}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          {homeLabel}
        </Link>
      ) : null}
      {showStatus ? (
        <Link
          to="/store/orders/status"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          Cek Status
        </Link>
      ) : null}
      <Link
        to={
          isAuthenticated
            ? "/store/account"
            : "/store/login?redirect=/store/account"
        }
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
      >
        {isAuthenticated ? "Akun" : "Masuk"}
      </Link>
      {showCart ? (
        <Link
          to="/store/cart"
          className="rounded-full bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          Keranjang {cartCount > 0 ? `(${cartCount})` : ""}
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
  homeLabel: PropTypes.string,
  homeTo: PropTypes.string,
};

export default StoreHeaderActions;
