// toast.js — small enter/exit notification, matching the motion language
// used elsewhere (transform + opacity, instant under reduced motion).
// DOM-only module.

let root = null;

function getRoot() {
  if (root && document.body.contains(root)) return root;
  root = document.createElement("div");
  root.className = "toast-root";
  root.setAttribute("aria-live", "polite");
  root.setAttribute("aria-atomic", "true");
  document.body.appendChild(root);
  return root;
}

/**
 * @param {string} message
 * @param {{ duration?: number }} [options]
 */
export function showToast(message, { duration = 2400 } = {}) {
  const container = getRoot();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  container.appendChild(el);

  // Force a layout flush so the enter transition actually plays.
  void el.offsetWidth;
  el.classList.add("is-visible");

  const dismiss = () => {
    el.classList.remove("is-visible");
    el.classList.add("is-leaving");
    el.addEventListener(
      "transitionend",
      () => {
        el.remove();
      },
      { once: true }
    );
    // Fallback removal in case transitionend never fires (e.g. display:none ancestor).
    setTimeout(() => el.remove(), 1000);
  };

  setTimeout(dismiss, duration);
}
