import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { MODULE_META, type Accent } from "@/components/module-meta";
import { FlowArrow } from "@/components/svg";
import { buttonPrimary, buttonSecondary, Card, cx, Notice } from "@/components/ui";
import { getTeam, listUsers } from "@/lib/data/repo";
import { UPBASE_BRAND_LOGOS, UPBASE_SOURCE, UPBASE_STATS } from "@/lib/home-content";
import { canOpen, type ModuleKey } from "@/lib/rbac";
import { getCurrentUser, getI18n } from "@/lib/session";

const ACCENTS: Accent[] = ["blue", "purple", "cyan", "green", "orange", "pink"];
const at = (i: number) => ACCENTS[i % ACCENTS.length];
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function SectionTitle({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-[22px] font-semibold tracking-[-0.5px] text-ink">{children}</h2>
      {note && <p className="mt-1 text-[13px] text-body">{note}</p>}
    </div>
  );
}

// Vertical connector between org levels.
function DownConnector() {
  return (
    <svg width="12" height="28" viewBox="0 0 12 28" aria-hidden className="mx-auto block text-hairline-strong">
      <path d="M6 0 V22 M2 18 L6 23 L10 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default async function HomePage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getI18n()]);
  const h = t.home;
  const internal = user && ["director", "manager", "teamlead", "staff"].includes(user.role);
  const team = internal ? listUsers().filter((u) => u.role !== "viewer" && u.role !== "brand") : [];
  const teams = Map.groupBy(team, (u) => getTeam(u.teamId)?.name ?? t.roles.director);
  const shortcuts: ModuleKey[] = user
    ? (["overview", "stores", "people", "reports", "planning", "tasks"] as ModuleKey[]).filter((k) => canOpen(user, k))
    : [];

  return (
    <div className="space-y-12 md:space-y-16">
      {/* Hero */}
      <section className="sky-wash enter relative overflow-hidden rounded-xl border border-hairline-strong px-5 py-10 md:px-10 md:py-16">
        <span
          aria-hidden
          className="drift pointer-events-none absolute -top-24 right-[-6rem] size-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-cyan), transparent 65%)" }}
        />
        <span
          aria-hidden
          className="drift pointer-events-none absolute -bottom-32 left-[-4rem] size-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-purple), transparent 65%)", animationDelay: "-6s" }}
        />
        <div className="relative max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.88px] text-body">{h.eyebrow}</div>
          <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-1.2px] text-ink md:text-[64px] md:tracking-[-1.92px]">
            {t.app.name}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-body md:text-[17px]">{h.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={user ? "/overview" : "/login"} className={buttonPrimary}>
              {user ? h.ctaSignedIn : h.ctaSignedOut}
            </Link>
            {user && canOpen(user, "reports") && (
              <Link href="/reports" className={buttonSecondary}>
                {h.ctaReports}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Figures */}
      <section className="on-dark enter relative overflow-hidden rounded-xl bg-surface-dark px-5 py-8 text-on-dark md:px-10 md:py-10" style={stagger(1)}>
        <span
          aria-hidden
          className="drift pointer-events-none absolute -top-20 -right-10 size-72 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-cyan), var(--accent-purple) 60%, transparent 70%)" }}
        />
        <div className="relative">
          <div className="text-[11px] font-semibold uppercase tracking-[0.88px] text-on-dark-soft">{h.statsTitle}</div>
          <dl className="mt-5 grid grid-cols-3 gap-3 md:gap-8">
            {UPBASE_STATS.map((s) => (
              <div key={s.key}>
                <dt className="sr-only">{h[s.key]}</dt>
                <dd className="tabular text-[24px] font-semibold leading-none tracking-[-0.7px] min-[400px]:text-[28px] md:text-[56px] md:tracking-[-1.7px]">
                  {s.value}
                </dd>
                <dd className="mt-2 text-[13px] text-on-dark-soft md:text-sm">{h[s.key]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-on-dark-soft">
            {h.statsNote}{" "}
            <a href={UPBASE_SOURCE} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              upbase.asia
            </a>
          </p>
        </div>
      </section>

      {/* About + business model */}
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="enter lg:col-span-2" style={stagger(2)}>
          <SectionTitle>{h.aboutTitle}</SectionTitle>
          <div className="space-y-3 text-[15px] leading-relaxed text-body">
            {h.aboutBody.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          <SectionTitle>{h.modelTitle}</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {h.model.map(([name, desc], i) => (
              <li
                key={name}
                className={`accent-${at(i)} enter lift relative overflow-hidden rounded-lg border border-hairline-strong bg-canvas p-4`}
                style={stagger(i + 3)}
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: "var(--accent)" }} />
                <div className="text-sm font-semibold text-ink">{name}</div>
                <div className="mt-1 text-[13px] text-body">{desc}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* E2E chain + platforms */}
      <section>
        <SectionTitle>{h.chainTitle}</SectionTitle>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
          {h.chain.map((step, i) => (
            <li key={step} className="enter flex items-center gap-1.5" style={stagger(i)}>
              <span className={`accent-${at(i)} accent-plate rounded-md px-3 py-2 text-[13px] font-semibold`}>{step}</span>
              {i < h.chain.length - 1 && <FlowArrow className="text-muted" />}
            </li>
          ))}
        </ol>
        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">{h.platformsTitle}</div>
        <ul className="mt-2 flex flex-wrap gap-2">
          {h.platforms.map((p) => (
            <li key={p} className="rounded-full border border-hairline-strong bg-canvas px-3 py-1.5 text-[13px] text-ink">
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Org + project structure */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card title={h.orgTitle} accent="purple" index={1}>
          <ol>
            {h.orgLevels.map((level, i) => (
              <li key={level}>
                {i > 0 && <DownConnector />}
                <div
                  className={cx(
                    "mx-auto max-w-sm rounded-lg border px-4 py-3 text-center text-sm font-semibold",
                    i === h.orgLevels.length - 1
                      ? "accent-blue accent-plate border-transparent"
                      : "border-hairline-strong bg-canvas text-ink",
                  )}
                >
                  {level}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-center text-[13px] text-body">{h.orgNote}</p>
        </Card>

        <Card title={h.projectTitle} accent="cyan" index={2}>
          <ul className="grid grid-cols-2 gap-2">
            {h.projectRoles.map(([role, desc]) => {
              const core = role === "Growth";
              return (
                <li
                  key={role}
                  className={cx(
                    "rounded-lg border p-3",
                    core ? "on-dark col-span-2 border-transparent bg-surface-dark text-on-dark" : "border-hairline-strong",
                  )}
                >
                  <div className={cx("text-sm font-semibold", core ? "text-on-dark" : "text-ink")}>{role}</div>
                  {desc ? (
                    <div className={cx("mt-0.5 text-[13px]", core ? "text-on-dark-soft" : "text-body")}>{desc}</div>
                  ) : (
                    <div className="mt-0.5 text-[13px] text-muted">{t.common.tbd}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* Growth process */}
      <section>
        <SectionTitle>{h.processTitle}</SectionTitle>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {h.process.map((step, i) => (
            <li
              key={step}
              className={`accent-${at(i)} enter lift relative rounded-lg border border-hairline-strong bg-canvas p-4`}
              style={stagger(i)}
            >
              <div className="accent-plate tabular flex size-7 items-center justify-center rounded-md text-[13px] font-semibold">
                {i + 1}
              </div>
              <div className="mt-3 text-sm font-semibold text-ink">{step}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* Growth scope */}
      <section>
        <SectionTitle>{h.scopeTitle}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {h.scopeGroups.map(([group, items], i) => (
            <Card key={group} title={group} accent={at(i)} index={i}>
              <ul className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <li key={item} className="rounded-sm bg-surface-strong px-2 py-1 text-[13px] text-ink">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Brands */}
      <section>
        <SectionTitle note={h.brandsNote}>{h.brandsTitle}</SectionTitle>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {UPBASE_BRAND_LOGOS.map((b, i) => (
            <li
              key={b.name}
              className="enter lift flex aspect-[3/2] items-center justify-center rounded-lg border border-hairline-strong bg-white p-3"
              style={stagger(i % 10)}
              title={b.name}
            >
              {/* Hotlinked from upbase.asia; plain img avoids proxying third-party assets. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.src} alt={b.name} loading="lazy" className="max-h-full max-w-full object-contain" />
            </li>
          ))}
        </ul>
      </section>

      {/* Team */}
      <section>
        <SectionTitle note={internal ? h.teamSample : undefined}>{h.teamTitle}</SectionTitle>
        {internal ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...teams.entries()].map(([name, members], i) => (
              <Card key={name} title={name} hint={String(members.length)} accent={at(i + 1)} index={i}>
                <ul className="flex flex-wrap gap-1.5">
                  {members.map((m) => (
                    <li key={m.id} className="rounded-sm bg-surface-strong px-2 py-1 text-[13px] text-ink">
                      {m.name} <span className="text-muted">{m.level}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <Notice>{user ? t.common.noAccess : h.teamSignedOut}</Notice>
        )}
      </section>

      {/* Culture + news */}
      <section className="grid gap-6 md:grid-cols-2">
        <Card title={h.cultureTitle} accent="pink">
          <p className="text-sm text-muted">{h.pending}</p>
        </Card>
        <Card title={h.newsTitle} accent="orange">
          <p className="text-sm text-muted">{h.newsEmpty}</p>
        </Card>
      </section>

      {/* Shortcuts */}
      {shortcuts.length > 0 && (
        <section>
          <SectionTitle>{h.shortcutsTitle}</SectionTitle>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {shortcuts.map((key, i) => (
              <li key={key} className="enter" style={stagger(i)}>
                <Link
                  href={MODULE_META[key].href}
                  className={`accent-${MODULE_META[key].accent} lift flex h-full items-center justify-between gap-2 rounded-lg border border-hairline-strong bg-canvas p-4 text-sm font-semibold text-ink`}
                >
                  {t.nav[key]}
                  <FlowArrow className="shrink-0 text-[color:var(--accent)]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
