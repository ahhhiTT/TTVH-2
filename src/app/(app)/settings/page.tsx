import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { Card, Notice, PageHeader, Tbd, td, th } from "@/components/ui";
import { getUser, listTeams, listUsers } from "@/lib/data/repo";
import type { Role } from "@/lib/data/types";
import { KPI_DEFINITIONS } from "@/lib/kpi-definitions";
import { canOpen, ROLE_MODULES, type ModuleKey } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";

const ROLES: Role[] = ["director", "manager", "teamlead", "staff", "viewer", "brand"];
const MODULES: ModuleKey[] = ["home", "overview", "stores", "people", "planning", "tasks", "reports", "career", "knowledge", "settings"];

function Access({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <svg width="12" height="12" viewBox="0 0 12 12" className="inline text-success" role="img" aria-label="yes">
      <circle cx="6" cy="6" r="5" fill="currentColor" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 12 12" className="inline text-muted-soft" role="img" aria-label="no">
      <path d="M2 6 H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  if (!canOpen(user, "settings")) notFound();
  const { t } = await getI18n();
  const people = listUsers().filter((u) => u.role !== "viewer" && u.role !== "brand");
  const director = people.find((u) => u.role === "director");
  const teams = listTeams();

  return (
    <>
      <PageHeader accent={MODULE_META.settings.accent} title={t.settings.title} subtitle={t.settings.subtitle} />
      <div className="mb-6">
        <Notice>{t.settings.editNote}</Notice>
      </div>

      <div className="space-y-6">
        <Card index={1} accent="purple" title={t.settings.org} hint={`${people.length} ${t.common.people.toLowerCase()}`}>
          <div className="mb-4 text-sm">
            <span className="font-semibold">{director?.name}</span>
            <span className="text-body">. {director?.title}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => {
              const lead = team.leadId ? getUser(team.leadId) : null;
              const members = people.filter((u) => u.teamId === team.id && u.id !== team.leadId);
              return (
                <div key={team.id} className="rounded-lg border border-hairline-strong p-4">
                  <div className="text-sm font-semibold">{team.name}</div>
                  <div className="mb-3 text-[13px] text-body">
                    {lead ? `${t.roles.teamlead}: ${lead.name}` : t.settings.directReports}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => (
                      <Link
                        key={m.id}
                        href={`/people/${m.id}`}
                        className="rounded-sm bg-surface-strong px-2 py-1 text-[13px] text-ink hover:text-link"
                      >
                        {m.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card index={2} accent="cyan" title={t.settings.permissions} padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>{t.common.role}</th>
                  {MODULES.map((m) => (
                    <th key={m} className={`${th} text-center`}>
                      {t.nav[m]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {ROLES.map((role) => (
                  <tr key={role}>
                    <td className={`${td} whitespace-nowrap font-medium`}>{t.roles[role]}</td>
                    {MODULES.map((m) => (
                      <td key={m} className={`${td} text-center`}>
                        <Access allowed={ROLE_MODULES[role].includes(m)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <section id="definitions" className="scroll-mt-20">
          <Card index={3} accent="orange" title={t.settings.definitions} hint={t.settings.definitionsNote} padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-hairline">
                  <tr>
                    <th className={th}>{t.settings.colKpi}</th>
                    <th className={th}>{t.settings.colFormula}</th>
                    <th className={th}>{t.settings.colRollUp}</th>
                    <th className={th}>{t.settings.colSource}</th>
                    <th className={th}>{t.settings.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {KPI_DEFINITIONS.map((d) => (
                    <tr key={d.key}>
                      <td className={`${td} whitespace-nowrap font-medium`}>{d.name}</td>
                      <td className={`${td} min-w-56 text-body`}>{d.workingFormula}</td>
                      <td className={`${td} min-w-48 text-body`}>{d.rollUp}</td>
                      <td className={`${td} whitespace-nowrap text-muted`}>{d.source ?? t.common.notConfigured}</td>
                      <td className={td}>{d.status === "tbd" ? <Tbd /> : "OK"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
