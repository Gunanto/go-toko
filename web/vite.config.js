import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: "/tmp/go-toko-vite",
  server: {
    proxy: {
      "/v1": {
        target: process.env.VITE_PROXY_TARGET || "http://app:8082",
        changeOrigin: true,
      },
    },
  },
});
