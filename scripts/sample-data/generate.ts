// Generates SAMPLE master data as SQL for the Supabase project. Fictional only.
// Usage: npx tsx scripts/sample-data/generate.ts > /tmp/master.sql
//
// Master data (people, teams, brands, stores, assignments) comes from the
// in-repo sample seed so ids stay stable. Daily metrics and monthly targets
// are generated inside Postgres by metrics.sql (run it after this file).

import { assignments, brands, stores, teams, users } from "../../src/lib/data/seed";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const q = (v: string | null) => (v === null ? "null" : `'${v.replace(/'/g, "''")}'`);
const arr = (v: string[]) => `'{${v.map((x) => `"${x}"`).join(",")}}'`;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const out: string[] = [];
out.push("begin;");

// teams first without lead/manager (people do not exist yet)
for (const t of teams) out.push(`insert into teams (id, name) values (${q(t.id)}, ${q(t.name)});`);
// people: insert without manager, then set managers
for (const u of users) {
  out.push(
    `insert into people (id, name, email, role, title, department, level, team_id, permissions, granted_store_ids) values (${q(u.id)}, ${q(u.name)}, ${q(u.email)}, ${q(u.role)}, ${q(u.title)}, ${q(u.department)}, ${q(u.level)}, ${q(u.teamId)}, ${arr(u.permissions)}, ${arr(u.grantedStoreIds)});`,
  );
}
for (const u of users) if (u.managerId) out.push(`update people set manager_id = ${q(u.managerId)} where id = ${q(u.id)};`);
for (const t of teams)
  out.push(`update teams set lead_id = ${q(t.leadId)}, manager_id = ${q(t.managerId)} where id = ${q(t.id)};`);

for (const b of brands) out.push(`insert into brands (id, name, category) values (${q(b.id)}, ${q(b.name)}, ${q(b.category)});`);
for (const s of stores)
  out.push(
    `insert into stores (id, brand_id, name, platform, scale, difficulty, status) values (${q(s.id)}, ${q(s.brandId)}, ${q(s.name)}, ${q(s.channel)}, ${q(s.scale)}, ${s.difficulty}, ${q(s.status)});`,
  );

const START = new Date(2026, 4, 1);
for (const a of assignments)
  out.push(
    `insert into store_assignments (person_id, store_id, workload_pct, is_primary, valid_from) values (${q(a.userId)}, ${q(a.storeId)}, ${a.workloadPct}, ${a.isPrimary}, ${q(iso(START))});`,
  );

out.push("commit;");
process.stdout.write(out.join("\n") + "\n");
