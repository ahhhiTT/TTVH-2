import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { Badge, Card, Notice, PageHeader, StatTile, StatusLabel, Tbd, td, tdNum, th } from "@/components/ui";
import { getTeam, getUser } from "@/lib/data/repo";
import { money, pct } from "@/lib/format";
import { canOpen, canViewUser } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { personSummary } from "@/lib/views";

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const person = getUser(id);
  if (!person || person.archivedAt || !canOpen(user, "people") || !canViewUser(user, id)) notFound();
  const { locale, t } = await getI18n();
  const s = personSummary(person);
  const manager = person.managerId ? getUser(person.managerId) : null;
  const other = 100 - s.workload;
  const has = s.items.length > 0;

  return (
    <>
      <PageHeader
        back={user.role !== "staff" ? { href: "/people", label: t.common.back } : undefined}
        accent={MODULE_META.people.accent}
        title={person.name}
        subtitle={[person.title, getTeam(person.teamId)?.name, manager && `${t.settings.reportsTo}: ${manager.name}`]
          .filter(Boolean)
          .join(". ")}
        actions={
          <div className="flex gap-2">
            <Badge>{t.roles[person.role]}</Badge>
            <Badge>
              {t.common.level} {person.level}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatTile index={1} accent="cyan" label={t.people.storeCount} value={String(s.items.length)} />
        <StatTile
          featured
          index={2}
          label={`${t.kpi.gmv} · ${t.common.mtd}`}
          value={has ? money(s.kpis.gmv, locale) : t.common.none}
          missing={!has || s.kpis.gmv === null}
          sub={
            has ? (
              <StatusLabel status={s.status} label={`${pct(s.kpis.achievement, locale, 0, true)} · ${t.pace[s.status]}`} />
            ) : undefined
          }
        />
        <StatTile
          index={3}
          accent="purple"
          tbd
          label={t.people.weighted}
          value={has ? money(s.weightedGmv, locale) : t.common.none}
          missing={!has || s.weightedGmv === null}
        />
        <StatTile
          index={4}
          accent="orange"
          label={t.common.workload}
          value={`${s.workload}%`}
          sub={other > 0 ? `${t.common.otherProjects}: ${other}%` : undefined}
        />
      </div>

      {has && (
        <Card index={5} accent="cyan" title={t.people.assigned} className="mt-6" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>{t.common.stores}</th>
                  <th className={`${th} text-right`}>{t.common.workload}</th>
                  <th className={`${th} text-right`}>{t.common.difficulty}</th>
                  <th className={`${th} text-right`}>{t.kpi.gmv}</th>
                  <th className={`${th} text-right`}>
                    {t.common.achievement}
                    <Tbd />
                  </th>
                  <th className={th}>{t.common.pace}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {s.items.map((i) => (
                  <tr key={i.store.id} className="hover:bg-canvas-soft">
                    <td className={`${td} min-w-44`}>
                      <Link href={`/stores/${i.store.id}`} className="font-medium hover:text-link">
                        {i.store.name}
                      </Link>
                    </td>
                    <td className={tdNum(false)}>{i.assignment.workloadPct}%</td>
                    <td className={tdNum(false)}>{i.store.difficulty}/5</td>
                    <td className={tdNum(i.kpis.gmv === null)}>{money(i.kpis.gmv, locale, true)}</td>
                    <td className={tdNum(i.kpis.achievement === null)}>{pct(i.kpis.achievement, locale, 0, true)}</td>
                    <td className={td}>
                      <StatusLabel status={i.status} label={t.pace[i.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="mt-3">
        <Notice tone="warning">
          {t.common.tbdNotice} {t.common.naLegend}
        </Notice>
      </div>
    </>
  );
}
