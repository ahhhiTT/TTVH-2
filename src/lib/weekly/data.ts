import "server-only";

import { supabase } from "../db/supabase";
import type { FactRow, InputRow } from "./compute";
import { type FileKind, readConfig, type ReportConfig } from "./kinds";

export interface UploadRow {
  id: number;
  kind: FileKind;
  file_name: string;
  date_from: string;
  date_to: string;
  row_count: number;
  uploaded_by: string | null;
  uploaded_at: string;
}

// PostgREST returns at most 1000 rows per request.
async function all<T>(make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let page = 0; page < 200; page++) {
    const { data, error } = await make(page * 1000, page * 1000 + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function loadWeekly(storeId: string, month: string, from: string, to: string) {
  const db = supabase();
  if (!db) return { facts: [] as FactRow[], inputs: [] as InputRow[], uploads: [] as UploadRow[], config: readConfig({}) };
  const [facts, inputs, uploads, store] = await Promise.all([
    all<FactRow>((a, b) =>
      db
        .from("wr_facts")
        .select("date_from,date_to,metric,dim,value")
        .eq("store_id", storeId)
        .gte("date_from", from)
        .lte("date_to", to)
        .order("date_from")
        .order("metric")
        .order("dim")
        .range(a, b),
    ),
    all<InputRow>((a, b) =>
      db.from("wr_inputs").select("period,field,dim,num,txt").eq("store_id", storeId).like("period", `${month}%`).range(a, b),
    ),
    // Uploads that touch the month (to show what is already in).
    all<UploadRow>((a, b) =>
      db
        .from("wr_uploads")
        .select("id,kind,file_name,date_from,date_to,row_count,uploaded_by,uploaded_at")
        .eq("store_id", storeId)
        .lte("date_from", to)
        .gte("date_to", from)
        .order("uploaded_at", { ascending: false })
        .range(a, b),
    ),
    db.from("stores").select("report_config").eq("id", storeId).maybeSingle(),
  ]);
  return {
    facts: facts.map((f) => ({ ...f, value: Number(f.value) })),
    inputs: inputs.map((i) => ({ ...i, num: i.num === null ? null : Number(i.num) })),
    uploads,
    config: readConfig(store.data?.report_config) as ReportConfig,
  };
}
