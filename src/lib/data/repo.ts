// Read-only data access. Swap these bodies for database queries later;
// callers should not need to change.

import { assignments, brands, stores, teams, users } from "./seed";

export const getUser = (id: string) => users.find((u) => u.id === id) ?? null;
export const getStore = (id: string) => stores.find((s) => s.id === id) ?? null;
export const getBrand = (id: string) => brands.find((b) => b.id === id) ?? null;
export const getTeam = (id: string | null) => (id ? teams.find((t) => t.id === id) ?? null : null);

export const listUsers = () => users;
export const listStores = () => stores;
export const listTeams = () => teams;
export const listBrands = () => brands;

export const assignmentsForUser = (userId: string) =>
  assignments.filter((a) => a.userId === userId);

export const assignmentsForStore = (storeId: string) =>
  assignments.filter((a) => a.storeId === storeId);
