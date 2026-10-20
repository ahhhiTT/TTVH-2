// Raw files behind the automated TikTok Shop weekly report (from the Director's
// FILE INPUT list and the Kuties TTS form, 2026-10-20). The extension will download
// these from Seller Center and Lark. "sample" = a sample file has been received.

import type { L } from "./reports";

export type RawStatus = "sample" | "missing" | "manual";

export interface RawSource {
  id: string;
  name: L;
  source: string;
  freq: L;
  status: RawStatus;
}

const daily = { vi: "Hằng ngày", en: "Daily" };
const hourly = { vi: "Hằng giờ", en: "Hourly" };
const weeklyMonthly = { vi: "Tuần / tháng", en: "Weekly / monthly" };
const tbd = { vi: "TBD", en: "TBD" };

export const RAW_SOURCES: RawSource[] = [
  { id: "orders", name: { vi: "Tất cả đơn hàng", en: "All orders" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "affiliate-orders", name: { vi: "Đơn hàng liên kết", en: "Affiliate orders" }, source: "TikTok Seller Center", freq: daily, status: "missing" },
  { id: "shop-overview", name: { vi: "Tổng quan cửa hàng (phân tích theo ngày)", en: "Shop overview (daily analytics)" }, source: "TikTok Seller Center", freq: hourly, status: "sample" },
  { id: "ads-pgm", name: { vi: "Ads Product GMV Max (PGM)", en: "Ads Product GMV Max (PGM)" }, source: "TikTok Seller Center", freq: hourly, status: "sample" },
  { id: "ads-lgm", name: { vi: "Ads Live GMV Max (LGM)", en: "Ads Live GMV Max (LGM)" }, source: "TikTok Seller Center", freq: hourly, status: "sample" },
  { id: "live-self", name: { vi: "Livestream self channel", en: "Livestream, self channel" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "streamer-daily", name: { vi: "TikTok Streamer: dữ liệu phiên live theo ngày", en: "TikTok Streamer: live sessions by day" }, source: "TikTok Streamer", freq: daily, status: "missing" },
  { id: "streamer-30m", name: { vi: "TikTok Streamer: dữ liệu theo 30 phút", en: "TikTok Streamer: data by 30 minutes" }, source: "TikTok Streamer", freq: { vi: "30 phút", en: "30 minutes" }, status: "missing" },
  { id: "live-aff", name: { vi: "Livestream affiliate", en: "Livestream, affiliate" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "video-self", name: { vi: "Video self channel (video kênh)", en: "Video, self channel" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "video-aff", name: { vi: "Video affiliate", en: "Video, affiliate" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "product-link", name: { vi: "Sản phẩm theo link sản phẩm", en: "Products by listing" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "product-sku", name: { vi: "Sản phẩm theo SKU", en: "Products by SKU" }, source: "TikTok Seller Center", freq: daily, status: "missing" },
  { id: "product-card", name: { vi: "Thẻ sản phẩm", en: "Product card" }, source: "TikTok Seller Center", freq: daily, status: "sample" },
  { id: "product-list", name: { vi: "Danh sách sản phẩm (listing, SKU người bán)", en: "Product listing (seller SKUs)" }, source: "TikTok Seller Center", freq: tbd, status: "sample" },
  { id: "customers", name: { vi: "Phân tích khách hàng", en: "Customer analysis" }, source: "TikTok Seller Center", freq: weeklyMonthly, status: "manual" },
  { id: "shop-score", name: { vi: "Điểm cửa hàng (sức khỏe gian hàng)", en: "Shop score (account health)" }, source: "TikTok Seller Center", freq: weeklyMonthly, status: "manual" },
  { id: "income", name: { vi: "Báo cáo income (quyết toán)", en: "Income report (settlement)" }, source: "TikTok Seller Center", freq: tbd, status: "sample" },
  { id: "booking", name: { vi: "Base Booking B2C", en: "Booking base, B2C" }, source: "Lark Base", freq: weeklyMonthly, status: "sample" },
  { id: "live-acceptance", name: { vi: "Base Livestream nghiệm thu", en: "Livestream acceptance base" }, source: "Lark Base", freq: weeklyMonthly, status: "sample" },
];
