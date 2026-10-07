import { ArrowLeft, BadgeDollarSign, ChartLine, History, MousePointerClick, TrendingUp, Users } from "lucide-react";
import { MODULE_META } from "@/components/module-meta";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, StatTile, StatusLabel, td, th } from "@/components/ui";
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
  if (!store || !canViewStore(user, id)) notFound();
  const { locale, t } = await getI18n();
  const brand = getBrand(store.brandId);
  const kpis = kpisFor(new Set([id]));
  const status = paceStatus(kpis.pace);
  const team = assignmentsForStore(id).map((a) => ({ a, person: getUser(a.userId)! }));
  const history = storeHistory(id).reverse();

  return (
    <>
      <Link href="/stores" className="mb-4 inline-flex items-center gap-1 text-sm text-body hover:text-ink">
        <ArrowLeft size={14} aria-hidden /> {t.common.back}
      </Link>
      <PageHeader
        icon={MODULE_META.stores.icon}
        accent={MODULE_META.stores.accent}
        title={store.name}
        subtitle={`${brand?.name} · ${brand?.category} · ${t.channel[store.channel]}`}
        actions={
          <div className="flex gap-2">
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          featured
          index={1}
          icon={TrendingUp}
          label={`${t.kpi.gmv} · ${t.common.mtd}`}
          value={money(kpis.gmv, locale)}
          sub={<StatusLabel status={status} label={`${pct(kpis.achievement, locale)} · ${t.pace[status]}`} />}
        />
        <StatTile index={2} icon={BadgeDollarSign} accent="green" label={t.kpi.nmv} value={money(kpis.nmv, locale)} sub={`${t.kpi.orders}: ${num(kpis.orders, locale)}`} />
        <StatTile index={3} icon={MousePointerClick} accent="purple" label={t.kpi.cr} value={pct(kpis.cr, locale, 2)} sub={`${t.kpi.aov}: ${money(kpis.aov, locale)}`} />
        <StatTile index={4} icon={ChartLine} accent="orange" label={t.kpi.roi} value={ratio(kpis.roi, locale)} sub={`${t.kpi.adSpend}: ${money(kpis.adSpend, locale)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card index={5} icon={History} accent="blue" title={t.stores.history} className="lg:col-span-2" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>{t.common.month}</th>
                  <th className={`${th} text-right`}>{t.common.target}</th>
                  <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                  <th className={`${th} text-right`}>{t.common.achievement}</th>
                  <th className={`${th} text-right`}>{t.kpi.orders}</th>
                  <th className={`${th} text-right`}>{t.kpi.roi}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {history.map((m) => {
                  const k = aggregate([m], m.month);
                  return (
                    <tr key={m.month}>
                      <td className={td}>{monthLabel(m.month, locale)}</td>
                      <td className={`${td} tabular text-right text-body`}>{money(m.gmvTarget, locale)}</td>
                      <td className={`${td} tabular text-right`}>{money(m.gmv, locale)}</td>
                      <td className={`${td} tabular text-right`}>{pct(k.achievement, locale)}</td>
                      <td className={`${td} tabular text-right`}>{num(m.orders, locale)}</td>
                      <td className={`${td} tabular text-right`}>{ratio(k.roi, locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card index={6} icon={Users} accent="purple" title={t.stores.team} padded={false}>
          <ul className="divide-y divide-hairline">
            {team.map(({ a, person }) => {
              const linkable = isLeader(user.role) ? canViewUser(user, person.id) : person.id === user.id;
              return (
                <li key={person.id} className="flex items-center justify-between px-5 py-3">
                  <span>
                    {linkable ? (
                      <Link href={`/people/${person.id}`} className="text-sm font-medium hover:text-link">
                        {person.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium">{person.name}</span>
                    )}
                    <span className="block text-[13px] text-muted">{person.title}</span>
                  </span>
                  {isLeader(user.role) || person.id === user.id ? (
                    <span className="tabular text-sm text-body">
                      {t.common.workload} {a.workloadPct}%
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <p className="mt-3 text-[13px] text-muted">* {t.common.provisional}</p>
    </>
  );
}
