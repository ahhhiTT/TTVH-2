"use client";

import { ChartColumn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleKey } from "@/lib/rbac";
import { MODULE_META } from "./module-meta";
import { cx } from "./ui";

export interface NavGroup {
  label: string;
  items: { key: ModuleKey; label: string }[];
}

export function Sidebar({ appName, groups }: { appName: string; groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hairline-strong bg-canvas md:flex">
      <Link href="/" className="group flex h-16 items-center gap-2 border-b border-hairline px-5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
          <ChartColumn size={16} aria-hidden className="transition-transform duration-300 group-hover:scale-110" />
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.3px]">{appName}</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.88px] text-muted">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map(({ key, label }) => {
                const { icon: Icon, href, accent } = MODULE_META[key];
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        `accent-${accent} group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors`,
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
                        className={cx(
                          "flex size-6 items-center justify-center rounded-sm transition-transform duration-200 group-hover:scale-110",
                          active ? "accent-plate" : "text-muted group-hover:text-[color:var(--accent)]",
                        )}
                      >
                        <Icon size={15} aria-hidden />
                      </span>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
