import { LogOut } from "lucide-react";
import { Sidebar, type NavGroup } from "@/components/sidebar";
import { Badge, buttonSecondary, cx } from "@/components/ui";
import { setLocale, signOut } from "@/lib/actions";
import { canOpen, type ModuleKey } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const { locale, t } = await getI18n();

  const group = (label: string, keys: ModuleKey[]): NavGroup => ({
    label,
    items: keys.filter((k) => canOpen(user, k)).map((key) => ({ key, label: t.nav[key] })),
  });
  const groups = [
    group(t.nav.groupPerformance, ["overview", "stores", "people"]),
    group(t.nav.groupExecution, ["planning", "tasks", "reports"]),
    group(t.nav.groupGrowth, ["career", "knowledge"]),
    group(t.nav.groupAdmin, ["settings"]),
  ].filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar appName={t.app.name} groups={groups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-hairline-strong bg-canvas px-6">
          <Badge className="bg-[#fff4e5] text-warning">{t.common.sampleData}</Badge>
          <div className="flex items-center gap-3">
            <form action={setLocale} className="flex rounded-md border border-hairline-strong p-0.5">
              {(["vi", "en"] as const).map((l) => (
                <button
                  key={l}
                  name="locale"
                  value={l}
                  aria-pressed={locale === l}
                  className={cx(
                    "h-8 rounded-sm px-2.5 text-[13px] font-medium uppercase",
                    locale === l ? "bg-primary text-white" : "text-body hover:text-ink",
                  )}
                >
                  {l}
                </button>
              ))}
            </form>
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-ink">{user.name}</div>
              <div className="text-[13px] text-muted">{t.roles[user.role]}</div>
            </div>
            <form action={signOut}>
              <button className={cx(buttonSecondary, "h-9 px-3")} title={t.common.switchRole}>
                <LogOut size={15} aria-hidden />
                <span className="hidden sm:inline">{t.common.switchRole}</span>
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
