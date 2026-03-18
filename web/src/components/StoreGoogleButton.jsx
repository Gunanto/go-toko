import PropTypes from "prop-types";
import { useStoreAuth } from "../context/StoreAuthContext";

function StoreGoogleButton({ redirect = "/store/account", className = "" }) {
  const { googleEnabled, getGoogleLoginUrl } = useStoreAuth();

  if (!googleEnabled) {
    return null;
  }

  return (
    <a
      href={getGoogleLoginUrl(redirect)}
      className={className}
    >
      Lanjutkan dengan Google
    </a>
  );
}

StoreGoogleButton.propTypes = {
  redirect: PropTypes.string,
  className: PropTypes.string,
};

export default StoreGoogleButton;
