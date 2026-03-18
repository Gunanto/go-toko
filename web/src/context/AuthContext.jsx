import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchMe, login as loginApi, registerUser } from "../lib/api";

const AuthContext = createContext(null);

const storageKey = "go_toko_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await loginApi(username, password);
      const accessToken = response?.data?.token;
      if (!accessToken) {
        throw new Error("Token tidak ditemukan");
      }
      localStorage.setItem(storageKey, accessToken);
      setToken(accessToken);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, username, email, password) => {
    setLoading(true);
    try {
      return await registerUser(name, username, email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setUser(null);
      return () => {
        isMounted = false;
      };
    }

    fetchMe(token)
      .then((profile) => {
        if (!isMounted) return;
        setUser(profile?.data ?? null);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem(storageKey);
          setToken(null);
          setUser(null);
        } else {
          setUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
    }),
    [token, user, isAuthenticated, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
