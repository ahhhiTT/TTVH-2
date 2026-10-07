import Link from "next/link";
import type { CSSProperties } from "react";
import { GmvChart } from "@/components/gmv-chart";
import { MODULE_META, type Accent } from "@/components/module-meta";
import { Card, EmptyState, Notice, PageHeader, ProgressBar, StatTile, StatusLabel, Tbd, td, tdNum, th } from "@/components/ui";
import { listStores } from "@/lib/data/repo";
import { money, monthLabel, num, pct, ratio } from "@/lib/format";
import { currentMonth, kpisFor, monthElapsedShare, paceStatus, trendFor } from "@/lib/metrics";
import { canOpen, hasPermission, isLeader, visibleStoreIds } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { personRows, storeRows } from "@/lib/views";

export default async function OverviewPage() {
  const user = await requireUser();
  const { locale, t } = await getI18n();
  const scope = visibleStoreIds(user);
  const kpis = kpisFor(scope);
  const status = paceStatus(kpis.pace);
  const trend = trendFor(scope);
  const rows = storeRows(user);
  // Rows with unknown pace sort last; they are not counted as "behind".
  const byPace = (a: { kpis: { pace: number | null } }, b: { kpis: { pace: number | null } }) =>
    (a.kpis.pace ?? Infinity) - (b.kpis.pace ?? Infinity);
  const below = rows.filter((r) => r.kpis.pace !== null && r.kpis.pace < 1).sort(byPace);
  const unknown = rows.filter((r) => r.kpis.pace === null).length;
  const people = isLeader(user.role)
    ? personRows(user)
        .filter((p) => p.items.length > 0)
        .sort((a, b) => (b.kpis.pace ?? -1) - (a.kpis.pace ?? -1))
    : [];
  const benchmark =
    !isLeader(user.role) && hasPermission(user, "benchmark:view") ? kpisFor(new Set(listStores().map((s) => s.id))) : null;
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const missingNote = (n: number) =>
    n > 0 ? t.common.missingRows.replace("{n}", String(n)).replace("{total}", String(kpis.rows)) : undefined;

  const chips: { accent: Accent; value: string; label: string }[] = [
    { accent: "cyan", value: String(scope.size), label: t.common.stores.toLowerCase() },
    { accent: "blue", value: pct(monthElapsedShare(), locale), label: t.overview.monthElapsed },
    { accent: "purple", value: String(daysLeft), label: t.overview.daysLeft },
  ];

  return (
    <>
      <PageHeader
        accent={MODULE_META.overview.accent}
        title={t.overview.title}
        subtitle={`${t.overview.subtitle}. ${t.common.mtd} ${monthLabel(currentMonth(), locale)}.`}
      />

      <ul className="-mt-2 mb-6 flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <li
            key={c.label}
            className={`accent-${c.accent} enter flex items-center gap-2 rounded-full border border-hairline-strong bg-canvas py-1.5 pr-3.5 pl-2.5`}
            style={{ "--i": i } as CSSProperties}
          >
            <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
            <span className="tabular text-sm font-semibold text-ink">{c.value}</span>
            <span className="text-[13px] text-body">{c.label}</span>
          </li>
        ))}
      </ul>

      {scope.size === 0 ? (
        <Card>
          <EmptyState>{t.common.noStores}</EmptyState>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            <StatTile
              featured
              index={1}
              label={`${t.kpi.gmv} · ${t.common.mtd}`}
              value={money(kpis.gmv, locale)}
              missing={kpis.gmv === null}
              sub={
                <span className="flex flex-col gap-2">
                  <span>
                    {t.common.target} {money(kpis.gmvTarget, locale)}
                    {kpis.achievement !== null && ` (${pct(kpis.achievement, locale)})`}
                    <Tbd />
                  </span>
                  <ProgressBar value={kpis.achievement} status={status} />
                  <StatusLabel status={status} label={t.pace[status]} />
                  {missingNote(kpis.missing.gmvTarget) && <span>{missingNote(kpis.missing.gmvTarget)}</span>}
                </span>
              }
            />
            <StatTile
              index={2}
              accent="green"
              label={t.kpi.nmv}
              value={money(kpis.nmv, locale)}
              missing={kpis.nmv === null}
              sub={`${t.kpi.orders}: ${num(kpis.orders, locale)}`}
            />
            <StatTile
              index={3}
              accent="purple"
              tbd
              label={t.kpi.cr}
              value={pct(kpis.cr, locale, 2)}
              missing={kpis.cr === null}
              sub={
                <span className="flex flex-col gap-0.5">
                  <span>
                    {t.kpi.aov}: {money(kpis.aov, locale)}. {t.kpi.traffic}: {num(kpis.traffic, locale)}
                  </span>
                  {missingNote(kpis.missing.traffic) && <span>{missingNote(kpis.missing.traffic)}</span>}
                </span>
              }
            />
            <StatTile
              index={4}
              accent="orange"
              tbd
              label={t.kpi.roi}
              value={ratio(kpis.roi, locale)}
              missing={kpis.roi === null}
              sub={
                <span className="flex flex-col gap-0.5">
                  <span>
                    {t.kpi.adSpend}: {money(kpis.adSpend, locale)}
                  </span>
                  {missingNote(kpis.missing.adSpend) && <span>{missingNote(kpis.missing.adSpend)}</span>}
                </span>
              }
            />
          </div>

          {benchmark && (
            <p className="text-[13px] text-body">
              Benchmark TTVH2: {t.common.achievement} {pct(benchmark.achievement, locale)}. {t.kpi.cr}{" "}
              {pct(benchmark.cr, locale, 2)}. {t.kpi.roi} {ratio(benchmark.roi, locale)}.
            </p>
          )}
          <Notice tone="warning">
            {t.common.tbdNotice}{" "}
            {canOpen(user, "settings") && (
              <Link href="/settings#definitions" className="underline underline-offset-2">
                {t.common.viewDefinitions}
              </Link>
            )}
          </Notice>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card index={5} accent="blue" title={t.overview.trend} hint={t.overview.trendHint} className="lg:col-span-3">
              <GmvChart
                labels={{ actual: t.common.actual, target: t.common.target, achievement: t.common.achievement }}
                points={trend.map((p) => ({
                  label: monthLabel(p.month, locale),
                  gmv: p.gmv,
                  target: p.gmvTarget,
                  gmvText: money(p.gmv, locale),
                  targetText: money(p.gmvTarget, locale),
                  achievementText: pct(p.achievement, locale),
                }))}
              />
            </Card>

            <Card
              index={6}
              accent="orange"
              title={t.overview.alerts}
              hint={<Tbd />}
              className="lg:col-span-2"
              padded={false}
            >
              {below.length === 0 ? (
                <EmptyState>{t.overview.alertsEmpty}</EmptyState>
              ) : (
                <ul className="max-h-[300px] divide-y divide-hairline overflow-y-auto">
                  {below.map((r) => (
                    <li key={r.store.id}>
                      <Link
                        href={`/stores/${r.store.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas-soft md:px-5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{r.store.name}</span>
                          <span className="block truncate text-[13px] text-muted">
                            {r.owners.map((o) => o.name).join(", ") || t.common.none}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="tabular block text-sm text-ink">{pct(r.kpis.pace, locale)}</span>
                          <StatusLabel status={r.status} label={t.pace[r.status]} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {unknown > 0 && (
                <p className="border-t border-hairline px-4 py-2.5 text-[12px] text-muted md:px-5">
                  {unknown} {t.common.stores.toLowerCase()}: {t.pace.unknown.toLowerCase()} ({t.common.target}: N/A)
                </p>
              )}
            </Card>
          </div>

          {people.length > 0 && (
            <Card index={7} accent="purple" title={t.overview.peopleSummary} padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-hairline">
                    <tr>
                      <th className={th}>{t.common.people}</th>
                      <th className={`${th} text-right`}>{t.common.stores}</th>
                      <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                      <th className={`${th} text-right`}>{t.common.achievement}</th>
                      <th className={th}>{t.common.pace}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {people.map((p) => (
                      <tr key={p.person.id} className="hover:bg-canvas-soft">
                        <td className={`${td} whitespace-nowrap`}>
                          <Link href={`/people/${p.person.id}`} className="font-medium hover:text-link">
                            {p.person.name}
                          </Link>
                        </td>
                        <td className={tdNum(false)}>{p.items.length}</td>
                        <td className={tdNum(p.kpis.gmv === null)}>{money(p.kpis.gmv, locale, true)}</td>
                        <td className={tdNum(p.kpis.achievement === null)}>{pct(p.kpis.achievement, locale, 0, true)}</td>
                        <td className={td}>
                          <StatusLabel status={p.status} label={t.pace[p.status]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
