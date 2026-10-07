import Link from "next/link";
import { MODULE_META } from "@/components/module-meta";
import { notFound, redirect } from "next/navigation";
import { Card, PageHeader, StatusLabel, td, th } from "@/components/ui";
import { getTeam } from "@/lib/data/repo";
import { money, pct } from "@/lib/format";
import { canOpen } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { personRows } from "@/lib/views";

export default async function PeoplePage() {
  const user = await requireUser();
  if (!canOpen(user, "people")) notFound();
  // Staff only see themselves, so go straight to their own profile.
  if (user.role === "staff") redirect(`/people/${user.id}`);
  const { locale, t } = await getI18n();
  const rows = personRows(user).sort((a, b) => a.person.id.localeCompare(b.person.id));

  return (
    <>
      <PageHeader icon={MODULE_META.people.icon} accent={MODULE_META.people.accent} title={t.people.title} subtitle={`${t.people.subtitle} · ${rows.length} ${t.common.people.toLowerCase()}`} />
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
                <th className={`${th} text-right`}>{t.people.weighted}</th>
                <th className={`${th} text-right`}>{t.common.achievement}</th>
                <th className={th}>{t.common.pace}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((r) => (
                <tr key={r.person.id} className="hover:bg-canvas-soft">
                  <td className={td}>
                    <Link href={`/people/${r.person.id}`} className="font-medium hover:text-link">
                      {r.person.name}
                    </Link>
                    <div className="text-[13px] text-muted">{r.person.title}</div>
                  </td>
                  <td className={`${td} text-body`}>{t.roles[r.person.role]}</td>
                  <td className={`${td} text-body`}>{getTeam(r.person.teamId)?.name ?? t.common.none}</td>
                  <td className={`${td} text-body`}>{r.person.level}</td>
                  <td className={`${td} tabular text-right`}>{r.items.length}</td>
                  <td className={`${td} tabular text-right`}>{r.items.length ? `${r.workload}%` : t.common.none}</td>
                  <td className={`${td} tabular text-right`}>{r.items.length ? money(r.weightedGmv, locale) : t.common.none}</td>
                  <td className={`${td} tabular text-right`}>{r.items.length ? pct(r.kpis.achievement, locale) : t.common.none}</td>
                  <td className={td}>{r.items.length ? <StatusLabel status={r.status} label={t.pace[r.status]} /> : t.common.none}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-[13px] text-muted">* {t.people.weightedHint}</p>
    </>
  );
}
