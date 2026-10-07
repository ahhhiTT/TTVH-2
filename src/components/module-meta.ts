import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Store,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/rbac";

export type Accent = "blue" | "purple" | "cyan" | "green" | "orange" | "pink";

// Each module keeps one identity color everywhere (sidebar, headers, tiles).
export const MODULE_META: Record<ModuleKey, { href: string; icon: LucideIcon; accent: Accent }> = {
  overview: { href: "/", icon: LayoutDashboard, accent: "blue" },
  stores: { href: "/stores", icon: Store, accent: "cyan" },
  people: { href: "/people", icon: Users, accent: "purple" },
  planning: { href: "/planning", icon: Target, accent: "orange" },
  tasks: { href: "/tasks", icon: ClipboardCheck, accent: "green" },
  reports: { href: "/reports", icon: FileText, accent: "blue" },
  career: { href: "/career", icon: GraduationCap, accent: "pink" },
  knowledge: { href: "/knowledge", icon: BookOpen, accent: "purple" },
  settings: { href: "/settings", icon: Settings, accent: "cyan" },
};
