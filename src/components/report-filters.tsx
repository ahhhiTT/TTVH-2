"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cx } from "./ui";

export interface FilterOption {
  value: string;
  label: string;
}

export interface StoreOption extends FilterOption {
  brand: string;
  platform: string;
}

export interface OperatorOption extends FilterOption {
  storeIds: string[];
}

export interface FilterBarProps {
  kinds: { value: string; label: string; hint: string }[];
  platforms: FilterOption[];
  brands: FilterOption[];
  stores: StoreOption[];
  operators: OperatorOption[] | null; // null = viewer cannot filter by person
  labels: {
    scope: string;
    time: string;
    period: string;
    date: string;
    from: string;
    to: string;
    platform: string;
    brand: string;
    store: string;
    operator: string;
    all: string;
    reset: string;
  };
  minDate: string;
  maxDate: string;
  current: { date: string; from: string; to: string }; // the period actually shown
}

const control =
  "h-10 w-full min-w-0 rounded-xl border border-hairline-strong bg-canvas px-3 text-sm text-ink outline-none focus:border-ink";
const CHAIN = ["operator", "brand", "platform", "store"] as const;
type Key = (typeof CHAIN)[number];

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.88px] text-muted">
      <span className="tabular flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-on-primary">{n}</span>
      {children}
    </div>
  );
}

// Filters in a fixed order: person -> brand -> platform -> store, then the time
// dimension. Each choice narrows the options after it. Every change updates
// the URL, so a filtered view can be bookmarked or sent to someone with the same access.
export function ReportFilters(props: FilterBarProps) {
  const { labels } = props;
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const kind = sp.get("period") ?? "mtd";
  const val = (k: Key) => sp.get(k) ?? "";

  // Stores left after the choices made before step `upto`.
  const storesBefore = (upto: Key, picked: Record<Key, string>) => {
    let list = props.stores;
    const idx = CHAIN.indexOf(upto);
    if (idx > 0 && picked.operator && props.operators) {
      const ids = new Set(props.operators.find((o) => o.value === picked.operator)?.storeIds ?? []);
      list = list.filter((s) => ids.has(s.value));
    }
    if (idx > 1 && picked.brand) list = list.filter((s) => s.brand === picked.brand);
    if (idx > 2 && picked.platform) list = list.filter((s) => s.platform === picked.platform);
    return list;
  };
  const optionsFor = (k: Key, picked: Record<Key, string>): FilterOption[] => {
    const left = storesBefore(k, picked);
    if (k === "operator") return props.operators ?? [];
    if (k === "brand") return props.brands.filter((b) => left.some((s) => s.brand === b.value));
    if (k === "platform") return props.platforms.filter((p) => left.some((s) => s.platform === p.value));
    return left;
  };

  const push = (next: URLSearchParams) =>
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));

  const setTime = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("tool");
    push(next);
  };

  // Changing one step keeps later choices only while they are still possible.
  const setScope = (key: Key, value: string) => {
    const picked = Object.fromEntries(CHAIN.map((k) => [k, val(k)])) as Record<Key, string>;
    picked[key] = value;
    for (const k of CHAIN.slice(CHAIN.indexOf(key) + 1)) {
      if (picked[k] && !optionsFor(k, picked).some((o) => o.value === picked[k])) picked[k] = "";
    }
    const next = new URLSearchParams(sp.toString());
    for (const k of CHAIN) {
      if (picked[k]) next.set(k, picked[k]);
      else next.delete(k);
    }
    next.delete("tool");
    push(next);
  };

  const picked = Object.fromEntries(CHAIN.map((k) => [k, val(k)])) as Record<Key, string>;
  const steps = CHAIN.filter((k) => k !== "operator" || props.operators);
  const labelOf: Record<Key, string> = {
    operator: labels.operator,
    brand: labels.brand,
    platform: labels.platform,
    store: labels.store,
  };
  const hasFilters = CHAIN.some((k) => sp.get(k));

  return (
    <div className={cx("rounded-2xl border border-hairline-strong bg-canvas transition-opacity", pending && "opacity-70")}>
      <div className="p-4 md:p-5">
        <Step n={1}>{labels.scope}</Step>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((k, i) => (
            <label key={k} className="min-w-0">
              <span className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-muted">
                {i > 0 && (
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="text-muted-soft">
                    <path d="M3 2 L7 5 L3 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {labelOf[k]}
              </span>
              <select className={control} value={picked[k]} onChange={(e) => setScope(k, e.target.value)}>
                <option value="">{labels.all}</option>
                {optionsFor(k, picked).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(sp.toString());
              for (const k of CHAIN) next.delete(k);
              next.delete("tool");
              push(next);
            }}
            className="mt-3 rounded-full px-3 py-1.5 text-[13px] font-semibold text-body hover:bg-panel hover:text-ink"
          >
            {labels.reset}
          </button>
        )}
      </div>

      <div className="border-t border-hairline p-4 md:p-5">
        <Step n={2}>{labels.time}</Step>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={labels.period}>
            {props.kinds.map((k) => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                title={k.hint}
                onClick={() => setTime({ period: k.value === "mtd" ? null : k.value })}
                className={cx(
                  "h-10 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                  kind === k.value ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
          {kind === "custom" ? (
            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
              {(["from", "to"] as const).map((k) => (
                <label key={k} className="min-w-0">
                  <span className="mb-1 block text-[12px] font-medium text-muted">{labels[k]}</span>
                  <input
                    type="date"
                    className={control}
                    min={props.minDate}
                    max={props.maxDate}
                    value={sp.get(k) ?? props.current[k]}
                    onChange={(e) => setTime({ [k]: e.target.value || null })}
                  />
                </label>
              ))}
            </div>
          ) : (
            <label className="min-w-0 w-full sm:w-48">
              <span className="mb-1 block text-[12px] font-medium text-muted">{labels.date}</span>
              <input
                type={kind === "month" ? "month" : "date"}
                className={control}
                min={kind === "month" ? props.minDate.slice(0, 7) : props.minDate}
                max={kind === "month" ? props.maxDate.slice(0, 7) : props.maxDate}
                value={kind === "month" ? (sp.get("date") ?? props.current.date).slice(0, 7) : (sp.get("date") ?? props.current.date)}
                onChange={(e) => {
                  const v = e.target.value;
                  setTime({ date: v ? (kind === "month" ? `${v}-01` : v) : null });
                }}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
