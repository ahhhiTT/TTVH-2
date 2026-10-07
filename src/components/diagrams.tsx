// Inline SVG diagrams for the homepage. Text comes from the dictionaries.

import type { Accent } from "./module-meta";
import { cx } from "./ui";

const ACCENTS: Accent[] = ["blue", "purple", "cyan", "green", "orange", "pink"];

// Growth at the centre, the other project roles on an orbit.
export function OrbitDiagram({ center, roles }: { center: string; roles: string[] }) {
  const size = 360;
  const c = size / 2;
  const r = 128;
  const pos = roles.map((_, i) => {
    const a = (i / roles.length) * Math.PI * 2 - Math.PI / 2;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[380px]" role="img" aria-label={center}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--hairline-strong)" strokeDasharray="3 6" />
      <circle className="glow" cx={c} cy={c} r={62} fill="color-mix(in oklab, var(--accent-blue) 16%, transparent)" style={{ transformOrigin: "center", transformBox: "fill-box" }} />
      {pos.map((p, i) => (
        <line
          key={i}
          className="dash-flow"
          x1={c}
          y1={c}
          x2={p.x}
          y2={p.y}
          stroke="var(--muted-soft)"
          strokeDasharray="4 8"
        />
      ))}
      <circle cx={c} cy={c} r={40} fill="var(--surface-dark)" />
      <text x={c} y={c + 5} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--on-dark)">
        {center}
      </text>
      {roles.map((role, i) => {
        const p = pos[i];
        const w = Math.max(64, role.length * 7.4 + 22);
        return (
          <g key={role} className={`accent-${ACCENTS[i % ACCENTS.length]}`}>
            <rect x={p.x - w / 2} y={p.y - 15} width={w} height={30} rx={15} fill="var(--canvas)" stroke="var(--hairline-strong)" />
            <circle cx={p.x - w / 2 + 13} cy={p.y} r={3.5} fill="var(--accent)" />
            <text x={p.x + 5} y={p.y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="var(--ink)">
              {role}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// End-to-end service chain: horizontal on large screens, vertical below.
export function ChainFlow({ steps }: { steps: string[] }) {
  return (
    <ol className="relative grid gap-2 lg:grid-cols-8 lg:gap-3">
      {/* Connector line, animated dashes. */}
      <svg aria-hidden className="pointer-events-none absolute top-0 left-[19px] h-full w-[2px] lg:top-[19px] lg:left-0 lg:h-[2px] lg:w-full" preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2="100%" className="dash-flow lg:hidden" stroke="var(--muted-soft)" strokeWidth="2" strokeDasharray="4 8" />
        <line x1="0" y1="1" x2="100%" y2="1" className="dash-flow hidden lg:inline" stroke="var(--muted-soft)" strokeWidth="2" strokeDasharray="4 8" />
      </svg>
      {steps.map((step, i) => (
        <li key={step} className={cx(`accent-${ACCENTS[i % ACCENTS.length]}`, "relative flex items-center gap-3 lg:flex-col lg:gap-2")}>
          {/* Opaque base so the connector line does not show through the tinted plate. */}
          <span className="relative z-10 shrink-0 rounded-full bg-canvas ring-4 ring-panel">
            <span className="accent-plate tabular flex size-10 items-center justify-center rounded-full text-[13px] font-semibold">
              {String(i + 1).padStart(2, "0")}
            </span>
          </span>
          <span className="text-sm font-semibold text-ink lg:text-center lg:text-[13px]">{step}</span>
        </li>
      ))}
    </ol>
  );
}
