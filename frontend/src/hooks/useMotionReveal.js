import { useEffect } from "react";

const REVEAL_SELECTOR = [
  "section",
  ".account-card-premium",
  ".catalogue-category-card",
  ".order-card-item",
  ".support-card",
  ".terms-policy",
  ".ui-stat-card",
].join(",");

export default function useMotionReveal(containerRef, routeKey) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const observed = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -7%", threshold: 0.06 });

    function register(root) {
      const nodes = [];
      if (root instanceof Element && root.matches(REVEAL_SELECTOR)) nodes.push(root);
      root.querySelectorAll?.(REVEAL_SELECTOR).forEach((node) => nodes.push(node));
      nodes.forEach((node, index) => {
        if (observed.has(node)) return;
        observed.add(node);
        node.classList.add("ui-reveal");
        node.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 38}ms`);
        observer.observe(node);
      });
    }

    register(container);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) register(node);
      }));
    });
    mutations.observe(container, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [containerRef, routeKey]);
}
