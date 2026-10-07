import Link from "next/link";
import { buttonSecondary } from "@/components/ui";
import { getI18n } from "@/lib/session";

// Shown both for missing records and for records outside the user's scope.
export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-[48px] font-semibold tracking-[-1.44px] text-ink">404</div>
      <p className="text-sm text-body">
        {t.common.notFound} {t.common.noAccess}
      </p>
      <Link href="/" className={buttonSecondary}>
        {t.nav.overview}
      </Link>
    </div>
  );
}
