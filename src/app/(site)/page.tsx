import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ChainFlow, OrbitDiagram } from "@/components/diagrams";
import { ArcMark, ArrowRight, Eyebrow, Marquee, Panel, StatusPill } from "@/components/expo";
import { GrowthAccordion } from "@/components/growth-accordion";
import { MODULE_META, type Accent } from "@/components/module-meta";
import { Reveal } from "@/components/reveal";
import { FlowArrow } from "@/components/svg";
import { buttonPrimary, buttonSecondary, cx } from "@/components/ui";
import { getTeam, listUsers } from "@/lib/data/repo";
import { UPBASE_BRAND_LOGOS, UPBASE_SOURCE, UPBASE_STATS } from "@/lib/home-content";
import { canOpen, type ModuleKey } from "@/lib/rbac";
import { getCurrentUser, getI18n } from "@/lib/session";

const ACCENTS: Accent[] = ["blue", "purple", "cyan", "green", "orange", "pink"];
const at = (i: number) => ACCENTS[i % ACCENTS.length];

function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cx("text-[28px] font-semibold leading-[1.15] tracking-[-0.84px] text-ink md:text-[36px] md:tracking-[-1.08px]", className)}>
      {children}
    </h2>
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
  const roleNames = h.projectRoles.map(([r]) => r);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero: left headline, right description (expo.dev layout). */}
      <section className="grid gap-8 pt-4 pb-6 md:grid-cols-[1.5fr_1fr] md:items-end md:gap-12 md:pt-10 md:pb-10">
        <div className="enter">
          <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-1.3px] text-ink md:text-[72px] md:tracking-[-2.2px]">
            {t.app.name}
          </h1>
          <p className="mt-3 text-[18px] font-semibold tracking-[-0.3px] text-body md:text-[22px]">{h.siteLine}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={user ? "/overview" : "/login"} className={buttonPrimary}>
              {user ? h.ctaSignedIn : h.ctaSignedOut}
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            {user && canOpen(user, "reports") && (
              <Link href="/reports" className={buttonSecondary}>
                {h.ctaReports}
              </Link>
            )}
          </div>
        </div>
        <div className="enter space-y-4" style={{ "--i": 2 } as CSSProperties}>
          <StatusPill>{h.demoPill}</StatusPill>
          <p className="text-[15px] leading-relaxed text-body">{h.lead}</p>
          <Eyebrow>{h.eyebrow}</Eyebrow>
        </div>
      </section>

      {/* Logo carousel with mono caption. */}
      <Reveal as="section" className="space-y-5 pb-4">
        <Eyebrow className="text-center">{h.logoCaption}</Eyebrow>
        <Marquee items={UPBASE_BRAND_LOGOS} />
        <p className="mx-auto max-w-3xl text-center text-[12px] text-muted">
          {h.statsNote} {h.brandsNote}{" "}
          <a href={UPBASE_SOURCE} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            upbase.asia
          </a>
        </p>
      </Reveal>

      {/* Growth scope: accordion + isometric drawing. */}
      <Reveal>
        <Panel>
          <H2 className="max-w-md">{h.scopeTitle}</H2>
          <p className="mt-3 max-w-xl text-[15px] text-body">{h.scopeLead}</p>
          <div className="mt-8">
            <GrowthAccordion groups={h.scopeGroups} />
          </div>
        </Panel>
      </Reveal>

      {/* Bento: role (dark) + business model + structure + platforms. */}
      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        <Reveal className="lg:row-span-2">
          <Panel tone="dark" className="flex h-full flex-col items-center text-center">
            <span
              aria-hidden
              className="glow pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, var(--accent-purple), transparent 65%)" }}
            />
            <div className="relative mt-2">
              <ArcMark />
            </div>
            <H2 className="relative mt-6 text-on-dark">{h.aboutTitle}</H2>
            <div className="relative mt-4 space-y-3 text-[14px] leading-relaxed text-on-dark-soft">
              {h.aboutBody.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <dl className="relative mt-8 grid w-full grid-cols-3 gap-2 border-t border-white/10 pt-6">
              {UPBASE_STATS.map((s) => (
                <div key={s.key}>
                  <dd className="tabular text-[22px] font-semibold tracking-[-0.5px] text-on-dark md:text-[26px]">{s.value}</dd>
                  <dt className="mt-1 text-[12px] text-on-dark-soft">{h[s.key]}</dt>
                </div>
              ))}
            </dl>
          </Panel>
        </Reveal>

        <Reveal className="lg:col-span-2" index={1}>
          <Panel className="h-full">
            <H2>{h.modelTitle}</H2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {h.model.map(([name, desc], i) => (
                <li key={name} className={`accent-${at(i)} lift rounded-3xl border border-hairline-strong bg-canvas p-5`}>
                  <span aria-hidden className="block h-1 w-8 rounded-full" style={{ background: "var(--accent)" }} />
                  <div className="mt-3 text-[15px] font-semibold text-ink">{name}</div>
                  <div className="mt-1 text-[13px] text-body">{desc}</div>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>

        <Reveal index={2}>
          <Panel className="h-full">
            <H2 className="text-[24px] md:text-[28px]">{h.orgTitle}</H2>
            <ol className="mt-6 space-y-2">
              {h.orgLevels.map((level, i) => (
                <li
                  key={level}
                  className="flex items-center gap-3 rounded-2xl border border-hairline-strong bg-canvas px-4 py-3"
                  style={{ marginLeft: `${i * 12}px` }}
                >
                  <span
                    className={`accent-${at(i)} accent-plate tabular flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-ink">{level}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13px] text-body">{h.orgNote}</p>
          </Panel>
        </Reveal>

        <Reveal index={3}>
          <Panel className="h-full">
            <H2 className="text-[24px] md:text-[28px]">{h.platformsTitle}</H2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {h.platforms.map((p, i) => (
                <li
                  key={p}
                  className={`accent-${at(i)} flex items-center gap-2 rounded-full border border-hairline-strong bg-canvas px-3.5 py-2 text-[13px] font-medium text-ink`}
                >
                  <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
                  {p}
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>
      </div>

      {/* E2E chain. */}
      <Reveal>
        <Panel>
          <H2 className="text-center">{h.chainTitle}</H2>
          <div className="mt-8">
            <ChainFlow steps={h.chain} />
          </div>
        </Panel>
      </Reveal>

      {/* Project structure: orbit diagram + role list. */}
      <Reveal>
        <Panel>
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <H2>{h.projectTitle}</H2>
              <ul className="mt-6 divide-y divide-hairline-strong">
                {h.projectRoles.map(([role, desc]) => (
                  <li key={role} className="flex gap-4 py-2.5">
                    <span className="w-24 shrink-0 text-sm font-semibold text-ink">{role}</span>
                    <span className={cx("text-[13px]", desc ? "text-body" : "text-muted")}>{desc || t.common.tbd}</span>
                  </li>
                ))}
              </ul>
            </div>
            <OrbitDiagram center="Growth" roles={roleNames.filter((r) => r !== "Growth")} />
          </div>
        </Panel>
      </Reveal>

      {/* Process: centred heading, inline steps, pill CTA. */}
      <Reveal as="section" className="py-10 text-center md:py-16">
        <H2>{h.processTitle}</H2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-body">{h.processLead}</p>
        <ol className="mx-auto mt-7 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {h.process.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span
                className={`accent-${at(i)} flex items-center gap-2 rounded-full border border-hairline-strong bg-canvas py-1.5 pr-3.5 pl-1.5 text-[13px] font-semibold text-ink`}
              >
                <span className="accent-plate tabular flex size-6 items-center justify-center rounded-full text-[11px]">{i + 1}</span>
                {step}
              </span>
              {i < h.process.length - 1 && <FlowArrow className="text-muted" />}
            </li>
          ))}
        </ol>
        {user && canOpen(user, "overview") && (
          <Link href="/overview" className={cx(buttonPrimary, "mt-8")}>
            {h.ctaSignedIn}
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </Reveal>

      {/* Team. */}
      <Reveal>
        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <H2>{h.teamTitle}</H2>
            {internal && <span className="text-[13px] text-muted">{h.teamSample}</span>}
          </div>
          {internal ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[...teams.entries()].map(([name, members], i) => (
                <div key={name} className={`accent-${at(i + 1)} rounded-3xl border border-hairline-strong bg-canvas p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
                      {name}
                    </span>
                    <span className="tabular text-[13px] text-muted">{members.length}</span>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {members.map((m) => (
                      <li key={m.id} className="rounded-full bg-surface-strong px-2.5 py-1 text-[12px] text-ink">
                        {m.name} <span className="text-muted">{m.level}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[15px] text-body">{user ? t.common.noAccess : h.teamSignedOut}</p>
          )}
        </Panel>
      </Reveal>

      {/* Culture + news. */}
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <Reveal>
          <Panel className="h-full">
            <H2 className="text-[24px] md:text-[28px]">{h.cultureTitle}</H2>
            <p className="mt-3 text-sm text-muted">{h.pending}</p>
          </Panel>
        </Reveal>
        <Reveal index={1}>
          <Panel className="h-full">
            <H2 className="text-[24px] md:text-[28px]">{h.newsTitle}</H2>
            <p className="mt-3 text-sm text-muted">{h.newsEmpty}</p>
          </Panel>
        </Reveal>
      </div>

      {/* Shortcuts. */}
      {shortcuts.length > 0 && (
        <Reveal as="section" className="pt-4">
          <H2 className="text-[24px] md:text-[28px]">{h.shortcutsTitle}</H2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {shortcuts.map((key) => (
              <li key={key}>
                <Link
                  href={MODULE_META[key].href}
                  className={`accent-${MODULE_META[key].accent} lift group flex h-full items-center justify-between gap-2 rounded-3xl border border-hairline-strong bg-canvas p-5 text-sm font-semibold text-ink`}
                >
                  {t.nav[key]}
                  <ArrowRight className="shrink-0 text-[color:var(--accent)] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}
