"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getData } from "./data/dataset";
import { LOCALES, type Locale } from "./i18n/dictionaries";
import { LOCALE_COOKIE, SESSION_COOKIE } from "./session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function demoSignIn(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  if (!(await getData()).getUser(id)) redirect("/login");
  (await cookies()).set(SESSION_COOKIE, id, cookieOptions);
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale")) as Locale;
  if (LOCALES.includes(locale)) (await cookies()).set(LOCALE_COOKIE, locale, cookieOptions);
}
