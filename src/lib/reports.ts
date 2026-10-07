// Report map, taken from the Director's hub manifest (docs/UpBase_Hub.source.html).
// status "ok" = the tool file exists in public/reports/, "wait" = file pending.
// Labels and descriptions follow the manifest; only personal notes were removed.
// English versions are translations of the Vietnamese text.

export type ReportStatus = "ok" | "wait";

// Bilingual text. Vietnamese follows the Director's manifest; English is a translation.
export type L = { vi: string; en: string };

export interface ReportItem {
  id: string;
  label: L;
  group?: string;
  platform?: "Shopee" | "TikTok Shop";
  status: ReportStatus;
  file: string;
  desc: L;
}

export interface ReportSection {
  id: string;
  name: L;
  sub: L;
  items: ReportItem[];
}

export const REPORT_SECTIONS: ReportSection[] = [
  {
    id: "s1",
    name: { vi: "Tổng quan report", en: "Report overview" },
    sub: { vi: "Bức tranh chung toàn gian hàng theo kỳ.", en: "The overall picture of all stores for the period." },
    items: [
      {
        id: "overview",
        label: { vi: "Tổng quan report", en: "Report overview" },
        status: "wait",
        file: "report_tong_quan.html",
        desc: { vi: "Báo cáo tổng hợp toàn kỳ, điểm vào của các phân tích bên dưới.", en: "Summary report for the whole period, the entry point to the analyses below." },
      },
    ],
  },
  {
    id: "s2",
    name: { vi: "Theo chiều ngày", en: "By day" },
    sub: { vi: "Campaign và daily, chung cho mọi sàn, không tách Shopee với TikTok.", en: "Campaign and daily, shared across marketplaces, Shopee and TikTok not split." },
    items: [
      {
        id: "camp-main",
        group: "Campaign",
        label: { vi: "Campaign", en: "Campaign" },
        status: "ok",
        file: "HTMLCAMP.html",
        desc: { vi: "Diễn biến ngày campaign: dán data thô, đọc ra xu hướng.", en: "Campaign-day trend: paste raw data, read the trend." },
      },
      {
        id: "camp-live",
        group: "Campaign",
        label: { vi: "Livestream campaign detail", en: "Livestream campaign detail" },
        status: "ok",
        file: "campaign_livestream_detail.html",
        desc: { vi: "Phân tích D-Day theo từng khung giờ: phiên nào, giờ nào tạo ra phần tăng thêm của campaign.", en: "D-Day analysis by hour: which sessions and hours create the campaign uplift." },
      },
      {
        id: "daily",
        group: "Daily",
        label: { vi: "Daily", en: "Daily" },
        status: "wait",
        file: "daily.html",
        desc: { vi: "Nhịp bán ngày thường, làm nền so sánh để biết campaign thực sự cộng thêm bao nhiêu.", en: "Normal-day sales rhythm, the baseline to measure what a campaign really adds." },
      },
    ],
  },
  {
    id: "s3",
    name: { vi: "Theo hoạt động gian hàng", en: "By store activity" },
    sub: { vi: "Sáu nguồn traffic của gian hàng, mỗi nguồn một báo cáo.", en: "Six traffic sources of a store, one report per source." },
    items: [
      {
        id: "act-video-kenh",
        label: { vi: "Video kênh", en: "Channel video" },
        status: "wait",
        file: "hd1_video_kenh.html",
        desc: { vi: "Hiệu quả video do kênh tự sản xuất: lượt xem, click, đơn, GMV theo từng video.", en: "Performance of self-produced videos: views, clicks, orders, GMV per video." },
      },
      {
        id: "act-video-koc",
        label: { vi: "Video KOC", en: "KOC video" },
        status: "ok",
        file: "hd2_video_koc.html",
        desc: { vi: "Chẩn đoán video affiliate: video nào của KOC nào đang ra đơn, video nào chỉ có view.", en: "Affiliate video diagnostic: which KOC videos drive orders and which only get views." },
      },
      {
        id: "act-live-shopee",
        label: { vi: "Livestream kênh Shopee", en: "Channel livestream, Shopee" },
        platform: "Shopee",
        status: "ok",
        file: "hd3_live_shopee.html",
        desc: { vi: "Bảng phân tích phiên live kênh trên Shopee.", en: "Analysis of channel live sessions on Shopee." },
      },
      {
        id: "act-live-tts",
        label: { vi: "Livestream kênh TikTok", en: "Channel livestream, TikTok" },
        platform: "TikTok Shop",
        status: "ok",
        file: "hd3_live_tiktok.html",
        desc: { vi: "Chẩn đoán phiên live TikTok theo traffic, conversion và AOV, kèm chi phí ads. Bản nhân sự đang dùng thử.", en: "TikTok live session diagnostic by traffic, conversion and AOV, with ad cost. Trial version used by staff." },
      },
      {
        id: "act-live-koc",
        label: { vi: "Livestream KOC", en: "KOC livestream" },
        status: "wait",
        file: "hd4_live_koc.html",
        desc: { vi: "Phiên live do KOC chạy. Cần file export có cột host/creator.", en: "Live sessions run by KOCs. Needs an export file with a host/creator column." },
      },
      {
        id: "act-card",
        label: { vi: "Thẻ sản phẩm", en: "Product cards" },
        status: "wait",
        file: "hd5_the_san_pham.html",
        desc: { vi: "Traffic và đơn đến từ thẻ sản phẩm trong nội dung.", en: "Traffic and orders from product cards in content." },
      },
      {
        id: "act-cms",
        label: { vi: "CMS chung", en: "Shared CMS" },
        status: "wait",
        file: "hd6_cms.html",
        desc: { vi: "Tổng hợp toàn bộ hoạt động nội dung về một mặt bằng để so sánh giữa các nguồn.", en: "All content activity on one basis to compare sources." },
      },
    ],
  },
  {
    id: "s4",
    name: { vi: "Theo chiều sản phẩm", en: "By product" },
    sub: { vi: "SKU nào kéo doanh thu, SKU nào cần xử lý tồn.", en: "Which SKUs drive revenue, which need stock clearance." },
    items: [
      {
        id: "prd-shopee",
        label: { vi: "Sản phẩm Shopee", en: "Products, Shopee" },
        platform: "Shopee",
        status: "ok",
        file: "sp_shopee.html",
        desc: { vi: "Phân tích dữ liệu sản phẩm Shopee: xếp hạng SKU, vai trò sản phẩm, GMV share.", en: "Shopee product analysis: SKU ranking, product role, GMV share." },
      },
      {
        id: "prd-tts",
        label: { vi: "Sản phẩm TikTok", en: "Products, TikTok" },
        platform: "TikTok Shop",
        status: "ok",
        file: "sp_tiktok.html",
        desc: { vi: "Phân tích nguồn hoạt động và hiệu quả sản phẩm trên TikTok Shop.", en: "Activity source and product performance analysis on TikTok Shop." },
      },
      {
        id: "prd-po",
        label: { vi: "PO và tồn kho", en: "PO and inventory" },
        status: "ok",
        file: "sp_po_ton_kho.html",
        desc: { vi: "Kế hoạch đặt hàng: đối chiếu tồn kho với tốc độ bán để biết cần nhập thêm hay cần đẩy hàng.", en: "Purchase planning: compare stock with sell-through to decide whether to reorder or push stock." },
      },
    ],
  },
  {
    id: "s5",
    name: { vi: "Sức khoẻ gian hàng", en: "Store health" },
    sub: { vi: "Chỉ số nền của shop, không thuộc một hoạt động nào.", en: "Baseline shop metrics, not tied to one activity." },
    items: [
      {
        id: "health",
        label: { vi: "Sức khoẻ gian hàng", en: "Store health" },
        status: "wait",
        file: "suc_khoe_gian_hang.html",
        desc: { vi: "Điểm shop, tỷ lệ huỷ, thời gian xử lý đơn, vi phạm, đánh giá.", en: "Shop score, cancellation rate, order handling time, violations, ratings." },
      },
    ],
  },
  {
    id: "s6",
    name: { vi: "Checklist công việc", en: "Work checklist" },
    sub: { vi: "Việc cần làm sinh ra từ chẩn đoán.", en: "Actions generated from diagnostics." },
    items: [
      {
        id: "checklist",
        label: { vi: "Checklist công việc", en: "Work checklist" },
        status: "wait",
        file: "checklist.html",
        desc: { vi: "Danh sách hành động theo tuần, gắn với nhóm bottleneck và người phụ trách.", en: "Weekly action list linked to bottleneck groups and owners." },
      },
    ],
  },
  {
    id: "s7",
    name: { vi: "Đo lường hiệu quả", en: "Impact measurement" },
    sub: { vi: "Đã làm gì, kết quả ra sao.", en: "What was done and what came of it." },
    items: [
      {
        id: "impact",
        label: { vi: "Đo lường hiệu quả", en: "Impact measurement" },
        status: "wait",
        file: "do_luong_hieu_qua.html",
        desc: { vi: "Đối chiếu tác động dự kiến với tác động thực tế sau khi làm.", en: "Expected impact compared with actual impact after the work." },
      },
    ],
  },
];

export const ALL_REPORTS = REPORT_SECTIONS.flatMap((s) => s.items.map((item) => ({ ...item, section: s })));
export const getReport = (id: string) => ALL_REPORTS.find((r) => r.id === id) ?? null;
