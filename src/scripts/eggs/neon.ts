// Cold Brew Neon mode: the palette's pink + seafoam come from the Filament
// cold-brew sign, so the Konami code turns the whole site into the sign.
// Lasts until reload, or until the theme toggle is pressed (which then only
// switches neon off — one press, one change).
const NEON_BG = "#0c0806";

const themeColor = () =>
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

export const neonOn = () =>
  document.documentElement.classList.contains("neon");

export function setNeon(on: boolean) {
  const root = document.documentElement;
  root.classList.toggle("neon", on);
  if (on) {
    // the tube-ignition flicker is a one-shot class so re-renders don't replay it
    root.classList.add("neon-ignite");
    setTimeout(() => root.classList.remove("neon-ignite"), 1600);
  }
  themeColor()?.setAttribute(
    "content",
    on ? NEON_BG : root.dataset.theme === "dark" ? "#1c1410" : "#faf4e6",
  );
}

// Registered on document in the capture phase, so it runs before Base's own
// toggle handler and can swallow the click.
export function neonToggleGuard() {
  document.addEventListener(
    "click",
    (e) => {
      if (!neonOn()) return;
      if (!(e.target as Element | null)?.closest?.("#theme-toggle")) return;
      e.stopPropagation();
      setNeon(false);
    },
    true,
  );
}
