import { useEffect, useState } from "react";

export default function NetworkActivity() {
  const [activity, setActivity] = useState({ phase: "idle", cycle: 0 });

  useEffect(() => {
    let showTimer;
    let hideTimer;
    let completionTimer;
    let shownAt = 0;
    let isCompleting = false;

    const update = (event) => {
      if (event.detail > 0) {
        window.clearTimeout(hideTimer);
        window.clearTimeout(completionTimer);

        if (isCompleting) {
          isCompleting = false;
          shownAt = Date.now();
          setActivity((current) => ({ phase: "loading", cycle: current.cycle + 1 }));
          return;
        }

        if (!shownAt && !showTimer) {
          showTimer = window.setTimeout(() => {
            showTimer = undefined;
            shownAt = Date.now();
            setActivity((current) => ({ phase: "loading", cycle: current.cycle + 1 }));
          }, 200);
        }
      } else {
        window.clearTimeout(showTimer);
        showTimer = undefined;
        if (!shownAt) return;
        hideTimer = window.setTimeout(() => {
          isCompleting = true;
          setActivity((current) => ({ ...current, phase: "complete" }));
          completionTimer = window.setTimeout(() => {
            shownAt = 0;
            isCompleting = false;
            setActivity((current) => ({ ...current, phase: "idle" }));
          }, 180);
        }, Math.max(0, 300 - (Date.now() - shownAt)));
      }
    };

    window.addEventListener("api-activity", update);
    return () => {
      window.removeEventListener("api-activity", update);
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(completionTimer);
    };
  }, []);

  if (activity.phase === "idle") return null;

  return (
    <div
      key={activity.cycle}
      className={`network-activity${activity.phase === "complete" ? " is-complete" : ""}`}
      role="status"
      aria-label={activity.phase === "complete" ? "Đã tải xong" : "Đang xử lý yêu cầu"}
    />
  );
}
