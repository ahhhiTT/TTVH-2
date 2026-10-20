"use client";

import { useActionState } from "react";
import { activate, type CodeState, type FormState, issueActivationCode, signIn } from "@/lib/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { buttonPrimary, cx } from "./ui";

type LoginText = Dictionary["login"];

const field =
  "h-11 w-full rounded-md border border-hairline-strong bg-canvas px-3 text-base text-ink focus:border-2 focus:border-ink focus:outline-none sm:text-sm";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input className={field} {...props} />
    </label>
  );
}

function ErrorLine({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">
      {text}
    </p>
  ) : null;
}

export function LoginForm({ t }: { t: LoginText }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, { error: null });
  return (
    <form action={action} className="space-y-3">
      <Field label={t.email} name="email" type="email" autoComplete="username" required />
      <Field label={t.password} name="password" type="password" autoComplete="current-password" required />
      <ErrorLine text={state.error ? t.errors[state.error] : null} />
      <button type="submit" disabled={pending} className={cx(buttonPrimary, "w-full")}>
        {pending ? t.working : t.submit}
      </button>
    </form>
  );
}

export function ActivateForm({ t }: { t: LoginText }) {
  const [state, action, pending] = useActionState<FormState, FormData>(activate, { error: null });
  return (
    <form action={action} className="space-y-3">
      <Field label={t.email} name="email" type="email" autoComplete="username" required />
      <Field label={t.code} name="code" autoComplete="one-time-code" placeholder="XXXXX-XXXXX" required />
      <Field label={t.newPassword} name="password" type="password" autoComplete="new-password" minLength={10} required />
      <Field label={t.confirm} name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      <ErrorLine text={state.error ? t.errors[state.error] : null} />
      <button type="submit" disabled={pending} className={cx(buttonPrimary, "w-full")}>
        {pending ? t.working : t.activateSubmit}
      </button>
    </form>
  );
}

// Admin: create a one-time activation code for one person and show it once.
export function ActivationCodeButton({
  personId,
  label,
  text,
}: {
  personId: string;
  label: string;
  text: { shown: string; errors: Record<string, string> };
}) {
  const [state, action, pending] = useActionState<CodeState, FormData>(issueActivationCode, null);
  const mine = state && state.personId === personId ? state : null;
  return (
    <form action={action} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="personId" value={personId} />
      {mine && "code" in mine ? (
        <span className="rounded-md border border-hairline-strong bg-panel px-2 py-1 text-right text-[12px] text-body">
          {text.shown}{" "}
          <code className="font-mono text-[13px] font-semibold tracking-wider text-ink select-all">{mine.code}</code>
        </span>
      ) : (
        <button disabled={pending} className="rounded-full px-2.5 py-1 text-[13px] font-medium text-ink hover:bg-panel">
          {label}
        </button>
      )}
      {mine && "error" in mine && <span className="text-[12px] text-warning">{text.errors[mine.error] ?? mine.error}</span>}
    </form>
  );
}
