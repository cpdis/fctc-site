// ↑ ↑ ↓ ↓ ← → ← → B A — Kazuhisa Hashimoto's code from the 1986 Famicom
// Gradius. Phones have no arrow keys, so swipes stand in for the arrows and
// two taps for B A.
const CODE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

export function onKonami(fire: () => void) {
  let i = 0;
  // the game uses the same keys; don't re-fire from inside it
  const busy = () => !!document.querySelector(".egg-game");

  const feed = (key: string) => {
    if (busy()) return;
    if (key === CODE[i]) {
      if (++i === CODE.length) {
        i = 0;
        fire();
      }
    } else {
      // a third ↑ still leaves you two ↑s in
      i = key === CODE[0] ? (i === 2 ? 2 : 1) : 0;
    }
  };

  addEventListener("keydown", (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as Element | null;
    if (t?.closest?.("input, textarea, select, [contenteditable]")) return;
    feed(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });

  // Observe-only touch listeners: nothing is prevented, so scrolling works.
  let sx = 0;
  let sy = 0;
  let st = 0;
  let multi = false;
  addEventListener(
    "touchstart",
    (e) => {
      multi = e.touches.length > 1;
      const t = e.touches[0];
      sx = t.clientX;
      sy = t.clientY;
      st = performance.now();
    },
    { passive: true },
  );
  addEventListener(
    "touchend",
    (e) => {
      if (multi || e.touches.length) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const dt = performance.now() - st;
      if (Math.max(ax, ay) >= 40 && dt < 700) {
        feed(
          ax > ay
            ? dx > 0 ? "ArrowRight" : "ArrowLeft"
            : dy > 0 ? "ArrowDown" : "ArrowUp",
        );
      } else if (ax < 12 && ay < 12 && dt < 350) {
        // taps only count as B and A right after the swipes
        feed(i === 8 ? "b" : i === 9 ? "a" : "tap");
      }
    },
    { passive: true },
  );
}
