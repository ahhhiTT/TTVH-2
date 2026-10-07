import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { canOpen } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";
import { MODULE_META } from "./module-meta";

type PlannedModule = "planning" | "tasks" | "career" | "knowledge";

export async function ModulePlaceholder({ module }: { module: PlannedModule }) {
  const user = await requireUser();
  if (!canOpen(user, module)) notFound();
  const { t } = await getI18n();
  const m = t.modules[module];
  const { accent } = MODULE_META[module];

  return (
    <>
      <PageHeader accent={accent} title={m.title} subtitle={m.subtitle} actions={<Badge>{t.common.comingSoon}</Badge>} />

      <div className="enter mb-3 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted" style={{ "--i": 1 } as CSSProperties}>
        {t.common.plannedFeatures}
      </div>
      <ul className={`accent-${accent} grid gap-3 sm:grid-cols-2 md:gap-4`}>
        {m.features.map((f, i) => (
          <li
            key={f}
            className="enter lift flex items-start gap-4 rounded-lg border border-hairline-strong bg-canvas p-4 md:p-5"
            style={{ "--i": i + 2 } as CSSProperties}
          >
            <span className="accent-plate tabular flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold">
              {i + 1}
            </span>
            <span className="pt-1 text-sm text-ink">{f}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
