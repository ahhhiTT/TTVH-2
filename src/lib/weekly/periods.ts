// Weeks of a month as in the weekly report template: week 1 runs from the 1st to the
// first Thursday, then Friday..Thursday, the last week is cut at the month end.
// Example September 2026: 01-03, 04-10, 11-17, 18-24, 25-30.

export interface WeekRange {
  key: string; // "W1".."W5" (a month can have 6 when the 1st is a Friday: W6)
  from: string; // ISO date, inclusive
  to: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: iso(y, m, 1), to: iso(y, m, last) };
}

export function weeksOfMonth(month: string): WeekRange[] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const weeks: WeekRange[] = [];
  let start = 1;
  for (let d = 1; d <= last; d++) {
    const dow = new Date(y, m - 1, d).getDay(); // 4 = Thursday
    if (dow === 4 || d === last) {
      weeks.push({ key: `W${weeks.length + 1}`, from: iso(y, m, start), to: iso(y, m, d) });
      start = d + 1;
    }
  }
  return weeks;
}

export const isMonth = (s: unknown): s is string => typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export const dm = (isoDate: string) => `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
