// Visibility rules. Every page must go through these helpers instead of
// reading the raw data, so a user never sees a store or person outside scope.
//
// director  → everything
// manager   → people in teams they manage (+ their stores)
// teamlead  → people in their team (+ their stores)
// staff     → own stores and own figures
// viewer / brand → only explicitly granted stores, no people data

import type { Data } from "./data/dataset";
import type { Permission, Role, User } from "./data/types";

export function isLeader(role: Role) {
  return role === "director" || role === "manager" || role === "teamlead";
}

export function hasPermission(user: User, permission: Permission) {
  return user.role === "director" || user.permissions.includes(permission);
}

export function visibleUserIds(d: Data, user: User): Set<string> {
  const users = d.listUsers();
  const teams = d.listTeams();
  switch (user.role) {
    case "director":
      return new Set(users.filter((u) => u.role !== "viewer" && u.role !== "brand").map((u) => u.id));
    case "manager": {
      const teamIds = teams.filter((t) => t.managerId === user.id).map((t) => t.id);
      return new Set([
        user.id,
        ...users.filter((u) => u.managerId === user.id || (u.teamId && teamIds.includes(u.teamId))).map((u) => u.id),
      ]);
    }
    case "teamlead": {
      const teamIds = teams.filter((t) => t.leadId === user.id).map((t) => t.id);
      return new Set([user.id, ...users.filter((u) => u.teamId && teamIds.includes(u.teamId)).map((u) => u.id)]);
    }
    case "staff":
      return new Set([user.id]);
    default:
      return new Set();
  }
}

export function visibleStoreIds(d: Data, user: User): Set<string> {
  const stores = d.listStores();
  if (user.role === "director") return new Set(stores.map((s) => s.id));
  if (user.role === "viewer" || user.role === "brand")
    return new Set(user.grantedStoreIds.filter((id) => stores.some((s) => s.id === id)));
  const people = visibleUserIds(d, user);
  const live = new Set(stores.map((s) => s.id));
  return new Set(d.activeAssignments().filter((a) => people.has(a.userId) && live.has(a.storeId)).map((a) => a.storeId));
}

export function canViewStore(d: Data, user: User, storeId: string) {
  return visibleStoreIds(d, user).has(storeId);
}

export function canViewUser(d: Data, user: User, targetId: string) {
  return visibleUserIds(d, user).has(targetId);
}

// Which sidebar modules a role can open.
export type ModuleKey =
  | "home"
  | "overview"
  | "stores"
  | "people"
  | "planning"
  | "tasks"
  | "reports"
  | "career"
  | "knowledge"
  | "settings";

const MODULES_BY_ROLE: Record<Role, ModuleKey[]> = {
  director: ["home", "overview", "stores", "people", "planning", "tasks", "reports", "career", "knowledge", "settings"],
  manager: ["home", "overview", "stores", "people", "planning", "tasks", "reports", "career", "knowledge"],
  teamlead: ["home", "overview", "stores", "people", "planning", "tasks", "reports", "career", "knowledge"],
  staff: ["home", "overview", "stores", "people", "planning", "tasks", "reports", "career", "knowledge"],
  viewer: ["home", "overview", "stores", "knowledge"],
  brand: ["home", "overview", "stores", "reports"],
};

export function canOpen(user: User, module: ModuleKey) {
  return MODULES_BY_ROLE[user.role].includes(module);
}

export const ROLE_MODULES = MODULES_BY_ROLE;
