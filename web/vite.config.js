import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL(".", import.meta.url));
  const env = loadEnv(mode, rootDir, "");

  return {
    plugins: [react()],
    cacheDir: "/tmp/go-toko-vite",
    server: {
      proxy: {
        "/v1": {
          target: env.VITE_PROXY_TARGET || "http://app-dev:8082",
          changeOrigin: true,
        },
      },
    },
  };
});
