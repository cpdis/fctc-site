// Date takeovers: on the club's big days the marquees change their tune and
// the matching tradition gets a tag. Runs on every page; pages without
// marquees or traditions just skip those parts.
import type { PerthDate } from "./perth";

interface Takeover {
  open: string; // top marquee (under the hero)
  close: string; // closing marquee (above the footer)
  trad?: string; // data-trad of the tradition to tag
  tag?: string;
}

function takeoverFor({ month, day }: PerthDate): Takeover | undefined {
  // Anzac Day: played straight — no jokes, no confetti.
  if (month === 4 && day === 25) {
    return {
      open: "ANZAC DAY • LEST WE FORGET",
      close: "WE WILL REMEMBER THEM • LEST WE FORGET",
      trad: "anzac",
      tag: "Today",
    };
  }
  if (month === 9 && day === 1) {
    return {
      open: "HAPPY BIRTHDAY AARON • BEER RUN • 🍺",
      close: "HAPPY BIRTHDAY AARON • AMEN SCOUNDRELS",
      trad: "aaron",
      tag: "Today",
    };
  }
  if (month === 12) {
    return {
      open: "MERRY CHRISTMAS • CHRISTMAS MARATHON • WHITE ELEPHANT",
      close: "MERRY CHRISTMAS, SCOUNDRELS • SEE YOU AT 0530",
      trad: "christmas",
      tag: "This month",
    };
  }
}

// Swap a marquee's text while keeping its seamless loop: both spans stay
// identical, and each stays at least as long as the original so wide
// screens don't show a gap.
function retitle(name: string, text: string) {
  const spans = document.querySelectorAll<HTMLElement>(
    `[data-marquee="${name}"] span`,
  );
  if (!spans.length) return;
  const unit = `${text} • `;
  const repeats = Math.max(
    2,
    Math.ceil((spans[0].textContent ?? "").length / unit.length),
  );
  const content = unit.repeat(repeats);
  spans.forEach((s) => (s.textContent = content));
}

export function applyTakeover(today: PerthDate) {
  const t = takeoverFor(today);
  if (!t) return;
  retitle("open", t.open);
  retitle("close", t.close);
  if (t.trad && t.tag) {
    const h3 = document.querySelector(`[data-trad="${t.trad}"] h3`);
    if (h3 && !h3.querySelector(".egg-today")) {
      const tag = document.createElement("span");
      tag.className = "egg-today";
      tag.textContent = t.tag;
      h3.append(" ", tag);
    }
  }
}
