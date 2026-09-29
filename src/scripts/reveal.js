// reveal.js — coordinated entrance animation via IntersectionObserver.
// Adds .is-visible once, then stops observing (no re-trigger on scroll
// back up, matching a one-time "premium" entrance rather than a bouncy
// scrubber).

export function initReveal(selector = "[data-reveal]", { rootMargin = "0px 0px -10% 0px", threshold = 0.15 } = {}) {
  const els = Array.from(document.querySelectorAll(selector));
  if (!els.length) return;

  if (typeof IntersectionObserver === "undefined") {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin, threshold }
  );

  els.forEach((el) => observer.observe(el));
}
