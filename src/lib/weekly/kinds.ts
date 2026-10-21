// Raw files behind the TikTok Shop weekly report (Kuties template, Director 2026-10-20).
// "daily": rows carry a date, facts are stored per day. "period": the export has no
// per-day date (e.g. Ads Product GMV Max); the person picks the week or month it covers.

import type { L } from "../reports";

export type FileKind =
  | "orders"
  | "shop_overview"
  | "product_card"
  | "ads_pgm"
  | "ads_lgm"
  | "live_self"
  | "live_aff"
  | "video_self"
  | "video_aff"
  | "income"
  | "booking"
  | "live_acceptance";

export interface KindInfo {
  name: L;
  source: string;
  grain: "daily" | "period";
  required: boolean;
  feeds: L; // which parts of the report use it
}

export const KINDS: Record<FileKind, KindInfo> = {
  orders: {
    name: { vi: "Tất cả đơn hàng (OrderSKUList)", en: "All orders (OrderSKUList)" },
    source: "Seller Center",
    grain: "daily",
    required: true,
    feeds: { vi: "GMV, NMV, số đơn, GMV video theo kênh, doanh thu SP", en: "GMV, NMV, orders, video GMV by account, SKU sales" },
  },
  shop_overview: {
    name: { vi: "Phân tích cửa hàng (dữ liệu theo ngày)", en: "Shop analytics (daily data)" },
    source: "Seller Center",
    grain: "daily",
    required: true,
    feeds: { vi: "Lượt nhấp, lượt truy cập, GMV video/live self và affiliate", en: "Clicks, visitors, video/live GMV self and affiliate" },
  },
  product_card: {
    name: { vi: "Thẻ sản phẩm - Hiệu suất", en: "Product card performance" },
    source: "Seller Center",
    grain: "daily",
    required: true,
    feeds: { vi: "Doanh thu trang sản phẩm", en: "Product card revenue" },
  },
  ads_pgm: {
    name: { vi: "Ads Product GMV Max (PGM)", en: "Ads Product GMV Max (PGM)" },
    source: "Seller Center",
    grain: "period",
    required: true,
    feeds: { vi: "Ads PGM, chi phí Ads", en: "Ads PGM, Ads cost" },
  },
  ads_lgm: {
    name: { vi: "Ads Live GMV Max (LGM)", en: "Ads Live GMV Max (LGM)" },
    source: "Seller Center",
    grain: "daily",
    required: true,
    feeds: { vi: "Ads LGM, chi phí Ads", en: "Ads LGM, Ads cost" },
  },
  live_self: {
    name: { vi: "Livestream self channel", en: "Livestream, self channel" },
    source: "Seller Center",
    grain: "daily",
    required: false,
    feeds: { vi: "Đối chiếu phiên live kênh", en: "Self channel live sessions (cross-check)" },
  },
  live_aff: {
    name: { vi: "Livestream affiliate", en: "Livestream, affiliate" },
    source: "Seller Center",
    grain: "daily",
    required: true,
    feeds: { vi: "GMV và số đơn livestream affiliate", en: "Affiliate livestream GMV and orders" },
  },
  video_self: {
    name: { vi: "Video kênh (self channel)", en: "Channel videos (self channel)" },
    source: "Seller Center",
    grain: "daily",
    required: false,
    feeds: { vi: "Đối chiếu video kênh", en: "Channel videos (cross-check)" },
  },
  video_aff: {
    name: { vi: "Video affiliate", en: "Affiliate videos" },
    source: "Seller Center",
    grain: "daily",
    required: false,
    feeds: { vi: "Số video affiliate đăng trong kỳ", en: "Affiliate videos posted in the period" },
  },
  income: {
    name: { vi: "Báo cáo income (quyết toán)", en: "Income report (settlement)" },
    source: "Seller Center",
    grain: "period",
    required: true,
    feeds: { vi: "Chi phí tiếp thị liên kết", en: "Affiliate commission cost" },
  },
  booking: {
    name: { vi: "Base Booking B2C", en: "Booking base, B2C" },
    source: "Lark Base",
    grain: "daily",
    required: true,
    feeds: { vi: "Số video và chi phí booking theo tier, dòng sản phẩm, kênh", en: "Booked videos and cost by tier, product line, channel" },
  },
  live_acceptance: {
    name: { vi: "Base Livestream nghiệm thu", en: "Livestream acceptance base" },
    source: "Lark Base",
    grain: "daily",
    required: true,
    feeds: { vi: "Chi phí livestream self channel (Tổng thu Brand)", en: "Self channel livestream cost (brand charge)" },
  },
};

export const KIND_ORDER = Object.keys(KINDS) as FileKind[];

// Per-store settings the template needs (were hard-coded in the Kuties sheet).
export interface ReportConfig {
  selfAccounts: string[]; // TikTok handles of the brand's own channels
  productLines: { name: string; keywords: string[] }[]; // booking "Sản phẩm" -> product line
}

export function readConfig(raw: unknown): ReportConfig {
  const r = (raw ?? {}) as Partial<ReportConfig>;
  return {
    selfAccounts: Array.isArray(r.selfAccounts) ? r.selfAccounts.map(String).filter(Boolean) : [],
    productLines: Array.isArray(r.productLines)
      ? r.productLines
          .filter((p) => p && typeof p.name === "string")
          .map((p) => ({ name: p.name, keywords: Array.isArray(p.keywords) ? p.keywords.map(String).filter(Boolean) : [] }))
      : [],
  };
}

// Facts sent from the browser after parsing. Only aggregates and public handles.
export interface Fact {
  from: string;
  to: string;
  metric: string;
  dim: string;
  value: number;
}

export interface ParsedFile {
  fileName: string;
  sheet: string;
  kind: FileKind;
  from: string;
  to: string;
  rows: number;
  facts: Fact[];
  warnings: string[];
  needsPeriod: boolean; // period export: the person confirms which range it covers
}
