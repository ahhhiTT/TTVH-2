import Link from "next/link";
import type { ReactNode } from "react";
import { MobileNav, type NavGroup } from "@/components/sidebar";
import { AccountMenu, TopNav, type TopNavGroup } from "@/components/top-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge, buttonPrimary, cx } from "@/components/ui";
import { setLocale, signOut } from "@/lib/actions";
import type { User } from "@/lib/data/types";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { canOpen, type ModuleKey } from "@/lib/rbac";
import { LogoMark } from "./svg";

function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={setLocale} aria-label={label} className="flex rounded-md border border-hairline-strong p-0.5">
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          name="locale"
          value={l}
          aria-pressed={locale === l}
          className={cx(
            "h-8 rounded-sm px-2.5 text-[13px] font-medium uppercase",
            locale === l ? "bg-primary text-on-primary" : "text-body hover:text-ink",
          )}
        >
          {l}
        </button>
      ))}
    </form>
  );
}

function Preferences({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <>
      <ThemeToggle
        className="hidden sm:flex"
        labels={{ light: t.common.themeLight, dark: t.common.themeDark, group: t.common.themeLabel }}
      />
      <LocaleSwitch locale={locale} label={t.common.languageLabel} />
    </>
  );
}

export function navGroupsFor(user: User, t: Dictionary): NavGroup[] {
  const group = (label: string, keys: ModuleKey[]): NavGroup => ({
    label,
    items: keys.filter((k) => canOpen(user, k)).map((key) => ({ key, label: t.nav[key] })),
  });
  return [
    group(t.nav.groupDepartment, ["home"]),
    group(t.nav.groupPerformance, ["overview", "stores", "people"]),
    group(t.nav.groupExecution, ["planning", "tasks", "reports"]),
    group(t.nav.groupGrowth, ["career", "knowledge"]),
    group(t.nav.groupAdmin, ["settings"]),
  ].filter((g) => g.items.length > 0);
}

// Signed-in shell: horizontal top bar with dropdown menus (drawer on mobile).
export function AppShell({
  user,
  locale,
  t,
  children,
}: {
  user: User;
  locale: Locale;
  t: Dictionary;
  children: ReactNode;
}) {
  const groups = navGroupsFor(user, t);
  const topGroups: TopNavGroup[] = groups.map((g) => ({
    label: g.label,
    items: g.items.map((it) => ({ ...it, desc: t.navDesc[it.key] })),
  }));
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-hairline-strong bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-3 md:h-16 md:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:gap-6">
            <MobileNav
              appName={t.app.name}
              groups={groups}
              labels={{
                open: t.nav.openMenu,
                close: t.nav.closeMenu,
                light: t.common.themeLight,
                dark: t.common.themeDark,
                theme: t.common.themeLabel,
              }}
            />
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <LogoMark size={26} />
              <span className="hidden text-[15px] font-semibold tracking-[-0.3px] whitespace-nowrap min-[400px]:inline">
                {t.app.name}
              </span>
            </Link>
            <TopNav groups={topGroups} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden 2xl:block">
              <Badge className="bg-warning-soft text-warning">{t.common.sampleData}</Badge>
            </span>
            <LocaleSwitch locale={locale} label={t.common.languageLabel} />
            <AccountMenu
              name={user.name}
              role={`${t.roles[user.role]} · ${t.common.sampleData}`}
              signOutLabel={t.common.switchRole}
              signOutAction={signOut}
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted">{t.common.themeLabel}</span>
                <ThemeToggle labels={{ light: t.common.themeLight, dark: t.common.themeDark, group: t.common.themeLabel }} />
              </div>
            </AccountMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}

// Signed-out shell for the public homepage.
export function PublicShell({ locale, t, children }: { locale: Locale; t: Dictionary; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-hairline-strong bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-2 px-4 md:h-16 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-[15px] font-semibold tracking-[-0.3px] whitespace-nowrap">{t.app.name}</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Preferences locale={locale} t={t} />
            <Link href="/login" className={cx(buttonPrimary, "h-9 px-3.5 text-[13px] whitespace-nowrap")}>
              {t.common.signIn}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
