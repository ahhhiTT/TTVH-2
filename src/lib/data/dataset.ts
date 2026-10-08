import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { supabase } from "../db/supabase";
import * as seed from "./seed";
import type {
  Assignment,
  AuditEntry,
  Brand,
  DailyMetric,
  MonthlyMetric,
  MonthlyTarget,
  Store,
  Team,
  User,
} from "./types";

export const DATASET_TAG = "dataset";

export type DataSource = "supabase" | "seed";

interface Raw {
  source: DataSource;
  teams: Team[];
  users: User[];
  brands: Brand[];
  stores: Store[];
  assignments: Assignment[];
  daily: DailyMetric[];
  targets: MonthlyTarget[];
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// PostgREST caps a response at 1000 rows, so large tables are read in pages.
async function readAll<T>(table: string, columns: string, order: string[]): Promise<T[]> {
  const db = supabase()!;
  const size = 1000;
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  const pages = Math.ceil((count ?? 0) / size);
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => {
      let q = db.from(table).select(columns);
      for (const col of order) q = q.order(col);
      return q.range(i * size, i * size + size - 1);
    }),
  );
  return results.flatMap((r) => {
    if (r.error) throw new Error(`${table}: ${r.error.message}`);
    return r.data as T[];
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fromSupabase(): Promise<Raw> {
  const [teams, people, brands, stores, assignments, daily, targets] = await Promise.all([
    readAll<any>("teams", "*", ["id"]),
    readAll<any>("people", "*", ["id"]),
    readAll<any>("brands", "*", ["id"]),
    readAll<any>("stores", "*", ["id"]),
    readAll<any>("store_assignments", "*", ["id"]),
    readAll<any>("daily_metrics", "store_id,date,gmv,nmv,orders,traffic,ad_spend", ["store_id", "date"]),
    readAll<any>("monthly_targets", "*", ["store_id", "month"]),
  ]);
  return {
    source: "supabase",
    teams: teams.map((t) => ({ id: t.id, name: t.name, leadId: t.lead_id, managerId: t.manager_id, archivedAt: t.archived_at })),
    users: people.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      title: p.title ?? "",
      department: p.department ?? "",
      level: p.level ?? "",
      teamId: p.team_id,
      managerId: p.manager_id,
      permissions: p.permissions ?? [],
      grantedStoreIds: p.granted_store_ids ?? [],
      archivedAt: p.archived_at,
    })),
    brands: brands.map((b) => ({ id: b.id, name: b.name, category: b.category ?? "", archivedAt: b.archived_at })),
    stores: stores.map((s) => ({
      id: s.id,
      brandId: s.brand_id,
      name: s.name,
      channel: s.platform,
      scale: s.scale,
      difficulty: s.difficulty,
      status: s.status,
      archivedAt: s.archived_at,
    })),
    assignments: assignments.map((a) => ({
      id: a.id,
      userId: a.person_id,
      storeId: a.store_id,
      workloadPct: Number(a.workload_pct),
      isPrimary: a.is_primary,
      validFrom: a.valid_from,
      validTo: a.valid_to,
      archivedAt: a.archived_at,
    })),
    daily: daily.map((r) => ({
      storeId: r.store_id,
      date: r.date,
      gmv: num(r.gmv),
      nmv: num(r.nmv),
      orders: num(r.orders),
      traffic: num(r.traffic),
      adSpend: num(r.ad_spend),
    })),
    targets: targets.map((t) => ({ storeId: t.store_id, month: String(t.month).slice(0, 7), gmvTarget: num(t.gmv_target) })),
  };
}

async function loadRaw(): Promise<Raw> {
  "use cache";
  cacheTag(DATASET_TAG);
  cacheLife("minutes");
  return fromSupabase();
}

export async function readAudit(limit = 200): Promise<AuditEntry[]> {
  const db = supabase();
  if (!db) return [];
  const { data, error } = await db.from("audit_log").select("*").order("at", { ascending: false }).limit(limit);
  if (error) throw new Error(`audit_log: ${error.message}`);
  return data.map((r: any) => ({
    id: r.id,
    at: r.at,
    actorId: r.actor_id,
    entity: r.entity,
    entityId: r.entity_id,
    action: r.action,
    before: r.before,
    after: r.after,
  }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Read-only view over one snapshot of the data. Lists hide archived records;
// get* still resolves them so history keeps pointing at the right name.
export class Data {
  readonly source: DataSource;
  readonly teams: Team[];
  readonly users: User[];
  readonly brands: Brand[];
  readonly stores: Store[];
  readonly assignments: Assignment[];
  readonly daily: DailyMetric[];
  readonly targets: MonthlyTarget[];
  private byId = new Map<string, unknown>();
  private dailyByStore = new Map<string, DailyMetric[]>();
  private monthlyCache = new Map<string, MonthlyMetric[]>();

  constructor(raw: Raw) {
    this.source = raw.source;
    this.teams = raw.teams;
    this.users = raw.users;
    this.brands = raw.brands;
    this.stores = raw.stores;
    this.assignments = raw.assignments;
    this.daily = raw.daily;
    this.targets = raw.targets;
    for (const x of raw.teams) this.byId.set(`team:${x.id}`, x);
    for (const x of raw.users) this.byId.set(`user:${x.id}`, x);
    for (const x of raw.brands) this.byId.set(`brand:${x.id}`, x);
    for (const x of raw.stores) this.byId.set(`store:${x.id}`, x);
    for (const r of raw.daily) {
      const list = this.dailyByStore.get(r.storeId);
      if (list) list.push(r);
      else this.dailyByStore.set(r.storeId, [r]);
    }
  }

  getUser = (id: string) => (this.byId.get(`user:${id}`) as User | undefined) ?? null;
  getStore = (id: string) => (this.byId.get(`store:${id}`) as Store | undefined) ?? null;
  getBrand = (id: string) => (this.byId.get(`brand:${id}`) as Brand | undefined) ?? null;
  getTeam = (id: string | null) => (id ? ((this.byId.get(`team:${id}`) as Team | undefined) ?? null) : null);

  listUsers = () => this.users.filter((r) => r.archivedAt === null);
  listStores = () => this.stores.filter((r) => r.archivedAt === null);
  listTeams = () => this.teams.filter((r) => r.archivedAt === null);
  listBrands = () => this.brands.filter((r) => r.archivedAt === null);

  // Assignments in force on a date (default: today), not archived.
  activeAssignments(on = isoDate(new Date())) {
    return this.assignments.filter(
      (a) => a.archivedAt === null && a.validFrom <= on && (a.validTo === null || a.validTo >= on),
    );
  }
  // Assignments that overlap a date range, for attributing a period to people.
  assignmentsOverlapping(from: string, to: string) {
    return this.assignments.filter(
      (a) => a.archivedAt === null && a.validFrom <= to && (a.validTo === null || a.validTo >= from),
    );
  }
  assignmentsForUser = (userId: string) => this.activeAssignments().filter((a) => a.userId === userId);
  assignmentsForStore = (storeId: string) => this.activeAssignments().filter((a) => a.storeId === storeId);

  dailyFor(storeId: string, from: string, to: string) {
    return (this.dailyByStore.get(storeId) ?? []).filter((r) => r.date >= from && r.date <= to);
  }

  // Latest date with any received GMV, across all stores.
  lastDataDate() {
    let last = "";
    for (const r of this.daily) if (r.gmv !== null && r.date > last) last = r.date;
    return last || null;
  }

  firstDataDate() {
    let first = "";
    for (const r of this.daily) if (!first || r.date < first) first = r.date;
    return first || null;
  }

  // Monthly rows summed from daily data. A field is null for a store-month
  // when no day in that month has it (Missing); partly missing days are
  // visible in the daily views.
  monthly(month: string): MonthlyMetric[] {
    const hit = this.monthlyCache.get(month);
    if (hit) return hit;
    const target = new Map(this.targets.filter((t) => t.month === month).map((t) => [t.storeId, t.gmvTarget]));
    const rows = this.stores.map((s) => {
      const days = (this.dailyByStore.get(s.id) ?? []).filter((r) => r.date.startsWith(month));
      const sum = (f: "gmv" | "nmv" | "orders" | "traffic" | "adSpend") => {
        const present = days.filter((r) => r[f] !== null);
        return present.length ? present.reduce((acc, r) => acc + (r[f] as number), 0) : null;
      };
      return {
        storeId: s.id,
        month,
        gmvTarget: target.get(s.id) ?? null,
        gmv: sum("gmv"),
        nmv: sum("nmv"),
        orders: sum("orders"),
        traffic: sum("traffic"),
        adSpend: sum("adSpend"),
      };
    });
    this.monthlyCache.set(month, rows);
    return rows;
  }
}

function fromSeed(): Raw {
  return {
    source: "seed",
    teams: seed.teams,
    users: seed.users,
    brands: seed.brands,
    stores: seed.stores,
    assignments: seed.assignments,
    daily: seed.daily,
    targets: seed.targets,
  };
}

// One snapshot per request.
export const getData = cache(async (): Promise<Data> => {
  if (!supabase()) return new Data(fromSeed());
  return new Data(await loadRaw());
});
