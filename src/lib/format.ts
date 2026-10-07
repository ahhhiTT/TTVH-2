import type { Locale } from "./i18n/dictionaries";

// Missing data renders as this marker, never as 0.
export const MISSING: Record<Locale, string> = { vi: "Chưa có dữ liệu", en: "No data" };
const SHORT_MISSING = "N/A";

const nfo = (locale: Locale, digits: number, extra: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: digits, ...extra });

// Compact VND: 1,25 tỷ / 1.25B, 850 tr / 850M.
export function money(value: number | null, locale: Locale, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${nfo(locale, 2).format(value / 1e9)}${locale === "vi" ? " tỷ" : "B"}`;
  if (abs >= 1e6) return `${nfo(locale, 0).format(value / 1e6)}${locale === "vi" ? " tr" : "M"}`;
  if (abs >= 1e3) return `${nfo(locale, 0).format(value / 1e3)}K`;
  return nfo(locale, 0).format(value);
}

export function num(value: number | null, locale: Locale, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return nfo(locale, 0).format(value);
}

export function pct(value: number | null, locale: Locale, digits = 0, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return nfo(locale, digits, { style: "percent" }).format(value);
}

export function ratio(value: number | null, locale: Locale, short = false) {
  if (value === null) return short ? SHORT_MISSING : MISSING[locale];
  return `${nfo(locale, 1).format(value)}x`;
}

export function monthLabel(month: string, locale: Locale) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { month: "short", year: "2-digit" }).format(
    new Date(y, m - 1, 1),
  );
}
