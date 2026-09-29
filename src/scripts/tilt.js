// tilt.js — subtle pointer-reactive tilt on the hero mark. Transform-only,
// disabled entirely under prefers-reduced-motion, and a no-op if the
// element or PointerEvent support isn't there.

const MAX_DEG = 10;

/**
 * @param {string} selector container the pointer is tracked over
 * @param {string} targetSelector element that receives the rotation
 */
export function initTilt(selector = "[data-tilt]", containerSelector = ".hero-visual") {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.querySelector(selector);
  const container = document.querySelector(containerSelector) || target?.parentElement;
  if (!target || !container || typeof PointerEvent === "undefined") return;

  function onMove(event) {
    const rect = container.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width; // 0..1
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 2 * MAX_DEG;
    const rotateX = (0.5 - py) * 2 * MAX_DEG;
    target.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  }

  function onLeave() {
    target.style.transform = "rotateX(0deg) rotateY(0deg)";
  }

  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
  container.addEventListener("pointercancel", onLeave);

  return () => {
    container.removeEventListener("pointermove", onMove);
    container.removeEventListener("pointerleave", onLeave);
    container.removeEventListener("pointercancel", onLeave);
  };
}
