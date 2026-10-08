// Report engine for the dashboard: scope (platform, brand, store, operator)
// x period. Same Missing vs Zero rules as metrics.ts:
//   - a store-day counts as missing for a field when its value is null or the
//     day has no row at all (only days up to today; future days are not due yet)
//   - sums ignore missing values and report how many store-days were missing
//   - ratios use only store-days where both inputs are present; null on 0 denominator
// Formulas are working assumptions until confirmed (see kpi-definitions.ts).

import type { Data } from "./data/dataset";
import type { Channel, DailyMetric, Store, User } from "./data/types";
import { addDays, eachDay, type Period, type Range, toIso } from "./period";
import { isLeader, visibleStoreIds, visibleUserIds } from "./rbac";

export interface Filters {
  platform: Channel | null;
  brand: string | null;
  store: string | null;
  operator: string | null;
}

export type Field = "gmv" | "nmv" | "orders" | "traffic" | "adSpend";
const FIELDS: Field[] = ["gmv", "nmv", "orders", "traffic", "adSpend"];

export interface Totals {
  storeDays: number; // store-days due (up to today)
  missing: Record<Field, number>;
  gmv: number | null;
  nmv: number | null;
  orders: number | null;
  traffic: number | null;
  adSpend: number | null;
  aov: number | null;
  cr: number | null;
  roas: number | null;
}

export interface Options {
  stores: Store[];
  brands: { id: string; name: string }[];
  platforms: Channel[];
  operators: { user: User; storeIds: string[] }[];
}

// What the filter bar may offer this viewer: only what they can already see.
// Operators (leaders only) are people with an assignment overlapping the period.
export function filterOptions(d: Data, viewer: User, period: Range): Options {
  const visible = visibleStoreIds(d, viewer);
  const stores = d.listStores().filter((s) => visible.has(s.id));
  const brandIds = new Set(stores.map((s) => s.brandId));
  const people = isLeader(viewer.role) ? visibleUserIds(d, viewer) : new Set<string>();
  const byPerson = new Map<string, Set<string>>();
  for (const a of d.assignmentsOverlapping(period.from, period.to)) {
    if (!people.has(a.userId) || !visible.has(a.storeId)) continue;
    const set = byPerson.get(a.userId) ?? new Set<string>();
    set.add(a.storeId);
    byPerson.set(a.userId, set);
  }
  return {
    stores,
    brands: d.listBrands().filter((b) => brandIds.has(b.id)).map((b) => ({ id: b.id, name: b.name })),
    platforms: (["shopee", "tiktok", "lazada", "website"] as Channel[]).filter((c) => stores.some((s) => s.channel === c)),
    operators: [...byPerson.entries()]
      .map(([id, ids]) => ({ user: d.getUser(id), storeIds: [...ids] }))
      .filter((o): o is { user: User; storeIds: string[] } => o.user !== null)
      .sort((a, b) => a.user.name.localeCompare(b.user.name)),
  };
}

// Stores in scope after filters. Operator = stores assigned to that person at
// any point inside the period (see filterOptions).
export function scopeStores(opts: Options, f: Filters): Store[] {
  let stores = opts.stores;
  if (f.platform) stores = stores.filter((s) => s.channel === f.platform);
  if (f.brand) stores = stores.filter((s) => s.brandId === f.brand);
  if (f.store) stores = stores.filter((s) => s.id === f.store);
  if (f.operator) {
    const ids = new Set(opts.operators.find((o) => o.user.id === f.operator)?.storeIds ?? []);
    stores = stores.filter((s) => ids.has(s.id));
  }
  return stores;
}

const today = () => toIso(new Date());

// Clamp a range to days that are due (<= today). Returns null when nothing is due.
export function dueRange(r: Range, now = today()): Range | null {
  const to = r.to > now ? now : r.to;
  return r.from > to ? null : { from: r.from, to };
}

function rowsFor(d: Data, storeIds: string[], r: Range) {
  return storeIds.flatMap((id) => d.dailyFor(id, r.from, r.to));
}

export function totals(d: Data, storeIds: string[], r: Range): Totals {
  const due = dueRange(r);
  const days = due ? eachDay(due).length : 0;
  const storeDays = storeIds.length * days;
  const rows = due ? rowsFor(d, storeIds, due) : [];
  const sum = (list: DailyMetric[], f: Field) => {
    const present = list.filter((x) => x[f] !== null);
    return present.length ? present.reduce((acc, x) => acc + (x[f] as number), 0) : null;
  };
  const ratio = (num: Field, den: Field) => {
    const both = rows.filter((x) => x[num] !== null && x[den] !== null);
    const n = sum(both, num);
    const dd = sum(both, den);
    return n === null || dd === null || dd === 0 ? null : n / dd;
  };
  const missing = Object.fromEntries(
    FIELDS.map((f) => [f, storeDays - rows.filter((x) => x[f] !== null).length]),
  ) as Record<Field, number>;
  return {
    storeDays,
    missing,
    gmv: sum(rows, "gmv"),
    nmv: sum(rows, "nmv"),
    orders: sum(rows, "orders"),
    traffic: sum(rows, "traffic"),
    adSpend: sum(rows, "adSpend"),
    aov: ratio("gmv", "orders"),
    cr: ratio("orders", "traffic"),
    roas: ratio("gmv", "adSpend"),
  };
}

export const change = (cur: number | null, prev: number | null) =>
  cur === null || prev === null || prev === 0 ? null : cur / prev - 1;

// Monthly target applies only when the period is one calendar month (MTD or
// full month). Splitting a monthly target into weeks or custom ranges has not
// been decided, so it stays TBD.
export function targetFor(d: Data, storeIds: string[], period: Period) {
  if (!period.month || (period.kind !== "mtd" && period.kind !== "month")) return { applicable: false as const };
  const ids = new Set(storeIds);
  const rows = d.targets.filter((t) => t.month === period.month && ids.has(t.storeId));
  const withTarget = rows.filter((t) => t.gmvTarget !== null);
  const missing = storeIds.length - withTarget.length;
  const target = withTarget.length ? withTarget.reduce((a, t) => a + (t.gmvTarget as number), 0) : null;
  // Achievement over stores that have both a target and GMV in the period.
  const due = dueRange(period);
  let gmv = 0;
  let tgt = 0;
  if (due) {
    for (const t of withTarget) {
      const g = d.dailyFor(t.storeId, due.from, due.to).filter((x) => x.gmv !== null);
      if (!g.length) continue;
      gmv += g.reduce((a, x) => a + (x.gmv as number), 0);
      tgt += t.gmvTarget as number;
    }
  }
  return { applicable: true as const, target, missing, achievement: tgt ? gmv / tgt : null };
}

export interface DayPoint {
  date: string;
  gmv: number | null;
  prev: number | null; // same position in the comparison period
  due: boolean;
  missingStores: number;
}

export function dailySeries(d: Data, storeIds: string[], period: Period): DayPoint[] {
  const now = today();
  return eachDay(period).map((date, i) => {
    const due = date <= now;
    const rows = storeIds.flatMap((id) => d.dailyFor(id, date, date));
    const present = rows.filter((x) => x.gmv !== null);
    const prevDate = addDays(period.compare.from, i);
    const prevRows =
      prevDate <= period.compare.to ? storeIds.flatMap((id) => d.dailyFor(id, prevDate, prevDate)).filter((x) => x.gmv !== null) : [];
    return {
      date,
      gmv: due && present.length ? present.reduce((a, x) => a + (x.gmv as number), 0) : null,
      prev: prevRows.length ? prevRows.reduce((a, x) => a + (x.gmv as number), 0) : null,
      due,
      missingStores: due ? storeIds.length - present.length : 0,
    };
  });
}

export type Dimension = "platform" | "brand" | "store" | "operator";

export interface BreakdownRow {
  key: string;
  label: string;
  href: string | null;
  stores: number;
  cur: Totals;
  prev: Totals;
}

export function breakdown(d: Data, viewer: User, stores: Store[], period: Period, by: Dimension): BreakdownRow[] {
  const groups = new Map<string, { label: string; href: string | null; ids: string[] }>();
  const add = (key: string, label: string, href: string | null, id: string) => {
    const g = groups.get(key);
    if (g) g.ids.push(id);
    else groups.set(key, { label, href, ids: [id] });
  };
  if (by === "operator") {
    const people = visibleUserIds(d, viewer);
    const ids = new Set(stores.map((s) => s.id));
    for (const a of d.assignmentsOverlapping(period.from, period.to)) {
      if (!ids.has(a.storeId) || !people.has(a.userId)) continue;
      const u = d.getUser(a.userId);
      if (u && !groups.get(u.id)?.ids.includes(a.storeId)) add(u.id, u.name, `/people/${u.id}`, a.storeId);
    }
  } else {
    for (const s of stores) {
      if (by === "platform") add(s.channel, s.channel, null, s.id);
      else if (by === "brand") add(s.brandId, d.getBrand(s.brandId)?.name ?? s.brandId, null, s.id);
      else add(s.id, s.name, `/stores/${s.id}`, s.id);
    }
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: g.label,
      href: g.href,
      stores: g.ids.length,
      cur: totals(d, g.ids, period),
      prev: totals(d, g.ids, period.compare),
    }))
    .sort((a, b) => (b.cur.gmv ?? -Infinity) - (a.cur.gmv ?? -Infinity));
}

// Stores with missing GMV days in the period, worst first.
export function completeness(d: Data, stores: Store[], period: Period) {
  const due = dueRange(period);
  if (!due) return [];
  const days = eachDay(due);
  return stores
    .map((s) => {
      const rows = d.dailyFor(s.id, due.from, due.to);
      const have = new Set(rows.filter((x) => x.gmv !== null).map((x) => x.date));
      const missingDays = days.filter((x) => !have.has(x));
      const all = d.dailyFor(s.id, "0000-01-01", "9999-12-31").filter((x) => x.gmv !== null);
      return { store: s, missingDays, lastDate: all.length ? all[all.length - 1].date : null };
    })
    .filter((x) => x.missingDays.length > 0)
    .sort((a, b) => b.missingDays.length - a.missingDays.length);
}
