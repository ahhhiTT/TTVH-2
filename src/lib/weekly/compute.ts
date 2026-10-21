// Evaluates the weekly report template for one store and month.

import type { L } from "../reports";
import type { WeekRange } from "./periods";
import { type FactAccess, type RowDef, type Section, type Unit } from "./template";

export interface FactRow {
  date_from: string;
  date_to: string;
  metric: string;
  dim: string;
  value: number;
}

export interface InputRow {
  period: string;
  field: string;
  dim: string;
  num: number | null;
  txt: string | null;
}

export interface Cell {
  plan: number | null;
  actual: number | null;
  rate: number | null; // actual / plan
  planFromWeeks?: boolean;
  actualFromWeeks?: boolean;
}

export interface ResultRow {
  key: string;
  label: L;
  unit: Unit;
  level: number;
  source: "base" | "manual" | "calc";
  note?: L;
  planEditable: boolean;
  actualEditable: boolean;
  cells: Record<string, Cell>; // by period key: "M" for the month, "W1".."W6"
}

export interface ResultSection {
  key: string;
  title: L;
  groups: { title: L; rows: ResultRow[] }[];
}

interface Period {
  key: string; // "M" | "W1".."W6"
  id: string; // stored period id: "2026-09" | "2026-09-W1"
  from: string;
  to: string;
}

export function periodsOf(month: string, monthFrom: string, monthTo: string, weeks: WeekRange[]): Period[] {
  return [
    { key: "M", id: month, from: monthFrom, to: monthTo },
    ...weeks.map((w) => ({ key: w.key, id: `${month}-${w.key}`, from: w.from, to: w.to })),
  ];
}

function factAccess(facts: FactRow[], from: string, to: string): FactAccess {
  const inRange = facts.filter((f) => f.date_from >= from && f.date_to <= to);
  const byMetric = Map.groupBy(inRange, (f) => f.metric);
  return {
    // null = the source has no data for the period (Missing); a loaded source with no
    // matching rows is a real 0 (e.g. no KL4 booking this week).
    sum(metric, match) {
      const all = byMetric.get(metric);
      if (!all?.length) return null;
      return all.filter((f) => !match || match(f.dim)).reduce((a, f) => a + Number(f.value), 0);
    },
  };
}

const ADDITIVE: Unit[] = ["vnd", "num", "h"];

export function evaluate(sections: Section[], periods: Period[], facts: FactRow[], inputs: InputRow[]): ResultSection[] {
  const rows = new Map<string, RowDef>();
  for (const s of sections) for (const g of s.groups) for (const r of g.rows) rows.set(r.key, r);
  const input = new Map(inputs.map((i) => [`${i.period}|${i.field}|${i.dim}`, i]));
  const num = (period: string, field: string) => input.get(`${period}|${field}|`)?.num ?? null;
  const weeks = periods.filter((p) => p.key !== "M");
  const access = new Map(periods.map((p) => [p.key, factAccess(facts, p.from, p.to)]));

  const memo = new Map<string, number | null>();
  const flags = new Map<string, boolean>();

  // Typed value for a row: month falls back to the sum of weeks for additive inputs.
  const typed = (p: Period, field: string, unit: Unit): number | null => {
    const v = num(p.id, field);
    if (v !== null || p.key !== "M" || !ADDITIVE.includes(unit)) return v;
    const parts = weeks.map((w) => num(w.id, field));
    if (parts.every((x) => x === null)) return null;
    flags.set(`${p.key}|${field}`, true);
    return parts.reduce<number>((a, x) => a + (x ?? 0), 0);
  };

  const value = (p: Period, mode: "plan" | "actual", key: string, depth = 0): number | null => {
    const memoKey = `${p.key}|${mode}|${key}`;
    if (memo.has(memoKey)) return memo.get(memoKey)!;
    const row = rows.get(key);
    if (!row || depth > 50) return null;
    const get = (k: string) => value(p, mode, k, depth + 1);
    let v: number | null = null;
    if (row.calc) v = row.calc(get);
    else if (mode === "plan") v = row.noPlan ? null : typed(p, `plan:${key}`, row.unit);
    else if (row.base) v = row.base(access.get(p.key)!);
    else if (row.manual) v = typed(p, `act:${key}`, row.unit);
    memo.set(memoKey, v);
    return v;
  };

  return sections.map((s) => ({
    key: s.key,
    title: s.title,
    groups: s.groups.map((g) => ({
      title: g.title,
      rows: g.rows.map((r) => {
        const cells: Record<string, Cell> = {};
        for (const p of periods) {
          const plan = value(p, "plan", r.key);
          const actual = value(p, "actual", r.key);
          cells[p.key] = {
            plan,
            actual,
            rate: plan === null || actual === null || plan === 0 ? null : actual / plan,
            planFromWeeks: flags.get(`${p.key}|plan:${r.key}`),
            actualFromWeeks: flags.get(`${p.key}|act:${r.key}`),
          };
        }
        return {
          key: r.key,
          label: r.label,
          unit: r.unit,
          level: r.level ?? 0,
          source: r.calc ? "calc" : r.base ? "base" : "manual",
          note: r.note,
          planEditable: !r.calc && !r.noPlan,
          actualEditable: !r.calc && !r.base && !!r.manual,
          cells,
        };
      }),
    })),
  }));
}
