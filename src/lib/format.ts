import type { Locale } from "./i18n/dictionaries";

// Compact VND: 1.25 tỷ / 1.25B, 850 tr / 850M.
export function money(value: number, locale: Locale) {
  const nf = (digits: number) =>
    new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: digits });
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${nf(2).format(value / 1e9)}${locale === "vi" ? " tỷ" : "B"}`;
  if (abs >= 1e6) return `${nf(0).format(value / 1e6)}${locale === "vi" ? " tr" : "M"}`;
  if (abs >= 1e3) return `${nf(0).format(value / 1e3)}K`;
  return nf(0).format(value);
}

export function num(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 0 }).format(value);
}

export function pct(value: number, locale: Locale, digits = 0) {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value);
}

export function ratio(value: number, locale: Locale) {
  return `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", { maximumFractionDigits: 1 }).format(value)}x`;
}

export function monthLabel(month: string, locale: Locale) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { month: "short", year: "2-digit" }).format(
    new Date(y, m - 1, 1),
  );
}
