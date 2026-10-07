import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { PaceStatus } from "@/lib/metrics";
import type { Accent } from "./module-meta";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const buttonPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-[18px] text-sm font-medium text-on-primary hover:bg-primary-active disabled:opacity-50";
export const buttonSecondary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-hairline-strong bg-canvas px-[17px] text-sm font-medium text-ink hover:bg-canvas-soft";

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
  accent,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  accent?: Accent;
}) {
  return (
    <div className={cx("enter mb-6 flex flex-wrap items-end justify-between gap-4", accent && `accent-${accent}`)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="accent-plate flex size-11 items-center justify-center rounded-lg">
            <Icon size={22} aria-hidden />
          </span>
        )}
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.84px] text-ink">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-body">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function Card({
  title,
  hint,
  icon: Icon,
  accent,
  children,
  className,
  padded = true,
  index,
}: {
  title?: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: Accent;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  index?: number; // stagger position for the entrance animation
}) {
  return (
    <section
      className={cx("enter rounded-lg border border-hairline-strong bg-canvas", accent && `accent-${accent}`, className)}
      style={index !== undefined ? ({ "--i": index } as CSSProperties) : undefined}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-base font-semibold text-ink">
            {Icon && (
              <span className="accent-plate flex size-7 items-center justify-center rounded-md">
                <Icon size={15} aria-hidden />
              </span>
            )}
            {title}
          </h2>
          {hint && <span className="text-[13px] text-muted">{hint}</span>}
        </header>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
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

const STATUS_STYLE: Record<PaceStatus, { icon: typeof CircleCheck; className: string }> = {
  good: { icon: CircleCheck, className: "text-success" },
  warning: { icon: TriangleAlert, className: "text-warning" },
  critical: { icon: CircleAlert, className: "text-error" },
};

// Status is never color-only: icon + label always travel together.
export function StatusLabel({ status, label }: { status: PaceStatus; label: string }) {
  const { icon: Icon, className } = STATUS_STYLE[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[13px] font-medium", className)}>
      <Icon size={14} aria-hidden />
      {label}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  accent = "blue",
  featured = false,
  index = 0,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon?: LucideIcon;
  accent?: Accent;
  featured?: boolean; // dark inverted card, the design's "feature-card-dark"
  index?: number;
}) {
  return (
    <div
      className={cx(
        `accent-${accent} enter lift relative overflow-hidden rounded-lg border p-5`,
        featured ? "on-dark border-transparent bg-surface-dark text-on-dark" : "border-hairline-strong bg-canvas",
      )}
      style={{ "--i": index } as CSSProperties}
    >
      {featured && (
        <span
          aria-hidden
          className="drift pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--accent-cyan), var(--accent-purple) 60%, transparent 70%)" }}
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cx(
            "text-[11px] font-semibold uppercase tracking-[0.88px]",
            featured ? "text-on-dark-soft" : "text-muted",
          )}
        >
          {label}
        </div>
        {Icon && (
          <span
            className={cx(
              "flex size-8 shrink-0 items-center justify-center rounded-md",
              featured ? "bg-white/10 text-on-dark" : "accent-plate",
            )}
          >
            <Icon size={16} aria-hidden />
          </span>
        )}
      </div>
      <div
        className={cx(
          "tabular relative mt-1 text-[28px] font-semibold leading-none tracking-[-0.84px]",
          featured ? "text-on-dark" : "text-ink",
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

export function ProgressBar({ value, status }: { value: number; status: PaceStatus }) {
  const color = { good: "bg-success", warning: "bg-warning", critical: "bg-error" }[status];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
      <div className={cx("grow-x h-full rounded-full", color)} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-muted";
export const td = "px-4 py-3 text-sm text-ink";

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-body">{children}</div>;
}
