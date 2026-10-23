import type { Locale } from "./i18n/dictionaries";

// Missing data renders as this marker, never as 0.
export const MISSING: Record<Locale, string> = { vi: "Chưa có dữ liệu", en: "No data" };
const SHORT_MISSING = "N/A";

// Number standard (Director 2026-10-23), same in both languages: full value, no
// compaction, "." groups thousands, "," before decimals, at most 2 decimals.
// Percentages always show 2 decimals.
const NF = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const PF = new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNumber = (value: number) => NF.format(value);
export const fmtPercent = (value: number) => `${PF.format(value * 100)}%`;

// Typed input in the same standard: "1.234.567,5" -> 1234567.5. Without a comma, dots
// followed by groups of exactly 3 digits are thousands ("1.500" -> 1500), any other
// single dot is a decimal point ("0.12" -> 0.12).
export function parseVnNumber(text: string): number {
  let s = text.replace(/[\s\u00a0]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return s === "" ? NaN : Number(s);
}

// Plain value for an edit box: no grouping, "," before decimals.
export const editNumber = (value: number) => String(value).replace(".", ",");

export function money(value: number | null, locale: Locale, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return fmtNumber(value);
}

export function num(value: number | null, locale: Locale, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return fmtNumber(value);
}

// `digits` is kept for existing callers; the standard is always 2 decimals.
export function pct(value: number | null, locale: Locale, digits = 2, short = false) {
  void digits;
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return fmtPercent(value);
}

export function ratio(value: number | null, locale: Locale, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return `${fmtNumber(value)}x`;
}

export function monthLabel(month: string, locale: Locale) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { month: "short", year: "2-digit" }).format(
    new Date(y, m - 1, 1),
  );
}
