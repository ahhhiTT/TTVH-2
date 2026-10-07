import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { buttonSecondary, cx, Notice, PageHeader } from "@/components/ui";
import { canOpen } from "@/lib/rbac";
import { getReport } from "@/lib/reports";
import { getI18n, requireUser } from "@/lib/session";

// Hosts one of the Director's report tools unchanged, inside the app frame.
export default async function ReportViewerPage({ params }: PageProps<"/reports/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const report = getReport(id);
  if (!report || !canOpen(user, "reports")) notFound();
  const { t } = await getI18n();
  const src = `/reports/${report.file}`;

  return (
    <>
      <PageHeader
        back={{ href: "/reports", label: t.reports.allReports }}
        accent={MODULE_META.reports.accent}
        title={report.label}
        subtitle={`${report.section.name}. ${report.desc}`}
        actions={
          report.status === "ok" ? (
            <a href={src} target="_blank" rel="noreferrer" className={cx(buttonSecondary, "h-9 text-[13px]")}>
              {t.common.openNewTab}
            </a>
          ) : undefined
        }
      />
      {report.status === "ok" ? (
        <>
          <p className="mb-3 text-[13px] text-body">{t.reports.privacy}</p>
          <iframe
            src={src}
            title={report.label}
            className="enter h-[calc(100dvh-13rem)] min-h-[560px] w-full rounded-lg border border-hairline-strong bg-white"
          />
        </>
      ) : (
        <Notice tone="warning">{t.reports.waitingBody}</Notice>
      )}
    </>
  );
}
