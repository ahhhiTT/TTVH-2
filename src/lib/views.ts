// Row builders shared by pages: combine store/person data with KPIs.

import { assignmentsForUser, getBrand, getStore, getUser, listStores } from "./data/repo";
import { assignments, metrics } from "./data/seed";
import type { User } from "./data/types";
import { currentMonth, kpisFor, paceStatus } from "./metrics";
import { visibleStoreIds, visibleUserIds } from "./rbac";

export function storeRows(viewer: User, month = currentMonth()) {
  const ids = visibleStoreIds(viewer);
  return listStores()
    .filter((s) => ids.has(s.id))
    .map((store) => {
      const kpis = kpisFor(new Set([store.id]), month);
      const owners = assignments
        .filter((a) => a.storeId === store.id)
        .map((a) => getUser(a.userId))
        .filter((u) => u !== null);
      return {
        store,
        brand: getBrand(store.brandId),
        owners,
        kpis,
        status: paceStatus(kpis.pace),
      };
    });
}

export function personRows(viewer: User, month = currentMonth()) {
  const ids = visibleUserIds(viewer);
  return [...ids]
    .map((id) => getUser(id))
    .filter((u) => u !== null)
    .map((person) => personSummary(person, month));
}

export function personSummary(person: User, month = currentMonth()) {
  const items = assignmentsForUser(person.id).map((a) => {
    const kpis = kpisFor(new Set([a.storeId]), month);
    return { assignment: a, store: getStore(a.storeId)!, kpis, status: paceStatus(kpis.pace) };
  });
  const storeIds = new Set(items.map((i) => i.store.id));
  const kpis = kpisFor(storeIds, month);
  // Provisional: credit each store's GMV by the person's workload share.
  const weightedGmv = items.reduce((acc, i) => acc + i.kpis.gmv * (i.assignment.workloadPct / 100), 0);
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

export function storeHistory(storeId: string) {
  return metrics.filter((m) => m.storeId === storeId).sort((a, b) => a.month.localeCompare(b.month));
}
