"use client";

import { useEffect, useRef } from "react";

interface Ray {
  angle: number;
  inner: number; // start distance from centre (px, before scale)
  length: number;
  dot: number; // dot radius
  phase: number;
  speed: number;
  alpha: number;
}

// Rays and dots bursting out from behind the centre mark, as on the expo.dev hero.
// Drawn on canvas; colour follows the current theme's ink token.
export function Starburst({ className, rays = 260 }: { className?: string; rays?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Deterministic pseudo-random so the burst looks the same on every load.
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const list: Ray[] = Array.from({ length: rays }, () => ({
      angle: rand() * Math.PI * 2,
      inner: 120 + rand() * 30,
      length: 60 + Math.pow(rand(), 0.7) * 260,
      dot: rand() < 0.75 ? 1.2 + rand() * 1.6 : 0,
      phase: rand() * Math.PI * 2,
      speed: 0.3 + rand() * 0.7,
      alpha: 0.25 + rand() * 0.55,
    }));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let color = "23,23,23";

    const readColor = () => {
      const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
      const m = ink.match(/^#([0-9a-f]{6})$/i);
      if (m) {
        const n = parseInt(m[1], 16);
        color = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      // Scale the burst to the box; 420px is the design radius.
      const s = Math.min(w, h) / 2 / 420;
      const time = t / 1000;
      const spin = reduce ? 0 : time * 0.012;
      ctx.lineWidth = 1;
      for (const r of list) {
        const pulse = reduce ? 1 : 0.86 + 0.14 * Math.sin(time * r.speed + r.phase);
        const a = r.angle + spin;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const x0 = cx + cos * r.inner * s;
        const y0 = cy + sin * r.inner * s;
        const len = r.length * pulse;
        const x1 = cx + cos * (r.inner + len) * s;
        const y1 = cy + sin * (r.inner + len) * s;
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, `rgba(${color},${r.alpha * 0.9})`);
        grad.addColorStop(1, `rgba(${color},0)`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        if (r.dot) {
          const twinkle = reduce ? 1 : 0.55 + 0.45 * Math.sin(time * r.speed * 1.7 + r.phase * 2);
          ctx.fillStyle = `rgba(${color},${Math.min(1, r.alpha + 0.25) * twinkle})`;
          ctx.beginPath();
          ctx.arc(x1, y1, r.dot * Math.max(0.7, s * 1.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    readColor();
    resize();
    raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(canvas);
    // Re-read the colour when the theme changes.
    const mo = new MutationObserver(() => {
      readColor();
      if (reduce) draw(0);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => readColor();
    media.addEventListener("change", onScheme);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      media.removeEventListener("change", onScheme);
    };
  }, [rays]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
