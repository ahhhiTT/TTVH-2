import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";
import { buttonPrimary, buttonSecondary, cx } from "@/components/ui";
import { demoSignIn } from "@/lib/actions";
import { getData } from "@/lib/data/dataset";
import type { Role } from "@/lib/data/types";
import { demoMode, getCurrentUser, getI18n } from "@/lib/session";

const ROLE_ORDER: Role[] = ["director", "manager", "teamlead", "staff", "viewer", "brand"];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const { locale, t } = await getI18n();

  if (!demoMode()) {
    return (
      <AuthCard t={t} locale={locale}>
        <h1 className="text-[22px] font-semibold tracking-[-0.5px]">{t.login.title}</h1>
        <p className="mt-1 mb-5 text-sm text-body">{t.login.realSubtitle}</p>
        <LoginForm t={t.login} />
        <p className="mt-4 text-sm text-body">
          {t.login.firstTime}{" "}
          <Link href="/activate" className="font-medium text-ink underline underline-offset-4">
            {t.login.activateLink}
          </Link>
        </p>
        <p className="mt-1 text-[12.5px] text-muted">{t.login.forgot}</p>
        <div className="my-5 h-px bg-hairline" />
        <button disabled className={cx(buttonSecondary, "w-full")}>
          {t.login.larkSecond}
        </button>
      </AuthCard>
    );
  }

  // Demo mode: no database configured (local sample data only).
  const users = (await getData()).listUsers();
  return (
    <AuthCard t={t} locale={locale}>
      <h1 className="text-[22px] font-semibold tracking-[-0.5px]">{t.login.title}</h1>
      <p className="mt-1 text-sm text-body">{t.app.tagline}</p>
      <div className="my-6 h-px bg-hairline" />
      <form action={demoSignIn} className="space-y-3">
        <label htmlFor="userId" className="block text-sm font-medium text-ink">
          {t.login.pick}
        </label>
        <select
          id="userId"
          name="userId"
          defaultValue="u01"
          className="h-11 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-base text-ink focus:border-2 focus:border-ink focus:outline-none sm:text-sm"
        >
          {ROLE_ORDER.map((role) => {
            const members = users.filter((u) => u.role === role);
            if (members.length === 0) return null;
            return (
              <optgroup key={role} label={t.roles[role]}>
                {members.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}, {u.title}
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
    </AuthCard>
  );
}
