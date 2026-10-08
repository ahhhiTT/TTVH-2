"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cx } from "./ui";

export interface FilterOption {
  value: string;
  label: string;
  brand?: string; // for stores: lets the store list follow the brand filter
}

export interface FilterBarProps {
  kinds: { value: string; label: string; hint: string }[];
  platforms: FilterOption[];
  brands: FilterOption[];
  stores: FilterOption[];
  operators: FilterOption[] | null; // null = viewer cannot filter by person
  labels: {
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

// One row of filters above the dashboard. Every change updates the URL, so a
// filtered view can be bookmarked or sent to someone with the same access.
export function ReportFilters(props: FilterBarProps) {
  const { labels } = props;
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const kind = sp.get("period") ?? "mtd";
  const brand = sp.get("brand") ?? "";

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const select = (key: string, label: string, options: FilterOption[], extra?: Record<string, string | null>) => (
    <label className="min-w-0">
      <span className="mb-1 block text-[12px] font-medium text-muted">{label}</span>
      <select className={control} value={sp.get(key) ?? ""} onChange={(e) => set({ [key]: e.target.value || null, ...extra })}>
        <option value="">{labels.all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  const stores = brand ? props.stores.filter((s) => s.brand === brand) : props.stores;
  const hasFilters = ["platform", "brand", "store", "operator"].some((k) => sp.get(k));

  return (
    <div className={cx("rounded-2xl border border-hairline-strong bg-canvas p-4 transition-opacity md:p-5", pending && "opacity-70")}>
      <div className="mb-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={labels.period}>
        {props.kinds.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={kind === k.value}
            title={k.hint}
            onClick={() => set({ period: k.value === "mtd" ? null : k.value })}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              kind === k.value ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {kind === "custom" ? (
          <>
            <label className="min-w-0">
              <span className="mb-1 block text-[12px] font-medium text-muted">{labels.from}</span>
              <input
                type="date"
                className={control}
                min={props.minDate}
                max={props.maxDate}
                value={sp.get("from") ?? props.current.from}
                onChange={(e) => set({ from: e.target.value || null })}
              />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[12px] font-medium text-muted">{labels.to}</span>
              <input
                type="date"
                className={control}
                min={props.minDate}
                max={props.maxDate}
                value={sp.get("to") ?? props.current.to}
                onChange={(e) => set({ to: e.target.value || null })}
              />
            </label>
          </>
        ) : (
          <label className="min-w-0 col-span-2 md:col-span-1">
            <span className="mb-1 block text-[12px] font-medium text-muted">{labels.date}</span>
            <input
              type={kind === "month" ? "month" : "date"}
              className={control}
              min={kind === "month" ? props.minDate.slice(0, 7) : props.minDate}
              max={kind === "month" ? props.maxDate.slice(0, 7) : props.maxDate}
              value={kind === "month" ? (sp.get("date") ?? props.current.date).slice(0, 7) : (sp.get("date") ?? props.current.date)}
              onChange={(e) => {
                const v = e.target.value;
                set({ date: v ? (kind === "month" ? `${v}-01` : v) : null });
              }}
            />
          </label>
        )}
        {select(
          "platform",
          labels.platform,
          props.platforms,
        )}
        {select("brand", labels.brand, props.brands, { store: null })}
        {select("store", labels.store, stores)}
        {props.operators && select("operator", labels.operator, props.operators)}
        {hasFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => set({ platform: null, brand: null, store: null, operator: null })}
              className="h-10 rounded-full px-3 text-[13px] font-semibold text-body hover:bg-panel hover:text-ink"
            >
              {labels.reset}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
