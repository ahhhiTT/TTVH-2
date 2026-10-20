import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { MODULE_META } from "@/components/module-meta";
import { buttonSecondary, Card, cx, EmptyState, Notice, PageHeader, td, th } from "@/components/ui";
import { getData } from "@/lib/data/dataset";
import { RAW_SOURCES, type RawStatus } from "@/lib/raw-sources";
import { canOpen, visibleStoreIds } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";

const DOCS = ["guideline", "product", "jbp", "masterdata"] as const;
const TEMPLATES: Partial<Record<(typeof DOCS)[number], string>> = {
  jbp: "/templates/mau-jbp.xlsx",
  masterdata: "/templates/mau-danh-muc-onboarding.xlsx",
};

// Shape + label, never color alone.
function RawMark({ status }: { status: RawStatus }) {
  if (status === "sample")
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-success">
        <circle cx="6" cy="6" r="5" fill="currentColor" />
      </svg>
    );
  if (status === "manual")
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-warning">
        <path d="M6 1 L11 10.5 H1 Z" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-muted">
      <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.5 2" />
    </svg>
  );
}

export default async function BrandHubPage() {
  const user = await requireUser();
  if (!canOpen(user, "brandhub")) notFound();
  const [d, { locale, t }] = await Promise.all([getData(), getI18n()]);
  const B = t.brandhub;
  const scope = visibleStoreIds(d, user);
  const stores = d.listStores().filter((s) => scope.has(s.id));
  const brands = d
    .listBrands()
    .map((b) => ({ brand: b, stores: stores.filter((s) => s.brandId === b.id).length }))
    .filter((x) => x.stores > 0);

  return (
    <>
      <PageHeader accent={MODULE_META.brandhub.accent} title={B.title} subtitle={B.subtitle} />
      <div className="mb-6">
        <Notice tone="warning">{B.uploadNote}</Notice>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink">{B.requiredTitle}</h2>
        <p className="mb-4 text-[13px] text-body">{B.requiredHint}</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {DOCS.map((key, i) => {
            const doc = B.docs[key];
            const tpl = TEMPLATES[key];
            return (
              <li
                key={key}
                className="enter accent-pink flex flex-col rounded-2xl border border-hairline-strong bg-canvas p-4 md:p-5"
                style={{ "--i": i } as CSSProperties}
              >
                <div className="flex items-start gap-3">
                  <span className="accent-plate tabular flex size-7 shrink-0 items-center justify-center rounded-md text-[13px] font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-ink">{doc.name}</h3>
                    <p className="text-[13px] text-body">{doc.desc}</p>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                  <dt className="text-muted">{B.format}</dt>
                  <dd className="text-ink">{doc.format}</dd>
                  <dt className="text-muted">{B.owner}</dt>
                  <dd className="text-ink">{doc.owner}</dd>
                  <dt className="text-muted">{B.when}</dt>
                  <dd className="text-ink">{doc.when}</dd>
                </dl>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">{B.mustHave}</div>
                <ul className="mt-1.5 space-y-1">
                  {doc.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-[13px] text-ink">
                      <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                      {it}
                    </li>
                  ))}
                </ul>
                {tpl && (
                  <a href={tpl} download className={cx(buttonSecondary, "mt-4 h-9 self-start text-[13px]")}>
                    {B.download}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="space-y-6">
        <Card index={4} accent="cyan" title={B.rawTitle} hint={B.rawHint} padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>{B.rawCols.file}</th>
                  <th className={th}>{B.rawCols.source}</th>
                  <th className={th}>{B.rawCols.freq}</th>
                  <th className={th}>{B.rawCols.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {RAW_SOURCES.map((r, i) => (
                  <tr key={r.id}>
                    <td className={`${td} tabular text-muted`}>{i + 1}</td>
                    <td className={`${td} min-w-56 font-medium`}>{r.name[locale]}</td>
                    <td className={`${td} whitespace-nowrap text-body`}>{r.source}</td>
                    <td className={`${td} whitespace-nowrap text-body`}>{r.freq[locale]}</td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]">
                        <RawMark status={r.status} />
                        {B.rawStatus[r.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card index={5} accent="pink" title={B.statusTitle} hint={B.statusHint} padded={false}>
          {brands.length === 0 ? (
            <EmptyState>{t.common.noStores}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-hairline">
                  <tr>
                    <th className={th}>{t.common.brand}</th>
                    <th className={`${th} text-right`}>{B.storesCol}</th>
                    {DOCS.map((k) => (
                      <th key={k} className={th}>
                        {B.docs[k].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {brands.map(({ brand, stores: n }) => (
                    <tr key={brand.id}>
                      <td className={`${td} whitespace-nowrap font-medium`}>{brand.name}</td>
                      <td className={`${td} tabular text-right`}>{n}</td>
                      {DOCS.map((k) => (
                        <td key={k} className={`${td} whitespace-nowrap`}>
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                            <RawMark status="missing" />
                            {B.notOnSystem}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
