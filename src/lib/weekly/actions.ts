"use server";

import { revalidatePath } from "next/cache";
import { getData } from "../data/dataset";
import { parseVnNumber } from "../format";
import { supabase } from "../db/supabase";
import { canViewStore } from "../rbac";
import { getCurrentUser } from "../session";
import { type Fact, type FileKind, KINDS, readConfig, type ReportConfig } from "./kinds";
import { isMonth } from "./periods";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const INTERNAL = new Set(["director", "manager", "teamlead", "staff"]);

// Internal people who can see the store may load data and edit inputs.
async function guard(storeId: string) {
  const user = await getCurrentUser();
  const db = supabase();
  if (!user || !db || !INTERNAL.has(user.role)) return null;
  const d = await getData();
  if (!canViewStore(d, user, storeId)) return null;
  return { user, db };
}

export type UploadResult = { ok: true; replaced: number } | { ok: false; error: string };

export async function saveUpload(
  storeId: string,
  file: { kind: FileKind; fileName: string; from: string; to: string; rows: number; facts: Fact[] },
): Promise<UploadResult> {
  const g = await guard(storeId);
  if (!g) return { ok: false, error: "forbidden" };
  if (!(file.kind in KINDS) || !ISO.test(file.from) || !ISO.test(file.to) || file.from > file.to) return { ok: false, error: "invalid" };
  const facts = file.facts.filter(
    (f) => ISO.test(f.from) && ISO.test(f.to) && f.from >= file.from && f.to <= file.to && typeof f.metric === "string" && isFinite(f.value),
  );
  const { db, user } = g;
  const { data: up, error: e1 } = await db
    .from("wr_uploads")
    .insert({ store_id: storeId, kind: file.kind, file_name: file.fileName.slice(0, 200), date_from: file.from, date_to: file.to, row_count: file.rows, uploaded_by: user.id })
    .select("id")
    .single();
  if (e1) return { ok: false, error: e1.message };
  // A new file of the same kind replaces what was loaded for the dates it covers.
  const { count: replaced, error: e2 } = await db
    .from("wr_facts")
    .delete({ count: "exact" })
    .eq("store_id", storeId)
    .eq("kind", file.kind)
    .gte("date_from", file.from)
    .lte("date_to", file.to);
  if (e2) return { ok: false, error: e2.message };
  for (let i = 0; i < facts.length; i += 1000) {
    const chunk = facts.slice(i, i + 1000).map((f) => ({
      store_id: storeId,
      kind: file.kind,
      date_from: f.from,
      date_to: f.to,
      metric: f.metric.slice(0, 60),
      dim: String(f.dim ?? "").slice(0, 200),
      value: f.value,
      upload_id: up.id,
    }));
    const { error } = await db.from("wr_facts").insert(chunk);
    if (error) return { ok: false, error: error.message };
  }
  await db.from("audit_log").insert({
    actor_id: user.id,
    entity: "weekly_upload",
    entity_id: String(up.id),
    action: "create",
    before: null,
    after: { store: storeId, kind: file.kind, file: file.fileName, from: file.from, to: file.to, rows: file.rows, facts: facts.length },
  });
  revalidatePath("/reports/weekly");
  return { ok: true, replaced: replaced ?? 0 };
}

export type SaveState = { ok: boolean; error?: string; at?: number } | null;

// Form fields: "n|period|field|dim" for numbers, "t|period|field|dim" for text.
export async function saveInputs(_: SaveState, formData: FormData): Promise<SaveState> {
  const storeId = String(formData.get("storeId") ?? "");
  const month = String(formData.get("month") ?? "");
  const g = await guard(storeId);
  if (!g || !isMonth(month)) return { ok: false, error: "forbidden" };
  const { db, user } = g;
  const { data: current } = await db.from("wr_inputs").select("period,field,dim,num,txt").eq("store_id", storeId).like("period", `${month}%`);
  const before = new Map((current ?? []).map((r) => [`${r.period}|${r.field}|${r.dim}`, r]));
  const upserts: Record<string, unknown>[] = [];
  const deletes: { period: string; field: string; dim: string }[] = [];
  const changes: Record<string, unknown> = {};
  for (const [name, raw] of formData.entries()) {
    const parts = name.split("|");
    if (parts.length !== 4 || (parts[0] !== "n" && parts[0] !== "t")) continue;
    const [type, period, field, dim] = parts;
    if (period !== month && !period.startsWith(`${month}-W`)) continue;
    const text = String(raw).trim();
    let num: number | null = null;
    let txt: string | null = null;
    if (type === "n") {
      if (text) {
        const n = parseVnNumber(text);
        if (!isFinite(n)) return { ok: false, error: `invalid:${field}` };
        num = n;
      }
    } else txt = text ? text.slice(0, 4000) : null;
    const key = `${period}|${field}|${dim}`;
    const prev = before.get(key);
    const same = prev ? Number(prev.num ?? NaN) === Number(num ?? NaN) || (prev.num === null && num === null) : num === null;
    if (same && (prev?.txt ?? null) === txt) continue;
    changes[key] = { from: prev ? (prev.num ?? prev.txt) : null, to: num ?? txt };
    if (num === null && txt === null) deletes.push({ period, field, dim });
    else upserts.push({ store_id: storeId, period, field, dim, num, txt, updated_by: user.id, updated_at: new Date().toISOString() });
  }
  if (upserts.length) {
    const { error } = await db.from("wr_inputs").upsert(upserts);
    if (error) return { ok: false, error: error.message };
  }
  for (const d of deletes) {
    await db.from("wr_inputs").delete().eq("store_id", storeId).eq("period", d.period).eq("field", d.field).eq("dim", d.dim);
  }
  if (Object.keys(changes).length) {
    await db.from("audit_log").insert({ actor_id: user.id, entity: "weekly_input", entity_id: `${storeId}|${month}`, action: "update", before: null, after: changes });
  }
  revalidatePath("/reports/weekly");
  return { ok: true, at: Date.now() };
}

export async function saveConfig(storeId: string, config: ReportConfig): Promise<{ ok: boolean; error?: string }> {
  const g = await guard(storeId);
  if (!g) return { ok: false, error: "forbidden" };
  const clean = readConfig({
    selfAccounts: config.selfAccounts.map((s) => s.trim().replace(/^@/, "")).filter(Boolean).slice(0, 20),
    productLines: config.productLines
      .map((p) => ({ name: p.name.trim().slice(0, 80), keywords: p.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 20) }))
      .filter((p) => p.name)
      .slice(0, 20),
  });
  const { db, user } = g;
  const { data: prev } = await db.from("stores").select("report_config").eq("id", storeId).maybeSingle();
  const { error } = await db.from("stores").update({ report_config: clean }).eq("id", storeId);
  if (error) return { ok: false, error: error.message };
  await db.from("audit_log").insert({ actor_id: user.id, entity: "stores", entity_id: storeId, action: "update", before: { report_config: prev?.report_config ?? null }, after: { report_config: clean } });
  revalidatePath("/reports/weekly");
  return { ok: true };
}
