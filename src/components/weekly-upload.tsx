"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { fmtNumber } from "@/lib/format";
import { saveUpload } from "@/lib/weekly/actions";
import { type FileKind, KINDS, type ParsedFile, type ReportConfig } from "@/lib/weekly/kinds";
import { dm, type WeekRange } from "@/lib/weekly/periods";
import { buttonPrimary, cx } from "./ui";

type W = Dictionary["weekly"];

interface Item extends ParsedFile {
  include: boolean;
  period: string; // "M" or "W1".. for period exports
}

const LIVE: FileKind[] = ["live_self", "live_aff"];

// Live files share one format; switching the type renames the metrics.
function asKind(item: Item, kind: FileKind): Item {
  if (!LIVE.includes(kind) || item.kind === kind) return { ...item, kind };
  const [from, to] = kind === "live_aff" ? ["lself_", "laff_"] : ["laff_", "lself_"];
  return {
    ...item,
    kind,
    facts: item.facts.filter((f) => f.metric !== "lself_hours_file").map((f) => ({ ...f, metric: f.metric.replace(from, to) })),
  };
}

export function WeeklyUpload({
  storeId,
  storeName,
  config,
  monthRange,
  weeks,
  locale,
  t,
}: {
  storeId: string;
  storeName: string;
  config: ReportConfig;
  monthRange: { from: string; to: string };
  weeks: WeekRange[];
  locale: Locale;
  t: W;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [unknown, setUnknown] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [saving, startSaving] = useTransition();

  async function read(files: File[]) {
    if (!files.length) return;
    setReading(true);
    setMessages([]);
    const { parseFile } = await import("@/lib/weekly/parse");
    const found: Item[] = [];
    const missed: string[] = [];
    for (const file of files) {
      try {
        const parsed = await parseFile(file, { storeName, config });
        if (!parsed.length) missed.push(file.name);
        found.push(...parsed.map((p) => checkStore({ ...p, include: p.rows > 0, period: "M" })));
      } catch {
        missed.push(file.name);
      }
    }
    setItems((prev) => [...prev, ...found]);
    setUnknown(missed);
    setReading(false);
  }

  // Shop-side accounts in the file must belong to the selected store.
  function checkStore(item: Item): Item {
    if (!item.accounts?.length) return item;
    const own = config.selfAccounts.map((a) => a.trim().toLowerCase());
    const seen = item.accounts.join(", ");
    if (!own.length) return { ...item, warnings: [...item.warnings, `no_config:${seen}`] };
    if (item.accounts.some((a) => own.includes(a))) return item;
    return { ...item, include: false, warnings: [...item.warnings, `wrong_store:${seen}`] };
  }

  const range = (item: Item) => {
    if (!item.needsPeriod) return { from: item.from, to: item.to };
    if (item.period === "M") return monthRange;
    const w = weeks.find((x) => x.key === item.period)!;
    return { from: w.from, to: w.to };
  };

  function save() {
    startSaving(async () => {
      const out: string[] = [];
      let n = 0;
      for (const item of items.filter((i) => i.include)) {
        const { from, to } = range(item);
        const facts = item.needsPeriod ? item.facts.map((f) => ({ ...f, from, to })) : item.facts;
        const res = await saveUpload(storeId, { kind: item.kind, fileName: `${item.fileName} / ${item.sheet}`, from, to, rows: item.rows, facts });
        if (res.ok) n++;
        else out.push(t.saveError.replace("{file}", item.fileName).replace("{error}", res.error));
      }
      if (n) out.unshift(t.saved.replace("{n}", String(n)));
      setMessages(out);
      setItems([]);
      router.refresh();
    });
  }

  const warn = (w: string) => {
    const i = w.indexOf(":");
    const key = i < 0 ? w : w.slice(0, i);
    const n = i < 0 ? "" : w.slice(i + 1);
    const text = (t.warn as Record<string, string>)[key] ?? w;
    return text.replace("{n}", n).replace("{store}", storeName);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          read(Array.from(e.dataTransfer.files));
        }}
        className={cx(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          drag ? "border-ink bg-panel" : "border-hairline-strong hover:bg-canvas-soft",
        )}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="text-muted">
          <path d="M14 18V5M8 11l6-6 6 6M5 19v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-medium text-ink">{reading ? t.reading : t.drop}</span>
        <span className="text-[12px] text-muted">.xlsx, .xls, .csv</span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          // Copy first: clearing the input empties its live FileList.
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          read(files);
        }}
      />

      {unknown.length > 0 && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-[13px] text-warning">{t.unknown.replace("{files}", unknown.join(", "))}</p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-hairline-strong">
          <table className="w-full text-[13px]">
            <thead className="border-b border-hairline text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
              <tr>
                <th className="px-3 py-2">{t.colInclude}</th>
                <th className="px-3 py-2">{t.colFile}</th>
                <th className="px-3 py-2">{t.colKind}</th>
                <th className="px-3 py-2">{t.colRange}</th>
                <th className="px-3 py-2 text-right">{t.colRows}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {items.map((item, i) => (
                <tr key={`${item.fileName}-${item.sheet}-${i}`} className="align-top">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={item.include}
                      onChange={(e) => setItems((all) => all.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-ink">{item.fileName}</div>
                    <div className="text-muted">{item.sheet}</div>
                  </td>
                  <td className="px-3 py-2">
                    {LIVE.includes(item.kind) ? (
                      <select
                        value={item.kind}
                        onChange={(e) => setItems((all) => all.map((x, j) => (j === i ? asKind(x, e.target.value as FileKind) : x)))}
                        className="rounded-lg border border-hairline-strong bg-canvas px-2 py-1 text-ink"
                      >
                        {LIVE.map((k) => (
                          <option key={k} value={k}>
                            {KINDS[k].name[locale]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-ink">{KINDS[item.kind].name[locale]}</span>
                    )}
                    {item.warnings.map((w) => (
                      <div key={w} className="mt-1 text-[12px] text-warning">
                        {warn(w)}
                      </div>
                    ))}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.needsPeriod ? (
                      <label className="block">
                        <span className="mb-1 block text-[12px] text-muted">{t.periodPick}</span>
                        <select
                          value={item.period}
                          onChange={(e) => setItems((all) => all.map((x, j) => (j === i ? { ...x, period: e.target.value } : x)))}
                          className="rounded-lg border border-hairline-strong bg-canvas px-2 py-1 text-ink"
                        >
                          <option value="M">
                            {t.wholeMonth} ({dm(monthRange.from)} - {dm(monthRange.to)})
                          </option>
                          {weeks.map((w) => (
                            <option key={w.key} value={w.key}>
                              {t.week} {w.key.slice(1)} ({dm(w.from)} - {dm(w.to)})
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : item.from ? (
                      <span className="tabular">
                        {dm(item.from)}/{item.from.slice(0, 4)} - {dm(item.to)}/{item.to.slice(0, 4)}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="tabular px-3 py-2 text-right">{fmtNumber(item.rows)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-hairline p-3">
            <button type="button" disabled={saving || !items.some((i) => i.include)} onClick={save} className={buttonPrimary}>
              {saving ? t.saving : t.save.replace("{store}", storeName)}
            </button>
          </div>
        </div>
      )}

      {messages.map((m) => (
        <p key={m} className="rounded-lg border border-hairline-strong px-3 py-2 text-[13px] text-body">
          {m}
        </p>
      ))}
    </div>
  );
}
