import "server-only";

import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import type { Data } from "./data/dataset";
import type { User } from "./data/types";
import { supabase } from "./db/supabase";

// Email + password sign-in. Accounts are activated with a one-time code that the
// Director creates on the admin page and sends to the person (e.g. via Lark).
// Passwords are stored as scrypt hashes; sessions are random tokens whose SHA-256
// is kept in the `sessions` table, so a session can be revoked from the server.

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
export const AUTH_COOKIE = "ttvh2_sid";
const SESSION_DAYS = 30;
const CODE_DAYS = 7;
const MAX_FAILS = 5; // per email per 15 minutes
export const MIN_PASSWORD = 10;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
}

async function verifyPassword(pw: string, stored: string) {
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt") return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(pw, Buffer.from(salt, "base64"), expected.length, { N: +n, r: +r, p: +p });
  return timingSafeEqual(key, expected);
}

const norm = (e: string) => e.trim().toLowerCase();

// Active people only; company or personal email both work.
export function findByEmail(d: Data, email: string): User | null {
  const e = norm(email);
  if (!e) return null;
  return d.listUsers().find((u) => (u.email && norm(u.email) === e) || (u.personalEmail && norm(u.personalEmail) === e)) ?? null;
}

async function tooManyFails(email: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await supabase()!
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("email", norm(email))
    .eq("ok", false)
    .gte("at", since);
  return (count ?? 0) >= MAX_FAILS;
}

const logAttempt = (email: string, ok: boolean) => supabase()!.from("login_attempts").insert({ email: norm(email), ok });

async function startSession(personId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  const { error } = await supabase()!.from("sessions").insert({
    id_hash: sha256(token),
    person_id: personId,
    expires_at: expires.toISOString(),
  });
  if (error) throw new Error(error.message);
  (await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export type AuthError = "invalid" | "locked" | "code" | "weak" | "mismatch" | "unavailable";

export async function signInWithPassword(d: Data, email: string, password: string): Promise<AuthError | null> {
  const db = supabase();
  if (!db) return "unavailable";
  if (await tooManyFails(email)) return "locked";
  const user = findByEmail(d, email);
  const { data } = user
    ? await db.from("credentials").select("password_hash").eq("person_id", user.id).maybeSingle()
    : { data: null };
  const ok = Boolean(user && data && (await verifyPassword(password, data.password_hash)));
  await logAttempt(email, ok);
  if (!ok) return "invalid";
  await startSession(user!.id);
  return null;
}

// Uppercase letters and digits without look-alikes (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const formatCode = (raw: string) => `${raw.slice(0, 5)}-${raw.slice(5)}`;
const cleanCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export async function createActivationCode(personId: string, actorId: string) {
  const db = supabase()!;
  const raw = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  // A new code replaces any unused one for the same person.
  await db.from("activation_codes").update({ expires_at: new Date().toISOString() }).eq("person_id", personId).is("used_at", null);
  const { error } = await db.from("activation_codes").insert({
    person_id: personId,
    code_hash: sha256(raw),
    created_by: actorId,
    expires_at: new Date(Date.now() + CODE_DAYS * 86400000).toISOString(),
  });
  if (error) throw new Error(error.message);
  return formatCode(raw);
}

export async function activateAccount(
  d: Data,
  email: string,
  code: string,
  password: string,
  confirm: string,
): Promise<AuthError | null> {
  const db = supabase();
  if (!db) return "unavailable";
  if (password.length < MIN_PASSWORD) return "weak";
  if (password !== confirm) return "mismatch";
  if (await tooManyFails(email)) return "locked";
  const user = findByEmail(d, email);
  const { data: row } = user
    ? await db
        .from("activation_codes")
        .select("id")
        .eq("person_id", user.id)
        .eq("code_hash", sha256(cleanCode(code)))
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle()
    : { data: null };
  if (!user || !row) {
    await logAttempt(email, false);
    return "code";
  }
  const hash = await hashPassword(password);
  const { error } = await db.from("credentials").upsert({ person_id: user.id, password_hash: hash, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await db.from("activation_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
  // Old sessions end when a password is (re)set.
  await db.from("sessions").update({ revoked_at: new Date().toISOString() }).eq("person_id", user.id).is("revoked_at", null);
  await db.from("audit_log").insert({ actor_id: user.id, entity: "people", entity_id: user.id, action: "update", before: null, after: { account: "activated" } });
  await logAttempt(email, true);
  await startSession(user.id);
  return null;
}

// Person id of the signed-in session, or null. One lookup per request.
export const sessionPersonId = cache(async (): Promise<string | null> => {
  await connection(); // compares with the current time: always per request
  const db = supabase();
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!db || !token) return null;
  const { data } = await db
    .from("sessions")
    .select("person_id")
    .eq("id_hash", sha256(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return data?.person_id ?? null;
});

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const db = supabase();
  if (db && token) await db.from("sessions").update({ revoked_at: new Date().toISOString() }).eq("id_hash", sha256(token));
  jar.delete(AUTH_COOKIE);
}

// Who has set a password, for the admin page.
export async function activatedIds(): Promise<Set<string>> {
  const db = supabase();
  if (!db) return new Set();
  const { data } = await db.from("credentials").select("person_id");
  return new Set((data ?? []).map((r) => r.person_id as string));
}
