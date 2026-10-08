import Link from "next/link";
import { notFound } from "next/navigation";
import { type CSSProperties, Suspense } from "react";
import { DailyChart } from "@/components/daily-chart";
import { MODULE_META, type Accent } from "@/components/module-meta";
import { ReportFilters } from "@/components/report-filters";
import { FlowArrow } from "@/components/svg";
import { Badge, buttonSecondary, Card, cx, EmptyState, Notice, PageHeader, StatTile, Tbd, td, tdNum, th } from "@/components/ui";
import { getData } from "@/lib/data/dataset";
import type { Channel } from "@/lib/data/types";
import { money, num, pct, ratio } from "@/lib/format";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { isIsoDate, makePeriod, PERIOD_KINDS, type PeriodKind, rangeLabel, toIso } from "@/lib/period";
import { canOpen, isLeader } from "@/lib/rbac";
import {
  breakdown,
  change,
  completeness,
  dailySeries,
  type Dimension,
  filterOptions,
  type Filters,
  scopeStores,
  targetFor,
  totals,
  type Totals,
} from "@/lib/report";
import { REPORT_SECTIONS } from "@/lib/reports";
import { getI18n, requireUser } from "@/lib/session";

const ACCENTS: Accent[] = ["blue", "cyan", "purple", "green", "orange", "pink", "blue"];
type View = "dashboard" | "template";
type SP = Record<string, string | string[] | undefined>;

const signed = (v: number | null, locale: Locale) =>
  v === null ? null : `${v > 0 ? "+" : ""}${pct(v, locale, 1)}`;

function Delta({ cur, prev, locale, label }: { cur: number | null; prev: number | null; locale: Locale; label: string }) {
  const c = signed(change(cur, prev), locale);
  return c ? (
    <span className="tabular">
      <span className="font-semibold">{c}</span> {label}
    </span>
  ) : (
    <span className="text-muted">{label}: N/A</span>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  if (!canOpen(user, "reports")) notFound();
  const sp = await searchParams;
  const { locale, t } = await getI18n();
  // The old "tools" tab now lives inside the dashboard flow.
  const view: View = sp.view === "template" ? "template" : "dashboard";
  const tabs: { key: View; label: string }[] = [
    { key: "dashboard", label: t.dash.tabDashboard },
    { key: "template", label: t.dash.tabTemplate },
  ];

  return (
    <>
      <PageHeader accent={MODULE_META.reports.accent} title={t.reports.title} subtitle={t.reports.subtitle} />
      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label={t.reports.title}>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "dashboard" ? "/reports" : `/reports?view=${tab.key}`}
            aria-current={tab.key === view ? "page" : undefined}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              tab.key === view ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {view === "dashboard" && <Dashboard sp={sp} locale={locale} t={t} />}
      {view === "template" && <Template t={t} />}
    </>
  );
}

function Template({ t }: { t: Dictionary }) {
  return (
    <Card index={1} accent="orange" title={t.dash.templateTitle} hint={<Tbd />}>
      <p className="max-w-3xl text-sm leading-relaxed text-body">{t.dash.templateBody}</p>
      <ul className="mt-4 space-y-2">
        {t.dash.templateNeeds.map((n) => (
          <li key={n} className="flex items-start gap-2.5 text-sm text-ink">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="mt-1 shrink-0 text-warning">
              <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2" />
            </svg>
            {n}
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function Dashboard({ sp, locale, t }: { sp: SP; locale: Locale; t: Dictionary }) {
  const user = await requireUser();
  const d = await getData();
  const T = t.dash;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : null);
  const kind = (PERIOD_KINDS.includes(one("period") as PeriodKind) ? one("period") : "mtd") as PeriodKind;
  const today = toIso(new Date());
  const date = one("date");
  const period = makePeriod(kind, isIsoDate(date) ? date : today, one("from") ?? undefined, one("to") ?? undefined);
  const opts = filterOptions(d, user, period);
  const pick = <V extends string>(v: string | null, allowed: V[]) => (v && allowed.includes(v as V) ? (v as V) : null);
  const leader = isLeader(user.role);
  const f: Filters = {
    platform: pick<Channel>(one("platform"), opts.platforms),
    brand: pick(one("brand"), opts.brands.map((b) => b.id)),
    store: pick(one("store"), opts.stores.map((s) => s.id)),
    operator: leader ? pick(one("operator"), opts.operators.map((o) => o.user.id)) : null,
  };
  const stores = scopeStores(opts, f);
  const ids = stores.map((s) => s.id);
  const cur = totals(d, ids, period);
  const prev = totals(d, ids, period.compare);
  const target = targetFor(d, ids, period);
  const series = dailySeries(d, ids, period);
  const dims: Dimension[] = leader ? ["platform", "brand", "store", "operator"] : ["platform", "brand", "store"];
  const by = pick<Dimension>(one("by"), dims) ?? "platform";
  const rows = breakdown(d, user, stores, period, by);
  const gaps = completeness(d, stores, period);
  // The marketplace the file tools should follow: the platform filter, or the
  // single platform left in scope (e.g. one store chosen).
  const channels = [...new Set(stores.map((s) => s.channel))];
  const toolPlatform = f.platform ?? (channels.length === 1 ? channels[0] : null);
  const scopeText = [
    f.operator ? d.getUser(f.operator)?.name : null,
    f.brand ? d.getBrand(f.brand)?.name : null,
    f.platform ? t.channel[f.platform] : null,
    f.store ? d.getStore(f.store)?.name : null,
    `${T.kinds[period.kind]} ${rangeLabel(period)}`,
  ]
    .filter(Boolean)
    .join(" / ");
  const vsLabel = `${T.compareTo} ${rangeLabel(period.compare)}`;
  const missingNote = (field: keyof Totals["missing"]) =>
    cur.missing[field] > 0
      ? T.missingDays.replace("{n}", String(cur.missing[field])).replace("{total}", String(cur.storeDays))
      : null;
  const href = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") next.set(k, v);
    for (const [k, v] of Object.entries(patch)) next.set(k, v);
    return `/reports?${next}`;
  };
  const sub = (field: keyof Totals["missing"] | null, c: number | null, p: number | null) => (
    <div className="space-y-0.5">
      <Delta cur={c} prev={p} locale={locale} label={vsLabel} />
      {field && missingNote(field) && <div className="text-muted">{missingNote(field)}</div>}
    </div>
  );
  const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

  return (
    <div className="space-y-6">
      <Suspense>
        <ReportFilters
          kinds={PERIOD_KINDS.map((k) => ({ value: k, label: T.kinds[k], hint: T.kindHint[k] }))}
          platforms={opts.platforms.map((p) => ({ value: p, label: t.channel[p] }))}
          brands={opts.brands.map((b) => ({ value: b.id, label: b.name }))}
          stores={opts.stores.map((s) => ({ value: s.id, label: s.name, brand: s.brandId, platform: s.channel }))}
          operators={leader ? opts.operators.map((o) => ({ value: o.user.id, label: o.user.name, storeIds: o.storeIds })) : null}
          labels={{
            scope: T.stepScope,
            time: T.stepTime,
            period: T.period,
            date: T.date,
            from: T.from,
            to: T.to,
            platform: T.platform,
            brand: T.brand,
            store: T.store,
            operator: T.operator,
            all: T.all,
            reset: T.reset,
          }}
          minDate={d.firstDataDate() ?? today}
          maxDate={today}
          current={{ date: period.anchor, from: period.from, to: period.to }}
        />
      </Suspense>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-body">
        <span className="font-semibold text-ink">
          {T.kinds[period.kind]}: {rangeLabel(period)}
        </span>
        <span>{vsLabel}</span>
        <span>{T.scope.replace("{stores}", String(stores.length))}</span>
        <Badge>{d.source === "supabase" ? t.source.supabase : t.source.seed}</Badge>
      </div>
      <div className="space-y-2">
        <Notice tone="warning">
          {t.common.tbdNotice} {T.compareTbd}
        </Notice>
        <Notice>{t.common.naLegend}</Notice>
      </div>

      <nav
        aria-label={T.flowNav}
        className="sticky top-16 z-20 -mx-1 flex gap-1.5 overflow-x-auto rounded-full border border-hairline-strong bg-canvas/90 p-1 backdrop-blur"
      >
        {REPORT_SECTIONS.map((section, si) => (
          <a
            key={section.id}
            href={`#flow-${section.id}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-body transition-colors hover:bg-panel hover:text-ink"
          >
            <span className="tabular text-muted">{si + 1}</span>
            {si === 0 ? T.flowOverview : section.name[locale]}
          </a>
        ))}
      </nav>

      <FlowHeader index={0} id={REPORT_SECTIONS[0].id} title={T.flowOverview} sub={T.flowOverviewSub} />
      {stores.length === 0 ? (
        <Card index={1}>
          <EmptyState>{T.noScope}</EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              featured
              index={0}
              label={t.kpi.gmv}
              value={money(cur.gmv, locale)}
              missing={cur.gmv === null}
              sub={sub("gmv", cur.gmv, prev.gmv)}
            />
            {target.applicable ? (
              <StatTile
                index={1}
                accent="green"
                tbd
                label={T.achievement}
                value={pct(target.achievement, locale, 1)}
                missing={target.achievement === null}
                sub={
                  <div className="space-y-0.5">
                    <div>
                      {T.target}: <span className="tabular text-ink">{money(target.target, locale)}</span>
                    </div>
                    {target.missing > 0 && <div className="text-muted">{T.targetMissing.replace("{n}", String(target.missing))}</div>}
                  </div>
                }
              />
            ) : (
              <StatTile index={1} accent="green" tbd label={T.target} value="TBD" missing sub={T.targetTbd} />
            )}
            <StatTile index={2} accent="blue" label={t.kpi.nmv} value={money(cur.nmv, locale)} missing={cur.nmv === null} sub={sub("nmv", cur.nmv, prev.nmv)} />
            <StatTile
              index={3}
              accent="cyan"
              label={t.kpi.orders}
              value={num(cur.orders, locale)}
              missing={cur.orders === null}
              sub={sub("orders", cur.orders, prev.orders)}
            />
            <StatTile index={4} accent="purple" tbd label={t.kpi.aov} value={money(cur.aov, locale)} missing={cur.aov === null} sub={sub(null, cur.aov, prev.aov)} />
            <StatTile
              index={5}
              accent="pink"
              label={t.kpi.traffic}
              value={num(cur.traffic, locale)}
              missing={cur.traffic === null}
              sub={sub("traffic", cur.traffic, prev.traffic)}
            />
            <StatTile index={6} accent="orange" tbd label={t.kpi.cr} value={pct(cur.cr, locale, 2)} missing={cur.cr === null} sub={sub(null, cur.cr, prev.cr)} />
            <StatTile
              index={7}
              accent="blue"
              label={t.kpi.adSpend}
              value={money(cur.adSpend, locale)}
              missing={cur.adSpend === null}
              sub={sub("adSpend", cur.adSpend, prev.adSpend)}
            />
          </div>

          <Card
            index={2}
            accent="blue"
            title={T.dailyGmv}
            hint={
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="10" height="10" aria-hidden>
                    <rect width="10" height="10" rx="2" fill="var(--chart-bar)" />
                  </svg>
                  {rangeLabel(period)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg width="12" height="10" aria-hidden>
                    <line x1="1" x2="11" y1="5" y2="5" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {rangeLabel(period.compare)}
                </span>
              </span>
            }
          >
            <DailyChart
              points={series.map((p) => ({
                label: p.date.slice(8, 10),
                title: `${dm(p.date)}/${p.date.slice(0, 4)}`,
                value: p.gmv,
                prev: p.prev,
                due: p.due,
                valueText: p.due ? money(p.gmv, locale) : T.notDue,
                prevText: money(p.prev, locale),
                note:
                  p.due && p.missingStores > 0
                    ? `${t.common.missingRows.replace("{n}", String(p.missingStores)).replace("{total}", String(ids.length))}`
                    : null,
              }))}
              labels={{ current: t.kpi.gmv, previous: T.compareTo }}
            />
            <p className="mt-2 text-[12.5px] text-muted">{T.dailyHint}</p>
          </Card>

          <Card index={3} accent="cyan" title={T.breakdown} padded={false}>
            <div className="flex flex-wrap gap-1.5 border-b border-hairline px-4 py-3 md:px-5">
              {dims.map((k) => (
                <Link
                  key={k}
                  href={href({ by: k })}
                  scroll={false}
                  aria-current={k === by ? "page" : undefined}
                  className={cx(
                    "rounded-full px-3 py-1 text-[13px] font-semibold transition-colors",
                    k === by ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
                  )}
                >
                  {T.by[k]}
                </Link>
              ))}
            </div>
            {by === "operator" && (
              <div className="px-4 pt-3 md:px-5">
                <Notice tone="warning">{T.operatorNote}</Notice>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-hairline">
                  <tr>
                    <th className={th}>{T.by[by]}</th>
                    {by !== "store" && <th className={`${th} text-right`}>{T.colStores}</th>}
                    <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                    {by !== "operator" && <th className={`${th} text-right`}>{T.colShare}</th>}
                    <th className={`${th} text-right`}>{T.colChange}</th>
                    <th className={`${th} text-right`}>{t.kpi.orders}</th>
                    <th className={`${th} text-right`}>
                      {t.kpi.aov}
                      <Tbd />
                    </th>
                    <th className={`${th} text-right`}>{t.kpi.adSpend}</th>
                    <th className={`${th} text-right`}>
                      {T.roas}
                      <Tbd />
                    </th>
                    <th className={`${th} text-right`}>{T.colMissing}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {rows.map((r) => {
                    const label = by === "platform" ? t.channel[r.key as Channel] : r.label;
                    const delta = signed(change(r.cur.gmv, r.prev.gmv), locale);
                    return (
                      <tr key={r.key}>
                        <td className={`${td} whitespace-nowrap font-medium`}>
                          {r.href ? (
                            <Link href={r.href} className="hover:text-link">
                              {label}
                            </Link>
                          ) : (
                            label
                          )}
                        </td>
                        {by !== "store" && <td className={tdNum(false)}>{r.stores}</td>}
                        <td className={tdNum(r.cur.gmv === null)}>{money(r.cur.gmv, locale, true)}</td>
                        {by !== "operator" && (
                          <td className={tdNum(r.cur.gmv === null || cur.gmv === null)}>
                            {pct(r.cur.gmv !== null && cur.gmv ? r.cur.gmv / cur.gmv : null, locale, 1, true)}
                          </td>
                        )}
                        <td className={tdNum(delta === null)}>{delta ?? "N/A"}</td>
                        <td className={tdNum(r.cur.orders === null)}>{num(r.cur.orders, locale, true)}</td>
                        <td className={tdNum(r.cur.aov === null)}>{money(r.cur.aov, locale, true)}</td>
                        <td className={tdNum(r.cur.adSpend === null)}>{money(r.cur.adSpend, locale, true)}</td>
                        <td className={tdNum(r.cur.roas === null)}>{ratio(r.cur.roas, locale, true)}</td>
                        <td className={cx(tdNum(false), r.cur.missing.gmv > 0 ? "text-warning" : "text-muted")}>
                          {r.cur.missing.gmv > 0 ? `${r.cur.missing.gmv}/${r.cur.storeDays}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card index={4} accent="orange" title={T.completeness} hint={T.completenessHint} padded={gaps.length === 0}>
            {gaps.length === 0 ? (
              <p className="text-sm text-body">{T.completenessOk}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-hairline">
                    <tr>
                      <th className={th}>{T.store}</th>
                      <th className={`${th} text-right`}>{T.colMissing}</th>
                      <th className={th}>{T.date}</th>
                      <th className={`${th} text-right`}>{T.lastData}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {gaps.slice(0, 15).map((g) => (
                      <tr key={g.store.id}>
                        <td className={`${td} whitespace-nowrap font-medium`}>
                          <Link href={`/stores/${g.store.id}`} className="hover:text-link">
                            {g.store.name}
                          </Link>
                        </td>
                        <td className={cx(tdNum(false), "text-warning")}>{g.missingDays.length}</td>
                        <td className={`${td} tabular text-body`}>
                          {g.missingDays.slice(0, 6).map(dm).join(", ")}
                          {g.missingDays.length > 6 && ", ..."}
                        </td>
                        <td className={tdNum(g.lastDate === null)}>{g.lastDate ? `${dm(g.lastDate)}/${g.lastDate.slice(0, 4)}` : T.noData}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {REPORT_SECTIONS.map((section, si) => (
        <ToolSection
          key={section.id}
          section={section}
          index={si}
          locale={locale}
          t={t}
          platform={toolPlatform}
          open={one("tool")}
          scopeText={scopeText}
          href={href}
          closeHref={href({ tool: "" })}
        />
      ))}
    </div>
  );
}

const PLATFORM_OF: Record<string, Channel> = { Shopee: "shopee", "TikTok Shop": "tiktok" };

function FlowHeader({ index, id, title, sub }: { index: number; id: string; title: string; sub: string }) {
  return (
    <div id={`flow-${id}`} className={`accent-${ACCENTS[index]} flex scroll-mt-32 items-baseline gap-3 pt-2`}>
      <span className="accent-plate tabular flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold">
        {index + 1}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-[13px] text-body">{sub}</p>
      </div>
    </div>
  );
}

// One step of the flow: the Director's tools for this part, unchanged. The shared
// platform filter decides which tools apply; the other filters are shown as the
// scope the uploaded file should match (the tools read only the uploaded file).
function ToolSection({
  section,
  index,
  locale,
  t,
  platform,
  open,
  scopeText,
  href,
  closeHref,
}: {
  section: (typeof REPORT_SECTIONS)[number];
  index: number;
  locale: Locale;
  t: Dictionary;
  platform: Channel | null;
  open: string | null;
  scopeText: string;
  href: (patch: Record<string, string>) => string;
  closeHref: string;
}) {
  const T = t.dash;
  const items = section.items.filter((it) => !platform || !it.platform || PLATFORM_OF[it.platform] === platform);
  const hidden = section.items.length - items.length;
  const active = items.find((it) => it.id === open && it.status === "ok") ?? null;
  const src = active ? (locale === "en" ? `/reports/en/${active.file}` : `/reports/${active.file}`) : null;

  return (
    <section className={`accent-${ACCENTS[index]} space-y-3`}>
      {index > 0 && <FlowHeader index={index} id={section.id} title={section.name[locale]} sub={section.sub[locale]} />}
      {index === 0 && <h3 className="pt-2 text-sm font-semibold text-ink">{T.flowToolsHere}</h3>}
      {hidden > 0 && <p className="text-[13px] text-muted">{T.hiddenByPlatform.replace("{n}", String(hidden))}</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const ok = item.status === "ok";
          const isOpen = active?.id === item.id;
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-ink">{item.label[locale]}</div>
                <span
                  className={cx(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    ok ? "accent-plate" : "border border-dashed border-hairline-strong text-muted",
                  )}
                >
                  {ok ? t.reports.ready : t.reports.waiting}
                </span>
              </div>
              {(item.group || item.platform) && (
                <div className="mt-1 text-[12px] text-muted">{[item.group, item.platform].filter(Boolean).join(" / ")}</div>
              )}
              <p className="mt-2 text-[13px] leading-relaxed text-body">{item.desc[locale]}</p>
              {ok && (
                <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--accent)]">
                  {isOpen ? T.toolOpened : t.reports.open} {!isOpen && <FlowArrow />}
                </div>
              )}
            </>
          );
          return (
            <li key={item.id} className="enter" style={{ "--i": i } as CSSProperties}>
              {ok ? (
                <Link
                  href={`${href({ tool: item.id })}#flow-${section.id}`}
                  scroll={false}
                  aria-current={isOpen ? "true" : undefined}
                  className={cx(
                    "lift block h-full rounded-lg border bg-canvas p-4",
                    isOpen ? "border-[color:var(--accent)] ring-1 ring-[color:var(--accent)]" : "border-hairline-strong",
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-lg border border-dashed border-hairline-strong bg-canvas-soft p-4 opacity-80">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {active && src && (
        <div className="enter space-y-2 rounded-2xl border border-hairline-strong bg-canvas p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">{active.label[locale]}</div>
              <div className="text-[12.5px] text-body">
                <span className="font-medium text-ink">{T.toolScope}:</span> {scopeText}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/reports/${active.id}`} className={cx(buttonSecondary, "h-9 text-[13px]")}>
                {T.toolFull}
              </Link>
              <Link href={`${closeHref}#flow-${section.id}`} scroll={false} className={cx(buttonSecondary, "h-9 text-[13px]")}>
                {T.toolClose}
              </Link>
            </div>
          </div>
          <p className="text-[12.5px] text-muted">
            {T.toolNote} {t.reports.privacy}
          </p>
          <iframe
            key={active.id}
            src={src}
            title={active.label[locale]}
            className="h-[calc(100dvh-12rem)] min-h-[560px] w-full rounded-lg border border-hairline-strong bg-white"
          />
        </div>
      )}
    </section>
  );
}
