"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ModuleKey } from "@/lib/rbac";
import { MODULE_META } from "./module-meta";
import { Chevron } from "./svg";
import { cx } from "./ui";

export interface TopNavGroup {
  label: string;
  items: { key: ModuleKey; label: string; desc: string }[];
}

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

// Horizontal menu with dropdowns, as on expo.dev ("Product ▾", "Solutions ▾").
// Single-item groups render as a plain link.
export function TopNav({ groups }: { groups: TopNavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const root = useRef<HTMLElement>(null);

  // Close on Escape and outside click; links close it on click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  };

  const linkClass = (active: boolean) =>
    cx(
      "flex h-9 items-center gap-1 rounded-full px-3 text-[14px] font-medium transition-colors",
      active ? "text-ink" : "text-body hover:text-ink",
    );

  return (
    <nav ref={root} className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {groups.map((g, gi) => {
        if (g.items.length === 1) {
          const it = g.items[0];
          const href = MODULE_META[it.key].href;
          return (
            <Link key={it.key} href={href} className={linkClass(isActive(pathname, href))} aria-current={isActive(pathname, href) ? "page" : undefined}>
              {it.label}
            </Link>
          );
        }
        const active = g.items.some((it) => isActive(pathname, MODULE_META[it.key].href));
        const isOpen = open === gi;
        return (
          <div
            key={g.label}
            className="relative"
            onMouseEnter={() => {
              cancelClose();
              setOpen(gi);
            }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className={cx(linkClass(active), isOpen && "text-ink")}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => setOpen(isOpen ? null : gi)}
            >
              {g.label}
              <span className={cx("inline-flex transition-transform duration-200", isOpen && "rotate-180")}>
                <Chevron dir="down" size={12} />
              </span>
            </button>
            <div
              className={cx(
                "absolute top-full left-0 z-40 pt-2 transition-[opacity,transform] duration-150",
                isOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
              )}
            >
              <ul className="w-[320px] rounded-2xl border border-hairline-strong bg-canvas p-1.5 shadow-[0_16px_48px_var(--shadow-hover)]">
                {g.items.map((it) => {
                  const { href, accent } = MODULE_META[it.key];
                  const on = isActive(pathname, href);
                  return (
                    <li key={it.key}>
                      <Link
                        href={href}
                        className={cx(
                          `accent-${accent} flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors`,
                          on ? "bg-panel" : "hover:bg-panel",
                        )}
                        aria-current={on ? "page" : undefined}
                        onClick={() => setOpen(null)}
                      >
                        <span className="accent-plate mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
                          <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{it.label}</span>
                          <span className="block text-[12.5px] leading-snug text-body">{it.desc}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// Account pill with a dropdown: who is signed in, theme switch, switch account.
export function AccountMenu({
  name,
  role,
  signOutLabel,
  signOutAction,
  children,
}: {
  name: string;
  role: string;
  signOutLabel: string;
  signOutAction: () => Promise<void>;
  children?: React.ReactNode; // extra rows, e.g. the theme toggle
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-9 items-center gap-2 rounded-full border border-hairline-strong bg-canvas py-1 pr-2.5 pl-1 text-sm font-medium text-ink transition-colors hover:bg-canvas-soft"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-on-primary">
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate xl:inline">{name}</span>
        <span className={cx("inline-flex transition-transform duration-200", open && "rotate-180")}>
          <Chevron dir="down" size={12} />
        </span>
      </button>
      <div
        className={cx(
          "absolute top-full right-0 z-40 pt-2 transition-[opacity,transform] duration-150",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <div className="w-[260px] rounded-2xl border border-hairline-strong bg-canvas p-3 shadow-[0_16px_48px_var(--shadow-hover)]">
          <div className="px-1 pb-3">
            <div className="truncate text-sm font-semibold text-ink">{name}</div>
            <div className="text-[13px] text-muted">{role}</div>
          </div>
          {children && <div className="border-t border-hairline px-1 py-3">{children}</div>}
          <form action={signOutAction} className="border-t border-hairline pt-3">
            <button className="flex h-9 w-full items-center justify-center rounded-full border border-hairline-strong text-[13px] font-semibold text-ink transition-colors hover:bg-canvas-soft">
              {signOutLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
