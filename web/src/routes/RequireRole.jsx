import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RequireRole({ role, fallbackTo = "/dashboard", children }) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role !== role) {
    return <Navigate to={fallbackTo} replace />;
  }

  return children;
}

RequireRole.propTypes = {
  role: PropTypes.string.isRequired,
  fallbackTo: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default RequireRole;
