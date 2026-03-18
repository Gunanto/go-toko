import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchStoreAuthOptions,
  fetchStoreCustomerMe,
  getStoreGoogleAuthStartUrl,
  loginStoreCustomer,
  registerStoreCustomer,
} from "../lib/api";

const StoreAuthContext = createContext(null);
const storageKey = "go_toko_store_token";

export function StoreAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(storageKey));
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const isAuthenticated = Boolean(token);

  const login = async (login, password) => {
    setLoading(true);
    try {
      const response = await loginStoreCustomer(login, password);
      const accessToken = response?.data?.token;
      if (!accessToken) {
        throw new Error("Token customer tidak ditemukan");
      }
      localStorage.setItem(storageKey, accessToken);
      setToken(accessToken);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const response = await registerStoreCustomer(payload);
      const accessToken = response?.data?.token;
      if (!accessToken) {
        throw new Error("Token customer tidak ditemukan");
      }
      localStorage.setItem(storageKey, accessToken);
      setToken(accessToken);
      setCustomer(response?.data?.customer ?? null);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(storageKey);
    setToken(null);
    setCustomer(null);
  };

  const consumeToken = (accessToken) => {
    localStorage.setItem(storageKey, accessToken);
    setToken(accessToken);
  };

  useEffect(() => {
    let isMounted = true;
    fetchStoreAuthOptions()
      .then((response) => {
        if (!isMounted) return;
        setGoogleEnabled(Boolean(response?.data?.google_enabled));
      })
      .catch(() => {
        if (!isMounted) return;
        setGoogleEnabled(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!token) {
      setCustomer(null);
      return () => {
        isMounted = false;
      };
    }

    fetchStoreCustomerMe(token)
      .then((response) => {
        if (!isMounted) return;
        setCustomer(response?.data ?? null);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem(storageKey);
          setToken(null);
        }
        setCustomer(null);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      customer,
      isAuthenticated,
      loading,
      googleEnabled,
      login,
      register,
      logout,
      consumeToken,
      getGoogleLoginUrl: (redirect) => getStoreGoogleAuthStartUrl(redirect),
    }),
    [token, customer, isAuthenticated, loading, googleEnabled],
  );

  return (
    <StoreAuthContext.Provider value={value}>
      {children}
    </StoreAuthContext.Provider>
  );
}

StoreAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreAuth() {
  const ctx = useContext(StoreAuthContext);
  if (!ctx) {
    throw new Error("useStoreAuth must be used within StoreAuthProvider");
  }
  return ctx;
}
