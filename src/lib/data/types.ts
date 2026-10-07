// Domain model. Kept independent of storage so the mock repo can later be
// swapped for a real database (Prisma/Postgres) without touching the UI.

export type Role =
  | "director" // Giám đốc TTVH — sees everything
  | "manager" // sees the teams under them
  | "teamlead" // sees their team
  | "staff" // sees own stores + own performance
  | "viewer" // other departments (Media, Content, Booking…) — only granted stores
  | "brand"; // brand-side login — only granted stores

export type Channel = "shopee" | "tiktok" | "lazada" | "website";

export type Permission =
  | "benchmark:view" // see centre-wide benchmark figures
  | "peers:view"; // see colleagues' figures / ranking

export interface Team {
  id: string;
  name: string;
  leadId: string | null;
  managerId: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string; // "Growth", "Media", brand name…
  level: string; // e.g. "L2"
  teamId: string | null;
  managerId: string | null; // direct line manager
  permissions: Permission[];
  grantedStoreIds: string[]; // for viewer / brand roles
}

export interface Brand {
  id: string;
  name: string;
  category: string;
}

export interface Store {
  id: string;
  brandId: string;
  name: string;
  channel: Channel;
  scale: "S" | "M" | "L" | "XL"; // business size
  difficulty: 1 | 2 | 3 | 4 | 5;
  status: "active" | "onboarding" | "paused";
}

// Who runs which store, and what share of their time it takes.
// Workload is agreed by director, line manager and the staff member.
export interface Assignment {
  userId: string;
  storeId: string;
  workloadPct: number;
  isPrimary: boolean;
}

// One row per store per month. Raw inputs only; ratios are derived in metrics.ts.
export interface MonthlyMetric {
  storeId: string;
  month: string; // "YYYY-MM"
  gmvTarget: number;
  gmv: number;
  nmv: number;
  traffic: number;
  orders: number;
  adSpend: number;
}
