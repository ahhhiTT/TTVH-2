"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { DATASET_TAG, getData } from "./data/dataset";
import { ENTITIES, ENTITY_KEYS, type EntityKey, ID_PATTERN, STATIC_OPTIONS } from "./admin-schema";
import { supabase, writesEnabled } from "./db/supabase";
import { canOpen } from "./rbac";
import { getCurrentUser } from "./session";

type Row = Record<string, unknown>;

const back = (entity: string, params: Record<string, string>) =>
  `/settings/data?${new URLSearchParams({ tab: entity, ...params })}`;

async function guard(formData: FormData) {
  const entity = String(formData.get("entity")) as EntityKey;
  if (!ENTITY_KEYS.includes(entity)) redirect("/settings/data");
  const user = await getCurrentUser();
  if (!user || !canOpen(user, "settings")) redirect("/login");
  if (!writesEnabled()) redirect(back(entity, { err: "readonly" }));
  return { entity, user, spec: ENTITIES[entity], db: supabase()! };
}

async function audit(actorId: string, entity: string, entityId: string, action: string, before: Row | null, after: Row | null) {
  const { error } = await supabase()!.from("audit_log").insert({
    actor_id: actorId,
    entity,
    entity_id: entityId,
    action,
    before,
    after,
  });
  if (error) throw new Error(`audit_log: ${error.message}`);
}

// Parse and validate form fields against the schema. Returns an error code or the row.
function parse(entity: EntityKey, formData: FormData, mode: "create" | "update"): Row | string {
  const row: Row = {};
  for (const f of ENTITIES[entity].fields) {
    if (mode === "update" && f.createOnly) continue;
    if (f.type === "checkbox") {
      row[f.column] = formData.get(f.column) === "on";
      continue;
    }
    if (f.type === "multi") {
      const values = formData.getAll(f.column).map(String).filter(Boolean);
      const allowed = STATIC_OPTIONS[f.options!];
      if (allowed && values.some((v) => !allowed.includes(v))) return "invalid";
      row[f.column] = values;
      continue;
    }
    const raw = String(formData.get(f.column) ?? "").trim();
    if (!raw) {
      if (f.required) return "invalid";
      row[f.column] = null;
      continue;
    }
    if (f.column === "id" && !ID_PATTERN.test(raw)) return "invalid";
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return "invalid";
    if (f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "invalid";
    if (f.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) return "invalid";
      row[f.column] = n;
      continue;
    }
    const allowed = f.options ? STATIC_OPTIONS[f.options] : undefined;
    if (allowed && !allowed.includes(raw)) return "invalid";
    row[f.column] = f.options === "difficulty" ? Number(raw) : raw;
  }
  if (row.valid_to && row.valid_from && String(row.valid_to) < String(row.valid_from)) return "invalid";
  return row;
}

export async function saveEntity(formData: FormData) {
  const { entity, user, spec, db } = await guard(formData);
  const mode = formData.get("mode") === "update" ? "update" : "create";
  const id = String(formData.get("id") ?? "");
  const row = parse(entity, formData, mode);
  if (typeof row === "string") redirect(back(entity, { err: row, edit: mode === "update" ? id : "new" }));

  let target = "";
  let errMsg = "";
  try {
    if (mode === "create") {
      const { data, error } = await db.from(spec.table).insert(row).select().single();
      if (error) throw new Error(error.code === "23505" ? "exists" : error.message);
      target = String(data.id);
      await audit(user.id, entity, target, "create", null, data);
    } else {
      const key = spec.textId ? id : Number(id);
      const { data: before, error: e1 } = await db.from(spec.table).select().eq("id", key).single();
      if (e1) throw new Error(e1.message);
      // valid_to cannot be moved before valid_from that is stored, even though valid_from is create-only.
      if (row.valid_to && String(row.valid_to) < String(before.valid_from)) throw new Error("invalid");
      const { data, error } = await db.from(spec.table).update(row).eq("id", key).select().single();
      if (error) throw new Error(error.message);
      target = id;
      await audit(user.id, entity, target, "update", before, data);
    }
  } catch (e) {
    errMsg = e instanceof Error ? e.message : String(e);
  }
  if (errMsg) redirect(back(entity, { err: errMsg, edit: mode === "update" ? id : "new" }));
  updateTag(DATASET_TAG);
  redirect(back(entity, { ok: target }));
}

// Archive / restore: sets archived_at, never deletes.
export async function setArchived(formData: FormData) {
  const { entity, user, spec, db } = await guard(formData);
  const id = String(formData.get("id") ?? "");
  const archive = formData.get("archive") === "1";
  let errMsg = "";
  try {
    const key = spec.textId ? id : Number(id);
    const { data: before, error: e1 } = await db.from(spec.table).select().eq("id", key).single();
    if (e1) throw new Error(e1.message);
    const { data, error } = await db
      .from(spec.table)
      .update({ archived_at: archive ? new Date().toISOString() : null })
      .eq("id", key)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(user.id, entity, id, archive ? "archive" : "restore", before, data);
  } catch (e) {
    errMsg = e instanceof Error ? e.message : String(e);
  }
  if (errMsg) redirect(back(entity, { err: errMsg }));
  updateTag(DATASET_TAG);
  redirect(back(entity, { ok: id, ...(archive ? {} : { archived: "1" }) }));
}

// Close an assignment today, keeping it in history.
export async function endAssignment(formData: FormData) {
  const { user, db } = await guard(formData);
  const id = Number(formData.get("id"));
  const d = await getData();
  const a = d.assignments.find((x) => x.id === id);
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  let errMsg = "";
  try {
    if (!a || a.validFrom > iso) throw new Error("invalid");
    const { data: before, error: e1 } = await db.from("store_assignments").select().eq("id", id).single();
    if (e1) throw new Error(e1.message);
    const { data, error } = await db.from("store_assignments").update({ valid_to: iso }).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    await audit(user.id, "assignments", String(id), "update", before, data);
  } catch (e) {
    errMsg = e instanceof Error ? e.message : String(e);
  }
  if (errMsg) redirect(back("assignments", { err: errMsg }));
  updateTag(DATASET_TAG);
  redirect(back("assignments", { ok: String(id) }));
}
