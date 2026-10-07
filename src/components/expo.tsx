// Building blocks modelled on expo.dev: bento panels, logo carousel, status
// pill, mono eyebrow. All graphics are inline SVG.

import type { ReactNode } from "react";
import { cx } from "./ui";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted", className)}>
      {children}
    </div>
  );
}

// Large rounded panel. tone="dark" inverts it.
export function Panel({
  children,
  className,
  tone = "light",
}: {
  children: ReactNode;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-[28px] p-6 md:rounded-[40px] md:p-10",
        tone === "dark" ? "on-dark bg-surface-dark text-on-dark" : "bg-panel",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-canvas py-1 pr-3 pl-2 text-[12px] font-medium text-ink">
      <span className="relative flex size-2">
        <span aria-hidden className="pulse-ring absolute inset-0 rounded-full bg-success" />
        <span aria-hidden className="relative size-2 rounded-full bg-success" />
      </span>
      {children}
    </span>
  );
}

// Infinite horizontal logo strip. Items are rendered twice so the track can
// slide by exactly half its width.
export function Marquee({ items }: { items: { name: string; src: string }[] }) {
  const tile = (b: { name: string; src: string }, key: string, hidden = false) => (
    <li
      key={key}
      aria-hidden={hidden || undefined}
      className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-hairline-strong bg-white p-2.5 md:size-[72px]"
      title={b.name}
    >
      {/* Hotlinked from upbase.asia; plain img avoids proxying third-party assets. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={b.src} alt={hidden ? "" : b.name} loading="lazy" className="max-h-full max-w-full object-contain" />
    </li>
  );
  return (
    <div className="marquee overflow-hidden">
      <ul className="marquee-track flex w-max gap-3">
        {items.map((b) => tile(b, b.name))}
        {items.map((b) => tile(b, `${b.name}-dup`, true))}
      </ul>
    </div>
  );
}

// Product mark inside a slowly sweeping arc, used on dark panels.
export function ArcMark({ size = 168 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 168 168" aria-hidden>
      <defs>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-cyan)" />
          <stop offset="100%" stopColor="var(--accent-purple)" />
        </linearGradient>
      </defs>
      <circle cx="84" cy="84" r="74" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
      <circle
        className="arc-sweep"
        cx="84"
        cy="84"
        r="74"
        fill="none"
        stroke="url(#arc-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="120 345"
      />
      <circle cx="84" cy="84" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 5" />
      <rect x="58" y="58" width="52" height="52" rx="13" fill="#ffffff" />
      <rect x="70" y="86" width="6.5" height="12" rx="1.5" fill="#000" />
      <rect x="80.75" y="78" width="6.5" height="20" rx="1.5" fill="#000" />
      <rect x="91.5" y="70" width="6.5" height="28" rx="1.5" fill="#000" opacity="0.7" />
    </svg>
  );
}

// Arrow used inside pill CTAs and "learn more" links.
export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className={className}>
      <path d="M2 7 H11 M7.5 3.5 L11 7 L7.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
