"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { activateAccount, type AuthError, createActivationCode, endSession, signInWithPassword } from "./auth";
import { getData } from "./data/dataset";
import { LOCALES, type Locale } from "./i18n/dictionaries";
import { canOpen } from "./rbac";
import { demoMode, getCurrentUser, LOCALE_COOKIE, SESSION_COOKIE } from "./session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

// Demo accounts exist only without Supabase (local sample data).
export async function demoSignIn(formData: FormData) {
  if (!demoMode()) redirect("/login");
  const id = String(formData.get("userId") ?? "");
  if (!(await getData()).getUser(id)) redirect("/login");
  (await cookies()).set(SESSION_COOKIE, id, cookieOptions);
  redirect("/");
}

export type FormState = { error: AuthError | null };

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const error = await signInWithPassword(
    await getData(),
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );
  if (error) return { error };
  redirect("/");
}

export async function activate(_: FormState, formData: FormData): Promise<FormState> {
  const error = await activateAccount(
    await getData(),
    String(formData.get("email") ?? ""),
    String(formData.get("code") ?? ""),
    String(formData.get("password") ?? ""),
    String(formData.get("confirm") ?? ""),
  );
  if (error) return { error };
  redirect("/");
}

export async function signOut() {
  if (demoMode()) (await cookies()).delete(SESSION_COOKIE);
  else await endSession();
  redirect("/login");
}

export type CodeState = { personId: string; code: string } | { personId: string; error: string } | null;

// Director only. The code is returned once to the page and never stored in clear.
export async function issueActivationCode(_: CodeState, formData: FormData): Promise<CodeState> {
  const personId = String(formData.get("personId") ?? "");
  const actor = await getCurrentUser();
  if (!actor || !canOpen(actor, "settings") || demoMode()) return { personId, error: "forbidden" };
  const person = (await getData()).getUser(personId);
  if (!person || person.archivedAt) return { personId, error: "notfound" };
  if (!person.email && !person.personalEmail) return { personId, error: "noemail" };
  return { personId, code: await createActivationCode(personId, actor.id) };
}

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale")) as Locale;
  if (LOCALES.includes(locale)) (await cookies()).set(LOCALE_COOKIE, locale, cookieOptions);
}
