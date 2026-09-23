import { useEffect, useState } from "react";

export default function NetworkActivity() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer;
    let hideTimer;
    let shownAt = 0;

    const update = (event) => {
      if (event.detail > 0) {
        window.clearTimeout(hideTimer);
        if (!shownAt && !showTimer) {
          showTimer = window.setTimeout(() => {
            showTimer = undefined;
            shownAt = Date.now();
            setVisible(true);
          }, 200);
        }
      } else {
        window.clearTimeout(showTimer);
        showTimer = undefined;
        if (!shownAt) return;
        hideTimer = window.setTimeout(() => {
          shownAt = 0;
          setVisible(false);
        }, Math.max(0, 300 - (Date.now() - shownAt)));
      }
    };

    window.addEventListener("api-activity", update);
    return () => {
      window.removeEventListener("api-activity", update);
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return visible ? <div className="network-activity" role="status" aria-label="Đang xử lý yêu cầu" /> : null;
}
