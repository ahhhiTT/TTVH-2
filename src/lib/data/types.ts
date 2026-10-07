// Domain model. Kept independent of storage so the mock repo can later be
// swapped for a real database (Prisma/Postgres) without touching the UI.

export type Role =
  | "director" // Giám đốc TTVH, sees everything
  | "manager" // sees the teams under them
  | "teamlead" // sees their team
  | "staff" // sees own stores + own performance
  | "viewer" // other departments (Media, Content, Booking…), only granted stores
  | "brand"; // brand-side login, only granted stores

export type Channel = "shopee" | "tiktok" | "lazada" | "website";

export type Permission =
  | "benchmark:view" // see centre-wide benchmark figures
  | "peers:view"; // see colleagues' figures / ranking

// Master data is soft-deleted: archived records keep their history and are
// hidden from lists, never physically removed.
interface Archivable {
  archivedAt: string | null;
}

export interface Team extends Archivable {
  id: string;
  name: string;
  leadId: string | null;
  managerId: string | null;
}

export interface User extends Archivable {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  level: string;
  teamId: string | null;
  managerId: string | null;
  permissions: Permission[];
  grantedStoreIds: string[]; // for viewer / brand roles
}

export interface Brand extends Archivable {
  id: string;
  name: string;
  category: string;
}

export interface Store extends Archivable {
  id: string;
  brandId: string;
  name: string;
  channel: Channel;
  scale: "S" | "M" | "L" | "XL";
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
// null = data not received (Missing). 0 = the real value is zero.
export interface MonthlyMetric {
  storeId: string;
  month: string; // "YYYY-MM"
  gmvTarget: number | null;
  gmv: number | null;
  nmv: number | null;
  traffic: number | null;
  orders: number | null;
  adSpend: number | null;
}

export type MetricField = Exclude<keyof MonthlyMetric, "storeId" | "month">;
