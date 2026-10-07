import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { Badge, Card, Notice, PageHeader, StatTile, StatusLabel, Tbd, td, tdNum, th } from "@/components/ui";
import { assignmentsForStore, getBrand, getStore, getUser } from "@/lib/data/repo";
import { money, monthLabel, num, pct, ratio } from "@/lib/format";
import { aggregate, kpisFor, paceStatus } from "@/lib/metrics";
import { canViewStore, canViewUser, isLeader } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { storeHistory } from "@/lib/views";

export default async function StoreDetailPage({ params }: PageProps<"/stores/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const store = getStore(id);
  // Same 404 for "doesn't exist" and "not allowed", so scope can't be probed.
  if (!store || store.archivedAt || !canViewStore(user, id)) notFound();
  const { locale, t } = await getI18n();
  const brand = getBrand(store.brandId);
  const kpis = kpisFor(new Set([id]));
  const status = paceStatus(kpis.pace);
  const team = assignmentsForStore(id)
    .map((a) => ({ a, person: getUser(a.userId) }))
    .filter((x) => x.person !== null);
  const history = storeHistory(id).reverse();

  return (
    <>
      <PageHeader
        back={{ href: "/stores", label: t.common.back }}
        accent={MODULE_META.stores.accent}
        title={store.name}
        subtitle={`${brand?.name}. ${brand?.category}. ${t.channel[store.channel]}.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge>{t.storeStatus[store.status]}</Badge>
            <Badge>
              {t.common.scale} {store.scale}
            </Badge>
            <Badge>
              {t.common.difficulty} {store.difficulty}/5
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <StatTile
          featured
          index={1}
          label={`${t.kpi.gmv} · ${t.common.mtd}`}
          value={money(kpis.gmv, locale)}
          missing={kpis.gmv === null}
          sub={
            <span className="flex flex-col gap-1">
              <span>
                {t.common.target} {money(kpis.gmvTarget, locale)}
                <Tbd />
              </span>
              <StatusLabel status={status} label={`${pct(kpis.achievement, locale, 0, true)} · ${t.pace[status]}`} />
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
          sub={`${t.kpi.traffic}: ${num(kpis.traffic, locale)}. ${t.kpi.aov}: ${money(kpis.aov, locale)}`}
        />
        <StatTile
          index={4}
          accent="orange"
          tbd
          label={t.kpi.roi}
          value={ratio(kpis.roi, locale)}
          missing={kpis.roi === null}
          sub={`${t.kpi.adSpend}: ${money(kpis.adSpend, locale)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card index={5} accent="blue" title={t.stores.history} className="lg:col-span-2" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>{t.common.month}</th>
                  <th className={`${th} text-right`}>{t.common.target}</th>
                  <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                  <th className={`${th} text-right`}>
                    {t.common.achievement}
                    <Tbd />
                  </th>
                  <th className={`${th} text-right`}>{t.kpi.orders}</th>
                  <th className={`${th} text-right`}>
                    {t.kpi.roi}
                    <Tbd />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {history.map((m) => {
                  const k = aggregate([m], m.month);
                  return (
                    <tr key={m.month}>
                      <td className={`${td} whitespace-nowrap`}>{monthLabel(m.month, locale)}</td>
                      <td className={tdNum(m.gmvTarget === null)}>{money(m.gmvTarget, locale, true)}</td>
                      <td className={tdNum(m.gmv === null)}>{money(m.gmv, locale, true)}</td>
                      <td className={tdNum(k.achievement === null)}>{pct(k.achievement, locale, 0, true)}</td>
                      <td className={tdNum(m.orders === null)}>{num(m.orders, locale, true)}</td>
                      <td className={tdNum(k.roi === null)}>{ratio(k.roi, locale, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card index={6} accent="purple" title={t.stores.team} padded={false}>
          <ul className="divide-y divide-hairline">
            {team.map(({ a, person }) => {
              const p = person!;
              const linkable = isLeader(user.role) ? canViewUser(user, p.id) : p.id === user.id;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 md:px-5">
                  <span className="min-w-0">
                    {linkable ? (
                      <Link href={`/people/${p.id}`} className="text-sm font-medium hover:text-link">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium">{p.name}</span>
                    )}
                    <span className="block text-[13px] text-muted">{p.title}</span>
                  </span>
                  {(isLeader(user.role) || p.id === user.id) && (
                    <span className="tabular shrink-0 text-sm text-body">
                      {t.common.workload} {a.workloadPct}%
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <div className="mt-3">
        <Notice tone="warning">
          {t.common.tbdNotice} {t.common.naLegend}
        </Notice>
      </div>
    </>
  );
}
