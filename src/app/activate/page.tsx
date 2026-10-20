import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ActivateForm } from "@/components/auth-forms";
import { demoMode, getCurrentUser, getI18n } from "@/lib/session";

export default async function ActivatePage() {
  if (demoMode() || (await getCurrentUser())) redirect("/login");
  const { locale, t } = await getI18n();
  return (
    <AuthCard t={t} locale={locale}>
      <h1 className="text-[22px] font-semibold tracking-[-0.5px]">{t.login.activateTitle}</h1>
      <p className="mt-1 mb-5 text-sm text-body">{t.login.activateSubtitle}</p>
      <ActivateForm t={t.login} />
      <p className="mt-4 text-sm text-body">
        {t.login.haveAccount}{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          {t.login.toLogin}
        </Link>
      </p>
    </AuthCard>
  );
}
