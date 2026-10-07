import { AppShell } from "@/components/app-shell";
import { getI18n, requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const { locale, t } = await getI18n();
  return (
    <AppShell user={user} locale={locale} t={t}>
      {children}
    </AppShell>
  );
}
