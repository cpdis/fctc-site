// Run to Filament — the Konami code's reward, loaded only when someone
// enters it. A neon 5K along the sock stripe: jump the takeaway cups, duck
// the swooping magpies, reach Filament by sunrise. You start with 30 lives
// (Contra rules).
import { store, stored } from "./fx";

const H = 240;
const GROUND = H - 44;
const RUNNER_X = 72;
const START_SPEED = 6.5; // px per 60fps frame at the wide layout
const MAX_SPEED = 13;
const ACCEL = 0.0022;
const JUMP_V = -12.5;
const SHORT_HOP_V = -5; // let go early for a smaller hop
const GRAVITY = 0.65;
const LIVES = 30;
const GOAL_M = 5000;
const PX_PER_M = 10;
// race seconds per real second: a clean run finishes around 20 minutes
const RACE_CLOCK = 15;
const BEST_KEY = "fctc-5k-best";

const C = {
  pink: "#ff6b93",
  seafoam: "#9ed1af",
  gold: "#ffd23f",
  ember: "#ff7a30",
  flame: "#e8442c",
  crema: "#faf4e6",
};

type State = "ready" | "run" | "paused" | "over" | "done";
type Kind = "cup" | "tall" | "cups" | "magpie" | "decoy";
interface Ob {
  kind: Kind;
  x: number;
  w: number;
  h: number;
  dive: number; // magpies: lowest the bird's feet get (decoys stay overhead)
  flap: number;
}
interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const fmt = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

// hex colour lerp for the night → sunrise sky
const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

export function openGame() {
  if (document.querySelector(".egg-game")) return;
  const touch = matchMedia("(pointer: coarse)").matches;
  const returnFocus = document.activeElement as HTMLElement | null;

  // ---- DOM ----
  const root = document.createElement("div");
  root.className = "egg-game";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "egg-game-title");
  root.innerHTML = `
    <div class="egg-game-panel">
      <div class="egg-game-bar">
        <h2 id="egg-game-title">Run to Filament</h2>
        <button class="egg-game-x" type="button" aria-label="Close game">✕</button>
      </div>
      <div class="egg-game-hud" aria-hidden="true">
        <span data-hud="km"></span><span data-hud="clock"></span>
        <span data-hud="lives"></span><span data-hud="best"></span>
      </div>
      <div class="egg-game-stage">
        <canvas></canvas>
        <div class="egg-game-msg" aria-live="polite"><b></b><span></span></div>
      </div>
      <p class="egg-game-help">${
        touch
          ? "Tap the right side to jump · hold the left side to duck"
          : "Space / ↑ jump · ↓ duck · Esc quit"
      }</p>
    </div>`;
  document.body.append(root);
  document.documentElement.style.overflow = "hidden";

  const $ = <T extends Element>(s: string) => root.querySelector(s) as T;
  const closeBtn = $<HTMLButtonElement>(".egg-game-x");
  const stage = $<HTMLElement>(".egg-game-stage");
  const canvas = $<HTMLCanvasElement>("canvas");
  const msg = $<HTMLElement>(".egg-game-msg");
  const hud = {
    km: $<HTMLElement>('[data-hud="km"]'),
    clock: $<HTMLElement>('[data-hud="clock"]'),
    lives: $<HTMLElement>('[data-hud="lives"]'),
    best: $<HTMLElement>('[data-hud="best"]'),
  };

  // Narrow screens get a zoomed-in, shorter track; k scales speeds and
  // distances so the run takes the same time and reaction windows match.
  const W = stage.clientWidth < 560 ? 480 : 760;
  const k = W / 760;
  const goalPx = GOAL_M * PX_PER_M * k;
  const dpr = Math.min(devicePixelRatio || 1, 3);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d")!;

  const stars = Array.from({ length: 45 }, () => ({
    x: rand(0, W),
    y: rand(0, GROUND - 60),
    r: rand(1, 2),
    z: rand(0.3, 1),
  }));

  // ---- state ----
  let state: State = "ready";
  let dist = 0;
  let speed = START_SPEED;
  let raceMs = 0;
  let lives = LIVES;
  let obs: Ob[] = [];
  let gap = 0;
  let ry = GROUND;
  let vy = 0;
  let onGround = true;
  let duck = false;
  let jumpHeld = false;
  let jumpBuf = 0;
  let invuln = 0;
  let callout: { text: string; t: number } | null = null;
  let lockUntil = 0;
  let raf = 0;
  let last = 0;

  let best = Number(stored(BEST_KEY)) || 0;

  function show(title: string, sub: string) {
    msg.querySelector("b")!.textContent = title;
    msg.querySelector("span")!.textContent = sub;
    msg.hidden = false;
  }

  function reset() {
    dist = 0;
    speed = START_SPEED;
    raceMs = 0;
    lives = LIVES;
    obs = [];
    gap = W * 0.6;
    ry = GROUND;
    vy = 0;
    onGround = true;
    invuln = 0;
    callout = null;
  }

  function start() {
    if (performance.now() < lockUntil) return;
    reset();
    state = "run";
    msg.hidden = true;
    kick();
  }

  // ---- input ----
  function press() {
    if (state === "run") {
      jumpHeld = true;
      jumpBuf = 7; // jump on landing if pressed just before touching down
    } else if (state === "paused") {
      state = "run";
      msg.hidden = true;
      kick();
    } else {
      start();
    }
  }

  function release() {
    jumpHeld = false;
    if (vy < SHORT_HOP_V) vy = SHORT_HOP_V;
  }

  const JUMP_KEYS = [" ", "ArrowUp", "w", "W"];
  const DUCK_KEYS = ["ArrowDown", "s", "S"];

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") return close();
    if (e.key === "Tab") {
      e.preventDefault(); // one control in here; keep focus on it
      closeBtn.focus();
      return;
    }
    if (JUMP_KEYS.includes(e.key)) {
      e.preventDefault();
      if (!e.repeat) press();
    } else if (DUCK_KEYS.includes(e.key)) {
      e.preventDefault();
      duck = true;
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (JUMP_KEYS.includes(e.key)) release();
    else if (DUCK_KEYS.includes(e.key)) duck = false;
  }

  // touch: left half ducks while held, right half jumps; a mouse click jumps
  let duckPointer = -1;
  stage.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    stage.setPointerCapture?.(e.pointerId);
    if (e.pointerType !== "mouse" && state === "run") {
      const rect = stage.getBoundingClientRect();
      if (e.clientX - rect.left < rect.width / 2) {
        duck = true;
        duckPointer = e.pointerId;
        return;
      }
    }
    press();
  });
  const lift = (e: PointerEvent) => {
    if (e.pointerId === duckPointer) {
      duck = false;
      duckPointer = -1;
    } else {
      release();
    }
  };
  stage.addEventListener("pointerup", lift);
  stage.addEventListener("pointercancel", lift);

  function onVisibility() {
    if (document.hidden && state === "run") {
      state = "paused";
      show("Paused", touch ? "Tap to keep running." : "Press Space to keep running.");
    }
  }

  addEventListener("keydown", onKeyDown);
  addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVisibility);
  closeBtn.addEventListener("click", close);

  function close() {
    cancelAnimationFrame(raf);
    removeEventListener("keydown", onKeyDown);
    removeEventListener("keyup", onKeyUp);
    document.removeEventListener("visibilitychange", onVisibility);
    document.documentElement.style.overflow = "";
    root.remove();
    returnFocus?.focus?.();
  }

  // ---- simulation ----
  function magBottom(o: Ob) {
    // dives toward head height as it reaches you, climbs away after
    const d = Math.abs(o.x + o.w / 2 - RUNNER_X);
    const high = GROUND - 150;
    return o.dive - (o.dive - high) * Math.min(1, (d / 240) ** 2);
  }

  function box(o: Ob): Box {
    if (o.kind === "magpie" || o.kind === "decoy") {
      const b = magBottom(o);
      return { l: o.x, r: o.x + o.w, t: b - o.h, b };
    }
    return { l: o.x, r: o.x + o.w, t: GROUND - o.h, b: GROUND };
  }

  function runnerBox(): Box {
    return duck && onGround
      ? { l: RUNNER_X - 12, r: RUNNER_X + 16, t: ry - 24, b: ry }
      : { l: RUNNER_X - 8, r: RUNNER_X + 8, t: ry - 46, b: ry };
  }

  const overlap = (a: Box, b: Box, pad = 3) =>
    a.l + pad < b.r && a.r - pad > b.l && a.t + pad < b.b && a.b - pad > b.t;

  function spawn() {
    const metres = dist / (PX_PER_M * k);
    let o: Ob;
    if (metres > 500 && Math.random() < 0.3) {
      const decoy = Math.random() < 0.3;
      // flies 1.3× ground speed, so start it further out to arrive on the beat
      o = {
        kind: decoy ? "decoy" : "magpie",
        x: W + 30 + 0.3 * (W - RUNNER_X),
        w: 38,
        h: 20,
        dive: decoy ? GROUND - 84 : GROUND - 32,
        flap: 0,
      };
    } else {
      const r = Math.random();
      const [kind, w, h]: [Kind, number, number] =
        r < 0.55 ? ["cup", 20, 26] : r < 0.8 ? ["tall", 22, 36] : ["cups", 46, 26];
      o = { kind, x: W + 20, w, h, dive: 0, flap: 0 };
    }
    obs.push(o);
    const min = speed * k * 46; // a bit more than one jump's worth of ground
    gap = rand(min, min * 2.1);
  }

  function crash(o: Ob) {
    lives--;
    invuln = 80;
    speed = Math.max(START_SPEED, speed * 0.65);
    obs = obs.filter((x) => x !== o);
    const bird = o.kind === "magpie" || o.kind === "decoy";
    callout = { text: bird ? "Swooped!" : "Spilled!", t: 50 };
    if (lives <= 0) {
      state = "over";
      lockUntil = performance.now() + 700;
      show("DNF", `Out of lives at ${(dist / (PX_PER_M * k) / 1000).toFixed(2)} km. ${touch ? "Tap" : "Space"} to run it back.`);
    }
  }

  function finish() {
    state = "done";
    dist = goalPx;
    lockUntil = performance.now() + 900;
    const sec = raceMs / 1000;
    const pb = !best || sec < best;
    if (pb) {
      best = sec;
      store(BEST_KEY, String(sec));
    }
    const lost = LIVES - lives;
    show(
      "Made it to Filament",
      `5K in ${fmt(sec)} · ${lost} ${lost === 1 ? "life" : "lives"} lost${pb ? " · new PB" : ""}. Coffee's on you.`,
    );
  }

  function update(dt: number) {
    speed = Math.min(MAX_SPEED, speed + ACCEL * dt);
    const v = speed * k * dt;
    dist += v;
    raceMs += dt * 16.667 * RACE_CLOCK;

    // runner
    if (jumpBuf > 0) {
      jumpBuf -= dt;
      if (onGround) {
        vy = JUMP_V;
        onGround = false;
        jumpBuf = 0;
        if (!jumpHeld) vy = SHORT_HOP_V * 1.6;
      }
    }
    if (!onGround) {
      vy += GRAVITY * (duck ? 2.6 : 1) * dt; // ducking mid-air = fast fall
      ry += vy * dt;
      if (ry >= GROUND) {
        ry = GROUND;
        vy = 0;
        onGround = true;
      }
    }

    // world
    for (const o of obs) {
      o.x -= o.kind === "magpie" || o.kind === "decoy" ? v * 1.3 : v;
      o.flap += dt;
    }
    obs = obs.filter((o) => o.x + o.w > -30);
    gap -= v;
    if (gap <= 0 && goalPx - dist > W + 240) spawn();

    if (invuln > 0) {
      invuln -= dt;
    } else {
      const me = runnerBox();
      const hit = obs.find((o) => overlap(me, box(o)));
      if (hit) crash(hit);
    }
    if (callout && (callout.t -= dt) <= 0) callout = null;
    if (state === "run" && dist >= goalPx) finish();
  }

  // ---- rendering ----
  function glow(color: string, width = 2.5) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  function poly(...pts: [number, number][]) {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (const p of pts.slice(1)) ctx.lineTo(...p);
    ctx.stroke();
  }

  function drawCup(x: number, w: number, h: number) {
    const t = GROUND - h;
    glow(C.gold);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, GROUND);
    ctx.lineTo(x + w * 0.86, GROUND);
    ctx.lineTo(x + w, t + 5);
    ctx.lineTo(x, t + 5);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeRect(x - 1.5, t, w + 3, 5); // lid
    glow(C.ember, 2);
    poly([x + w * 0.1, t + h * 0.45], [x + w * 0.9, t + h * 0.45]); // sleeve
    poly([x + w * 0.12, t + h * 0.72], [x + w * 0.88, t + h * 0.72]);
  }

  function drawMagpie(o: Ob) {
    const cy = magBottom(o) - 10;
    const cx = o.x + o.w / 2;
    const f = Math.sin(o.flap * 0.5);
    glow(C.crema);
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy, 13, 6, 0, 0, Math.PI * 2); // body
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 12, cy - 3, 5, 0, Math.PI * 2); // head
    ctx.stroke();
    poly([cx + 14, cy - 1], [cx + 24, cy - 5], [cx + 24, cy + 3], [cx + 14, cy + 2]); // tail
    glow(C.seafoam);
    poly([cx - 17, cy - 4], [cx - 26, cy - 1.5]); // beak, coming for you
    poly([cx - 3, cy - 2], [cx + 5, cy - 2 - 14 * f], [cx + 13, cy - 2 - 9 * f]); // wing
  }

  function drawShop(door: number) {
    const left = door - 34;
    const top = GROUND - 112;
    glow(C.seafoam);
    ctx.strokeRect(left, top, 200, 112);
    poly([left - 8, top + 46], [left + 208, top + 46]); // awning line
    for (let x = left; x < left + 200; x += 20) {
      poly([x, top + 46], [x + 10, top + 56], [x + 20, top + 46]);
    }
    glow(C.crema);
    ctx.strokeRect(door - 15, GROUND - 52, 30, 52);
    ctx.strokeRect(door + 40, GROUND - 44, 110, 28); // window
    glow(C.pink);
    ctx.font = `28px Anton, "Archivo Variable", sans-serif`;
    ctx.fillText("FILAMENT", left + 44, top + 36);
    // neon cup in the window
    glow(C.gold, 2);
    poly([door + 84, GROUND - 38], [door + 86, GROUND - 22], [door + 100, GROUND - 22], [door + 102, GROUND - 38]);
    poly([door + 102, GROUND - 34], [door + 107, GROUND - 32], [door + 102, GROUND - 27]);
  }

  function drawRunner() {
    if (invuln > 0 && Math.floor(invuln / 5) % 2 === 0) return; // blink
    glow(C.pink, 3);
    const x = RUNNER_X;
    const y = ry;
    const ducking = duck && onGround;
    const air = !onGround;
    const phase = dist / k / 16;
    const head: [number, number] = ducking ? [x + 13, y - 19] : [x + 3, y - 40];
    const sh: [number, number] = ducking ? [x + 6, y - 17] : [x + 1, y - 32];
    const hip: [number, number] = ducking ? [x - 8, y - 13] : [x - 2, y - 18];
    const len = ducking ? 7 : 9.5;

    ctx.beginPath();
    ctx.arc(head[0], head[1], 5.5, 0, Math.PI * 2);
    ctx.stroke();
    poly(sh, hip);
    for (const i of [0, 1]) {
      const s = air ? (i ? 0.9 : -0.5) : state === "ready" ? 0 : Math.sin(phase + i * Math.PI);
      // angles from straight down, positive = forward
      const thigh = s * 0.75;
      const knee: [number, number] = [hip[0] + Math.sin(thigh) * len, hip[1] + Math.cos(thigh) * len];
      const bend = state === "ready" ? 0 : 0.35 + 0.9 * Math.max(0, -Math.cos(phase + i * Math.PI));
      const shin = thigh - (air ? 1.4 : bend);
      const foot: [number, number] = [knee[0] + Math.sin(shin) * len, knee[1] + Math.cos(shin) * len];
      poly(hip, knee, foot);
      const upper = -s * 0.8;
      const elbow: [number, number] = [sh[0] + Math.sin(upper) * 7.5, sh[1] + Math.cos(upper) * 7.5];
      const fore = upper + 1.5;
      poly(sh, elbow, [elbow[0] + Math.sin(fore) * 6.5, elbow[1] + Math.cos(fore) * 6.5]);
    }
  }

  function draw() {
    const p = Math.min(1, dist / goalPx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.shadowBlur = 0;

    // night → sunrise as the kilometres tick over
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix("#0c0806", "#2b1022", p));
    sky.addColorStop(1, mix("#140c0a", "#6b2a3a", p));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    if (p > 0.05) {
      const sun = ctx.createRadialGradient(W * 0.8, GROUND, 0, W * 0.8, GROUND, 240);
      sun.addColorStop(0, `rgba(255,210,63,${0.5 * p})`);
      sun.addColorStop(1, "rgba(255,210,63,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = `rgba(250,244,230,${0.8 * (1 - p)})`;
    for (const s of stars) {
      const sx = (((s.x - dist * 0.05 * s.z) % W) + W) % W;
      ctx.fillRect(sx, s.y, s.r, s.r);
    }

    // the sock stripe is the track
    [C.gold, C.ember, C.flame].forEach((c, i) => {
      glow(c, 2);
      poly([0, GROUND + 3 + i * 5], [W, GROUND + 3 + i * 5]);
    });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(250,244,230,0.22)";
    for (let x = -(dist % 48); x < W; x += 48) poly([x, GROUND + 26], [x + 18, GROUND + 26]);

    const door = RUNNER_X + 10 + (goalPx - dist);
    if (door < W + 60) drawShop(door);

    for (const o of obs) {
      if (o.kind === "magpie" || o.kind === "decoy") drawMagpie(o);
      else if (o.kind === "cups") {
        drawCup(o.x, 20, o.h);
        drawCup(o.x + 26, 20, o.h);
      } else drawCup(o.x, o.w, o.h);
    }
    drawRunner();

    if (callout) {
      glow(C.gold);
      ctx.shadowBlur = 6;
      ctx.font = `700 13px "Space Mono", monospace`;
      ctx.globalAlpha = Math.min(1, callout.t / 15);
      ctx.fillText(callout.text.toUpperCase(), RUNNER_X - 20, ry - 58);
      ctx.globalAlpha = 1;
    }

    // HUD
    hud.km.textContent = `${(dist / (PX_PER_M * k) / 1000).toFixed(2)} km`;
    hud.clock.textContent = fmt(raceMs / 1000);
    hud.lives.textContent = `Lives ${lives}`;
    hud.best.textContent = best ? `PB ${fmt(best)}` : "PB —";
  }

  function frame(now: number) {
    const dt = Math.min((now - last) / 16.667, 2.5);
    last = now;
    if (state === "run") update(dt);
    draw();
    raf = state === "run" ? requestAnimationFrame(frame) : 0;
  }

  function kick() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  // ---- go ----
  reset();
  draw();
  show("Run to Filament", touch ? "Tap to start. 5K. 30 lives." : "Press Space to start. 5K. 30 lives.");
  closeBtn.focus();
}
