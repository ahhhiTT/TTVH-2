import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { MODULE_META, type Accent } from "@/components/module-meta";
import { FlowArrow } from "@/components/svg";
import { Badge, cx, Notice, PageHeader } from "@/components/ui";
import { canOpen } from "@/lib/rbac";
import { REPORT_SECTIONS } from "@/lib/reports";
import { getI18n, requireUser } from "@/lib/session";

const ACCENTS: Accent[] = ["blue", "cyan", "purple", "green", "orange", "pink", "blue"];

export default async function ReportsPage() {
  const user = await requireUser();
  if (!canOpen(user, "reports")) notFound();
  const { t } = await getI18n();
  const ready = REPORT_SECTIONS.flatMap((s) => s.items).filter((i) => i.status === "ok").length;
  const total = REPORT_SECTIONS.flatMap((s) => s.items).length;

  return (
    <>
      <PageHeader
        accent={MODULE_META.reports.accent}
        title={t.reports.title}
        subtitle={t.reports.subtitle}
        actions={
          <Badge>
            {ready}/{total} {t.reports.ready}
          </Badge>
        }
      />
      <div className="mb-6 space-y-2">
        <Notice tone="warning">{t.reports.templateNote}</Notice>
        <Notice>{t.reports.privacy}</Notice>
      </div>

      <div className="space-y-8">
        {REPORT_SECTIONS.map((section, si) => (
          <section key={section.id} className={`accent-${ACCENTS[si]}`}>
            <div className="mb-3 flex items-baseline gap-3">
              <span className="accent-plate tabular flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold">
                {si + 1}
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">{section.name}</h2>
                <p className="text-[13px] text-body">{section.sub}</p>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item, i) => {
                const ok = item.status === "ok";
                const body = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-ink">{item.label}</div>
                      <span
                        className={cx(
                          "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          ok ? "accent-plate" : "border border-dashed border-hairline-strong text-muted",
                        )}
                      >
                        {ok ? t.reports.ready : t.reports.waiting}
                      </span>
                    </div>
                    {(item.group || item.platform) && (
                      <div className="mt-1 text-[12px] text-muted">{[item.group, item.platform].filter(Boolean).join(" / ")}</div>
                    )}
                    <p className="mt-2 text-[13px] leading-relaxed text-body">{item.desc}</p>
                    {ok && (
                      <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--accent)]">
                        {t.reports.open} <FlowArrow />
                      </div>
                    )}
                  </>
                );
                return (
                  <li key={item.id} className="enter" style={{ "--i": i } as CSSProperties}>
                    {ok ? (
                      <Link
                        href={`/reports/${item.id}`}
                        className="lift block h-full rounded-lg border border-hairline-strong bg-canvas p-4"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="h-full rounded-lg border border-dashed border-hairline-strong bg-canvas-soft p-4 opacity-80">
                        {body}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
