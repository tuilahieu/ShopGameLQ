import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import "./foundation.css";
import "./storefront.css";
import "./ui-audit.css";
import "./client-toy.css";
import "./admin-toy.css";

if (window.matchMedia("(pointer: coarse)").matches) {
  const preventPinchZoom = (event) => event.preventDefault();
  const preventMultiTouchZoom = (event) => {
    if (event.touches.length > 1) event.preventDefault();
  };

  document.addEventListener("gesturestart", preventPinchZoom, { passive: false });
  document.addEventListener("gesturechange", preventPinchZoom, { passive: false });
  document.addEventListener("touchmove", preventMultiTouchZoom, { passive: false });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// The HTML shell covers the period before JavaScript is evaluated; React's
// Suspense fallback takes over immediately afterwards for lazy route bundles.
requestAnimationFrame(() => document.getElementById("app-boot-loader")?.remove());
