import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cx } from "./ui";

export type ReportTab = "dashboard" | "weekly" | "template";

// Tabs shared by /reports and /reports/weekly.
export function ReportTabs({ active, t }: { active: ReportTab; t: Dictionary }) {
  const tabs: { key: ReportTab; label: string; href: string }[] = [
    { key: "dashboard", label: t.dash.tabDashboard, href: "/reports" },
    { key: "weekly", label: t.weekly.tab, href: "/reports/weekly" },
    { key: "template", label: t.dash.tabTemplate, href: "/reports?view=template" },
  ];
  return (
    <nav className="mb-5 flex flex-wrap gap-1.5" aria-label={t.reports.title}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={cx(
            "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
            tab.key === active ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
