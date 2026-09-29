// Site-wide Easter eggs, loaded from Base on every hub page. Page-specific
// ones (Surprise?, the Traditions bursts, the custom 404s) wire themselves
// up in their own pages.
import { applyTakeover } from "./dates";
import { pick, toast } from "./fx";
import { onKonami } from "./konami";
import { initMagpies } from "./magpie";
import { neonOn, neonToggleGuard, setNeon } from "./neon";
import { perthToday } from "./perth";

// ---- developer console ----
const CUP = [
  "      ( (",
  "       ) )",
  "    .______.",
  "    |      |]",
  "    \\      /",
  "     `----'",
].join("\n");

const whatsapp = document.querySelector<HTMLAnchorElement>(
  'a[href*="chat.whatsapp.com"]',
)?.href;
console.log(`%c${CUP}`, "color:#d75b77;font:700 13px/1.25 monospace");
console.log(
  "%c    %c    %c    ",
  "background:#ffd23f",
  "background:#ff7a30",
  "background:#e8442c",
);
console.log(
  "%cUp at 0530 reading source? You're one of us.",
  "color:#d75b77;font:700 14px monospace",
);
console.log(
  [
    whatsapp && `Join the WhatsApp: ${whatsapp}`,
    "Some things on this site are hiding. Try the classics: ↑ ↑ ↓ ↓ ← → ← → B A",
  ]
    .filter(Boolean)
    .join("\n"),
);

// ---- coffee's going cold ----
const title = document.title;
const COLD = [
  "☕ Your flat white's going cold",
  "☕ Coffee's getting cold…",
  "☕ Come back, scoundrel",
];
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? pick(COLD) : title;
});

// ---- the calendar: date takeovers + magpie season ----
const today = perthToday();
applyTakeover(today);
initMagpies(today);

// ---- Konami: Cold Brew Neon mode, then Run to Filament ----
neonToggleGuard();
onKonami(() => {
  if (!neonOn()) setNeon(true);
  toast("+30 lives. Still 0530.");
  // let the tubes finish flickering on before the game takes over
  setTimeout(() => import("./game").then((m) => m.openGame()), 1100);
});
