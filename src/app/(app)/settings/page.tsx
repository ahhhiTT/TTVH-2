import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader, td, th } from "@/components/ui";
import { getUser, listTeams, listUsers } from "@/lib/data/repo";
import type { Role } from "@/lib/data/types";
import { canOpen, ROLE_MODULES, type ModuleKey } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";

const ROLES: Role[] = ["director", "manager", "teamlead", "staff", "viewer", "brand"];
const MODULES: ModuleKey[] = ["overview", "stores", "people", "planning", "tasks", "reports", "career", "knowledge", "settings"];

export default async function SettingsPage() {
  const user = await requireUser();
  if (!canOpen(user, "settings")) notFound();
  const { t } = await getI18n();
  const people = listUsers().filter((u) => u.role !== "viewer" && u.role !== "brand");
  const director = people.find((u) => u.role === "director");
  const teams = listTeams();

  return (
    <>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
      <p className="mb-6 rounded-md border border-hairline-strong bg-canvas px-4 py-3 text-[13px] text-body">
        {t.settings.editNote}
      </p>

      <div className="space-y-6">
        <Card title={t.settings.org} hint={`${people.length} ${t.common.people.toLowerCase()}`}>
          <div className="mb-4 text-sm">
            <span className="font-semibold">{director?.name}</span>
            <span className="text-body"> · {director?.title}</span>
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

        <Card title={t.settings.permissions} padded={false}>
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
                    <td className={`${td} font-medium`}>{t.roles[role]}</td>
                    {MODULES.map((m) => (
                      <td key={m} className={`${td} text-center`}>
                        {ROLE_MODULES[role].includes(m) ? (
                          <Check size={16} className="inline text-success" aria-label="yes" />
                        ) : (
                          <Minus size={16} className="inline text-muted-soft" aria-label="no" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
