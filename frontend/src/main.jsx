import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import "./foundation.css";
import "./storefront.css";
import "./ui-audit.css";
import "./client-toy.css";
import "./admin-toy.css";

const maxTouchPoints = navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0;
const hasTouchInput = "ontouchstart" in window || maxTouchPoints > 0;

if (hasTouchInput) {
  const preventZoomGesture = (event) => {
    if (event.cancelable) event.preventDefault();
  };
  const preventMultiTouchZoom = (event) => {
    if (event.touches?.length > 1 && event.cancelable) event.preventDefault();
  };
  let lastTouchEnd = 0;
  const preventDoubleTapZoom = (event) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300 && event.cancelable) event.preventDefault();
    lastTouchEnd = now;
  };

  document.addEventListener("touchstart", preventMultiTouchZoom, { passive: false });
  document.addEventListener("touchmove", preventMultiTouchZoom, { passive: false });
  document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });
  document.addEventListener("gesturestart", preventZoomGesture, { passive: false });
  document.addEventListener("gesturechange", preventZoomGesture, { passive: false });
  document.addEventListener("gestureend", preventZoomGesture, { passive: false });
  document.addEventListener("dblclick", preventZoomGesture, { passive: false });
}

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
