"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { saveConfig } from "@/lib/weekly/actions";
import type { ReportConfig } from "@/lib/weekly/kinds";
import { buttonPrimary, buttonSecondary, cx } from "./ui";

const field = "h-10 w-full min-w-0 rounded-xl border border-hairline-strong bg-canvas px-3 text-sm text-ink outline-none focus:border-ink";
const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function WeeklyConfig({ storeId, config, t }: { storeId: string; config: ReportConfig; t: Dictionary["weekly"] }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(config.selfAccounts.join(", "));
  const [lines, setLines] = useState(config.productLines.map((p) => ({ name: p.name, keywords: p.keywords.join(", ") })));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveConfig(storeId, {
            selfAccounts: split(accounts),
            productLines: lines.map((l) => ({ name: l.name, keywords: split(l.keywords) })),
          });
          setMsg(res.ok ? t.savedInputs : res.error ?? "error");
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="mb-1 block text-[13px] font-medium text-body">{t.selfAccounts}</span>
        <input className={field} value={accounts} onChange={(e) => setAccounts(e.target.value)} placeholder="kutieskinmama, kutieskinmama.review" />
      </label>
      <div>
        <div className="mb-1 text-[13px] font-medium text-body">{t.productLines}</div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input
                className={field}
                value={line.name}
                aria-label={t.lineName}
                placeholder={t.lineName}
                onChange={(e) => setLines((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className={field}
                value={line.keywords}
                aria-label={t.keywords}
                placeholder={t.keywords}
                onChange={(e) => setLines((all) => all.map((x, j) => (j === i ? { ...x, keywords: e.target.value } : x)))}
              />
              <button type="button" className={cx(buttonSecondary, "h-10")} onClick={() => setLines((all) => all.filter((_, j) => j !== i))}>
                {t.remove}
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={cx(buttonSecondary, "mt-2 h-9 text-[13px]")} onClick={() => setLines((all) => [...all, { name: "", keywords: "" }])}>
          {t.addLine}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button disabled={pending} className={buttonPrimary}>
          {t.saveConfig}
        </button>
        {msg && <span className="text-[13px] text-body">{msg}</span>}
      </div>
    </form>
  );
}
