import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { PaceStatus } from "@/lib/metrics";

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
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.84px] text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-body">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({
  title,
  hint,
  children,
  className,
  padded = true,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cx("rounded-lg border border-hairline-strong bg-canvas", className)}>
      {title && (
        <header className="flex items-baseline justify-between gap-3 border-b border-hairline px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
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
}: {
  label: string;
  value: string;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-hairline-strong bg-canvas p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">{label}</div>
      <div className="tabular mt-2 text-[28px] font-semibold leading-none tracking-[-0.84px] text-ink">{value}</div>
      {sub && <div className="mt-2 text-[13px] text-body">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, status }: { value: number; status: PaceStatus }) {
  const color = { good: "bg-success", warning: "bg-warning", critical: "bg-error" }[status];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-strong">
      <div className={cx("h-full rounded-full", color)} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </div>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.88px] text-muted";
export const td = "px-4 py-3 text-sm text-ink";

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-body">{children}</div>;
}
