// Row builders shared by pages: combine store/person data with KPIs.

import type { Data } from "./data/dataset";
import type { User } from "./data/types";
import { currentMonth, kpisFor, monthKeys, paceStatus } from "./metrics";
import { visibleStoreIds, visibleUserIds } from "./rbac";

export function storeRows(d: Data, viewer: User, month = currentMonth()) {
  const ids = visibleStoreIds(d, viewer);
  return d.listStores()
    .filter((s) => ids.has(s.id))
    .map((store) => {
      const kpis = kpisFor(d, new Set([store.id]), month);
      const owners = d
        .assignmentsForStore(store.id)
        .map((a) => d.getUser(a.userId))
        .filter((u) => u !== null);
      return {
        store,
        brand: d.getBrand(store.brandId),
        owners,
        kpis,
        status: paceStatus(kpis.pace),
      };
    });
}

export function personRows(d: Data, viewer: User, month = currentMonth()) {
  const ids = visibleUserIds(d, viewer);
  return [...ids]
    .map((id) => d.getUser(id))
    .filter((u) => u !== null)
    .map((person) => personSummary(d, person, month));
}

export function personSummary(d: Data, person: User, month = currentMonth()) {
  const items = d
    .assignmentsForUser(person.id)
    .map((a) => ({ a, store: d.getStore(a.storeId) }))
    .filter((x) => x.store !== null && x.store.archivedAt === null)
    .map(({ a, store }) => {
      const kpis = kpisFor(d, new Set([a.storeId]), month);
      return { assignment: a, store: store!, kpis, status: paceStatus(kpis.pace) };
    });
  const storeIds = new Set(items.map((i) => i.store.id));
  const kpis = kpisFor(d, storeIds, month);
  // Formula TBD: credit each store's GMV by the person's workload share.
  // null when no assigned store has GMV data.
  const withGmv = items.filter((i) => i.kpis.gmv !== null);
  const weightedGmv = withGmv.length
    ? withGmv.reduce((acc, i) => acc + (i.kpis.gmv as number) * (i.assignment.workloadPct / 100), 0)
    : null;
  const workload = items.reduce((acc, i) => acc + i.assignment.workloadPct, 0);
  return {
    person,
    items,
    kpis,
    weightedGmv,
    workload,
    status: paceStatus(kpis.pace),
  };
}

export function storeHistory(d: Data, storeId: string) {
  return monthKeys(6).flatMap((month) => d.monthly(month).filter((m) => m.storeId === storeId));
}
