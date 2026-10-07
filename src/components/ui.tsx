import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { PaceStatus } from "@/lib/metrics";
import type { Accent } from "./module-meta";
import { Chevron, StatusMark } from "./svg";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const buttonPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-[18px] text-sm font-medium text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50";
export const buttonSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-hairline-strong bg-canvas px-[17px] text-sm font-medium text-ink transition-colors hover:bg-canvas-soft disabled:opacity-50";

const stagger = (i?: number) => (i === undefined ? undefined : ({ "--i": i } as CSSProperties));

// Small accent bar that marks a module's identity color. Not an icon.
export function AccentBar({ accent, className }: { accent: Accent; className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(`accent-${accent} inline-block w-1 shrink-0 rounded-full`, className)}
      style={{ background: "var(--accent)" }}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  accent,
  back,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  accent?: Accent;
  back?: { href: string; label: string };
}) {
  return (
    <div className="enter mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-body hover:text-ink">
          <Chevron size={14} /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-stretch gap-3">
          {accent && <AccentBar accent={accent} />}
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.7px] text-ink md:text-[28px] md:tracking-[-0.84px]">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-body">{subtitle}</p>}
          </div>
        </div>
        {actions}
      </div>
    </div>
  );
}

export function Card({
  title,
  hint,
  accent,
  children,
  className,
  padded = true,
  index,
}: {
  title?: string;
  hint?: ReactNode;
  accent?: Accent;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  index?: number;
}) {
  return (
    <section
      className={cx("enter min-w-0 rounded-lg border border-hairline-strong bg-canvas", accent && `accent-${accent}`, className)}
      style={stagger(index)}
    >
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-hairline px-4 py-3.5 md:px-5 md:py-4">
          <h2 className="flex items-center gap-2.5 text-base font-semibold text-ink">
            {accent && <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--accent)" }} />}
            {title}
          </h2>
          {hint && <span className="text-[13px] text-muted">{hint}</span>}
        </header>
      )}
      <div className={padded ? "p-4 md:p-5" : undefined}>{children}</div>
    </section>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full bg-surface-strong px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.88px] text-ink",
        className,
      )}
    >
      {children}
    </span>
  );
}

// Inline marker for anything unconfirmed.
export function Tbd({ label = "TBD" }: { label?: string }) {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-xs border border-dashed border-warning px-1 text-[10px] font-semibold tracking-[0.5px] text-warning">
      {label}
    </span>
  );
}

const STATUS_CLASS: Record<PaceStatus, string> = {
  good: "text-success",
  warning: "text-warning",
  critical: "text-error",
  unknown: "text-muted",
};

// Status is never color-only: shape + label always travel together.
export function StatusLabel({ status, label }: { status: PaceStatus; label: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap", STATUS_CLASS[status])}>
      <StatusMark status={status} />
      {label}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = "blue",
  featured = false,
  index = 0,
  tbd = false,
  missing = false,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: Accent;
  featured?: boolean; // dark inverted card, the design's "feature-card-dark"
  index?: number;
  tbd?: boolean; // the KPI definition is not confirmed
  missing?: boolean; // value is Missing Data, render it muted
}) {
  return (
    <div
      className={cx(
        `accent-${accent} enter lift relative min-w-0 overflow-hidden rounded-lg border p-4 md:p-5`,
        featured ? "on-dark border-transparent bg-surface-dark text-on-dark" : "border-hairline-strong bg-canvas",
      )}
      style={stagger(index)}
    >
      {featured ? (
        <span
          aria-hidden
          className="drift pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-cyan), var(--accent-purple) 60%, transparent 70%)" }}
        />
      ) : (
        <span aria-hidden className="absolute top-0 left-0 h-[3px] w-full" style={{ background: "var(--accent)", opacity: 0.85 }} />
      )}
      <div
        className={cx(
          "relative flex items-center text-[11px] font-semibold uppercase tracking-[0.88px]",
          featured ? "text-on-dark-soft" : "text-muted",
        )}
      >
        {label}
        {tbd && <Tbd />}
      </div>
      <div
        className={cx(
          "tabular relative mt-2 font-semibold leading-none",
          missing ? "text-[18px] tracking-normal" : "text-[24px] tracking-[-0.7px] md:text-[28px] md:tracking-[-0.84px]",
          featured ? "text-on-dark" : missing ? "text-muted" : "text-ink",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className={cx("relative mt-2 text-[13px]", featured ? "text-on-dark-soft" : "text-body")}>{sub}</div>
      )}
    </div>
  );
}

export function ProgressBar({ value, status }: { value: number | null; status: PaceStatus }) {
  const color = { good: "bg-success", warning: "bg-warning", critical: "bg-error", unknown: "bg-muted" }[status];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
      {value !== null && (
        <div className={cx("grow-x h-full rounded-full", color)} style={{ width: `${Math.min(100, value * 100)}%` }} />
      )}
    </div>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-muted whitespace-nowrap";
export const td = "px-4 py-3 text-sm text-ink";
// Numeric cell; Missing values render muted.
export const tdNum = (missing: boolean) => cx(td, "tabular text-right whitespace-nowrap", missing && "text-muted");

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-body">{children}</div>;
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" }) {
  return (
    <p
      className={cx(
        "rounded-lg px-4 py-3 text-[13px]",
        tone === "warning" ? "bg-warning-soft text-warning" : "border border-hairline-strong bg-canvas text-body",
      )}
    >
      {children}
    </p>
  );
}
