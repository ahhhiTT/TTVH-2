"use client";

import { useState } from "react";

export interface GmvPoint {
  label: string;
  gmv: number;
  target: number;
  gmvText: string;
  targetText: string;
  achievementText: string;
}

// Single-series bar chart (actual GMV) with a target tick per month.
// One series → no legend box; the card title and hint name it.
export function GmvChart({
  points,
  labels,
}: {
  points: GmvPoint[];
  labels: { actual: string; target: string; achievement: string };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 220;
  const pad = { top: 12, bottom: 28, left: 8, right: 8 };
  const max = Math.max(...points.flatMap((p) => [p.gmv, p.target])) * 1.08 || 1;
  const slot = (width - pad.left - pad.right) / points.length;
  const barW = Math.min(44, slot * 0.5);
  const y = (v: number) => pad.top + (1 - v / max) * (height - pad.top - pad.bottom);
  const base = y(0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="GMV">
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad.left}
            x2={width - pad.right}
            y1={y(max * f)}
            y2={y(max * f)}
            stroke="var(--hairline)"
          />
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={base} y2={base} stroke="var(--hairline-strong)" />
        {points.map((p, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const top = y(p.gmv);
          const h = Math.max(0, base - top);
          const r = Math.min(4, h);
          return (
            <g key={p.label}>
              {/* Bar with 4px rounded top, square at the baseline. */}
              <path
                d={`M${cx - barW / 2},${base} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${base} Z`}
                fill="var(--chart-bar)"
                opacity={hover === null || hover === i ? 1 : 0.45}
              />
              <line
                x1={cx - barW / 2 - 6}
                x2={cx + barW / 2 + 6}
                y1={y(p.target)}
                y2={y(p.target)}
                stroke="var(--ink)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <text x={cx} y={height - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">
                {p.label}
              </text>
              {/* Hit target wider than the mark. */}
              <rect
                x={pad.left + slot * i}
                y={0}
                width={slot}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-md border border-hairline-strong bg-canvas px-3 py-2 text-[13px] shadow-[var(--shadow-soft)]"
          style={{
            left: `${((pad.left + slot * hover + slot / 2) / width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold text-ink">{points[hover].label}</div>
          <div className="tabular text-body">
            {labels.actual}: <span className="text-ink">{points[hover].gmvText}</span>
          </div>
          <div className="tabular text-body">
            {labels.target}: <span className="text-ink">{points[hover].targetText}</span>
          </div>
          <div className="tabular text-body">
            {labels.achievement}: <span className="text-ink">{points[hover].achievementText}</span>
          </div>
        </div>
      )}
    </div>
  );
}
