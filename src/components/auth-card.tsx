import Link from "next/link";
import type { ReactNode } from "react";
import { setLocale } from "@/lib/actions";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import { Chevron, LogoMark } from "./svg";
import { ThemeToggle } from "./theme-toggle";
import { cx } from "./ui";

// Shared frame for the sign-in and activation pages.
export function AuthCard({ t, locale, children }: { t: Dictionary; locale: Locale; children: ReactNode }) {
  return (
    <div className="sky-wash relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
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
      <div className="enter relative w-full max-w-md rounded-xl border border-hairline-strong bg-canvas/90 p-6 shadow-[0_24px_64px_var(--shadow-hover)] backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="text-lg font-semibold tracking-[-0.3px]">{t.app.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle labels={{ light: t.common.themeLight, dark: t.common.themeDark, group: t.common.themeLabel }} />
            <form action={setLocale} aria-label={t.common.languageLabel} className="flex gap-1">
              {(["vi", "en"] as const).map((l) => (
                <button
                  key={l}
                  name="locale"
                  value={l}
                  aria-pressed={locale === l}
                  className={cx(
                    "h-8 rounded-sm px-2 text-xs font-medium uppercase",
                    locale === l ? "bg-surface-strong text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {l}
                </button>
              ))}
            </form>
          </div>
        </div>

        {children}
      </div>
      <Link href="/" className="enter relative mt-5 inline-flex items-center gap-1 text-sm text-body hover:text-ink">
        <Chevron size={14} /> {t.login.backHome}
      </Link>
    </div>
  );
}
