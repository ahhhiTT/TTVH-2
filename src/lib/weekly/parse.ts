// Runs in the browser. Detects each raw file by its column headers and turns it into
// aggregated facts. Only the named columns below are read, so personal data in the
// exports (phone, address, bank account, ID numbers) never leaves the browser.

import * as XLSX from "xlsx";
import type { Fact, FileKind, ParsedFile, ReportConfig } from "./kinds";

type Row = unknown[];

const strip = (s: unknown) =>
  String(s ?? "")
    .normalize("NFC")
    .replace(/\p{Extended_Pictographic}|️/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

// Date, Excel serial, "dd/mm/yyyy ...", "yyyy/mm/dd ...", "yyyy-mm-dd ...".
// Placeholder dates before 2000 (exports use 1970-01-01 for "no date") count as no date.
export function toDay(v: unknown): string | null {
  const d = parseDay(v);
  return d && d >= "2000-01-01" ? d : null;
}

function parseDay(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = XLSX.SSF.parse_date_code(v);
    return d ? iso(d.y, d.m, d.d) : null;
  }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  return null;
}

export function toNum(v: unknown): number | null {
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v ?? "").trim().replace(/[₫\s%]/g, "");
  if (!s || s === "-") return null;
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(",", ".");
  const n = Number(s);
  return isFinite(n) ? n : null;
}

// "18h 2min", "1h 41min", "45min", "02:30:00"
function toHours(v: unknown): number | null {
  const s = String(v ?? "").trim();
  const hm = s.match(/(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i);
  if (hm && (hm[1] || hm[2])) return (+(hm[1] ?? 0)) + (+(hm[2] ?? 0)) / 60;
  const t = s.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (t) return +t[1] + +t[2] / 60 + +(t[3] ?? 0) / 3600;
  return null;
}

class Acc {
  private m = new Map<string, number>();
  add(from: string, to: string, metric: string, dim: string, value: number | null) {
    if (value === null) return;
    const k = `${from}\u0001${to}\u0001${metric}\u0001${dim}`;
    this.m.set(k, (this.m.get(k) ?? 0) + value);
  }
  facts(): Fact[] {
    return [...this.m.entries()].map(([k, value]) => {
      const [from, to, metric, dim] = k.split("\u0001");
      return { from, to, metric, dim, value };
    });
  }
}

// Find the header row: the first of the top rows containing every required label.
function findHeader(rows: Row[], must: string[], prefix = false) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const h = (rows[i] ?? []).map(strip);
    const ok = must.every((m) => h.some((c) => (prefix ? c.startsWith(m) : c === m)));
    if (ok) return { index: i, cols: h };
  }
  return null;
}

const col = (cols: string[], name: string, prefix = false) =>
  cols.findIndex((c) => (prefix ? c.startsWith(strip(name)) : c === strip(name)));

interface Ctx {
  storeName: string;
  config: ReportConfig;
}

type Detector = (rows: Row[], ctx: Ctx) => Omit<ParsedFile, "fileName" | "sheet"> | null;

function range(days: string[]) {
  const s = [...days].sort();
  return { from: s[0], to: s[s.length - 1] };
}

type Parsed = Omit<ParsedFile, "fileName" | "sheet">;

function daily(kind: FileKind, acc: Acc, days: string[], rows: number, warnings: string[] = []): Parsed | null {
  if (days.length === 0) return null;
  return { kind, ...range(days), rows, facts: acc.facts(), warnings, needsPeriod: false };
}

const orders: Detector = (rows) => {
  const h = findHeader(rows, ["order id", "created time", "sku subtotal before discount", "sku seller discount"]);
  if (!h) return null;
  const c = (n: string) => col(h.cols, n);
  const [cId, cType, cSub, cDisc, cTime, cCh, cCr, cSku, cQty] = [
    c("Order ID"), c("Cancelation/Return Type"), c("SKU Subtotal Before Discount"), c("SKU Seller Discount"),
    c("Created Time"), c("Order Channel"), c("Creator Handle"), c("Seller SKU"), c("Quantity"),
  ];
  const acc = new Acc();
  const byCreator = new Map<string, number>();
  const all = new Map<string, Set<string>>();
  const eff = new Map<string, Set<string>>();
  const days: string[] = [];
  let n = 0;
  for (const r of rows.slice(h.index + 1)) {
    const d = toDay(r[cTime]);
    const id = String(r[cId] ?? "").trim();
    if (!d || !id) continue; // skips the description row under the header
    n++;
    days.push(d);
    const v = (toNum(r[cSub]) ?? 0) - (toNum(r[cDisc]) ?? 0);
    const type = String(r[cType] ?? "").trim();
    const cancelled = type === "Cancel" || type === "Return/Refund";
    acc.add(d, d, "gmv", "", v);
    if (!cancelled) acc.add(d, d, "nmv", "", v);
    (all.get(d) ?? all.set(d, new Set()).get(d)!).add(id);
    if (!cancelled) (eff.get(d) ?? eff.set(d, new Set()).get(d)!).add(id);
    const ch = strip(r[cCh]);
    const cr = strip(r[cCr]);
    if (cr) {
      acc.add(d, d, "gmv_cc", `${ch}|${cr}`, v);
      byCreator.set(cr, (byCreator.get(cr) ?? 0) + v);
    }
    if (!cancelled && cSku >= 0) acc.add(d, d, "sku_qty", String(r[cSku] ?? "").trim() || "(không có SKU)", toNum(r[cQty]) ?? 0);
  }
  for (const [d, s] of all) acc.add(d, d, "orders", "", s.size);
  for (const [d, s] of eff) acc.add(d, d, "orders_eff", "", s.size);
  const res = daily("orders", acc, days, n);
  // The shop's own account is normally the top seller in its order file.
  if (res) res.accounts = [...byCreator.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  return res;
};

const shopOverview: Detector = (rows) => {
  const h = findHeader(rows, ["ngày", "khách truy cập", "lượt nhấp vào sản phẩm", "gmv nhờ video của tài khoản kết nối"]);
  if (!h) return null;
  const map: [string, string][] = [
    ["clicks", "Lượt nhấp vào sản phẩm"],
    ["visitors", "Khách truy cập"],
    ["gmv_vself", "GMV nhờ video của tài khoản kết nối"],
    ["gmv_vaff", "GMV đến từ video liên kết"],
    ["gmv_lself", "GMV nhờ buổi LIVE của tài khoản kết nối"],
    ["gmv_laff", "GMV nhờ buổi LIVE của nhà sáng tạo"],
  ];
  const cDate = col(h.cols, "Ngày");
  const acc = new Acc();
  const days: string[] = [];
  for (const r of rows.slice(h.index + 1)) {
    const d = toDay(r[cDate]);
    if (!d) continue;
    days.push(d);
    for (const [metric, name] of map) {
      const i = col(h.cols, name);
      if (i >= 0) acc.add(d, d, metric, "", toNum(r[i]));
    }
  }
  return daily("shop_overview", acc, days, days.length);
};

const productCard: Detector = (rows) => {
  const h = findHeader(rows, ["thời gian", "gmv nhờ thẻ sản phẩm"], true);
  if (!h) return null;
  const cDate = col(h.cols, "Thời gian");
  const cGmv = col(h.cols, "GMV nhờ thẻ sản phẩm", true);
  const acc = new Acc();
  const days: string[] = [];
  for (const r of rows.slice(h.index + 1)) {
    const d = toDay(r[cDate]);
    if (!d) continue;
    days.push(d);
    acc.add(d, d, "gmv_card", "", toNum(r[cGmv]));
  }
  return daily("product_card", acc, days, days.length);
};

const adsPgm: Detector = (rows) => {
  const h = findHeader(rows, ["tên chiến dịch", "id sản phẩm", "chi phí", "doanh thu gộp", "số lượt hiển thị quảng cáo sản phẩm"]);
  if (!h) return null;
  const map: [string, string][] = [
    ["pgm_cost", "Chi phí"],
    ["pgm_rev", "Doanh thu gộp"],
    ["pgm_orders", "Số lượng đơn hàng SKU"],
    ["pgm_clicks", "Số lượt nhấp vào quảng cáo sản phẩm"],
    ["pgm_impr", "Số lượt hiển thị quảng cáo sản phẩm"],
  ];
  const totals = new Map<string, number>();
  let n = 0;
  for (const r of rows.slice(h.index + 1)) {
    if (!r.some((v) => v !== null && v !== "")) continue;
    n++;
    for (const [metric, name] of map) {
      const v = toNum(r[col(h.cols, name)]);
      if (v !== null) totals.set(metric, (totals.get(metric) ?? 0) + v);
    }
  }
  if (!n) return null;
  // The range is set when the person confirms the period; placeholders until then.
  const facts = [...totals.entries()].map(([metric, value]) => ({ from: "", to: "", metric, dim: "", value }));
  return { kind: "ads_pgm", from: "", to: "", rows: n, facts, warnings: [], needsPeriod: true };
};

const adsLgm: Detector = (rows) => {
  const h = findHeader(rows, ["tên phiên live", "thời gian ra mắt", "chi phí", "doanh thu gộp", "số lượt xem phiên live"]);
  if (!h) return null;
  const map: [string, string][] = [
    ["lgm_cost", "Chi phí"],
    ["lgm_rev", "Doanh thu gộp"],
    ["lgm_orders", "Số lượng đơn hàng SKU"],
    ["lgm_views", "Số lượt xem phiên LIVE"],
  ];
  const cDate = col(h.cols, "Thời gian ra mắt");
  const acc = new Acc();
  const days: string[] = [];
  let n = 0;
  for (const r of rows.slice(h.index + 1)) {
    const d = toDay(r[cDate]);
    if (!d) continue;
    n++;
    days.push(d);
    for (const [metric, name] of map) acc.add(d, d, metric, "", toNum(r[col(h.cols, name)]));
  }
  return daily("ads_lgm", acc, days, n);
};

const live: Detector = (rows, ctx) => {
  const h = findHeader(rows, ["id nhà sáng tạo", "biệt danh", "thời gian bắt đầu", "gmv đến từ buổi live"], true);
  if (!h) return null;
  const cNick = col(h.cols, "Biệt danh");
  const cStart = col(h.cols, "Thời gian bắt đầu");
  const cGmv = col(h.cols, "GMV đến từ buổi LIVE", true);
  const cOrders = col(h.cols, "Đơn hàng đã tạo");
  const cDur = col(h.cols, "Thời lượng");
  const self = new Set(ctx.config.selfAccounts.map(strip));
  const nicks = new Set<string>();
  const parsed: { d: string; nick: string; r: Row }[] = [];
  for (const r of rows.slice(h.index + 1)) {
    const d = toDay(r[cStart]);
    if (!d) continue;
    const nick = strip(r[cNick]);
    nicks.add(nick);
    parsed.push({ d, nick, r });
  }
  if (!parsed.length) return null;
  const warnings: string[] = [];
  let isSelf: boolean;
  if (self.size) isSelf = [...nicks].every((x) => self.has(x));
  else {
    isSelf = nicks.size <= 2;
    warnings.push("self_guess");
  }
  const acc = new Acc();
  const kind: FileKind = isSelf ? "live_self" : "live_aff";
  const p = isSelf ? "lself" : "laff";
  for (const { d, r } of parsed) {
    acc.add(d, d, `${p}_gmv`, "", toNum(r[cGmv]));
    acc.add(d, d, `${p}_orders`, "", toNum(r[cOrders]));
    acc.add(d, d, `${p}_sessions`, "", 1);
    if (isSelf) acc.add(d, d, "lself_hours_file", "", toHours(r[cDur]));
  }
  const res = daily(kind, acc, parsed.map((x) => x.d), parsed.length, warnings);
  if (res && isSelf) res.accounts = [...nicks];
  return res;
};

const video: Detector = (rows) => {
  const h = findHeader(rows, ["tên nhà sáng tạo", "id video", "thời gian"]);
  if (!h) return null;
  const isAff = col(h.cols, "Quốc gia của nhà sáng tạo") >= 0;
  const cName = col(h.cols, "Tên nhà sáng tạo");
  const cTime = col(h.cols, "Thời gian");
  const acc = new Acc();
  const days: string[] = [];
  const names = new Set<string>();
  for (const r of rows.slice(h.index + 1)) {
    const d = toDay(r[cTime]);
    if (!d) continue;
    days.push(d);
    if (!isAff) names.add(strip(r[cName]));
    acc.add(d, d, isAff ? "vaff_posted" : "vself_posted", isAff ? "" : strip(r[cName]), 1);
  }
  const res = daily(isAff ? "video_aff" : "video_self", acc, days, days.length);
  if (res && !isAff) res.accounts = [...names];
  return res;
};

const income: Detector = (rows) => {
  const labelOf = (r: Row) => strip(r.find((v) => typeof v === "string" && v.trim()) ?? "");
  const valueOf = (r: Row) => {
    for (let i = r.length - 1; i >= 0; i--) {
      const n = toNum(r[i]);
      if (n !== null) return n;
    }
    return null;
  };
  const periodRow = rows.find((r) => labelOf(r) === "khoảng thời gian");
  if (!periodRow || !rows.some((r) => labelOf(r) === "hoa hồng liên kết")) return null;
  const text = periodRow.map(String).join(" ");
  const m = text.match(/(\d{4})[/-](\d{2})[/-](\d{2})\s*-\s*(\d{4})[/-](\d{2})[/-](\d{2})/);
  const from = m ? iso(+m[1], +m[2], +m[3]) : "";
  const to = m ? iso(+m[4], +m[5], +m[6]) : "";
  // Same four lines as the Kuties sheet (E35): -(F27 + F33 + F30 + F31).
  const LINES = [
    "hoa hồng liên kết",
    "hoa hồng của đối tác liên kết",
    "hoa hồng liên kết quảng cáo cửa hàng",
    "hoa hồng của quảng cáo cửa hàng liên kết trước thuế tncn",
  ];
  let sum = 0;
  const found: string[] = [];
  for (const r of rows) {
    const l = labelOf(r);
    if (LINES.includes(l) && !found.includes(l)) {
      found.push(l);
      sum += valueOf(r) ?? 0;
    }
  }
  const warnings = found.length < LINES.length ? ["income_lines"] : [];
  return {
    kind: "income",
    from,
    to,
    rows: found.length,
    facts: [{ from, to, metric: "aff_cost", dim: "", value: -sum }],
    warnings,
    needsPeriod: !m,
  };
};

const booking: Detector = (rows, ctx) => {
  const h = findHeader(rows, ["mã booking", "id kênh", "ngày air/live real", "kl"]);
  if (!h) return null;
  const c = (n: string) => col(h.cols, n);
  const [cCh, cDate, cProd, cKl, cCost, cStore] = [c("id kênh"), c("Ngày air/live real"), c("Sản phẩm"), c("KL"), c("Chi phí thanh toán Booking"), c("Store")];
  const store = strip(ctx.storeName);
  const acc = new Acc();
  const days: string[] = [];
  let other = 0;
  let huge = 0;
  for (const r of rows.slice(h.index + 1)) {
    if (cStore >= 0 && strip(r[cStore]) !== store) {
      if (r[cStore]) other++;
      continue;
    }
    const d = toDay(r[cDate]);
    if (!d) continue;
    days.push(d);
    const dim = `${strip(r[cCh])}|${strip(r[cKl])}|${strip(r[cProd]).slice(0, 80)}`;
    const cost = toNum(r[cCost]) ?? 0;
    // Kept as entered (never corrected silently) but flagged for a check in the Base.
    if (cost > 1e9) huge++;
    acc.add(d, d, "bk_count", dim, 1);
    acc.add(d, d, "bk_cost", dim, cost);
  }
  const warnings = [...(other ? ["other_store_rows"] : []), ...(huge ? [`huge_cost:${huge}`] : [])];
  const res = daily("booking", acc, days, days.length, warnings);
  return res ?? { kind: "booking", from: "", to: "", rows: 0, facts: [], warnings: ["no_store_rows"], needsPeriod: false };
};

const liveAcceptance: Detector = (rows, ctx) => {
  const h = findHeader(rows, ["id phiên live", "ngày live", "store", "tổng thu brand"]);
  if (!h) return null;
  const c = (n: string) => col(h.cols, n);
  const [cDate, cStore, cCost, cHours] = [c("Ngày live"), c("Store"), c("Tổng thu Brand"), c("Tổng giờ live nghiệm thu")];
  const store = strip(ctx.storeName);
  const acc = new Acc();
  const days: string[] = [];
  for (const r of rows.slice(h.index + 1)) {
    if (strip(r[cStore]) !== store) continue;
    const d = toDay(r[cDate]);
    if (!d) continue;
    days.push(d);
    acc.add(d, d, "lself_cost", "", toNum(r[cCost]));
    acc.add(d, d, "lself_hours_acc", "", toNum(r[cHours]));
  }
  return daily("live_acceptance", acc, days, days.length) ??
    { kind: "live_acceptance", from: "", to: "", rows: 0, facts: [], warnings: ["no_store_rows"], needsPeriod: false };
};

const DETECTORS: Detector[] = [orders, shopOverview, productCard, adsPgm, adsLgm, live, video, income, booking, liveAcceptance];

export async function parseFile(file: File, ctx: Ctx): Promise<ParsedFile[]> {
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true, dense: true });
  const out: ParsedFile[] = [];
  for (const sheet of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheet], { header: 1, raw: true, defval: null, blankrows: false });
    for (const detect of DETECTORS) {
      const res = detect(rows, ctx);
      if (res) {
        out.push({ fileName: file.name, sheet, ...res });
        break;
      }
    }
  }
  return out;
}
