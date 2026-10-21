import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { ReportTabs } from "@/components/report-tabs";
import { Card, cx, EmptyState, Notice, PageHeader } from "@/components/ui";
import { WeeklyConfig } from "@/components/weekly-config";
import { type PeriodCol, WeeklyReport } from "@/components/weekly-report";
import { WeeklyUpload } from "@/components/weekly-upload";
import { getData } from "@/lib/data/dataset";
import { canOpen, visibleStoreIds } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { evaluate, periodsOf } from "@/lib/weekly/compute";
import { loadWeekly } from "@/lib/weekly/data";
import { KIND_ORDER, KINDS } from "@/lib/weekly/kinds";
import { dm, isMonth, monthRange, weeksOfMonth } from "@/lib/weekly/periods";
import { buildTemplate, HEALTH, REVIEW_ITEMS } from "@/lib/weekly/template";

const INTERNAL = new Set(["director", "manager", "teamlead", "staff"]);

export default async function WeeklyReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  if (!canOpen(user, "reports")) notFound();
  const sp = await searchParams;
  const [d, { locale, t }] = await Promise.all([getData(), getI18n()]);
  const W = t.weekly;
  const scope = visibleStoreIds(d, user);
  // The template is the TikTok Shop one.
  const stores = d.listStores().filter((s) => scope.has(s.id) && s.channel === "tiktok").sort((a, b) => a.name.localeCompare(b.name));
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const month = isMonth(sp.month) ? sp.month : thisMonth;
  const store = stores.find((s) => s.id === sp.store) ?? stores[0] ?? null;

  const header = (
    <>
      <PageHeader accent={MODULE_META.reports.accent} title={t.reports.title} subtitle={t.reports.subtitle} />
      <ReportTabs active="weekly" t={t} />
    </>
  );
  if (!store) {
    return (
      <>
        {header}
        <Card>
          <EmptyState>{W.noStore}</EmptyState>
        </Card>
      </>
    );
  }

  const range = monthRange(month);
  const weeks = weeksOfMonth(month);
  const { facts, inputs, uploads, config } = await loadWeekly(store.id, month, range.from, range.to);
  const skus = [...new Set(facts.filter((f) => f.metric === "sku_qty").map((f) => f.dim))].sort();
  const sections = buildTemplate(config, skus);
  const result = evaluate(sections, periodsOf(month, range.from, range.to, weeks), facts, inputs);
  const canEdit = INTERNAL.has(user.role);
  const typed: Record<string, string> = {};
  for (const i of inputs) typed[`${i.period}|${i.field}`] = i.num !== null ? String(i.num) : (i.txt ?? "");
  const periodCols: PeriodCol[] = [
    { key: "M", id: month, label: `${W.monthCol} ${month.slice(5)}/${month.slice(0, 4)}`, range: `${dm(range.from)} - ${dm(range.to)}` },
    ...weeks.map((w) => ({ key: w.key, id: `${month}-${w.key}`, label: `${W.week} ${w.key.slice(1)}`, range: `${dm(w.from)} - ${dm(w.to)}` })),
  ];
  const people = new Map(d.users.map((u) => [u.id, u.name]));

  return (
    <>
      {header}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-ink">{W.title}</h2>
        <p className="text-sm text-body">{W.subtitle}</p>
      </div>

      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-hairline-strong bg-canvas p-4">
        <label className="min-w-64 flex-1">
          <span className="mb-1 block text-[12px] font-medium text-muted">{W.store}</span>
          <select name="store" defaultValue={store.id} className="h-10 w-full rounded-xl border border-hairline-strong bg-canvas px-3 text-sm text-ink">
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-[12px] font-medium text-muted">{W.month}</span>
          <input type="month" name="month" defaultValue={month} className="h-10 rounded-xl border border-hairline-strong bg-canvas px-3 text-sm text-ink" />
        </label>
        <button className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary">{W.show}</button>
      </form>

      <div className="space-y-6">
        {canEdit ? (
          <Card accent="cyan" title={W.step1} padded>
            <p className="mb-4 text-[13px] text-body">{W.step1Hint}</p>
            <WeeklyUpload storeId={store.id} storeName={store.name} config={config} monthRange={range} weeks={weeks} locale={locale} t={W} />
            <div className="mt-6">
              <div className="mb-1 text-sm font-semibold text-ink">{W.status}</div>
              <p className="mb-3 text-[12.5px] text-muted">{W.statusHint}</p>
              <ul className="grid gap-2 md:grid-cols-2">
                {KIND_ORDER.map((k) => {
                  const ups = uploads.filter((u) => u.kind === k);
                  const ok = ups.length > 0;
                  return (
                    <li key={k} className="flex items-start gap-2.5 rounded-xl border border-hairline-strong px-3 py-2 text-[13px]">
                      {ok ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="mt-1 shrink-0 text-success">
                          <circle cx="6" cy="6" r="5" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={cx("mt-1 shrink-0", KINDS[k].required ? "text-warning" : "text-muted")}>
                          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2" />
                        </svg>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-ink">
                          {KINDS[k].name[locale]}{" "}
                          <span className="font-normal text-muted">
                            ({KINDS[k].source}, {KINDS[k].required ? W.required : W.optional})
                          </span>
                        </div>
                        <div className="text-[12px] text-muted">{KINDS[k].feeds[locale]}</div>
                        <div className={cx("text-[12px]", ok ? "text-body" : KINDS[k].required ? "text-warning" : "text-muted")}>
                          {ok
                            ? ups
                                .slice(0, 3)
                                .map((u) => `${W.loaded}: ${dm(u.date_from)}-${dm(u.date_to)} ${W.by} ${people.get(u.uploaded_by ?? "") ?? "?"}`)
                                .join("; ")
                            : W.missing}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        ) : (
          <Notice>{W.readOnly}</Notice>
        )}

        {canEdit && (
          <details className="rounded-2xl border border-hairline-strong bg-canvas" open={config.selfAccounts.length === 0 || config.productLines.length === 0}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">{W.config}</summary>
            <div className="border-t border-hairline p-4">
              <p className="mb-4 text-[13px] text-body">{W.configHint}</p>
              <WeeklyConfig storeId={store.id} config={config} t={W} />
            </div>
          </details>
        )}

        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">{W.step2}</h2>
          {facts.length === 0 && (
            <div className="mb-3">
              <Notice tone="warning">{W.noData}</Notice>
            </div>
          )}
          <WeeklyReport
            storeId={store.id}
            month={month}
            sections={result}
            periods={periodCols}
            typed={typed}
            health={HEALTH}
            review={REVIEW_ITEMS}
            canEdit={canEdit}
            locale={locale}
            t={W}
          />
        </div>
      </div>
    </>
  );
}
