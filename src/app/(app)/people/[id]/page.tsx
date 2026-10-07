import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, StatTile, StatusLabel, td, th } from "@/components/ui";
import { getTeam, getUser } from "@/lib/data/repo";
import { money, pct } from "@/lib/format";
import { canOpen, canViewUser } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { personSummary } from "@/lib/views";

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const person = getUser(id);
  if (!person || !canOpen(user, "people") || !canViewUser(user, id)) notFound();
  const { locale, t } = await getI18n();
  const s = personSummary(person);
  const manager = person.managerId ? getUser(person.managerId) : null;
  const other = 100 - s.workload;

  return (
    <>
      {user.role !== "staff" && (
        <Link href="/people" className="mb-4 inline-flex items-center gap-1 text-sm text-body hover:text-ink">
          <ArrowLeft size={14} aria-hidden /> {t.common.back}
        </Link>
      )}
      <PageHeader
        title={person.name}
        subtitle={[person.title, getTeam(person.teamId)?.name, manager && `${t.settings.reportsTo}: ${manager.name}`]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="flex gap-2">
            <Badge>{t.roles[person.role]}</Badge>
            <Badge>
              {t.common.level} {person.level}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label={t.people.storeCount} value={String(s.items.length)} />
        <StatTile
          label={`${t.kpi.gmv} · ${t.common.mtd}`}
          value={money(s.kpis.gmv, locale)}
          sub={s.items.length ? <StatusLabel status={s.status} label={`${pct(s.kpis.achievement, locale)} · ${t.pace[s.status]}`} /> : undefined}
        />
        <StatTile label={t.people.weighted} value={money(s.weightedGmv, locale)} sub={t.people.weightedHint} />
        <StatTile
          label={t.common.workload}
          value={`${s.workload}%`}
          sub={other > 0 ? `${t.common.otherProjects}: ${other}%` : undefined}
        />
      </div>

      <Card title={t.people.assigned} className="mt-6" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-hairline">
              <tr>
                <th className={th}>{t.common.stores}</th>
                <th className={`${th} text-right`}>{t.common.workload}</th>
                <th className={`${th} text-right`}>{t.common.difficulty}</th>
                <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                <th className={`${th} text-right`}>{t.common.achievement}</th>
                <th className={th}>{t.common.pace}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {s.items.map((i) => (
                <tr key={i.store.id} className="hover:bg-canvas-soft">
                  <td className={td}>
                    <Link href={`/stores/${i.store.id}`} className="font-medium hover:text-link">
                      {i.store.name}
                    </Link>
                  </td>
                  <td className={`${td} tabular text-right`}>{i.assignment.workloadPct}%</td>
                  <td className={`${td} tabular text-right`}>{i.store.difficulty}/5</td>
                  <td className={`${td} tabular text-right`}>{money(i.kpis.gmv, locale)}</td>
                  <td className={`${td} tabular text-right`}>{pct(i.kpis.achievement, locale)}</td>
                  <td className={td}>
                    <StatusLabel status={i.status} label={t.pace[i.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-[13px] text-muted">* {t.common.provisional}</p>
    </>
  );
}
