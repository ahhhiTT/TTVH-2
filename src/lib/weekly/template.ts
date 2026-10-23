// TikTok Shop weekly report template, row by row as in the Kuties form (Director,
// 2026-10-20) with the confirmed corrections. Each row is one of:
//   base   - actual comes from the raw files (facts); plan is typed in
//   manual - actual and plan are typed in
//   calc   - computed from other rows, the same way for plan and actual
// Missing vs Zero: a row with no data is null; sums of only-missing parts are null;
// ratios with a missing input or a zero denominator are null.

import type { L } from "../reports";
import type { ReportConfig } from "./kinds";

export type Unit = "vnd" | "num" | "pct" | "x" | "h";
export type Getter = (key: string) => number | null;

export interface FactAccess {
  // Sum of a metric over the period; `match` filters by dimension.
  // null = no data for the metric in the period; 0 = data loaded, nothing matches.
  sum(metric: string, match?: (dim: string) => boolean): number | null;
}

export interface RowDef {
  key: string;
  label: L;
  unit: Unit;
  level?: 0 | 1 | 2;
  base?: (f: FactAccess) => number | null;
  manual?: boolean;
  calc?: (g: Getter) => number | null;
  noPlan?: boolean;
  note?: L; // shown under the label (e.g. a deviation from the Kuties sheet)
}

export interface Group {
  title: L;
  rows: RowDef[];
}

export interface Section {
  key: string;
  title: L;
  groups: Group[];
}

const l = (vi: string, en: string): L => ({ vi, en });

// ---------------------------------------------------------------- arithmetic with Missing
export const add = (...v: (number | null)[]) => (v.every((x) => x === null) ? null : v.reduce<number>((a, x) => a + (x ?? 0), 0));
export const sub = (a: number | null, b: number | null) => (a === null ? null : a - (b ?? 0));
export const div = (a: number | null, b: number | null) => (a === null || b === null || b === 0 ? null : a / b);
export const mul = (a: number | null, k: number) => (a === null ? null : a * k);
const share = (g: Getter, key: string, of: string) => div(g(key), g(of));

const fact = (metric: string, match?: (dim: string) => boolean) => (f: FactAccess) => f.sum(metric, match);

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();

export const TIERS = ["TAP UpAffiliate", "KL1", "KL2", "KL3", "KL4", "KL5", "KL6", "KL7"];

// booking dim = channel|tier|product
const bk = (dim: string) => {
  const [channel, tier, product] = dim.split("|");
  return { channel, tier, product };
};

export function buildTemplate(config: ReportConfig, skus: string[]): Section[] {
  const self = config.selfAccounts.map(norm);
  const isSelf = (ch: string) => self.includes(ch);
  const lineOf = (product: string) =>
    config.productLines.find((p) => p.keywords.some((k) => k && product.includes(norm(k))))?.name ?? null;
  const slug = (s: string) => norm(s).replace(/[^\p{L}\p{N}]+/gu, "-");

  // ------------------------------------------------------------ Part I
  const partI: Section = {
    key: "p1",
    title: l("Phần I. JBP", "Part I. JBP"),
    groups: [
      {
        title: l("Chỉ số chung", "Key metrics"),
        rows: [
          { key: "gmv", label: l("GMV nhà bán", "Seller GMV"), unit: "vnd", base: fact("gmv") },
          { key: "nmv", label: l("NMV nhà bán", "Seller NMV"), unit: "vnd", base: fact("nmv") },
          { key: "orders_eff", label: l("Số đơn hàng hiệu quả", "Effective orders"), unit: "num", base: fact("orders_eff") },
          { key: "orders", label: l("Số đơn hàng", "Orders"), unit: "num", base: fact("orders") },
          { key: "clicks", label: l("Lượt nhấp vào sản phẩm", "Product clicks"), unit: "num", base: fact("clicks") },
          { key: "visitors", label: l("Lượt truy cập gian hàng", "Store visitors"), unit: "num", base: fact("visitors") },
          { key: "cr", label: l("Tỉ lệ chuyển đổi (CR)", "Conversion rate (CR)"), unit: "pct", calc: (g) => div(g("orders"), g("visitors")) }, // Director 2026-10-23: orders / store visitors
          { key: "aov", label: l("Giá trung bình/đơn hàng (AOV)", "Average order value (AOV)"), unit: "vnd", calc: (g) => div(g("nmv"), g("orders_eff")) },
          { key: "cancel", label: l("Tỷ lệ hủy", "Cancel rate"), unit: "pct", calc: (g) => { const r = div(g("nmv"), g("gmv")); return r === null ? null : 1 - r; } },
          { key: "cost_net", label: l("Tổng chi phí thúc đẩy (net)", "Total growth cost (net)"), unit: "vnd", manual: true },
          { key: "cost_gross", label: l("Tổng chi phí thúc đẩy (gross)", "Total growth cost (gross)"), unit: "vnd", calc: (g) => g("c_total") },
          { key: "cir_net", label: l("% Chi phí thúc đẩy (net)/NMV (CIR)", "Growth cost (net) / NMV (CIR)"), unit: "pct", calc: (g) => div(g("cost_net"), g("nmv")) },
          { key: "cir_gross", label: l("% Chi phí thúc đẩy (gross)/NMV (CIR)", "Growth cost (gross) / NMV (CIR)"), unit: "pct", calc: (g) => div(g("cost_gross"), g("nmv")) },
        ],
      },
      {
        title: l("Doanh thu", "Revenue"),
        rows: [
          { key: "gap", label: l("GAP (GMV từ các hoạt động/GMV nhà bán)", "GAP (activity GMV / seller GMV)"), unit: "pct", calc: (g) => div(g("act_gmv"), g("gmv")) },
          { key: "act_gmv", label: l("GMV từ các hoạt động", "Activity GMV"), unit: "vnd", calc: (g) => add(g("video"), g("live"), g("card")) },
          { key: "video", label: l("Doanh thu Video", "Video revenue"), unit: "vnd", level: 1, calc: (g) => add(g("vself"), g("vaff")) },
          { key: "vself", label: l("Video self channel", "Video, self channel"), unit: "vnd", level: 2, base: fact("gmv_vself") },
          { key: "vaff", label: l("Video affiliate", "Video, affiliate"), unit: "vnd", level: 2, base: fact("gmv_vaff") },
          { key: "live", label: l("Doanh thu Livestream", "Livestream revenue"), unit: "vnd", level: 1, calc: (g) => add(g("lself"), g("laff")) },
          { key: "lself", label: l("Doanh thu Livestream self channel", "Livestream revenue, self channel"), unit: "vnd", level: 2, base: fact("gmv_lself") },
          { key: "laff", label: l("Doanh thu Livestream affiliate", "Livestream revenue, affiliate"), unit: "vnd", level: 2, base: fact("gmv_laff") },
          { key: "card", label: l("Doanh thu trang sản phẩm", "Product card revenue"), unit: "vnd", level: 1, base: fact("gmv_card") },
        ],
      },
      {
        title: l("Chi phí thúc đẩy", "Growth costs"),
        rows: [
          { key: "c_total", label: l("Tổng chi phí thúc đẩy (gross)", "Total growth cost (gross)"), unit: "vnd", calc: (g) => add(g("c_onsite"), g("c_offsite"), g("c_extra")) },
          {
            key: "c_onsite", label: l("Tổng chi phí onsite (gross)", "Onsite cost (gross)"), unit: "vnd", level: 1,
            calc: (g) => add(g("c_bk_vaff"), g("c_vself"), g("c_ads"), g("c_bk_laff"), g("c_lself"), g("c_aff"), g("c_mkt"), g("c_service"), g("c_other")),
          },
          {
            key: "c_bk_vaff", label: l("Chi phí booking video affiliate (gross)", "Video affiliate booking cost (gross)"), unit: "vnd", level: 2, calc: (g) => g("s2_cost"),
            note: l("File Kuties đang lấy nhầm chi phí video self channel ở dòng này; web lấy tổng chi phí booking video affiliate (Phần II mục 2). Cần xác nhận.", "The Kuties sheet takes the self channel video cost here by mistake; this takes the total video affiliate booking cost (Part II.2). To confirm."),
          },
          { key: "c_vself", label: l("Chi phí video self channel (gross)", "Self channel video cost (gross)"), unit: "vnd", level: 2, calc: (g) => g("s1_cost") },
          {
            key: "c_ads", label: l("Chi phí ads (gross)", "Ads cost (gross)"), unit: "vnd", level: 2, calc: (g) => g("s5_cost_gross"),
            note: l("Gross = chi phí Ads PGM + LGM x 1,1. File Kuties dòng này đang lấy số net. Cần xác nhận.", "Gross = Ads PGM + LGM cost x 1.1. The Kuties sheet links the net figure here. To confirm."),
          },
          { key: "c_bk_laff", label: l("Chi phí booking livestream affiliate (gross)", "Livestream affiliate booking cost (gross)"), unit: "vnd", level: 2, calc: (g) => g("s4_bk_cost") },
          {
            key: "c_lself", label: l("Chi phí livestream self channel (gross)", "Self channel livestream cost (gross)"), unit: "vnd", level: 2, calc: (g) => g("s3_cost_gross"),
            note: l("Gross = Tổng thu Brand (Base nghiệm thu) + chi phí set up, x 1,08. File Kuties dòng này đang lấy số net. Cần xác nhận.", "Gross = brand charge (acceptance base) + set-up cost, x 1.08. The Kuties sheet links the net figure here. To confirm."),
          },
          { key: "c_aff", label: l("Chi phí tiếp thị liên kết (gross)", "Affiliate commission (gross)"), unit: "vnd", level: 2, base: fact("aff_cost") },
          { key: "c_mkt", label: l("Chi phí gói Marketing Solution (gross)", "Marketing Solution package (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_service", label: l("Chi phí gói dịch vụ (gross)", "Service package (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_other", label: l("Chi phí khác (gross)", "Other cost (gross)"), unit: "vnd", level: 2, manual: true },
          {
            key: "c_offsite", label: l("Tổng chi phí offsite (gross)", "Offsite cost (gross)"), unit: "vnd", level: 1,
            calc: (g) => add(g("c_cpas"), g("c_upbase"), g("c_shopee"), g("c_google"), g("c_bk_off"), g("c_aff_off"), g("c_other_off")),
          },
          { key: "c_cpas", label: l("Chi phí CPAS (gross)", "CPAS (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_upbase", label: l("Chi phí UpBase managed (gross)", "UpBase managed (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_shopee", label: l("Chi phí Shopee managed (gross)", "Shopee managed (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_google", label: l("Chi phí Google Shopping Ads (gross)", "Google Shopping Ads (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_bk_off", label: l("Chi phí booking (gross)", "Booking (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_aff_off", label: l("Chi phí tiếp thị liên kết (gross)", "Affiliate (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_other_off", label: l("Chi phí khác (gross)", "Other (gross)"), unit: "vnd", level: 2, manual: true },
          { key: "c_extra", label: l("Tổng chi phí extra (branding nội sàn/ngoại sàn...)", "Extra cost (branding on/off marketplace...)"), unit: "vnd", level: 1, manual: true },
        ],
      },
      {
        title: l("Cơ cấu doanh thu", "Revenue mix"),
        rows: [
          { key: "m_act", label: l("GMV từ các hoạt động", "Activity GMV"), unit: "pct", calc: (g) => add(g("m_video"), g("m_live"), g("m_card")) },
          { key: "m_video", label: l("Doanh thu Video", "Video revenue"), unit: "pct", level: 1, calc: (g) => add(g("m_vself"), g("m_vaff")) },
          { key: "m_vself", label: l("Video self channel", "Video, self channel"), unit: "pct", level: 2, calc: (g) => share(g, "vself", "act_gmv") },
          { key: "m_vaff", label: l("Video affiliate", "Video, affiliate"), unit: "pct", level: 2, calc: (g) => share(g, "vaff", "act_gmv") },
          { key: "m_live", label: l("Doanh thu Livestream", "Livestream revenue"), unit: "pct", level: 1, calc: (g) => add(g("m_lself"), g("m_laff")) },
          { key: "m_lself", label: l("Doanh thu Livestream self channel", "Livestream, self channel"), unit: "pct", level: 2, calc: (g) => share(g, "lself", "act_gmv") },
          { key: "m_laff", label: l("Doanh thu Livestream affiliate", "Livestream, affiliate"), unit: "pct", level: 2, calc: (g) => share(g, "laff", "act_gmv") },
          { key: "m_card", label: l("Doanh thu trang sản phẩm", "Product card revenue"), unit: "pct", level: 1, calc: (g) => share(g, "card", "act_gmv") },
        ],
      },
      {
        title: l("Cơ cấu cách vận hành", "Operating mix"),
        rows: [
          { key: "o_self", label: l("Tự vận hành", "Self-operated"), unit: "pct", calc: (g) => add(g("m_vself"), g("m_lself"), g("m_card")) },
          { key: "o_aff", label: l("Tiếp thị liên kết", "Affiliate"), unit: "pct", calc: (g) => { const s = g("o_self"); return s === null ? null : 1 - s; } },
        ],
      },
      {
        title: l("Cơ cấu chi phí thúc đẩy (trên NMV)", "Growth cost mix (over NMV)"),
        rows: (
          [
            ["c_onsite", l("Chi phí onsite", "Onsite"), 0],
            ["c_bk_vaff", l("Chi phí booking video affiliate", "Video affiliate booking"), 1],
            ["c_vself", l("Chi phí video self channel", "Self channel video"), 1],
            ["c_ads", l("Chi phí ads", "Ads"), 1],
            ["c_bk_laff", l("Chi phí booking livestream affiliate", "Livestream affiliate booking"), 1],
            ["c_lself", l("Chi phí livestream self channel", "Self channel livestream"), 1],
            ["c_aff", l("Chi phí tiếp thị liên kết", "Affiliate commission"), 1],
            ["c_mkt", l("Chi phí gói dịch vụ hiển thị", "Display service package"), 1],
            ["c_service", l("Chi phí gói tài trợ (voucher, hoàn xu...)", "Sponsorship package (voucher, coin back...)"), 1],
            ["c_other", l("Chi phí khác", "Other"), 1],
            ["c_offsite", l("Chi phí offsite", "Offsite"), 0],
            ["c_cpas", l("Chi phí CPAS", "CPAS"), 1],
            ["c_upbase", l("Chi phí CPAS UpBase managed", "CPAS UpBase managed"), 1],
            ["c_shopee", l("Chi phí CPAS Shopee managed", "CPAS Shopee managed"), 1],
            ["c_google", l("Chi phí Google Shopping Ads", "Google Shopping Ads"), 1],
            ["c_bk_off", l("Chi phí booking", "Booking"), 1],
            ["c_aff_off", l("Chi phí tiếp thị liên kết", "Affiliate"), 1],
            ["c_other_off", l("Chi phí khác", "Other"), 1],
            ["c_extra", l("Chi phí extra", "Extra"), 0],
          ] as [string, L, 0 | 1][]
        ).map(([k, label, level]) => ({ key: `x_${k}`, label, unit: "pct" as const, level, calc: (g: Getter) => div(g(k), g("nmv")) })),
      },
    ],
  };

  // ------------------------------------------------------------ Part II.1 Video self channel
  const accountRows = (prefix: string, make: (a: string) => Omit<RowDef, "key" | "label" | "level">) =>
    self.map((a) => ({ key: `${prefix}_${slug(a)}`, label: l(a, a), level: 2 as const, ...make(a) }));
  const lineRows = (prefix: string, make: (name: string) => Omit<RowDef, "key" | "label" | "level">) =>
    config.productLines.map((p) => ({ key: `${prefix}_${slug(p.name)}`, label: l(p.name, p.name), level: 2 as const, ...make(p.name) }));

  const s1: Section = {
    key: "s1",
    title: l("1. Video self channel", "1. Video, self channel"),
    groups: [
      {
        title: l("Chỉ số chung", "Key metrics"),
        rows: [
          { key: "s1_gmv", label: l("GMV video self channel", "Self channel video GMV"), unit: "vnd", calc: (g) => g("vself") },
          { key: "s1_count", label: l("Số video self channel", "Self channel videos"), unit: "num", calc: (g) => add(...self.map((a) => g(`s1c_${slug(a)}`))) },
          { key: "s1_cost", label: l("Chi phí video self channel", "Self channel video cost"), unit: "vnd", calc: (g) => add(...self.map((a) => g(`s1k_${slug(a)}`))) },
          { key: "s1_roi", label: l("ROI", "ROI"), unit: "x", calc: (g) => div(g("s1_gmv"), g("s1_cost")) },
        ],
      },
      {
        title: l("Theo kênh", "By channel"),
        rows: [
          { key: "s1g_head", label: l("GMV video theo kênh", "Video GMV by channel"), unit: "vnd", level: 1, calc: (g) => add(...self.map((a) => g(`s1g_${slug(a)}`))) },
          ...accountRows("s1g", (a) => ({ unit: "vnd", base: fact("gmv_cc", (d) => d === `videos|${a}`) })),
          { key: "s1c_head", label: l("Số video theo kênh (Base Booking)", "Videos by channel (booking base)"), unit: "num", level: 1, calc: (g) => g("s1_count") },
          ...accountRows("s1c", (a) => ({ unit: "num", base: fact("bk_count", (d) => bk(d).channel === a) })),
          { key: "s1k_head", label: l("Chi phí theo kênh", "Cost by channel"), unit: "vnd", level: 1, calc: (g) => g("s1_cost") },
          ...accountRows("s1k", () => ({ unit: "vnd", manual: true })),
          { key: "s1r_head", label: l("ROI theo kênh", "ROI by channel"), unit: "x", level: 1, calc: (g) => g("s1_roi") },
          ...accountRows("s1r", (a) => ({ unit: "x", calc: (g) => div(g(`s1g_${slug(a)}`), g(`s1k_${slug(a)}`)) })),
        ],
      },
      {
        title: l("Theo dòng sản phẩm", "By product line"),
        rows: [
          ...lineRows("s1pg", () => ({ unit: "vnd", manual: true })),
          ...lineRows("s1pc", () => ({ unit: "num", manual: true })),
          ...lineRows("s1pk", () => ({ unit: "vnd", manual: true })),
        ],
      },
    ],
  };

  // ------------------------------------------------------------ Part II.2 Video affiliate
  const affLine = (name: string, tier: string | null) => (d: string) => {
    const b = bk(d);
    if (isSelf(b.channel)) return false;
    if (lineOf(b.product) !== name) return false;
    return tier === null ? b.tier === "" : b.tier === norm(tier);
  };
  const lineGroups: Group[] = config.productLines.map((p) => {
    const s = slug(p.name);
    const tiers = [...TIERS.map((t) => [t, t] as const), ["", "Non-booking"] as const];
    return {
      title: l(p.name, p.name),
      rows: [
        { key: `s2n_${s}`, label: l("Số video", "Videos"), unit: "num", level: 1, calc: (g) => add(...tiers.map(([t]) => g(`s2n_${s}_${slug(t || "non")}`))) },
        ...tiers.map(([t, label]) => ({
          key: `s2n_${s}_${slug(t || "non")}`, label: l(label, label), unit: "num" as const, level: 2 as const,
          base: fact("bk_count", affLine(p.name, t || null)),
        })),
        { key: `s2k_${s}`, label: l("Chi phí booking video affiliate", "Booking cost"), unit: "vnd", level: 1, calc: (g) => add(...tiers.map(([t]) => g(`s2k_${s}_${slug(t || "non")}`))) },
        ...tiers.map(([t, label]) => ({
          key: `s2k_${s}_${slug(t || "non")}`, label: l(label, label), unit: "vnd" as const, level: 2 as const,
          base: fact("bk_cost", affLine(p.name, t || null)),
        })),
      ],
    };
  });
  const s2: Section = {
    key: "s2",
    title: l("2. Video affiliate", "2. Video, affiliate"),
    groups: [
      {
        title: l("Chỉ số chung", "Key metrics"),
        rows: [
          { key: "s2_gmv", label: l("GMV video affiliate", "Affiliate video GMV"), unit: "vnd", calc: (g) => g("vaff") },
          { key: "s2_gmv_in", label: l("GMV video affiliate trong tháng", "GMV from videos of this month"), unit: "vnd", level: 1, manual: true },
          { key: "s2_gmv_old", label: l("GMV video affiliate cũ", "GMV from older videos"), unit: "vnd", level: 1, manual: true },
          { key: "s2_gmv_non", label: l("GMV video affiliate - non booking", "GMV, non-booking"), unit: "vnd", level: 1, calc: (g) => sub(sub(g("s2_gmv"), g("s2_gmv_in")), g("s2_gmv_old")) },
          { key: "s2_total", label: l("Tổng số video affiliate", "Total affiliate videos"), unit: "num", manual: true },
          { key: "s2_count", label: l("Số video affiliate trong tháng", "Affiliate videos this month"), unit: "num", level: 1, calc: (g) => add(...config.productLines.map((p) => g(`s2n_${slug(p.name)}`))) },
          { key: "s2_count_old", label: l("Số video affiliate cũ", "Older affiliate videos"), unit: "num", level: 1, manual: true },
          { key: "s2_count_non", label: l("Số video - non booking", "Videos, non-booking"), unit: "num", level: 1, manual: true },
          { key: "s2_cost", label: l("Chi phí booking video affiliate", "Video affiliate booking cost"), unit: "vnd", calc: (g) => add(g("s2_branding"), g("s2_perf"), g("s2_adcode")) },
          { key: "s2_branding", label: l("Branding", "Branding"), unit: "vnd", level: 1, manual: true },
          { key: "s2_perf", label: l("Performance", "Performance"), unit: "vnd", level: 1, calc: (g) => add(...config.productLines.map((p) => g(`s2k_${slug(p.name)}`))) },
          { key: "s2_adcode", label: l("Chi phí mua mã Ads/phí SDHA", "Ad code / SDHA fee"), unit: "vnd", level: 1, manual: true },
          { key: "s2_roi", label: l("ROI", "ROI"), unit: "x", calc: (g) => div(g("s2_gmv"), g("s2_cost")) },
        ],
      },
      ...lineGroups,
    ],
  };

  // ------------------------------------------------------------ Part II.3 Livestream self channel
  const s3: Section = {
    key: "s3",
    title: l("3. Livestream self channel", "3. Livestream, self channel"),
    groups: [
      {
        title: l("Chỉ số", "Metrics"),
        rows: [
          { key: "s3_gmv", label: l("GMV livestream self channel", "Self channel livestream GMV"), unit: "vnd", calc: (g) => g("lself") },
          { key: "s3_orders", label: l("Số đơn hàng livestream self channel", "Self channel livestream orders"), unit: "num", manual: true },
          { key: "s3_aov", label: l("AOV livestream self channel", "Self channel livestream AOV"), unit: "vnd", manual: true },
          { key: "s3_base", label: l("Baseline/giờ live", "Baseline per live hour"), unit: "vnd", manual: true },
          { key: "s3_hours", label: l("Số giờ livestream self channel", "Self channel live hours"), unit: "h", manual: true },
          { key: "s3_cost", label: l("Chi phí livestream self channel", "Self channel livestream cost"), unit: "vnd", calc: (g) => add(g("s3_host"), g("s3_setup")) },
          { key: "s3_cost_gross", label: l("Chi phí livestream self channel (gross)", "Self channel livestream cost (gross)"), unit: "vnd", calc: (g) => mul(g("s3_cost"), 1.08) },
          { key: "s3_host", label: l("Chi phí Host (Tổng thu Brand, Base nghiệm thu)", "Host cost (brand charge, acceptance base)"), unit: "vnd", level: 1, base: fact("lself_cost") },
          { key: "s3_setup", label: l("Chi phí set up", "Set-up cost"), unit: "vnd", level: 1, manual: true },
          { key: "s3_roi", label: l("ROI", "ROI"), unit: "x", manual: true },
        ],
      },
    ],
  };

  // ------------------------------------------------------------ Part II.4 Livestream affiliate
  const s4: Section = {
    key: "s4",
    title: l("4. Livestream affiliate", "4. Livestream, affiliate"),
    groups: [
      {
        title: l("Chỉ số", "Metrics"),
        rows: [
          { key: "s4_gmv", label: l("GMV livestream affiliate", "Affiliate livestream GMV"), unit: "vnd", base: fact("laff_gmv") },
          { key: "s4_bk_gmv", label: l("GMV Booking", "Booked GMV"), unit: "vnd", level: 1, manual: true },
          { key: "s4_non_gmv", label: l("GMV Non Booking", "Non-booked GMV"), unit: "vnd", level: 1, calc: (g) => sub(g("s4_gmv"), g("s4_bk_gmv")) },
          { key: "s4_orders", label: l("Số đơn hàng livestream affiliate (đơn đã tạo)", "Affiliate livestream orders (created)"), unit: "num", base: fact("laff_orders") },
          { key: "s4_aov", label: l("AOV livestream affiliate", "Affiliate livestream AOV"), unit: "vnd", calc: (g) => div(g("s4_gmv"), g("s4_orders")) },
          { key: "s4_bk_cost", label: l("Chi phí booking livestream affiliate", "Affiliate livestream booking cost"), unit: "vnd", manual: true },
          { key: "s4_roi", label: l("ROI", "ROI"), unit: "x", manual: true },
        ],
      },
    ],
  };

  // ------------------------------------------------------------ Part II.5 Ads
  const s5: Section = {
    key: "s5",
    title: l("5. Ads - Media", "5. Ads - Media"),
    groups: [
      {
        title: l("Ads GMV Max", "Ads GMV Max"),
        rows: [
          { key: "s5_rev", label: l("Doanh thu Ads", "Ads revenue"), unit: "vnd", calc: (g) => add(g("s5p_rev"), g("s5l_rev")) },
          { key: "s5_cost", label: l("Chi phí Ads", "Ads cost"), unit: "vnd", calc: (g) => add(g("s5p_cost"), g("s5l_cost")) },
          { key: "s5_cost_gross", label: l("Chi phí Ads (gross)", "Ads cost (gross)"), unit: "vnd", calc: (g) => mul(g("s5_cost"), 1.1) },
          { key: "s5_roi", label: l("ROI", "ROI"), unit: "x", calc: (g) => div(g("s5_rev"), g("s5_cost")) },
        ],
      },
      {
        title: l("Ads PGM", "Ads PGM"),
        rows: [
          { key: "s5p_rev", label: l("Doanh thu PGM", "PGM revenue"), unit: "vnd", base: fact("pgm_rev") },
          { key: "s5p_cost", label: l("Chi phí PGM", "PGM cost"), unit: "vnd", base: fact("pgm_cost") },
          { key: "s5p_roas", label: l("ROAS", "ROAS"), unit: "x", calc: (g) => div(g("s5p_rev"), g("s5p_cost")) },
          { key: "s5p_cpc", label: l("CPC", "CPC"), unit: "vnd", calc: (g) => div(g("s5p_cost"), g("s5p_clicks")) },
          { key: "s5p_ctr", label: l("CTR", "CTR"), unit: "pct", calc: (g) => div(g("s5p_clicks"), g("s5p_impr")) },
          { key: "s5p_cr", label: l("CR", "CR"), unit: "pct", calc: (g) => div(g("s5p_orders"), g("s5p_clicks")) },
          { key: "s5p_cpm", label: l("CPM", "CPM"), unit: "vnd", calc: (g) => mul(div(g("s5p_cost"), g("s5p_impr")), 1000) },
          { key: "s5p_orders", label: l("Số đơn hàng", "Orders"), unit: "num", base: fact("pgm_orders") },
          { key: "s5p_clicks", label: l("Số lượt click", "Clicks"), unit: "num", base: fact("pgm_clicks") },
          { key: "s5p_impr", label: l("Số lượt xem", "Impressions"), unit: "num", base: fact("pgm_impr") },
          { key: "s5p_aov", label: l("AOV", "AOV"), unit: "vnd", calc: (g) => div(g("s5p_rev"), g("s5p_orders")) },
        ],
      },
      {
        title: l("Ads LGM", "Ads LGM"),
        rows: [
          { key: "s5l_rev", label: l("Doanh thu LGM", "LGM revenue"), unit: "vnd", base: fact("lgm_rev") },
          { key: "s5l_cost", label: l("Chi phí LGM", "LGM cost"), unit: "vnd", base: fact("lgm_cost") },
          { key: "s5l_roi", label: l("ROI", "ROI"), unit: "x", calc: (g) => div(g("s5l_rev"), g("s5l_cost")) },
          { key: "s5l_cpm", label: l("CPM", "CPM"), unit: "vnd", calc: (g) => mul(div(g("s5l_cost"), g("s5l_views")), 1000) },
          { key: "s5l_views", label: l("Lượt xem", "Views"), unit: "num", base: fact("lgm_views") },
          { key: "s5l_orders", label: l("Số đơn hàng", "Orders"), unit: "num", base: fact("lgm_orders") },
          { key: "s5l_aov", label: l("AOV", "AOV"), unit: "vnd", calc: (g) => div(g("s5l_rev"), g("s5l_orders")) },
        ],
      },
      {
        title: l("Consider Ads (chưa có nguồn, để trống được)", "Consider Ads (no source yet, may stay empty)"),
        rows: [
          { key: "s5c_size", label: l("Consider", "Consider"), unit: "num", manual: true },
          { key: "s5c_cost", label: l("Chi phí Consider", "Consider cost"), unit: "vnd", manual: true },
          { key: "s5c_cpa", label: l("CPA", "CPA"), unit: "vnd", manual: true },
        ],
      },
      {
        title: l("Branding Ads (chưa có nguồn, để trống được)", "Branding Ads (no source yet, may stay empty)"),
        rows: [
          { key: "s5b_view", label: l("View", "Views"), unit: "num", manual: true },
          { key: "s5b_follow", label: l("Follow", "Follows"), unit: "num", manual: true },
          { key: "s5b_cost", label: l("Chi phí Branding", "Branding cost"), unit: "vnd", manual: true },
          { key: "s5b_cpa", label: l("CPA", "CPA"), unit: "vnd", manual: true },
        ],
      },
    ],
  };

  // ------------------------------------------------------------ Part II.6 SKU sales
  const s6: Section = {
    key: "s6",
    title: l("6. Doanh thu sản phẩm (số lượng theo SKU)", "6. Product sales (quantity by SKU)"),
    groups: [
      {
        title: l("Số lượng bán (không tính đơn hủy, hoàn)", "Units sold (cancelled and returned orders excluded)"),
        rows: [
          { key: "s6_total", label: l("Tổng", "Total"), unit: "num", noPlan: true, base: fact("sku_qty") },
          ...skus.map((sku) => ({
            key: `s6_${slug(sku)}`, label: l(sku, sku), unit: "num" as const, level: 1 as const, noPlan: true,
            base: fact("sku_qty", (d) => d === sku),
          })),
        ],
      },
    ],
  };

  return [partI, s1, s2, s3, s4, s5, s6];
}

// ------------------------------------------------------------ 7. shop health, 8. review
export const HEALTH: { key: string; label: L; target: string }[] = [
  ["Điểm vi phạm", "Violation points", ""],
  ["Tuân thủ chính sách", "Policy compliance", ""],
  ["Vi phạm liên quan đến cửa hàng", "Store-related violations", ""],
  ["Vi phạm liên quan đến sản phẩm", "Product-related violations", ""],
  ["Vi phạm về hoàn thiện đơn hàng", "Fulfilment violations", ""],
  ["Tỷ lệ giao nhanh 24h", "24h fast delivery rate", "≥ 90%"],
  ["Tỷ lệ gửi hàng nhanh", "Fast shipping rate", "≥ 90%"],
  ["Tỷ lệ gửi hàng muộn", "Late shipping rate", "< 4%"],
  ["Tỷ lệ hủy do lỗi của người bán", "Seller-fault cancellation rate", "< 2,5%"],
  ["Tỷ lệ gửi hàng muộn đơn Hỏa tốc", "Late shipping, express orders", "< 5%"],
  ["Tỷ lệ gửi hàng muộn đơn Trong ngày", "Late shipping, same-day orders", "< 5%"],
  ["Vi phạm số liệu dịch vụ", "Service metric violations", ""],
  ["Tỷ lệ đánh giá tiêu cực liên quan đến người bán", "Negative reviews, seller-related", "< 0,5%"],
  ["Tỷ lệ đánh giá tiêu cực liên quan đến dịch vụ", "Negative reviews, service-related", "< 0,5%"],
  ["Tỷ lệ hoàn tiền và trả hàng do lỗi người bán", "Seller-fault refund and return rate", "< 1,5%"],
  ["Tỷ lệ trả lời trong 12 giờ", "Reply rate within 12 hours", "> 85%"],
  ["Thời gian phản hồi trung bình", "Average response time", "< 1 giờ"],
  ["Tỷ lệ hài lòng qua chat", "Chat satisfaction rate", "≥ 70%"],
  ["Các vi phạm khác", "Other violations", ""],
  ["Vi phạm kiểm soát rủi ro", "Risk control violations", ""],
  ["Chấm điểm cửa hàng: Đánh giá", "Store rating", "> 4,5"],
  ["Tình trạng tài khoản TikTok: Số điểm vi phạm", "TikTok account: violation points", ""],
].map(([vi, en, target], i) => ({ key: `h${String(i + 1).padStart(2, "0")}`, label: { vi, en }, target }));

export const REVIEW_ITEMS: { key: string; label: L }[] = [
  ["overview", "Tổng quan", "Overview"],
  ["video_self", "Video trên kênh", "Channel videos"],
  ["video_koc", "Video KOC/KOL", "KOC/KOL videos"],
  ["ads", "Ads", "Ads"],
  ["live_self", "Livestream trên kênh", "Channel livestream"],
  ["live_koc", "Livestream KOC/KOL", "KOC/KOL livestream"],
].map(([key, vi, en]) => ({ key, label: { vi, en } }));
