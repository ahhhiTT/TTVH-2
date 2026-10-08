// Field definitions for master-data admin. Drives both the forms and the
// server-side validation, so the two cannot drift apart.

export type EntityKey = "brands" | "stores" | "people" | "teams" | "assignments";
export const ENTITY_KEYS: EntityKey[] = ["brands", "stores", "people", "teams", "assignments"];

export type OptionSource =
  | "brands"
  | "platforms"
  | "scales"
  | "difficulty"
  | "storeStatus"
  | "roles"
  | "teams"
  | "people"
  | "stores"
  | "permissions";

export interface FieldSpec {
  column: string;
  label: string; // key in dictionary `admin` or `common`
  type: "text" | "email" | "select" | "number" | "date" | "checkbox" | "multi";
  options?: OptionSource;
  required?: boolean;
  createOnly?: boolean; // cannot change after creation (ids, assignment person/store)
  min?: number;
  max?: number;
}

export interface EntitySpec {
  table: string;
  textId: boolean; // false = identity number assigned by the database
  fields: FieldSpec[];
}

export const ENTITIES: Record<EntityKey, EntitySpec> = {
  brands: {
    table: "brands",
    textId: true,
    fields: [
      { column: "id", label: "id", type: "text", required: true, createOnly: true },
      { column: "name", label: "name", type: "text", required: true },
      { column: "category", label: "category", type: "text" },
    ],
  },
  stores: {
    table: "stores",
    textId: true,
    fields: [
      { column: "id", label: "id", type: "text", required: true, createOnly: true },
      { column: "name", label: "name", type: "text", required: true },
      { column: "brand_id", label: "brand", type: "select", options: "brands", required: true },
      { column: "platform", label: "platform", type: "select", options: "platforms", required: true },
      { column: "scale", label: "scale", type: "select", options: "scales" },
      { column: "difficulty", label: "difficulty", type: "select", options: "difficulty" },
      { column: "status", label: "status", type: "select", options: "storeStatus", required: true },
    ],
  },
  people: {
    table: "people",
    textId: true,
    fields: [
      { column: "id", label: "id", type: "text", required: true, createOnly: true },
      { column: "name", label: "name", type: "text", required: true },
      { column: "email", label: "email", type: "email", required: true },
      { column: "role", label: "role", type: "select", options: "roles", required: true },
      { column: "title", label: "jobTitle", type: "text" },
      { column: "department", label: "department", type: "text" },
      { column: "level", label: "level", type: "text" },
      { column: "team_id", label: "team", type: "select", options: "teams" },
      { column: "manager_id", label: "manager", type: "select", options: "people" },
      { column: "permissions", label: "permissions", type: "multi", options: "permissions" },
      { column: "granted_store_ids", label: "grantedStores", type: "multi", options: "stores" },
    ],
  },
  teams: {
    table: "teams",
    textId: true,
    fields: [
      { column: "id", label: "id", type: "text", required: true, createOnly: true },
      { column: "name", label: "name", type: "text", required: true },
      { column: "lead_id", label: "lead", type: "select", options: "people" },
      { column: "manager_id", label: "manager", type: "select", options: "people" },
    ],
  },
  assignments: {
    table: "store_assignments",
    textId: false,
    fields: [
      { column: "person_id", label: "person", type: "select", options: "people", required: true, createOnly: true },
      { column: "store_id", label: "store", type: "select", options: "stores", required: true, createOnly: true },
      { column: "workload_pct", label: "workload", type: "number", required: true, min: 0, max: 100 },
      { column: "is_primary", label: "primary", type: "checkbox" },
      { column: "valid_from", label: "validFrom", type: "date", required: true, createOnly: true },
      { column: "valid_to", label: "validTo", type: "date" },
    ],
  },
};

export const STATIC_OPTIONS: Partial<Record<OptionSource, string[]>> = {
  platforms: ["shopee", "tiktok", "lazada", "website"],
  scales: ["S", "M", "L", "XL"],
  difficulty: ["1", "2", "3", "4", "5"],
  storeStatus: ["active", "onboarding", "paused"],
  roles: ["director", "manager", "teamlead", "staff", "viewer", "brand"],
  permissions: ["benchmark:view", "peers:view"],
};

export const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
