// copy.js — click-to-copy with visible feedback. DOM-only module.

/**
 * @param {string} text
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wires a copy button: reads the value from `data-copy-value`, copies it
 * on click, and flips visible feedback for `feedbackMs`. No-ops for
 * disabled buttons (inert records never get a working copy action).
 * @param {HTMLElement} button
 * @param {number} feedbackMs
 */
export function initCopyButton(button, feedbackMs = 1600) {
  if (!button || button.hasAttribute("disabled")) return;
  const value = button.getAttribute("data-copy-value");
  if (!value) return;

  let resetTimer = null;
  button.addEventListener("click", async () => {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    button.setAttribute("data-copied", "true");
    const label = button.querySelector("[data-copy-label]");
    const prevText = label ? label.textContent : null;
    if (label) label.textContent = "Copied";
    button.setAttribute("aria-live", "polite");
    button.dispatchEvent(new CustomEvent("autonomous:copied", { bubbles: true, detail: { value } }));
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      button.removeAttribute("data-copied");
      if (label && prevText !== null) label.textContent = prevText;
    }, feedbackMs);
  });
}

export function initAllCopyButtons(selector = "[data-copy-value]") {
  document.querySelectorAll(selector).forEach((btn) => initCopyButton(btn));
}
