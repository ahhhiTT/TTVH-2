import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { buttonSecondary, Card, cx, EmptyState, Notice, PageHeader, Tbd, td, th } from "@/components/ui";
import { METRIC_DICTIONARY } from "@/lib/metric-dictionary";
import { getI18n, requireUser } from "@/lib/session";

// Internal methodology: people inside the centre only, not viewer or brand accounts.
const INTERNAL = new Set(["director", "manager", "teamlead", "staff"]);

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

export default async function MetricsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  if (!INTERNAL.has(user.role)) notFound();
  const sp = await searchParams;
  const { t } = await getI18n();
  const M = t.metrics;
  const sections = [...new Set(METRIC_DICTIONARY.map((m) => m.section))];
  const section = typeof sp.section === "string" && sections.includes(sp.section) ? sp.section : null;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const rows = METRIC_DICTIONARY.filter(
    (m) =>
      (!section || m.section === section) &&
      (!q || fold(`${m.code} ${m.name} ${m.group}`).includes(fold(q))),
  );
  const confirmed = METRIC_DICTIONARY.filter((m) => m.status === "confirmed").length;
  const href = (s: string | null) => {
    const p = new URLSearchParams();
    if (s) p.set("section", s);
    if (q) p.set("q", q);
    return `/metrics${p.size ? `?${p}` : ""}`;
  };
  const grouped = Map.groupBy(rows, (m) => m.section);

  return (
    <>
      <PageHeader
        back={{ href: "/reports", label: t.common.back }}
        accent={MODULE_META.reports.accent}
        title={M.title}
        subtitle={M.subtitle}
      />
      <div className="mb-5 space-y-2">
        <Notice>
          {M.contentNote} {M.count.replace("{n}", String(METRIC_DICTIONARY.length)).replace("{c}", String(confirmed))}
        </Notice>
        <p className="text-[12.5px] text-muted">{M.langNote}</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap gap-1.5" aria-label={M.title}>
          {[null, ...sections].map((s) => (
            <Link
              key={s ?? "all"}
              href={href(s)}
              aria-current={s === section ? "page" : undefined}
              className={cx(
                "rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
                s === section ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
              )}
            >
              {s ?? M.all}
            </Link>
          ))}
        </nav>
        <form action="/metrics" className="flex gap-2">
          {section && <input type="hidden" name="section" value={section} />}
          <input
            name="q"
            defaultValue={q}
            placeholder={M.search}
            aria-label={M.search}
            className="h-10 w-full min-w-0 rounded-full border border-hairline-strong bg-canvas px-4 text-sm text-ink outline-none focus:border-ink md:w-64"
          />
          <button className={cx(buttonSecondary, "shrink-0")}>{M.searchButton}</button>
        </form>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState>{M.noResult}</EmptyState>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([sec, items], i) => (
            <Card key={sec} index={i} accent="blue" title={sec} hint={String(items.length)} padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-hairline">
                    <tr>
                      <th className={th}>{M.cols.code}</th>
                      <th className={th}>{M.cols.name}</th>
                      <th className={th}>{M.cols.definition}</th>
                      <th className={th}>{M.cols.formula}</th>
                      <th className={th}>{M.cols.source}</th>
                      <th className={th}>{M.cols.rollUp}</th>
                      <th className={th}>{M.cols.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {items.map((m) => (
                      <tr key={m.code} id={m.code} className="scroll-mt-24 align-top">
                        <td className={`${td} tabular whitespace-nowrap text-muted`}>{m.code}</td>
                        <td className={`${td} min-w-44`}>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-[12px] text-muted">
                            {[sec.includes(m.group) ? "" : m.group, m.unit].filter(Boolean).join(" · ")}
                          </div>
                        </td>
                        <td className={`${td} min-w-64 text-[13px] text-body`}>{m.definition || <Tbd />}</td>
                        <td className={`${td} min-w-56 text-[13px]`}>
                          {m.formula ? (
                            <span className="text-ink">{m.formula}</span>
                          ) : (
                            <span className="text-body">
                              {m.templateFormula}
                              <span className="mt-1 block text-[12px] text-muted">{M.templateOnly}</span>
                            </span>
                          )}
                        </td>
                        <td className={`${td} min-w-48 text-[13px] text-body`}>
                          {m.rawColumn || m.source || t.common.notConfigured}
                        </td>
                        <td className={`${td} whitespace-nowrap text-[13px] text-body`}>{m.rollUp}</td>
                        <td className={`${td} whitespace-nowrap text-[13px]`}>
                          {m.status === "confirmed" ? (
                            <span className="inline-flex items-center gap-1.5 text-success">
                              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                                <circle cx="5" cy="5" r="4.5" fill="currentColor" />
                              </svg>
                              {M.confirmed}
                            </span>
                          ) : (
                            <Tbd />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
