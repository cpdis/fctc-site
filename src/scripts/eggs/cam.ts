// Surprise? → Cam's head on a stick, marathon-sideline style. Rises from a
// screen edge, wobbles on its stick, sinks. Tap five times fast for a crowd.
// The optimized cutout's URL rides on <body data-cam> (set in Base).
import { eggLayer, motionOK, pick, rand } from "./fx";

type Edge = "bottom" | "left" | "right" | "top";
const EDGES: readonly Edge[] = ["bottom", "left", "right", "top"];
// rotation that points the stick in from each edge (head toward the middle)
const BASE: Record<Edge, number> = { bottom: 0, left: 90, right: -90, top: 180 };

const camSrc = () => document.body.dataset.cam;
let loading: Promise<unknown> | undefined;

export function preloadCam() {
  const src = camSrc();
  if (src && !loading) {
    const img = new Image();
    img.src = src;
    loading = img.decode().catch(() => {});
  }
  return loading ?? Promise.resolve();
}

interface PopOptions {
  edge?: Edge;
  at?: number; // position along the edge, px
  delay?: number;
}

export async function popCam({ edge = "bottom", at, delay = 0 }: PopOptions = {}) {
  const src = camSrc();
  if (!src) return;
  // don't pop an empty stick on a slow connection, but don't hang either
  await Promise.race([preloadCam(), new Promise((r) => setTimeout(r, 700))]);

  const el = document.createElement("div");
  el.className = "egg-cam";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  el.append(img, document.createElement("i"));
  el.style.visibility = "hidden";
  eggLayer().append(el);

  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const vertical = edge === "bottom" || edge === "top";
  const span = vertical ? innerWidth : innerHeight;
  const pos = Math.min(
    Math.max(at ?? rand(0.15, 0.85) * span, w / 2 + 8),
    span - w / 2 - 8,
  );
  el.style.left = `${vertical ? pos : edge === "left" ? 0 : innerWidth}px`;
  el.style.top = `${vertical ? (edge === "top" ? 0 : innerHeight) : pos}px`;

  // bottom-centre of the stick sits on the edge; `off` slides it out of view
  // along its own axis, `wob` rocks it on the stick end
  const tf = (off: number, wob: number) =>
    `translate(-50%, -100%) rotate(${BASE[edge]}deg) translateY(${off}px) rotate(${wob}deg)`;
  const gone = h + 24;
  const wobble = "ease-in-out";

  const frames: Keyframe[] = motionOK()
    ? [
        { transform: tf(gone, 0), easing: "cubic-bezier(0.2, 1.5, 0.4, 1)" },
        { transform: tf(0, 0), offset: 0.2, easing: wobble },
        { transform: tf(0, -8), offset: 0.32, easing: wobble },
        { transform: tf(0, 7), offset: 0.44, easing: wobble },
        { transform: tf(0, -4), offset: 0.56, easing: wobble },
        { transform: tf(0, 2), offset: 0.66, easing: wobble },
        { transform: tf(0, 0), offset: 0.8, easing: "cubic-bezier(0.5, 0, 0.8, 0.3)" },
        { transform: tf(gone, 0) },
      ]
    : [
        { transform: tf(0, 0), opacity: 0 },
        { transform: tf(0, 0), opacity: 1, offset: 0.12 },
        { transform: tf(0, 0), opacity: 1, offset: 0.88 },
        { transform: tf(0, 0), opacity: 0 },
      ];

  el.style.visibility = "";
  const anim = el.animate(frames, { duration: 2800, delay, fill: "both" });
  anim.finished.then(() => el.remove(), () => el.remove());
}

// five taps inside 2.5 s summons the crowd
let taps: number[] = [];

export function surprise(x: number) {
  const now = performance.now();
  taps = taps.filter((t) => now - t < 2500);
  taps.push(now);

  if (taps.length >= 5) {
    taps = [];
    const n = innerWidth < 620 ? 5 : 8;
    for (let i = 0; i < n; i++) {
      popCam({ at: ((i + 0.5) / n) * innerWidth, delay: i * 90 + rand(0, 60) });
    }
    return;
  }
  // first one rises right under your finger, then he gets creative
  popCam(taps.length === 1 ? { at: x } : { edge: pick(EDGES) });
}
