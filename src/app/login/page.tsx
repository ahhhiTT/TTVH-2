import { ChartColumn } from "lucide-react";
import { redirect } from "next/navigation";
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
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at top, var(--sky-light), var(--canvas) 60%)" }}
    >
      <div className="w-full max-w-md rounded-xl border border-hairline-strong bg-canvas p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-white">
              <ChartColumn size={18} aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-[-0.3px]">{t.app.name}</span>
          </span>
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
