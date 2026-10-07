import { BadgeDollarSign, CalendarClock, ChartLine, CircleAlert, CircleCheck, MousePointerClick, Store, TrendingUp, TriangleAlert, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { GmvChart } from "@/components/gmv-chart";
import { Card, EmptyState, ProgressBar, StatTile, StatusLabel, td, th } from "@/components/ui";
import { money, monthLabel, num, pct, ratio } from "@/lib/format";
import { currentMonth, kpisFor, monthElapsedShare, paceStatus, trendFor } from "@/lib/metrics";
import { hasPermission, isLeader, visibleStoreIds, visibleUserIds } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { personRows, storeRows } from "@/lib/views";
import { listStores } from "@/lib/data/repo";

export default async function OverviewPage() {
  const user = await requireUser();
  const { locale, t } = await getI18n();
  const scope = visibleStoreIds(user);
  const kpis = kpisFor(scope);
  const status = paceStatus(kpis.pace);
  const trend = trendFor(scope);
  const rows = storeRows(user);
  const behind = rows.filter((r) => r.status !== "good").sort((a, b) => a.kpis.pace - b.kpis.pace);
  const top = [...rows].sort((a, b) => b.kpis.pace - a.kpis.pace).slice(0, 5);
  const people = isLeader(user.role)
    ? personRows(user)
        .filter((p) => p.items.length > 0)
        .sort((a, b) => b.kpis.pace - a.kpis.pace)
    : [];
  const benchmark =
    !isLeader(user.role) && hasPermission(user, "benchmark:view")
      ? kpisFor(new Set(listStores().map((s) => s.id)))
      : null;

  // Greeting in Vietnam time regardless of where the server runs.
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(new Date()),
  );
  const greeting =
    hour < 11 ? t.overview.greetingMorning : hour < 18 ? t.overview.greetingAfternoon : t.overview.greetingEvening;
  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const peopleCount = visibleUserIds(user).size;
  const onTrack = rows.length - behind.length;

  return (
    <>
      <Hero
        eyebrow={`${t.overview.title} · ${t.common.mtd} ${monthLabel(currentMonth(), locale)} · ${pct(monthElapsedShare(), locale)}`}
        title={`${greeting}, ${user.name}`}
        line={`${t.overview.heroLine} ${t.overview.subtitle}.`}
        chips={[
          { icon: Store, accent: "cyan", value: String(scope.size), label: t.overview.chipStores },
          ...(peopleCount > 1 ? [{ icon: Users, accent: "purple" as const, value: String(peopleCount), label: t.overview.chipPeople }] : []),
          { icon: CircleCheck, accent: "green", value: String(onTrack), label: t.overview.chipOnTrack },
          { icon: TriangleAlert, accent: "orange", value: String(behind.length), label: t.overview.chipBehind },
          { icon: CalendarClock, accent: "blue", value: String(daysLeft), label: t.overview.daysLeft },
        ]}
      />

      {scope.size === 0 ? (
        <Card>
          <EmptyState>{t.common.noStores}</EmptyState>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              featured
              index={1}
              icon={TrendingUp}
              label={`${t.kpi.gmv} · ${t.common.mtd}`}
              value={money(kpis.gmv, locale)}
              sub={
                <span className="flex flex-col gap-2">
                  <span>
                    {t.common.target} {money(kpis.gmvTarget, locale)} · {pct(kpis.achievement, locale)}
                  </span>
                  <ProgressBar value={kpis.achievement} status={status} />
                  <StatusLabel status={status} label={t.pace[status]} />
                </span>
              }
            />
            <StatTile index={2} icon={BadgeDollarSign} accent="green" label={t.kpi.nmv} value={money(kpis.nmv, locale)} sub={`${t.kpi.orders}: ${num(kpis.orders, locale)}`} />
            <StatTile
              index={3}
              icon={MousePointerClick}
              accent="purple"
              label={`${t.kpi.cr} · ${t.kpi.aov}`}
              value={pct(kpis.cr, locale, 2)}
              sub={`${t.kpi.aov}: ${money(kpis.aov, locale)} · ${t.kpi.traffic}: ${num(kpis.traffic, locale)}`}
            />
            <StatTile
              index={4}
              icon={ChartLine}
              accent="orange"
              label={t.kpi.roi}
              value={ratio(kpis.roi, locale)}
              sub={`${t.kpi.adSpend}: ${money(kpis.adSpend, locale)}`}
            />
          </div>

          {benchmark && (
            <p className="text-[13px] text-body">
              Benchmark TTVH2: {t.common.achievement} {pct(benchmark.achievement, locale)} · {t.kpi.cr}{" "}
              {pct(benchmark.cr, locale, 2)} · {t.kpi.roi} {ratio(benchmark.roi, locale)}
            </p>
          )}
          <p className="text-[13px] text-muted">* {t.common.provisional}</p>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card index={5} icon={ChartLine} accent="blue" title={t.overview.trend} hint={t.overview.trendHint} className="lg:col-span-3">
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

            <Card index={6} icon={CircleAlert} accent="orange" title={t.overview.alerts} hint={String(behind.length)} className="lg:col-span-2" padded={false}>
              {behind.length === 0 ? (
                <EmptyState>{t.overview.alertsEmpty}</EmptyState>
              ) : (
                <ul className="max-h-[260px] divide-y divide-hairline overflow-y-auto">
                  {behind.map((r) => (
                    <li key={r.store.id}>
                      <Link
                        href={`/stores/${r.store.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-canvas-soft"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-ink">{r.store.name}</span>
                          <span className="block text-[13px] text-muted">
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
            </Card>
          </div>

          {people.length > 0 ? (
            <Card index={7} icon={Users} accent="purple" title={t.overview.peopleSummary} padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-hairline">
                    <tr>
                      <th className={th}>{t.common.people}</th>
                      <th className={th}>{t.common.stores}</th>
                      <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                      <th className={`${th} text-right`}>{t.common.achievement}</th>
                      <th className={th}>{t.common.pace}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {people.map((p) => (
                      <tr key={p.person.id} className="hover:bg-canvas-soft">
                        <td className={td}>
                          <Link href={`/people/${p.person.id}`} className="font-medium hover:text-link">
                            {p.person.name}
                          </Link>
                        </td>
                        <td className={`${td} tabular`}>{p.items.length}</td>
                        <td className={`${td} tabular text-right`}>{money(p.kpis.gmv, locale)}</td>
                        <td className={`${td} tabular text-right`}>{pct(p.kpis.achievement, locale)}</td>
                        <td className={td}>
                          <StatusLabel status={p.status} label={t.pace[p.status]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card index={7} icon={Trophy} accent="green" title={t.overview.topStores} padded={false}>
              <ul className="divide-y divide-hairline">
                {top.map((r) => (
                  <li key={r.store.id}>
                    <Link
                      href={`/stores/${r.store.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-canvas-soft"
                    >
                      <span className="text-sm font-medium">{r.store.name}</span>
                      <span className="tabular text-sm text-body">
                        {money(r.kpis.gmv, locale)} · {pct(r.kpis.achievement, locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
