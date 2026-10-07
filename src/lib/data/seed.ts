// SAMPLE DATA ONLY. Names, brands and figures are fictional and generated
// deterministically. Never put real brand or employee data in this file.
// Some values are deliberately null to exercise the Missing vs Zero handling:
// Website stores have no traffic feed, some stores have no Ads import yet,
// onboarding stores have no target.

import type {
  Assignment,
  Brand,
  Channel,
  MonthlyMetric,
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
    assignments.push({ userId, storeId, workloadPct: pct, isPrimary: true });
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

// Six months of monthly figures ending with the current month (month-to-date).
export function monthKeys(count = 6, now = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}

const SCALE_GMV = { S: 300e6, M: 900e6, L: 2.5e9, XL: 6e9 };

export const metrics: MonthlyMetric[] = [];
const now = new Date();
const mtdShare = now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
for (const store of stores) {
  const base = SCALE_GMV[store.scale] * between(0.6, 1.4);
  const growth = between(-0.03, 0.08);
  const noAdsImport = rand() > 0.85; // Ads report not connected yet → Missing
  const noAds = !noAdsImport && rand() > 0.9; // store genuinely runs no Ads → Zero
  monthKeys(6, now).forEach((month, i, all) => {
    const isCurrent = i === all.length - 1;
    const target = Math.round(base * (1 + growth) ** i * between(1.0, 1.15));
    const achievement = between(0.7, 1.2);
    const gmv = Math.round(target * achievement * (isCurrent ? mtdShare : 1));
    const aov = between(180e3, 450e3);
    const orders = Math.max(1, Math.round(gmv / aov));
    metrics.push({
      storeId: store.id,
      month,
      gmvTarget: store.status === "onboarding" ? null : target,
      gmv,
      nmv: Math.round(gmv * between(0.78, 0.9)),
      orders,
      traffic: store.channel === "website" ? null : Math.round(orders / between(0.012, 0.045)),
      adSpend: noAdsImport ? null : noAds ? 0 : Math.round(gmv / between(5, 14)),
    });
  });
}
