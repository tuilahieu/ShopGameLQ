let initialized = false;

function syncFormFocusState() {
  const activeElement = document.activeElement;
  document.body.classList.toggle(
    "has-form-focus",
    Boolean(activeElement?.matches?.("input, textarea, select")),
  );
}

export function initializeBrowserBehavior() {
  if (initialized || typeof document === "undefined") return;
  initialized = true;

  document.addEventListener("focusin", syncFormFocusState);
  document.addEventListener("focusout", () => window.setTimeout(syncFormFocusState, 0));
  // Enable instantaneous :active tactile response across mobile and WebKit browsers
  document.addEventListener("touchstart", () => {}, { passive: true });

  // Keep the mobile storefront at its authored 100% scale. Safari may still
  // emit proprietary pinch events even when the viewport meta is locked.
  const isMobileViewport = () => window.matchMedia("(max-width: 48rem)").matches;
  document.addEventListener("gesturestart", (event) => {
    if (isMobileViewport()) event.preventDefault();
  }, { passive: false });
  document.addEventListener("gesturechange", (event) => {
    if (isMobileViewport()) event.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", (event) => {
    if (isMobileViewport() && event.touches.length > 1) event.preventDefault();
  }, { passive: false });

  // Guarantee visible sunken tactile press on macOS trackpad taps & rapid mobile clicks
  let activePressedTarget = null;
  let pressedTimer = null;
  let pressStartTime = 0;

  function clearPressedState() {
    if (activePressedTarget) {
      activePressedTarget.classList.remove("is-pressed");
      activePressedTarget.removeAttribute("data-pressed");
      activePressedTarget = null;
    }
    if (pressedTimer) {
      window.clearTimeout(pressedTimer);
      pressedTimer = null;
    }
  }

  document.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const btn = event.target?.closest?.("button, .btn-primary, .btn-outline, .btn-secondary, a.btn-primary, a.btn-outline");
    if (!btn || btn.disabled) return;

    clearPressedState();
    activePressedTarget = btn;
    pressStartTime = Date.now();
    btn.classList.add("is-pressed");
    btn.setAttribute("data-pressed", "true");
  }, { passive: true });

  document.addEventListener("pointerup", () => {
    if (!activePressedTarget) return;
    const target = activePressedTarget;
    const elapsed = Date.now() - pressStartTime;
    const remaining = Math.max(0, 140 - elapsed);

    if (remaining === 0) {
      clearPressedState();
    } else {
      pressedTimer = window.setTimeout(() => {
        target.classList.remove("is-pressed");
        target.removeAttribute("data-pressed");
        if (activePressedTarget === target) {
          activePressedTarget = null;
        }
      }, remaining);
    }
  }, { passive: true });

  document.addEventListener("pointercancel", clearPressedState, { passive: true });
}
