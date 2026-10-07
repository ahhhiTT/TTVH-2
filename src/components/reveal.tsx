"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

// Fades a block up when it scrolls into view (expo.dev style). Content is
// server-rendered and visible without JS once .is-in is applied.
export function Reveal({
  children,
  as: Tag = "div",
  className,
  index = 0,
  style,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  index?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className ?? ""}`} style={{ "--i": index, ...style } as CSSProperties}>
      {children}
    </Tag>
  );
}
