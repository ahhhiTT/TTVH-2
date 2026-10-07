// Hand-written SVG marks. The app uses no icon library and no emoji.

import type { PaceStatus } from "@/lib/metrics";

type P = { size?: number; className?: string };

// Product mark: three rising bars on a rounded square.
export function LogoMark({ size = 28, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="7" fill="var(--primary)" />
      <rect x="7" y="15" width="3.5" height="6" rx="1" fill="var(--on-primary)" />
      <rect x="12.25" y="11" width="3.5" height="10" rx="1" fill="var(--on-primary)" />
      <rect x="17.5" y="7" width="3.5" height="14" rx="1" fill="var(--on-primary)" opacity="0.7" />
    </svg>
  );
}

// Status shape: circle = on track, triangle = watch, square = behind,
// dashed ring = undetermined. Shape carries meaning without color.
export function StatusMark({ status, size = 10 }: { status: PaceStatus; size?: number }) {
  const s = size;
  switch (status) {
    case "good":
      return (
        <svg width={s} height={s} viewBox="0 0 10 10" aria-hidden>
          <circle cx="5" cy="5" r="4.5" fill="currentColor" />
        </svg>
      );
    case "warning":
      return (
        <svg width={s} height={s} viewBox="0 0 10 10" aria-hidden>
          <path d="M5 0.6 L9.6 9.2 H0.4 Z" fill="currentColor" />
        </svg>
      );
    case "critical":
      return (
        <svg width={s} height={s} viewBox="0 0 10 10" aria-hidden>
          <rect x="0.8" y="0.8" width="8.4" height="8.4" rx="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 10 10" aria-hidden>
          <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 1.6" />
        </svg>
      );
  }
}

export function Chevron({ size = 14, className, dir = "left" }: P & { dir?: "left" | "right" | "down" }) {
  const rotate = { left: 0, right: 180, down: 270 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className={className} aria-hidden style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M8.5 3 L4.5 7 L8.5 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuLines({ size = 20, open = false }: P & { open?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      {open ? (
        <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M3 6 H17 M3 10 H17 M3 14 H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

// Thin connector arrow used in process and chain diagrams.
export function FlowArrow({ className }: { className?: string }) {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" className={className} aria-hidden>
      <path d="M1 5 H15 M11.5 1.5 L15.5 5 L11.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
