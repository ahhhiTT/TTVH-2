import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { Card, Notice, PageHeader, StatusLabel, Tbd, td, tdNum, th } from "@/components/ui";
import { getData } from "@/lib/data/dataset";
import { money, pct } from "@/lib/format";
import { canOpen } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { personRows } from "@/lib/views";

export default async function PeoplePage() {
  const user = await requireUser();
  const d = await getData();
  if (!canOpen(user, "people")) notFound();
  // Staff only see themselves, so go straight to their own profile.
  if (user.role === "staff") redirect(`/people/${user.id}`);
  const { locale, t } = await getI18n();
  const rows = personRows(d, user).sort((a, b) => a.person.id.localeCompare(b.person.id));

  return (
    <>
      <PageHeader
        accent={MODULE_META.people.accent}
        title={t.people.title}
        subtitle={`${t.people.subtitle}. ${rows.length} ${t.common.people.toLowerCase()}.`}
      />
      <Card index={1} padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-hairline">
              <tr>
                <th className={th}>{t.common.people}</th>
                <th className={th}>{t.common.role}</th>
                <th className={th}>{t.common.team}</th>
                <th className={th}>{t.common.level}</th>
                <th className={`${th} text-right`}>{t.people.storeCount}</th>
                <th className={`${th} text-right`}>{t.common.workload}</th>
                <th className={`${th} text-right`}>
                  {t.people.weighted}
                  <Tbd />
                </th>
                <th className={`${th} text-right`}>
                  {t.common.achievement}
                  <Tbd />
                </th>
                <th className={th}>{t.common.pace}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((r) => {
                const has = r.items.length > 0;
                return (
                  <tr key={r.person.id} className="hover:bg-canvas-soft">
                    <td className={`${td} min-w-40`}>
                      <Link href={`/people/${r.person.id}`} className="font-medium hover:text-link">
                        {r.person.name}
                      </Link>
                      <div className="text-[13px] text-muted">{r.person.title}</div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-body`}>{t.roles[r.person.role]}</td>
                    <td className={`${td} whitespace-nowrap text-body`}>{d.getTeam(r.person.teamId)?.name ?? t.common.none}</td>
                    <td className={`${td} text-body`}>{r.person.level}</td>
                    <td className={tdNum(false)}>{r.items.length}</td>
                    <td className={tdNum(!has)}>{has ? `${r.workload}%` : t.common.none}</td>
                    <td className={tdNum(!has || r.weightedGmv === null)}>
                      {has ? money(r.weightedGmv, locale, true) : t.common.none}
                    </td>
                    <td className={tdNum(!has || r.kpis.achievement === null)}>
                      {has ? pct(r.kpis.achievement, locale, 0, true) : t.common.none}
                    </td>
                    <td className={td}>{has ? <StatusLabel status={r.status} label={t.pace[r.status]} /> : t.common.none}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-3">
        <Notice tone="warning">
          {t.common.tbdNotice} {t.common.naLegend}
        </Notice>
      </div>
    </>
  );
}
