"use client";

import { Fragment, useActionState, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import type { L } from "@/lib/reports";
import { type SaveState, saveInputs } from "@/lib/weekly/actions";
import type { Cell, ResultSection } from "@/lib/weekly/compute";
import type { Unit } from "@/lib/weekly/template";
import { buttonPrimary, buttonSecondary, cx } from "./ui";

export interface PeriodCol {
  key: string; // "M" | "W1"..
  id: string; // stored period id
  label: string;
  range: string;
}

type W = Dictionary["weekly"];

function fmt(v: number | null, unit: Unit, locale: Locale) {
  if (v === null) return "N/A";
  const nf = (d: number) => new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: d });
  switch (unit) {
    case "vnd": {
      const a = Math.abs(v);
      if (a >= 1e9) return `${nf(2).format(v / 1e9)}${locale === "vi" ? " tỷ" : "B"}`;
      if (a >= 1e6) return `${nf(1).format(v / 1e6)}${locale === "vi" ? " tr" : "M"}`;
      return nf(0).format(v);
    }
    case "pct":
      return `${nf(1).format(v * 100)}%`;
    case "x":
      return nf(2).format(v);
    case "h":
      return nf(1).format(v);
    default:
      return nf(0).format(v);
  }
}

const full = (v: number | null, locale: Locale) =>
  v === null ? undefined : new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 4 }).format(v);

const th = "px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-muted whitespace-nowrap";
const inputCls =
  "h-8 w-28 rounded-md border border-warning/40 bg-warning-soft px-2 text-right text-[13px] text-ink outline-none focus:border-ink tabular";

export function WeeklyReport({
  storeId,
  month,
  sections,
  periods,
  typed,
  health,
  review,
  canEdit,
  locale,
  t,
}: {
  storeId: string;
  month: string;
  sections: ResultSection[];
  periods: PeriodCol[];
  typed: Record<string, string>; // "periodId|field" -> raw typed value
  health: { key: string; label: L; target: string }[];
  review: { key: string; label: L }[];
  canEdit: boolean;
  locale: Locale;
  t: W;
}) {
  const [editing, setEditing] = useState(false);
  const [focus, setFocus] = useState("all");
  const [state, action, pending] = useActionState<SaveState, FormData>(saveInputs, null);
  const shown = periods.filter((p) => focus === "all" || p.key === "M" || p.key === focus);
  const weeks = periods.filter((p) => p.key !== "M");

  const numCell = (periodId: string, field: string, cell: Cell, kind: "plan" | "actual", unit: Unit) => {
    const v = kind === "plan" ? cell.plan : cell.actual;
    const fromWeeks = kind === "plan" ? cell.planFromWeeks : cell.actualFromWeeks;
    if (editing) {
      return (
        <input
          name={`n|${periodId}|${field}|`}
          defaultValue={typed[`${periodId}|${field}`] ?? ""}
          placeholder={v === null ? "" : fmt(v, unit, locale)}
          inputMode="decimal"
          className={inputCls}
        />
      );
    }
    return (
      <span title={full(v, locale)} className={cx(v === null && "text-muted")}>
        {fmt(v, unit, locale)}
        {fromWeeks && <span className="ml-0.5 text-[10px] text-muted" title={t.sumOfWeeks}>Σ</span>}
      </span>
    );
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="month" value={month} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[{ key: "all", label: locale === "vi" ? "Tất cả tuần" : "All weeks" }, ...weeks.map((w) => ({ key: w.key, label: w.label }))].map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setFocus(o.key)}
              className={cx(
                "rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
                focus === o.key ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {state?.ok && !pending && <span className="text-[13px] text-success">{t.savedInputs}</span>}
            {state && !state.ok && <span className="text-[13px] text-warning">{state.error}</span>}
            {editing && (
              <button disabled={pending} className={buttonPrimary}>
                {t.saveInputs}
              </button>
            )}
            <button type="button" className={buttonSecondary} onClick={() => setEditing((e) => !e)}>
              {editing ? t.stopEdit : t.edit}
            </button>
          </div>
        )}
      </div>
      <p className="text-[12.5px] text-muted">{t.legend}</p>

      {sections.map((s) => (
        <section key={s.key} className="rounded-2xl border border-hairline-strong bg-canvas">
          <h3 className="border-b border-hairline px-4 py-3 text-base font-semibold text-ink">{s.title[locale]}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-hairline">
                  <th rowSpan={2} className={cx(th, "sticky left-0 z-10 min-w-56 bg-canvas text-left")} />
                  {shown.map((p) => (
                    <th key={p.key} colSpan={3} className={cx(th, "border-l border-hairline text-center normal-case tracking-normal")}>
                      <div className="text-[12px] text-ink">{p.label}</div>
                      <div className="font-normal">{p.range}</div>
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-hairline">
                  {shown.map((p) => (
                    <Fragment key={p.key}>
                      <th className={cx(th, "border-l border-hairline text-right")}>{t.plan}</th>
                      <th className={cx(th, "text-right")}>{t.actual}</th>
                      <th className={cx(th, "text-right")}>{t.rate}</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.groups.map((g, gi) => (
                  <Fragment key={gi}>
                    <tr className="bg-panel">
                      <td colSpan={1 + shown.length * 3} className="sticky left-0 px-3 py-1.5 text-[12px] font-semibold text-ink">
                        {g.title[locale]}
                      </td>
                    </tr>
                    {g.rows.map((r) => (
                      <tr key={r.key} className="border-t border-hairline align-top">
                        <td className="sticky left-0 z-10 bg-canvas px-3 py-1.5" style={{ paddingLeft: 12 + r.level * 14 }}>
                          <div className={cx(r.level === 0 ? "font-medium text-ink" : "text-body")}>{r.label[locale]}</div>
                          {r.note && <div className="mt-0.5 max-w-72 text-[11.5px] leading-snug text-warning">{r.note[locale]}</div>}
                        </td>
                        {shown.map((p) => {
                          const c = r.cells[p.key];
                          return (
                            <Fragment key={p.key}>
                              <td className={cx("tabular border-l border-hairline px-2 py-1.5 text-right whitespace-nowrap", r.planEditable && !editing && "bg-warning-soft/40")}>
                                {r.planEditable ? numCell(p.id, `plan:${r.key}`, c, "plan", r.unit) : <span className={cx(c.plan === null && "text-muted")}>{fmt(c.plan, r.unit, locale)}</span>}
                              </td>
                              <td className={cx("tabular px-2 py-1.5 text-right whitespace-nowrap", r.actualEditable && !editing && "bg-warning-soft/40")}>
                                {r.actualEditable ? numCell(p.id, `act:${r.key}`, c, "actual", r.unit) : <span title={full(c.actual, locale)} className={cx(c.actual === null && "text-muted")}>{fmt(c.actual, r.unit, locale)}</span>}
                              </td>
                              <td className={cx("tabular px-2 py-1.5 text-right whitespace-nowrap", c.rate === null && "text-muted")}>
                                {c.rate === null ? "N/A" : `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 1 }).format(c.rate * 100)}%`}
                              </td>
                            </Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-hairline-strong bg-canvas">
        <div className="border-b border-hairline px-4 py-3">
          <h3 className="text-base font-semibold text-ink">{t.health}</h3>
          <p className="text-[12.5px] text-muted">{t.healthHint}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className={cx(th, "sticky left-0 min-w-56 bg-canvas text-left")} />
                <th className={cx(th, "text-left")}>{t.target}</th>
                {weeks.map((w) => (
                  <th key={w.key} className={cx(th, "border-l border-hairline text-left normal-case tracking-normal")}>
                    <div className="text-[12px] text-ink">{w.label}</div>
                    <div className="font-normal">{w.range}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {health.map((h) => (
                <tr key={h.key} className="border-t border-hairline">
                  <td className="sticky left-0 bg-canvas px-3 py-1.5 text-ink">{h.label[locale]}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-body">{h.target || "-"}</td>
                  {weeks.map((w) => {
                    const v = typed[`${w.id}|health:${h.key}`] ?? "";
                    return (
                      <td key={w.key} className="border-l border-hairline px-2 py-1.5">
                        {editing ? (
                          <input name={`t|${w.id}|health:${h.key}|`} defaultValue={v} className={cx(inputCls, "w-24 text-left")} />
                        ) : (
                          <span className={cx(!v && "text-muted")}>{v || "N/A"}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-hairline-strong bg-canvas">
        <h3 className="border-b border-hairline px-4 py-3 text-base font-semibold text-ink">{t.review}</h3>
        <div className="divide-y divide-hairline">
          {weeks
            .filter((w) => focus === "all" || w.key === focus)
            .map((w) => (
              <div key={w.key} className="px-4 py-3">
                <div className="mb-2 text-sm font-semibold text-ink">
                  {w.label} <span className="font-normal text-muted">({w.range})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr>
                        <th className={cx(th, "w-44 text-left")} />
                        <th className={cx(th, "text-left")}>{t.reviewDone}</th>
                        <th className={cx(th, "text-left")}>{t.reviewIssue}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {review.map((item) => (
                          <tr key={item.key} className="border-t border-hairline align-top">
                            <td className="px-2 py-1.5 font-medium text-ink">{item.label[locale]}</td>
                            {(["done", "issue"] as const).map((part) => {
                              const v = typed[`${w.id}|review:${item.key}:${part}`] ?? "";
                              return (
                                <td key={part} className="min-w-64 px-2 py-1.5">
                                  {editing ? (
                                    <textarea
                                      name={`t|${w.id}|review:${item.key}:${part}|`}
                                      defaultValue={v}
                                      rows={3}
                                      className="w-full rounded-md border border-warning/40 bg-warning-soft p-2 text-[13px] text-ink outline-none focus:border-ink"
                                    />
                                  ) : (
                                    <span className={cx("whitespace-pre-line", !v && "text-muted")}>{v || "N/A"}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      </section>

      {editing && (
        <div className="sticky bottom-3 flex justify-end">
          <button disabled={pending} className={cx(buttonPrimary, "shadow-lg")}>
            {t.saveInputs}
          </button>
        </div>
      )}
    </form>
  );
}
