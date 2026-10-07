// Derived KPIs. All formulas are TBD until confirmed (see kpi-definitions.ts).
//
// Missing vs Zero: a raw field is null when no data was received. Sums ignore
// missing rows and report how many were missing; a sum over only-missing rows
// is null. A ratio is null when an input is missing or the denominator is 0.

import { metrics, monthKeys } from "./data/seed";
import type { MetricField, MonthlyMetric } from "./data/types";

export interface Kpis {
  rows: number; // store-month rows in scope
  missing: Record<MetricField, number>; // rows with no data per field
  gmvTarget: number | null;
  gmv: number | null;
  nmv: number | null;
  traffic: number | null;
  orders: number | null;
  adSpend: number | null;
  achievement: number | null;
  pace: number | null;
  cr: number | null;
  aov: number | null;
  roi: number | null;
}

const FIELDS: MetricField[] = ["gmvTarget", "gmv", "nmv", "traffic", "orders", "adSpend"];

export function currentMonth() {
  return monthKeys(1)[0];
}

export function monthElapsedShare(now = new Date()) {
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() / days;
}

function sum(rows: MonthlyMetric[], field: MetricField): number | null {
  const present = rows.filter((r) => r[field] !== null);
  return present.length ? present.reduce((acc, r) => acc + (r[field] as number), 0) : null;
}

// Ratio over rows where both fields are present, so a missing denominator
// in one store does not distort the total.
function ratioOver(rows: MonthlyMetric[], num: MetricField, den: MetricField): number | null {
  const both = rows.filter((r) => r[num] !== null && r[den] !== null);
  const d = sum(both, den);
  const n = sum(both, num);
  return n === null || d === null || d === 0 ? null : n / d;
}

export function aggregate(rows: MonthlyMetric[], month: string): Kpis {
  const missing = Object.fromEntries(
    FIELDS.map((f) => [f, rows.filter((r) => r[f] === null).length]),
  ) as Record<MetricField, number>;
  const achievement = ratioOver(rows, "gmv", "gmvTarget");
  const expected = month === currentMonth() ? monthElapsedShare() : 1;
  return {
    rows: rows.length,
    missing,
    gmvTarget: sum(rows, "gmvTarget"),
    gmv: sum(rows, "gmv"),
    nmv: sum(rows, "nmv"),
    traffic: sum(rows, "traffic"),
    orders: sum(rows, "orders"),
    adSpend: sum(rows, "adSpend"),
    achievement,
    pace: achievement === null ? null : achievement / expected,
    cr: ratioOver(rows, "orders", "traffic"),
    aov: ratioOver(rows, "gmv", "orders"),
    roi: ratioOver(rows, "gmv", "adSpend"),
  };
}

export function kpisFor(storeIds: Set<string>, month = currentMonth()): Kpis {
  return aggregate(
    metrics.filter((m) => m.month === month && storeIds.has(m.storeId)),
    month,
  );
}

export function trendFor(storeIds: Set<string>, months = monthKeys(6)) {
  return months.map((month) => ({ month, ...kpisFor(storeIds, month) }));
}

// "unknown" when pace cannot be computed (e.g. no target). Thresholds are TBD.
export type PaceStatus = "good" | "warning" | "critical" | "unknown";

export function paceStatus(pace: number | null): PaceStatus {
  if (pace === null) return "unknown";
  if (pace >= 1) return "good";
  if (pace >= 0.85) return "warning";
  return "critical";
}
