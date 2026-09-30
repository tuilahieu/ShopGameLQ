import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/app/App";
import { initializeBrowserBehavior } from "@/app/bootstrap/browser";
import "@/theme/css/index.css";

initializeBrowserBehavior();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The HTML shell covers the period before JavaScript is evaluated; React's
// Suspense fallback takes over immediately afterwards for lazy route bundles.
requestAnimationFrame(() => document.getElementById("app-boot-loader")?.remove());
