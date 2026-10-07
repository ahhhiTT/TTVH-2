import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Accent } from "./module-meta";

export interface HeroChip {
  icon: LucideIcon;
  accent: Accent;
  value: string;
  label: string;
}

// Overview hero: the design's sky-blue atmospheric wash, used on this band only.
export function Hero({ eyebrow, title, line, chips }: { eyebrow: string; title: string; line: string; chips: HeroChip[] }) {
  return (
    <section className="sky-wash enter relative mb-6 overflow-hidden rounded-xl border border-hairline-strong px-6 py-7 md:px-8">
      <span
        aria-hidden
        className="drift pointer-events-none absolute -top-24 right-[-6rem] size-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-cyan), transparent 65%)" }}
      />
      <div className="relative">
        <div className="text-[11px] font-semibold uppercase tracking-[0.88px] text-body">{eyebrow}</div>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.1] tracking-[-1px] text-ink md:text-[36px] md:tracking-[-1.08px]">
          {title}
        </h1>
        <p className="mt-2 text-[15px] text-body">{line}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <Chip key={c.label} index={i + 1} {...c} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Chip({ icon: Icon, accent, value, label, index }: HeroChip & { index: number }): ReactNode {
  return (
    <li
      className={`accent-${accent} enter flex items-center gap-2 rounded-full border border-hairline-strong bg-canvas/80 py-1 pr-3.5 pl-1 backdrop-blur`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="accent-plate flex size-7 items-center justify-center rounded-full">
        <Icon size={14} aria-hidden />
      </span>
      <span className="tabular text-sm font-semibold text-ink">{value}</span>
      <span className="text-[13px] text-body">{label}</span>
    </li>
  );
}
