import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getUser } from "./data/repo";
import { DEFAULT_LOCALE, dictionaries, LOCALES, type Locale } from "./i18n/dictionaries";

export const SESSION_COOKIE = "ttvh2_uid";
export const LOCALE_COOKIE = "ttvh2_locale";

// DEMO SESSION: the cookie holds a sample user id. Replace with Auth.js + Lark
// OAuth before any real data is loaded.
export async function getCurrentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  return id ? getUser(id) : null;
}

export async function requireUser() {
  // Pages derive "current month" from the clock, so they must render per request.
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
