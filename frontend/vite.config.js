import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      allowedHosts: ["competition-interpreted-meet-see.trycloudflare.com"],
      proxy: {
        "/api": {
          target: env.VITE_DEV_API_TARGET || "http://localhost:3000",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.VITE_DEV_API_TARGET || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
