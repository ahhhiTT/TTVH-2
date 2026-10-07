import { ChartColumn } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonPrimary, buttonSecondary, cx } from "@/components/ui";
import { demoSignIn, setLocale } from "@/lib/actions";
import { listUsers } from "@/lib/data/repo";
import type { Role } from "@/lib/data/types";
import { getCurrentUser, getI18n } from "@/lib/session";

const ROLE_ORDER: Role[] = ["director", "manager", "teamlead", "staff", "viewer", "brand"];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const { locale, t } = await getI18n();
  const users = listUsers();

  return (
    <div className="sky-wash relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Slow-drifting color fields behind the card. */}
      <span
        aria-hidden
        className="drift pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--sky-mid), transparent 65%)" }}
      />
      <span
        aria-hidden
        className="drift pointer-events-none absolute -right-24 -bottom-32 size-[26rem] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-purple), transparent 65%)", animationDelay: "-7s" }}
      />
      <div className="enter relative w-full max-w-md rounded-xl border border-hairline-strong bg-canvas/90 p-8 shadow-[0_24px_64px_var(--shadow-hover)] backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-on-primary">
              <ChartColumn size={18} aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-[-0.3px]">{t.app.name}</span>
          </span>
          <div className="flex items-center gap-2">
          <ThemeToggle labels={{ light: t.common.themeLight, dark: t.common.themeDark }} />
          <form action={setLocale} className="flex gap-1">
            {(["vi", "en"] as const).map((l) => (
              <button
                key={l}
                name="locale"
                value={l}
                aria-pressed={locale === l}
                className={cx(
                  "h-7 rounded-sm px-2 text-xs font-medium uppercase",
                  locale === l ? "bg-surface-strong text-ink" : "text-muted hover:text-ink",
                )}
              >
                {l}
              </button>
            ))}
          </form>
          </div>
        </div>

        <h1 className="text-[22px] font-semibold tracking-[-0.5px]">{t.login.title}</h1>
        <p className="mt-1 text-sm text-body">{t.app.tagline}</p>

        <button disabled className={cx(buttonSecondary, "mt-6 w-full")} title={t.login.larkSoon}>
          {t.login.lark}
        </button>
        <p className="mt-1.5 text-center text-xs text-muted">{t.login.larkSoon}</p>

        <div className="my-6 h-px bg-hairline" />

        <form action={demoSignIn} className="space-y-3">
          <label htmlFor="userId" className="block text-sm font-medium text-ink">
            {t.login.pick}
          </label>
          <select
            id="userId"
            name="userId"
            defaultValue="u01"
            className="h-11 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-sm text-ink focus:border-2 focus:border-ink focus:outline-none"
          >
            {ROLE_ORDER.map((role) => {
              const members = users.filter((u) => u.role === role);
              if (members.length === 0) return null;
              return (
                <optgroup key={role} label={t.roles[role]}>
                  {members.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <p className="text-xs text-body">{t.login.subtitle}</p>
          <button type="submit" className={cx(buttonPrimary, "w-full")}>
            {t.login.enter}
          </button>
        </form>
      </div>
    </div>
  );
}
