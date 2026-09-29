// Magpie season (Aug–Nov in Perth): every so often while you scroll, a
// magpie swoops across the screen. Catching one is the hardest egg on the
// site. At most three flights per page view, none under reduced motion.
import { bump, eggLayer, motionOK, rand, toast } from "./fx";
import type { PerthDate } from "./perth";

// Australian magpie, side-on, facing right: black body, white nape and
// shoulder, pale blue-grey beak with a dark tip, red-brown eye.
export const MAGPIE_SVG = `<svg viewBox="0 0 64 44" aria-hidden="true">
  <path d="M16 22 L3 18 L2 27 L16 27 Z" fill="#111"/>
  <path d="M16 21.6 L10 20.2 L10 27 L16 27 Z" fill="#f4f1ea"/>
  <ellipse cx="29" cy="25" rx="15" ry="8" fill="#111"/>
  <path d="M34 18 Q39 13 44 16 L42 23 Q37 22 34 18 Z" fill="#f4f1ea"/>
  <circle cx="47" cy="19" r="7" fill="#111"/>
  <path d="M52 17.2 L62.5 20 L52 22.8 Z" fill="#c9d3da"/>
  <path d="M59 19.2 L62.5 20 L59 20.8 Z" fill="#111"/>
  <circle cx="48.6" cy="17.4" r="1.4" fill="#9a3a22"/>
  <g class="wing">
    <path d="M36 23 L22 3 L15 6 L26 25 Z" fill="#111"/>
    <path d="M35 23 L29 13 L25 15 L30 24 Z" fill="#f4f1ea"/>
  </g>
</svg>`;

const SEASON = [8, 9, 10, 11];
const MAX_FLIGHTS = 3;

export function initMagpies(today: PerthDate) {
  if (!SEASON.includes(today.month) || !motionOK()) return;

  // previewing with ?eggdate= shouldn't mean waiting around for a bird
  let nextAt = performance.now() + (today.overridden ? 1500 : rand(8000, 20000));
  let flying = false;
  let flights = 0;

  addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      if (flying || flights >= MAX_FLIGHTS || now < nextAt || document.hidden)
        return;
      flying = true;
      flights++;
      swoop().then(() => {
        flying = false;
        nextAt = performance.now() + rand(35000, 80000);
      });
    },
    { passive: true },
  );
}

function swoop(): Promise<void> {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "egg-magpie";
    el.innerHTML = MAGPIE_SVG;
    eggLayer().append(el);

    // quadratic Bézier from one side to the other, dipping to ~60% height
    const W = innerWidth;
    const H = innerHeight;
    const ltr = Math.random() < 0.5;
    const p0 = { x: ltr ? -90 : W + 90, y: rand(0.05, 0.25) * H };
    const p1 = { x: W * rand(0.35, 0.65), y: H * rand(1, 1.25) };
    const p2 = { x: ltr ? W + 90 : -90, y: rand(0.05, 0.3) * H };
    const dur = Math.min(2600, Math.max(1500, 1100 + W * 0.6));
    const flip = ltr ? 1 : -1;

    let x = p0.x;
    let y = p0.y;
    let tilt = 0;
    let caught = false;
    const t0 = performance.now();

    const place = () =>
      `translate(${x}px, ${y}px) translate(-50%, -50%) scaleX(${flip}) rotate(${tilt}deg)`;

    const step = (now: number) => {
      if (caught) return;
      const t = Math.min(1, (now - t0) / dur);
      const u = 1 - t;
      x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
      y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
      // nose follows the curve (as if flying right; the mirror handles left)
      const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
      const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
      tilt = Math.max(-40, Math.min(40, (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI));
      el.style.transform = place();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        el.remove();
        resolve();
      }
    };
    requestAnimationFrame(step);

    el.addEventListener(
      "pointerdown",
      (e) => {
        e.preventDefault();
        caught = true;
        const n = bump("fctc-magpies");
        toast(
          n === 1
            ? "You caught a magpie. Cable ties optional."
            : `Magpies caught: ${n}. They're taking notes.`,
        );
        // indignant exit, straight up
        el.animate(
          [
            { transform: place() },
            {
              transform: `translate(${x}px, ${-160}px) translate(-50%, -50%) scaleX(${flip}) rotate(-70deg)`,
            },
          ],
          { duration: 650, easing: "cubic-bezier(0.5, 0, 0.9, 0.5)", fill: "forwards" },
        ).finished.then(() => {
          el.remove();
          resolve();
        });
      },
      { once: true },
    );
  });
}
