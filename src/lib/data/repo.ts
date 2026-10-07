// Read-only data access. Swap these bodies for database queries later;
// callers should not need to change.

import { assignments, brands, stores, teams, users } from "./seed";

export const getUser = (id: string) => users.find((u) => u.id === id) ?? null;
export const getStore = (id: string) => stores.find((s) => s.id === id) ?? null;
export const getBrand = (id: string) => brands.find((b) => b.id === id) ?? null;
export const getTeam = (id: string | null) => (id ? teams.find((t) => t.id === id) ?? null : null);

// Lists hide archived (soft-deleted) records; get* still resolves them so
// history keeps pointing at the right name.
const active = <T extends { archivedAt: string | null }>(rows: T[]) => rows.filter((r) => r.archivedAt === null);
export const listUsers = () => active(users);
export const listStores = () => active(stores);
export const listTeams = () => active(teams);
export const listBrands = () => active(brands);

export const assignmentsForUser = (userId: string) =>
  assignments.filter((a) => a.userId === userId);

export const assignmentsForStore = (storeId: string) =>
  assignments.filter((a) => a.storeId === storeId);
