import Link from "next/link";
import { MODULE_META } from "@/components/module-meta";
import { notFound } from "next/navigation";
import { Card, EmptyState, PageHeader, StatusLabel, td, th } from "@/components/ui";
import { money, monthLabel, pct, ratio } from "@/lib/format";
import { currentMonth } from "@/lib/metrics";
import { canOpen, isLeader } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { storeRows } from "@/lib/views";

export default async function StoresPage() {
  const user = await requireUser();
  if (!canOpen(user, "stores")) notFound();
  const { locale, t } = await getI18n();
  const rows = storeRows(user).sort((a, b) => b.kpis.gmv - a.kpis.gmv);
  const showOwners = isLeader(user.role);

  return (
    <>
      <PageHeader
        icon={MODULE_META.stores.icon}
        accent={MODULE_META.stores.accent}
        title={t.stores.title}
        subtitle={`${t.stores.subtitle} · ${t.common.mtd} ${monthLabel(currentMonth(), locale)} · ${rows.length} ${t.common.stores.toLowerCase()}`}
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
                  <th className={`${th} text-right`}>{t.common.achievement}</th>
                  <th className={`${th} text-right`}>{t.kpi.cr}</th>
                  <th className={`${th} text-right`}>{t.kpi.roi}</th>
                  <th className={th}>{t.common.pace}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((r) => (
                  <tr key={r.store.id} className="hover:bg-canvas-soft">
                    <td className={td}>
                      <Link href={`/stores/${r.store.id}`} className="font-medium hover:text-link">
                        {r.store.name}
                      </Link>
                      <div className="text-[13px] text-muted">{r.brand?.category}</div>
                    </td>
                    <td className={`${td} text-body`}>{t.channel[r.store.channel]}</td>
                    {showOwners && (
                      <td className={`${td} text-body`}>{r.owners.map((o) => o.name).join(", ") || t.common.none}</td>
                    )}
                    <td className={`${td} tabular text-right`}>{money(r.kpis.gmv, locale)}</td>
                    <td className={`${td} tabular text-right`}>{pct(r.kpis.achievement, locale)}</td>
                    <td className={`${td} tabular text-right`}>{pct(r.kpis.cr, locale, 2)}</td>
                    <td className={`${td} tabular text-right`}>{ratio(r.kpis.roi, locale)}</td>
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
      <p className="mt-3 text-[13px] text-muted">* {t.common.provisional}</p>
    </>
  );
}
