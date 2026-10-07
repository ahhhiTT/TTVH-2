import { Circle } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader } from "@/components/ui";
import { canOpen } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";

type PlannedModule = "planning" | "tasks" | "reports" | "career" | "knowledge";

export async function ModulePlaceholder({ module }: { module: PlannedModule }) {
  const user = await requireUser();
  if (!canOpen(user, module)) notFound();
  const { t } = await getI18n();
  const m = t.modules[module];

  return (
    <>
      <PageHeader title={m.title} subtitle={m.subtitle} actions={<Badge>{t.common.comingSoon}</Badge>} />
      <Card title={t.common.plannedFeatures}>
        <ul className="space-y-3">
          {m.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-body">
              <Circle size={14} className="mt-[3px] shrink-0 text-muted-soft" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        {"waiting" in m && (
          <p className="mt-5 rounded-md bg-warning-soft px-4 py-3 text-[13px] text-warning">{m.waiting}</p>
        )}
      </Card>
    </>
  );
}
