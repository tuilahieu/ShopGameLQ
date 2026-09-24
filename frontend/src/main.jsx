import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import "./foundation.css";
import "./storefront.css";
import "./ui-audit.css";
import "./client-toy.css";
import "./admin-toy.css";
import "./admin-ui.css";

const syncFormFocusState = () => {
  const activeElement = document.activeElement;
  document.body.classList.toggle(
    "has-form-focus",
    Boolean(activeElement?.matches?.("input, textarea, select")),
  );
};
document.addEventListener("focusin", syncFormFocusState);
document.addEventListener("focusout", () => window.setTimeout(syncFormFocusState, 0));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The HTML shell covers the period before JavaScript is evaluated; React's
// Suspense fallback takes over immediately afterwards for lazy route bundles.
requestAnimationFrame(() => document.getElementById("app-boot-loader")?.remove());
