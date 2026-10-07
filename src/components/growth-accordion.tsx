"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cx } from "./ui";

const STEP_MS = 6000;
const RING_R = 9;
const RING_LEN = 2 * Math.PI * RING_R;

// expo.dev "Develop / Test / Deploy / Monitor" pattern: one item open at a
// time, auto-advancing with a progress ring, synced to an isometric drawing.
export function GrowthAccordion({ groups }: { groups: [string, string[]][] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % groups.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, groups.length]);

  return (
    <div
      className="grid items-center gap-8 md:grid-cols-2 md:gap-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ul className="space-y-1">
        {groups.map(([title, items], i) => {
          const open = i === active;
          return (
            <li key={title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-expanded={open}
                className={cx(
                  "flex w-full items-center gap-3 py-2 text-left text-[22px] font-semibold tracking-[-0.5px] transition-colors md:text-[26px]",
                  open ? "text-ink" : "text-muted hover:text-body",
                )}
              >
                {title}
                {open && (
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="shrink-0 -rotate-90">
                    <circle cx="11" cy="11" r={RING_R} fill="none" stroke="var(--hairline-strong)" strokeWidth="2" />
                    <circle
                      key={`${active}-${paused}`}
                      className={paused ? undefined : "workflow-ring"}
                      cx="11"
                      cy="11"
                      r={RING_R}
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={RING_LEN}
                      strokeDashoffset={paused ? 0 : RING_LEN}
                      style={{ "--ring-len": RING_LEN, "--ring-ms": `${STEP_MS}ms` } as CSSProperties}
                    />
                  </svg>
                )}
              </button>
              <div
                className={cx(
                  "grid transition-[grid-template-rows,opacity] duration-500",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <ul className="flex flex-wrap gap-1.5 overflow-hidden pb-3">
                  {items.map((item) => (
                    <li key={item} className="rounded-full border border-hairline-strong bg-canvas px-3 py-1 text-[13px] text-ink">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
      <IsoStack layers={groups.length} active={active} />
    </div>
  );
}

// Isometric stack of slabs; the active layer is filled, the rest are dashed.
function IsoStack({ layers, active }: { layers: number; active: number }) {
  const cx0 = 180;
  const w = 130;
  const h = 65;
  const gap = 62;
  const top = 80;
  const slab = (cy: number) => `${cx0},${cy - h} ${cx0 + w},${cy} ${cx0},${cy + h} ${cx0 - w},${cy}`;
  const ys = Array.from({ length: layers }, (_, i) => top + i * gap);
  const last = ys[ys.length - 1];

  return (
    <svg viewBox={`0 0 360 ${last + h + 30}`} className="mx-auto w-full max-w-[420px]" aria-hidden>
      {/* Vertical edges joining the slabs. */}
      {[cx0 - w, cx0, cx0 + w].map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={x === cx0 ? top + h : top}
          y2={x === cx0 ? last + h : last}
          stroke="var(--muted-soft)"
          strokeDasharray="4 4"
        />
      ))}
      {ys
        .map((cy, i) => ({ cy, i }))
        .reverse()
        .map(({ cy, i }) => {
          const on = i === active;
          return (
            <g key={i}>
              <polygon
                points={slab(cy)}
                fill={on ? "color-mix(in oklab, var(--accent-blue) 22%, var(--canvas))" : "var(--canvas)"}
                stroke={on ? "var(--accent-blue)" : "var(--muted-soft)"}
                strokeWidth={on ? 1.6 : 1}
                strokeDasharray={on ? undefined : "4 4"}
                style={{ transition: "fill 400ms, stroke 400ms" }}
              />
              {/* Inner grid lines on the active slab. */}
              {on &&
                [0.33, 0.66].map((f) => (
                  <g key={f} stroke="var(--accent-blue)" strokeOpacity="0.35">
                    <line x1={cx0 - w * (1 - f)} y1={cy - h * f} x2={cx0 + w * f} y2={cy + h * (1 - f)} />
                    <line x1={cx0 + w * (1 - f)} y1={cy - h * f} x2={cx0 - w * f} y2={cy + h * (1 - f)} />
                  </g>
                ))}
            </g>
          );
        })}
      {/* Small dark cube riding on the active layer. */}
      <g style={{ transform: `translateY(${ys[active] - top}px)`, transition: "transform 500ms cubic-bezier(0.2,0.7,0.2,1)" }}>
        <polygon points={`${cx0},${top - 30} ${cx0 + 22},${top - 19} ${cx0},${top - 8} ${cx0 - 22},${top - 19}`} fill="var(--ink)" />
        <polygon points={`${cx0 - 22},${top - 19} ${cx0},${top - 8} ${cx0},${top + 14} ${cx0 - 22},${top + 3}`} fill="var(--ink)" opacity="0.85" />
        <polygon points={`${cx0 + 22},${top - 19} ${cx0},${top - 8} ${cx0},${top + 14} ${cx0 + 22},${top + 3}`} fill="var(--ink)" opacity="0.65" />
      </g>
    </svg>
  );
}
