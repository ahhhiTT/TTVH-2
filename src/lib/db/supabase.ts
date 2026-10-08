import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client using the secret key. RLS is on with no policies, so the
// browser can never read tables directly; every read goes through the server
// and the RBAC helpers. Returns null when the env is not configured, and the
// app falls back to the in-repo sample seed.
let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

// Admin edits write to the shared database. While the site is a public demo
// with click-to-sign-in, writes stay off unless explicitly enabled.
export function writesEnabled() {
  return supabase() !== null && process.env.ADMIN_WRITES === "on";
}
