import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { sessionPersonId } from "./auth";
import { getData } from "./data/dataset";
import { supabase } from "./db/supabase";
import { DEFAULT_LOCALE, dictionaries, LOCALES, type Locale } from "./i18n/dictionaries";

export const SESSION_COOKIE = "ttvh2_uid";
export const LOCALE_COOKIE = "ttvh2_locale";

// With Supabase configured: real sign-in (email + password, see auth.ts).
// Without it (local dev on the in-code sample): the demo cookie holds a sample user id.
export const demoMode = () => supabase() === null;

export async function getCurrentUser() {
  const id = demoMode() ? (await cookies()).get(SESSION_COOKIE)?.value : await sessionPersonId();
  if (!id) return null;
  const user = (await getData()).getUser(id);
  // Archived (left) people cannot use the system even with a live session.
  return user && user.archivedAt === null ? user : null;
}

export async function requireUser() {
  // Pages derive "current month" from the clock, so they must render per request.
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Explicit theme choice saved by ThemeToggle; null means "follow the OS".
export async function getTheme(): Promise<"light" | "dark" | null> {
  const value = (await cookies()).get("ttvh2_theme")?.value;
  return value === "light" || value === "dark" ? value : null;
}

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
