"use client";

import { useState } from "react";

export interface DailyPoint {
  label: string; // axis label, e.g. "08"
  title: string; // tooltip title, e.g. "08/10/2026"
  value: number | null; // null + due = Missing (dashed slot); null + !due = future day (empty)
  prev: number | null;
  due: boolean;
  valueText: string;
  prevText: string;
  note: string | null; // e.g. "missing in 3 stores"
}

// Daily bars for the period with a thin tick for the comparison period at the
// same position. One measure, one axis.
export function DailyChart({ points, labels }: { points: DailyPoint[]; labels: { current: string; previous: string } }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 760;
  const height = 230;
  const pad = { top: 12, bottom: 26, left: 6, right: 6 };
  const values = points.flatMap((p) => [p.value, p.prev]).filter((v): v is number => v !== null);
  const max = Math.max(1, ...values) * 1.08;
  const slot = (width - pad.left - pad.right) / Math.max(1, points.length);
  const barW = Math.max(3, Math.min(28, slot - 2));
  const y = (v: number) => pad.top + (1 - v / max) * (height - pad.top - pad.bottom);
  const base = y(0);
  const every = Math.ceil(points.length / 16);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={labels.current}>
        <defs>
          <linearGradient id="daily-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-bar-top)" />
            <stop offset="100%" stopColor="var(--chart-bar)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad.left} x2={width - pad.right} y1={y(max * f)} y2={y(max * f)} stroke="var(--hairline)" />
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={base} y2={base} stroke="var(--hairline-strong)" />
        {points.map((p, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const top = y(p.value ?? 0);
          const h = Math.max(0, base - top);
          const r = Math.min(4, h, barW / 2);
          const x0 = cx - barW / 2;
          const x1 = cx + barW / 2;
          return (
            <g key={p.title}>
              {p.value === null ? (
                p.due && (
                  <rect x={x0} y={base - 28} width={barW} height={28} rx={Math.min(4, barW / 2)} fill="none" stroke="var(--muted-soft)" strokeDasharray="3 3" />
                )
              ) : (
                <path
                  d={`M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${base} Z`}
                  fill="url(#daily-bar)"
                  className="grow-y"
                  style={{ "--i": Math.min(i, 20), transition: "opacity 150ms" } as React.CSSProperties}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {p.prev !== null && (
                <line x1={x0 - 1} x2={x1 + 1} y1={y(p.prev)} y2={y(p.prev)} stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" opacity={0.75} />
              )}
              {i % every === 0 && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                  {p.label}
                </text>
              )}
              <rect
                x={pad.left + slot * i}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover((h) => (h === i ? null : i))}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 whitespace-nowrap rounded-md border border-hairline-strong bg-canvas px-3 py-2 text-[13px] shadow-[var(--shadow-soft)]"
          style={{
            left: `${((pad.left + slot * hover + slot / 2) / width) * 100}%`,
            transform: `translateX(${hover < points.length * 0.2 ? "-10%" : hover > points.length * 0.8 ? "-90%" : "-50%"})`,
          }}
        >
          <div className="font-semibold text-ink">{points[hover].title}</div>
          <div className="tabular text-body">
            {labels.current}: <span className="text-ink">{points[hover].valueText}</span>
          </div>
          <div className="tabular text-body">
            {labels.previous}: <span className="text-ink">{points[hover].prevText}</span>
          </div>
          {points[hover].note && <div className="text-muted">{points[hover].note}</div>}
        </div>
      )}
    </div>
  );
}
