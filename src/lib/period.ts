// Report periods. All dates are ISO "YYYY-MM-DD", inclusive on both ends,
// in local calendar days.
//
//   mtd    daily report: first of the month up to the chosen date (cumulative)
//   week   Friday of last week to Thursday of this week
//   month  full calendar month
//   custom any from/to
//
// The comparison period is the one right before, of the same kind:
//   mtd -> same day range in the previous month (clamped to its length)
//   week -> previous Fri..Thu, month -> previous month, custom -> same length right before
// The comparison basis has not been confirmed by the Director; the UI always
// prints the compared dates so the reader knows what is being compared.

export type PeriodKind = "mtd" | "week" | "month" | "custom";
export const PERIOD_KINDS: PeriodKind[] = ["mtd", "week", "month", "custom"];

export interface Range {
  from: string;
  to: string;
}

export interface Period extends Range {
  kind: PeriodKind;
  anchor: string; // the date the user picked (mtd/week/month) or `to` for custom
  compare: Range;
  days: number;
  month: string | null; // "YYYY-MM" when the period sits in one month
  fullMonth: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const isIsoDate = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && toIso(fromIso(s)) === s;

export const addDays = (s: string, n: number) => {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
export const daysBetween = (from: string, to: string) =>
  Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86400000) + 1;
const daysInMonth = (y: number, m0: number) => new Date(y, m0 + 1, 0).getDate();

export function eachDay({ from, to }: Range): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

// Friday on or before the date.
export function weekStart(date: string) {
  const dow = fromIso(date).getDay(); // 0 Sun .. 5 Fri
  return addDays(date, -((dow - 5 + 7) % 7));
}

function monthRange(y: number, m0: number): Range {
  return { from: toIso(new Date(y, m0, 1)), to: toIso(new Date(y, m0, daysInMonth(y, m0))) };
}

export function makePeriod(kind: PeriodKind, anchor: string, customFrom?: string, customTo?: string): Period {
  const a = fromIso(anchor);
  let range: Range;
  let compare: Range;
  switch (kind) {
    case "mtd": {
      range = { from: toIso(new Date(a.getFullYear(), a.getMonth(), 1)), to: anchor };
      const py = a.getMonth() === 0 ? a.getFullYear() - 1 : a.getFullYear();
      const pm = (a.getMonth() + 11) % 12;
      const day = Math.min(a.getDate(), daysInMonth(py, pm));
      compare = { from: toIso(new Date(py, pm, 1)), to: toIso(new Date(py, pm, day)) };
      break;
    }
    case "week": {
      const from = weekStart(anchor);
      range = { from, to: addDays(from, 6) };
      compare = { from: addDays(from, -7), to: addDays(from, -1) };
      break;
    }
    case "month": {
      range = monthRange(a.getFullYear(), a.getMonth());
      const prev = new Date(a.getFullYear(), a.getMonth() - 1, 1);
      compare = monthRange(prev.getFullYear(), prev.getMonth());
      break;
    }
    case "custom": {
      let from = isIsoDate(customFrom) ? customFrom : anchor;
      let to = isIsoDate(customTo) ? customTo : anchor;
      if (from > to) [from, to] = [to, from];
      range = { from, to };
      const len = daysBetween(from, to);
      compare = { from: addDays(from, -len), to: addDays(from, -1) };
      break;
    }
  }
  const sameMonth = range.from.slice(0, 7) === range.to.slice(0, 7);
  const f = fromIso(range.from);
  const t = fromIso(range.to);
  return {
    kind,
    anchor: kind === "custom" ? range.to : anchor,
    ...range,
    compare,
    days: daysBetween(range.from, range.to),
    month: sameMonth ? range.from.slice(0, 7) : null,
    fullMonth: sameMonth && f.getDate() === 1 && t.getDate() === daysInMonth(t.getFullYear(), t.getMonth()),
  };
}

// Short label like "01/10 - 08/10/2026" (locale-independent digits).
export function rangeLabel({ from, to }: Range) {
  const f = fromIso(from);
  const t = fromIso(to);
  const dm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  if (from === to) return `${dm(f)}/${f.getFullYear()}`;
  return f.getFullYear() === t.getFullYear()
    ? `${dm(f)} - ${dm(t)}/${t.getFullYear()}`
    : `${dm(f)}/${f.getFullYear()} - ${dm(t)}/${t.getFullYear()}`;
}
