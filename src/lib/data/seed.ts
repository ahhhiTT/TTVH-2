// SAMPLE DATA ONLY. Names, brands and figures are fictional and generated
// deterministically. Never put real brand or employee data in this file.
// Some values are deliberately null to exercise the Missing vs Zero handling:
// Website stores have no traffic feed, some stores have no Ads import yet,
// onboarding stores have no target.

import type {
  Assignment,
  Brand,
  Channel,
  DailyMetric,
  MonthlyTarget,
  Store,
  Team,
  User,
} from "./types";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261007);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)];
const pad = (n: number) => String(n).padStart(2, "0");

const CATEGORIES = ["Beauty", "Personal Care", "FMCG", "Mom & Baby", "Health", "Home"];
const CHANNELS: Channel[] = ["shopee", "tiktok", "lazada", "website"];
const CHANNEL_LABEL: Record<Channel, string> = {
  shopee: "Shopee",
  tiktok: "TikTok Shop",
  lazada: "Lazada",
  website: "Website",
};

export const brands: Brand[] = Array.from({ length: 20 }, (_, i) => ({
  id: `b${pad(i + 1)}`,
  name: `Brand ${String.fromCharCode(65 + i)}`,
  category: pick(CATEGORIES),
  archivedAt: null,
}));

// 51 stores: every brand has Shopee, most have TikTok Shop, some have more.
export const stores: Store[] = [];
for (const brand of brands) {
  const channels: Channel[] = ["shopee"];
  if (stores.length < 51) channels.push("tiktok");
  if (rand() > 0.6) channels.push(pick(["lazada", "website"] as const));
  for (const channel of channels) {
    if (stores.length >= 51) break;
    stores.push({
      id: `s${pad(stores.length + 1)}`,
      brandId: brand.id,
      name: `${brand.name} · ${CHANNEL_LABEL[channel]}`,
      channel,
      scale: pick(["S", "M", "M", "L", "L", "XL"] as const),
      difficulty: pick([1, 2, 3, 3, 4, 5] as const),
      status: rand() > 0.92 ? "onboarding" : "active",
      archivedAt: null,
    });
  }
}
while (stores.length < 51) {
  const brand = pick(brands);
  const channel = pick(CHANNELS);
  stores.push({
    id: `s${pad(stores.length + 1)}`,
    brandId: brand.id,
    name: `${brand.name} · ${CHANNEL_LABEL[channel]} 2`,
    channel,
    scale: "M",
    difficulty: 3,
    status: "active",
    archivedAt: null,
  });
}

export const teams: Team[] = [
  { id: "t1", name: "Growth Team 1", leadId: "u02", managerId: null, archivedAt: null },
  { id: "t2", name: "Growth Team 2", leadId: null, managerId: null, archivedAt: null },
];

const LEVELS = ["L1", "L2", "L2", "L3", "L3", "L4"];

// 27 people: 1 director, 0 manager, 1 team lead, 25 growth staff (matches TTVH2 today).
export const users: User[] = [
  {
    id: "u01",
    name: "Giám đốc TTVH2",
    email: "director@example.com",
    role: "director",
    title: "Giám đốc Trung tâm Vận hành 2",
    department: "Growth",
    level: "L6",
    teamId: null,
    managerId: null,
    permissions: ["benchmark:view", "peers:view"],
    grantedStoreIds: [],
    archivedAt: null,
  },
  {
    id: "u02",
    name: "Teamlead 01",
    email: "teamlead01@example.com",
    role: "teamlead",
    title: "Growth Teamlead",
    department: "Growth",
    level: "L5",
    teamId: "t1",
    managerId: "u01",
    permissions: ["benchmark:view", "peers:view"],
    grantedStoreIds: [],
    archivedAt: null,
  },
];
for (let i = 1; i <= 25; i++) {
  const inTeam1 = i <= 10;
  users.push({
    id: `u${pad(i + 2)}`,
    name: `Nhân sự ${pad(i)}`,
    email: `staff${pad(i)}@example.com`,
    role: "staff",
    title: "Growth Executive",
    department: "Growth",
    level: pick(LEVELS),
    teamId: inTeam1 ? "t1" : "t2",
    managerId: inTeam1 ? "u02" : "u01",
    // A couple of staff granted benchmark visibility to demo the permission.
    permissions: i <= 3 ? ["benchmark:view"] : [],
    grantedStoreIds: [],
    archivedAt: null,
  });
}

// Assign each store to one primary owner, round-robin across staff.
const staff = users.filter((u) => u.role === "staff");
const storesByUser = new Map<string, string[]>();
stores.forEach((store, i) => {
  const owner = staff[i % staff.length];
  storesByUser.set(owner.id, [...(storesByUser.get(owner.id) ?? []), store.id]);
});

export const SAMPLE_START = "2026-05-01";
export const assignments: Assignment[] = [];
for (const [userId, storeIds] of storesByUser) {
  // Leave 0–20% for "other projects", split the rest across stores.
  const other = pick([0, 10, 10, 20]);
  const weights = storeIds.map(() => between(1, 2));
  const total = weights.reduce((a, b) => a + b, 0);
  let remaining = 100 - other;
  storeIds.forEach((storeId, i) => {
    const pct =
      i === storeIds.length - 1
        ? remaining
        : Math.round(((100 - other) * weights[i]) / total / 5) * 5;
    remaining -= pct;
    assignments.push({
      id: assignments.length + 1,
      userId,
      storeId,
      workloadPct: pct,
      isPrimary: true,
      validFrom: SAMPLE_START,
      validTo: null,
      archivedAt: null,
    });
  });
}

// Two extra demo accounts outside the 27 headcount, to show restricted roles.
const demoGranted = stores.slice(0, 3).map((s) => s.id);
users.push(
  {
    id: "x01",
    name: "Demo · Media",
    email: "media@example.com",
    role: "viewer",
    title: "Media Specialist",
    department: "Media",
    level: "L3",
    teamId: null,
    managerId: null,
    permissions: [],
    grantedStoreIds: demoGranted,
    archivedAt: null,
  },
  {
    id: "x02",
    name: "Demo · Brand A",
    email: "brand-a@example.com",
    role: "brand",
    title: "Brand Manager",
    department: "Brand A",
    level: "-",
    teamId: null,
    managerId: null,
    permissions: [],
    grantedStoreIds: stores.filter((s) => s.brandId === "b01").map((s) => s.id),
    archivedAt: null,
  },
);

// Daily figures from SAMPLE_START to today. Same rules as
// scripts/sample-data/metrics.sql (which fills Supabase), different random
// stream, so the two sample sets do not match number for number.
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const SCALE_DAILY = { S: 10e6, M: 30e6, L: 85e6, XL: 200e6 };
const WEEKDAY = [1.1, 0.9, 0.95, 0.95, 1.0, 1.05, 1.15]; // Sun..Sat

export const daily: DailyMetric[] = [];
export const targets: MonthlyTarget[] = [];

const start = new Date(2026, 4, 1);
const today = new Date();
today.setHours(0, 0, 0, 0);
for (const store of stores) {
  const base = SCALE_DAILY[store.scale] * between(0.6, 1.4);
  const growth = between(-0.004, 0.008); // per week
  const rAds = rand();
  const lagged = rand() > 0.9; // today's import has not arrived
  const aov = between(180e3, 450e3);
  const cr = between(0.012, 0.045);

  for (let m = 0; m < 6; m++) {
    const month = new Date(2026, 4 + m, 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    targets.push({
      storeId: store.id,
      month: iso(month).slice(0, 7),
      gmvTarget:
        store.status === "onboarding" && m >= 4
          ? null
          : Math.round(base * days * (1 + growth * 4 * m) * between(1.0, 1.18) * 1.12),
    });
  }

  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const date = iso(d);
    if (lagged && d.getTime() === today.getTime()) {
      daily.push({ storeId: store.id, date, gmv: null, nmv: null, orders: null, traffic: null, adSpend: null });
      continue;
    }
    const weeks = (d.getTime() - start.getTime()) / (7 * 86400000);
    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    let f = WEEKDAY[d.getDay()] * (1 + growth * weeks) * between(0.75, 1.25);
    if (dd === mm) f *= between(3, 5); // double day
    else if (dd === 15 || dd === 25) f *= between(1.6, 2.2);
    else if (dd === mm - 1 || dd === mm - 2) f *= between(1.2, 1.5); // pre-campaign
    const gmv = base * f;
    const orders = Math.max(0, Math.round(gmv / (aov * between(0.9, 1.1))));
    daily.push({
      storeId: store.id,
      date,
      gmv: Math.round(gmv),
      nmv: Math.round(gmv * between(0.78, 0.9)),
      orders,
      traffic: store.channel === "website" ? null : Math.round(orders / (cr * between(0.85, 1.15))),
      adSpend: rAds > 0.85 ? null : rAds > 0.76 ? 0 : Math.round(gmv / between(5, 14)),
    });
  }
}
