import { useCallback, useRef, useState } from "react";

export default function useTurnstileCaptcha() {
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaResetRef = useRef(null);
  const captchaEnabled = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const onCaptchaToken = useCallback((token) => setCaptchaToken(token), []);
  const resetCaptcha = useCallback(() => captchaResetRef.current?.(), []);

  return {
    captchaToken,
    captchaResetRef,
    captchaEnabled,
    onCaptchaToken,
    resetCaptcha,
  };
}
