import { AppShell, PublicShell } from "@/components/app-shell";
import { getCurrentUser, getI18n } from "@/lib/session";

// The homepage is public. Signed-in users get it inside the app shell.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [user, { locale, t }] = await Promise.all([getCurrentUser(), getI18n()]);
  return user ? (
    <AppShell user={user} locale={locale} t={t}>
      {children}
    </AppShell>
  ) : (
    <PublicShell locale={locale} t={t}>
      {children}
    </PublicShell>
  );
}
