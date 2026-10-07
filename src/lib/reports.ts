// Report map, taken from the Director's hub manifest (docs/UpBase_Hub.source.html).
// status "ok" = the tool file exists in public/reports/, "wait" = file pending.
// Labels and descriptions follow the manifest; only personal notes were removed.

export type ReportStatus = "ok" | "wait";

export interface ReportItem {
  id: string;
  label: string;
  group?: string;
  platform?: "Shopee" | "TikTok Shop";
  status: ReportStatus;
  file: string;
  desc: string;
}

export interface ReportSection {
  id: string;
  name: string;
  sub: string;
  items: ReportItem[];
}

export const REPORT_SECTIONS: ReportSection[] = [
  {
    id: "s1",
    name: "Tổng quan report",
    sub: "Bức tranh chung toàn gian hàng theo kỳ.",
    items: [
      {
        id: "overview",
        label: "Tổng quan report",
        status: "wait",
        file: "report_tong_quan.html",
        desc: "Báo cáo tổng hợp toàn kỳ, điểm vào của các phân tích bên dưới.",
      },
    ],
  },
  {
    id: "s2",
    name: "Theo chiều ngày",
    sub: "Campaign và daily, chung cho mọi sàn, không tách Shopee với TikTok.",
    items: [
      {
        id: "camp-main",
        group: "Campaign",
        label: "Campaign",
        status: "ok",
        file: "HTMLCAMP.html",
        desc: "Diễn biến ngày campaign: dán data thô, đọc ra xu hướng.",
      },
      {
        id: "camp-live",
        group: "Campaign",
        label: "Livestream campaign detail",
        status: "ok",
        file: "campaign_livestream_detail.html",
        desc: "Phân tích D-Day theo từng khung giờ: phiên nào, giờ nào tạo ra phần tăng thêm của campaign.",
      },
      {
        id: "daily",
        group: "Daily",
        label: "Daily",
        status: "wait",
        file: "daily.html",
        desc: "Nhịp bán ngày thường, làm nền so sánh để biết campaign thực sự cộng thêm bao nhiêu.",
      },
    ],
  },
  {
    id: "s3",
    name: "Theo hoạt động gian hàng",
    sub: "Sáu nguồn traffic của gian hàng, mỗi nguồn một báo cáo.",
    items: [
      {
        id: "act-video-kenh",
        label: "Video kênh",
        status: "wait",
        file: "hd1_video_kenh.html",
        desc: "Hiệu quả video do kênh tự sản xuất: lượt xem, click, đơn, GMV theo từng video.",
      },
      {
        id: "act-video-koc",
        label: "Video KOC",
        status: "ok",
        file: "hd2_video_koc.html",
        desc: "Chẩn đoán video affiliate: video nào của KOC nào đang ra đơn, video nào chỉ có view.",
      },
      {
        id: "act-live-shopee",
        label: "Livestream kênh Shopee",
        platform: "Shopee",
        status: "ok",
        file: "hd3_live_shopee.html",
        desc: "Bảng phân tích phiên live kênh trên Shopee.",
      },
      {
        id: "act-live-tts",
        label: "Livestream kênh TikTok",
        platform: "TikTok Shop",
        status: "ok",
        file: "hd3_live_tiktok.html",
        desc: "Chẩn đoán phiên live TikTok theo traffic, conversion và AOV, kèm chi phí ads. Bản nhân sự đang dùng thử.",
      },
      {
        id: "act-live-koc",
        label: "Livestream KOC",
        status: "wait",
        file: "hd4_live_koc.html",
        desc: "Phiên live do KOC chạy. Cần file export có cột host/creator.",
      },
      {
        id: "act-card",
        label: "Thẻ sản phẩm",
        status: "wait",
        file: "hd5_the_san_pham.html",
        desc: "Traffic và đơn đến từ thẻ sản phẩm trong nội dung.",
      },
      {
        id: "act-cms",
        label: "CMS chung",
        status: "wait",
        file: "hd6_cms.html",
        desc: "Tổng hợp toàn bộ hoạt động nội dung về một mặt bằng để so sánh giữa các nguồn.",
      },
    ],
  },
  {
    id: "s4",
    name: "Theo chiều sản phẩm",
    sub: "SKU nào kéo doanh thu, SKU nào cần xử lý tồn.",
    items: [
      {
        id: "prd-shopee",
        label: "Sản phẩm Shopee",
        platform: "Shopee",
        status: "ok",
        file: "sp_shopee.html",
        desc: "Phân tích dữ liệu sản phẩm Shopee: xếp hạng SKU, vai trò sản phẩm, GMV share.",
      },
      {
        id: "prd-tts",
        label: "Sản phẩm TikTok",
        platform: "TikTok Shop",
        status: "ok",
        file: "sp_tiktok.html",
        desc: "Phân tích nguồn hoạt động và hiệu quả sản phẩm trên TikTok Shop.",
      },
      {
        id: "prd-po",
        label: "PO và tồn kho",
        status: "ok",
        file: "sp_po_ton_kho.html",
        desc: "Kế hoạch đặt hàng: đối chiếu tồn kho với tốc độ bán để biết cần nhập thêm hay cần đẩy hàng.",
      },
    ],
  },
  {
    id: "s5",
    name: "Sức khoẻ gian hàng",
    sub: "Chỉ số nền của shop, không thuộc một hoạt động nào.",
    items: [
      {
        id: "health",
        label: "Sức khoẻ gian hàng",
        status: "wait",
        file: "suc_khoe_gian_hang.html",
        desc: "Điểm shop, tỷ lệ huỷ, thời gian xử lý đơn, vi phạm, đánh giá.",
      },
    ],
  },
  {
    id: "s6",
    name: "Checklist công việc",
    sub: "Việc cần làm sinh ra từ chẩn đoán.",
    items: [
      {
        id: "checklist",
        label: "Checklist công việc",
        status: "wait",
        file: "checklist.html",
        desc: "Danh sách hành động theo tuần, gắn với nhóm bottleneck và người phụ trách.",
      },
    ],
  },
  {
    id: "s7",
    name: "Đo lường hiệu quả",
    sub: "Đã làm gì, kết quả ra sao.",
    items: [
      {
        id: "impact",
        label: "Đo lường hiệu quả",
        status: "wait",
        file: "do_luong_hieu_qua.html",
        desc: "Đối chiếu tác động dự kiến với tác động thực tế sau khi làm.",
      },
    ],
  },
];

export const ALL_REPORTS = REPORT_SECTIONS.flatMap((s) => s.items.map((item) => ({ ...item, section: s })));
export const getReport = (id: string) => ALL_REPORTS.find((r) => r.id === id) ?? null;
