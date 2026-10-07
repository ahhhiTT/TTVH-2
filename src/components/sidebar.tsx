"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ModuleKey } from "@/lib/rbac";
import { MODULE_META } from "./module-meta";
import { ThemeToggle } from "./theme-toggle";
import { LogoMark, MenuLines } from "./svg";
import { cx } from "./ui";

export interface NavGroup {
  label: string;
  items: { key: ModuleKey; label: string }[];
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label} className="mb-5">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">{group.label}</div>
          <ul className="space-y-0.5">
            {group.items.map(({ key, label }) => {
              const { href, accent } = MODULE_META[key];
              const active = isActive(pathname, href);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      `accent-${accent} group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors`,
                      active ? "bg-surface-strong text-ink" : "text-body hover:bg-hairline-soft hover:text-ink",
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r-full"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                    <span
                      aria-hidden
                      className={cx(
                        "size-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125",
                        !active && "opacity-50 group-hover:opacity-100",
                      )}
                      style={{ background: "var(--accent)" }}
                    />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ appName, onNavigate, bordered = true }: { appName: string; onNavigate?: () => void; bordered?: boolean }) {
  return (
    <Link href="/" onClick={onNavigate} className={cx("flex h-16 shrink-0 items-center gap-2.5 px-5", bordered && "border-b border-hairline")}>
      <LogoMark size={28} />
      <span className="text-[15px] font-semibold tracking-[-0.3px]">{appName}</span>
    </Link>
  );
}

export function Sidebar({ appName, groups }: { appName: string; groups: NavGroup[] }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hairline-strong bg-canvas md:flex">
      <Brand appName={appName} />
      <NavList groups={groups} />
    </aside>
  );
}

// Below md the sidebar becomes a slide-in drawer opened from the top bar.
export function MobileNav({
  appName,
  groups,
  labels,
}: {
  appName: string;
  groups: NavGroup[];
  labels: { open: string; close: string; light: string; dark: string; theme: string };
}) {
  const [open, setOpen] = useState(false);
  // The drawer is portalled to <body>: the top bar uses backdrop-filter, which
  // would otherwise become the containing block for position: fixed.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        className="-ml-1 flex size-10 items-center justify-center rounded-md text-ink hover:bg-hairline-soft"
      >
        <MenuLines />
      </button>
      {mounted &&
        createPortal(
          <>
      <div
        className={cx("fixed inset-0 z-40 bg-black/40 transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-72 flex-col bg-canvas shadow-[0_0_40px_var(--shadow-hover)] transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-hairline pr-2">
          <Brand appName={appName} onNavigate={() => setOpen(false)} bordered={false} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.close}
            className="flex size-10 items-center justify-center rounded-md text-ink hover:bg-hairline-soft"
          >
            <MenuLines open />
          </button>
        </div>
        <NavList groups={groups} onNavigate={() => setOpen(false)} />
        <div className="flex items-center justify-between border-t border-hairline px-5 py-3">
          <span className="text-[13px] text-muted">{labels.theme}</span>
          <ThemeToggle labels={{ light: labels.light, dark: labels.dark, group: labels.theme }} />
        </div>
      </aside>
          </>,
          document.body,
        )}
    </div>
  );
}
