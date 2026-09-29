// Shared plumbing for the Easter eggs: a fixed overlay layer, the emoji
// burst, and the toast. Everything here is created on demand, so a visitor
// who never finds an egg pays for nothing but this module.

// The global reduced-motion CSS only neuters CSS animations; rAF loops and
// element.animate() ignore it. Every moving egg checks this instead (the
// no-flash script in Base sets .js-anim only when motion is allowed).
export const motionOK = () =>
  document.documentElement.classList.contains("js-anim");

export const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const pick = <T>(xs: readonly T[]): T =>
  xs[Math.floor(Math.random() * xs.length)];

let layer: HTMLElement | undefined;

// One fixed, click-through layer for particles, Cam and the magpie.
export function eggLayer(): HTMLElement {
  if (!layer || !layer.isConnected) {
    layer = document.createElement("div");
    layer.className = "egg-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.append(layer);
  }
  return layer;
}

// ---- emoji burst ----

export interface BurstOptions {
  count?: number;
  speed?: number; // initial speed, px per 60fps frame
  gravity?: number; // px per frame², negative floats upward
  spin?: number; // max degrees per frame
  life?: number; // ms
}

const LIVE_CAP = 120;
let live = 0;

export function burst(
  x: number,
  y: number,
  emoji: readonly string[],
  opts: BurstOptions = {},
) {
  const { count = 14, speed = 11, gravity = 0.45, spin = 9, life = 1500 } =
    opts;
  const root = eggLayer();
  const moving = motionOK();
  const n = Math.min(moving ? count : 1, LIVE_CAP - live);

  for (let i = 0; i < n; i++) {
    const el = document.createElement("span");
    el.className = "egg-particle";
    el.textContent = pick(emoji);
    root.append(el);
    live++;

    // fan upward: -90° ± 60°
    const angle = ((-90 + rand(-60, 60)) * Math.PI) / 180;
    const v = moving ? rand(speed * 0.55, speed) : 0;
    let px = x;
    let py = y;
    let vx = Math.cos(angle) * v;
    let vy = Math.sin(angle) * v;
    let rot = rand(-20, 20);
    const vr = moving ? rand(-spin, spin) : 0;
    const scale = rand(0.8, 1.3);
    const born = performance.now();
    let last = born;

    const step = (now: number) => {
      const age = now - born;
      const dt = Math.min((now - last) / 16.667, 3);
      last = now;
      vy += gravity * dt;
      px += vx * dt;
      py += vy * dt;
      rot += vr * dt;
      const fade = Math.min(1, (life - age) / 350);
      el.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
      el.style.opacity = String(Math.max(0, fade));
      if (age < life && py < innerHeight + 80 && py > -120) {
        requestAnimationFrame(step);
      } else {
        el.remove();
        live--;
      }
    };
    requestAnimationFrame(step);
  }
}

// ---- toast ----

let toastEl: HTMLElement | undefined;
let toastTimer: number | undefined;

export function toast(message: string, ms = 2800) {
  if (!toastEl || !toastEl.isConnected) {
    toastEl = document.createElement("div");
    toastEl.className = "egg-toast";
    toastEl.setAttribute("role", "status");
    document.body.append(toastEl);
  }
  const el = toastEl;
  el.textContent = message;
  el.classList.remove("show");
  void el.offsetWidth; // restart the slide-in when toasts stack up
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove("show"), ms);
}

// ---- tiny persisted counters (per browser; storage can throw) ----

export function bump(key: string): number {
  try {
    const n = Number(localStorage.getItem(key) ?? 0) + 1;
    localStorage.setItem(key, String(n));
    return n;
  } catch {
    return 1;
  }
}

export function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — fine, it just won't remember */
  }
}
