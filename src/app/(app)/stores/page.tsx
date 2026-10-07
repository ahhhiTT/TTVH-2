import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { Card, EmptyState, Notice, PageHeader, StatusLabel, Tbd, td, tdNum, th } from "@/components/ui";
import { money, monthLabel, pct, ratio } from "@/lib/format";
import { currentMonth } from "@/lib/metrics";
import { canOpen, isLeader } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { storeRows } from "@/lib/views";

export default async function StoresPage() {
  const user = await requireUser();
  if (!canOpen(user, "stores")) notFound();
  const { locale, t } = await getI18n();
  // Missing GMV sorts last, never as if it were 0.
  const rows = storeRows(user).sort((a, b) => (b.kpis.gmv ?? -Infinity) - (a.kpis.gmv ?? -Infinity));
  const showOwners = isLeader(user.role);

  return (
    <>
      <PageHeader
        accent={MODULE_META.stores.accent}
        title={t.stores.title}
        subtitle={`${t.stores.subtitle}. ${t.common.mtd} ${monthLabel(currentMonth(), locale)}. ${rows.length} ${t.common.stores.toLowerCase()}.`}
      />
      <Card index={1} padded={false}>
        {rows.length === 0 ? (
          <EmptyState>{t.common.noStores}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>{t.common.stores}</th>
                  <th className={th}>{t.common.channel}</th>
                  {showOwners && <th className={th}>{t.common.owner}</th>}
                  <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                  <th className={`${th} text-right`}>
                    {t.common.achievement}
                    <Tbd />
                  </th>
                  <th className={`${th} text-right`}>
                    {t.kpi.cr}
                    <Tbd />
                  </th>
                  <th className={`${th} text-right`}>
                    {t.kpi.roi}
                    <Tbd />
                  </th>
                  <th className={th}>{t.common.pace}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((r) => (
                  <tr key={r.store.id} className="hover:bg-canvas-soft">
                    <td className={`${td} min-w-44`}>
                      <Link href={`/stores/${r.store.id}`} className="font-medium hover:text-link">
                        {r.store.name}
                      </Link>
                      <div className="text-[13px] text-muted">{r.brand?.category}</div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-body`}>{t.channel[r.store.channel]}</td>
                    {showOwners && (
                      <td className={`${td} whitespace-nowrap text-body`}>
                        {r.owners.map((o) => o.name).join(", ") || t.common.none}
                      </td>
                    )}
                    <td className={tdNum(r.kpis.gmv === null)}>{money(r.kpis.gmv, locale, true)}</td>
                    <td className={tdNum(r.kpis.achievement === null)}>{pct(r.kpis.achievement, locale, 0, true)}</td>
                    <td className={tdNum(r.kpis.cr === null)}>{pct(r.kpis.cr, locale, 2, true)}</td>
                    <td className={tdNum(r.kpis.roi === null)}>{ratio(r.kpis.roi, locale, true)}</td>
                    <td className={td}>
                      <StatusLabel status={r.status} label={t.pace[r.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="mt-3">
        <Notice tone="warning">
          {t.common.tbdNotice} {t.common.naLegend}
        </Notice>
      </div>
    </>
  );
}
