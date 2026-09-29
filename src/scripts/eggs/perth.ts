// "What day is it at Herdsman Lake?" — the club's calendar is Perth's, not
// the visitor's. Perth sits at UTC+8 year-round (WA has voted daylight
// saving down four times, most recently in 2009), but Intl keeps us honest.
//
// Preview any date's eggs with ?eggdate=YYYY-MM-DD, e.g.
//   /?eggdate=2026-09-01   Aaron's birthday takeover (and magpie season)
//   /?eggdate=2026-04-25   Anzac Day takeover

export interface PerthDate {
  year: number;
  month: number; // 1–12
  day: number;
  overridden: boolean;
}

export function perthToday(): PerthDate {
  const forced = new URLSearchParams(location.search)
    .get("eggdate")
    ?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (forced) {
    return {
      year: Number(forced[1]),
      month: Number(forced[2]),
      day: Number(forced[3]),
      overridden: true,
    };
  }
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    overridden: false,
  };
}
