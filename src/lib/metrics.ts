// Derived KPIs. FORMULAS ARE PROVISIONAL — they follow common e-commerce
// definitions and must be confirmed against TTVH2's official report spec.

import { metrics, monthKeys } from "./data/seed";
import type { MonthlyMetric } from "./data/types";

export interface Kpis {
  gmvTarget: number;
  gmv: number;
  nmv: number;
  traffic: number;
  orders: number;
  adSpend: number;
  achievement: number; // gmv / target
  pace: number; // achievement vs. expected share of month elapsed (1 = on track)
  cr: number; // orders / traffic
  aov: number; // gmv / orders
  roi: number; // gmv / adSpend
}

export function currentMonth() {
  return monthKeys(1)[0];
}

export function monthElapsedShare(now = new Date()) {
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return now.getDate() / days;
}

export function aggregate(rows: MonthlyMetric[], month: string): Kpis {
  const sum = (k: keyof Omit<MonthlyMetric, "storeId" | "month">) =>
    rows.reduce((acc, r) => acc + r[k], 0);
  const gmvTarget = sum("gmvTarget");
  const gmv = sum("gmv");
  const orders = sum("orders");
  const traffic = sum("traffic");
  const adSpend = sum("adSpend");
  const achievement = gmvTarget ? gmv / gmvTarget : 0;
  const expected = month === currentMonth() ? monthElapsedShare() : 1;
  return {
    gmvTarget,
    gmv,
    nmv: sum("nmv"),
    traffic,
    orders,
    adSpend,
    achievement,
    pace: expected ? achievement / expected : 0,
    cr: traffic ? orders / traffic : 0,
    aov: orders ? gmv / orders : 0,
    roi: adSpend ? gmv / adSpend : 0,
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

export type PaceStatus = "good" | "warning" | "critical";

// Provisional thresholds — to be replaced by TTVH2's alert rules.
export function paceStatus(pace: number): PaceStatus {
  if (pace >= 1) return "good";
  if (pace >= 0.85) return "warning";
  return "critical";
}
