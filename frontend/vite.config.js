import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      react(),
      legacy({
        targets: ["Safari >= 12", "iOS >= 12", "Chrome >= 64", "Edge >= 79", "Firefox >= 68", "not IE 11"],
      }),
    ],
    build: {
      cssTarget: "safari12",
    },
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
