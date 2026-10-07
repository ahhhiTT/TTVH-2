"use client";

import {
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Store,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ModuleKey } from "@/lib/rbac";
import { cx } from "./ui";

const ICONS: Record<ModuleKey, typeof Store> = {
  overview: LayoutDashboard,
  stores: Store,
  people: Users,
  planning: Target,
  tasks: ClipboardCheck,
  reports: FileText,
  career: GraduationCap,
  knowledge: BookOpen,
  settings: Settings,
};

const HREF: Record<ModuleKey, string> = {
  overview: "/",
  stores: "/stores",
  people: "/people",
  planning: "/planning",
  tasks: "/tasks",
  reports: "/reports",
  career: "/career",
  knowledge: "/knowledge",
  settings: "/settings",
};

export interface NavGroup {
  label: string;
  items: { key: ModuleKey; label: string }[];
}

export function Sidebar({ appName, groups }: { appName: string; groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-hairline-strong bg-canvas md:flex">
      <Link href="/" className="flex h-16 items-center gap-2 border-b border-hairline px-5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
          <ChartColumn size={16} aria-hidden />
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
                const Icon = ICONS[key];
                const href = HREF[key];
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium",
                        active ? "bg-surface-strong text-ink" : "text-body hover:bg-hairline-soft hover:text-ink",
                      )}
                    >
                      <Icon size={16} aria-hidden />
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
