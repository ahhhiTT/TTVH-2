import type { ModuleKey } from "@/lib/rbac";

export type Accent = "blue" | "purple" | "cyan" | "green" | "orange" | "pink";

// Each module keeps one identity color everywhere (sidebar, headers, cards).
export const MODULE_META: Record<ModuleKey, { href: string; accent: Accent }> = {
  home: { href: "/", accent: "blue" },
  overview: { href: "/overview", accent: "blue" },
  stores: { href: "/stores", accent: "cyan" },
  people: { href: "/people", accent: "purple" },
  planning: { href: "/planning", accent: "orange" },
  tasks: { href: "/tasks", accent: "green" },
  reports: { href: "/reports", accent: "blue" },
  career: { href: "/career", accent: "pink" },
  knowledge: { href: "/knowledge", accent: "purple" },
  settings: { href: "/settings", accent: "cyan" },
};
