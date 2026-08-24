import { useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.turnstile), { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/** Cloudflare Turnstile is optional locally and mandatory only when enabled server-side. */
export default function TurnstileCaptcha({ onToken, resetRef }) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!siteKey) {
      onToken(null);
      return undefined;
    }
    let active = true;
    loadTurnstile()
      .then((turnstile) => {
        if (!active || !turnstile || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "auto",
          size: "flexible",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => {
            onToken(null);
            setLoadError("Không thể xác minh captcha. Vui lòng tải lại trang.");
          },
        });
      })
      .catch(() => active && setLoadError("Không tải được captcha. Vui lòng kiểm tra kết nối mạng."));

    return () => {
      active = false;
      if (widgetIdRef.current !== null && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
  }, [siteKey, onToken]);

  useEffect(() => {
    if (!resetRef) return undefined;
    resetRef.current = () => {
      onToken(null);
      if (widgetIdRef.current !== null && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    };
    return () => { resetRef.current = null; };
  }, [onToken, resetRef]);

  if (!siteKey) return null;
  return (
    <div className="captcha-shell">
      <div ref={containerRef} />
      {loadError && <p className="form-hint error">{loadError}</p>}
    </div>
  );
}
