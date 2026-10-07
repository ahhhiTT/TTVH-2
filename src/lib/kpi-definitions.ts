// Registry of every KPI the app shows. Nothing here is confirmed yet: each
// entry stays "tbd" until the Director signs off the definition, data source
// and roll-up rule. Do not flip a status without that confirmation.

export type DefinitionStatus = "confirmed" | "tbd";

export interface KpiDefinition {
  key: string;
  name: string;
  // Formula the app currently uses for sample data. Shown so it can be checked.
  workingFormula: string;
  rollUp: string;
  source: string | null; // null = Not configured
  status: DefinitionStatus;
}

export const KPI_DEFINITIONS: KpiDefinition[] = [
  { key: "gmv", name: "GMV", workingFormula: "Raw input", rollUp: "Sum", source: null, status: "tbd" },
  { key: "nmv", name: "NMV", workingFormula: "Raw input", rollUp: "Sum", source: null, status: "tbd" },
  { key: "orders", name: "Orders", workingFormula: "Raw input", rollUp: "Sum", source: null, status: "tbd" },
  { key: "traffic", name: "Traffic", workingFormula: "Raw input", rollUp: "Sum", source: null, status: "tbd" },
  { key: "adSpend", name: "Ads spend", workingFormula: "Raw input", rollUp: "Sum", source: null, status: "tbd" },
  { key: "gmvTarget", name: "GMV target", workingFormula: "Raw input", rollUp: "Sum", source: null, status: "tbd" },
  {
    key: "achievement",
    name: "% đạt",
    workingFormula: "GMV / GMV target",
    rollUp: "Sum(GMV) / Sum(target), stores with a target only",
    source: null,
    status: "tbd",
  },
  {
    key: "pace",
    name: "Tiến độ",
    workingFormula: "% đạt / % số ngày đã qua trong tháng",
    rollUp: "Same as % đạt",
    source: null,
    status: "tbd",
  },
  {
    key: "cr",
    name: "CR",
    workingFormula: "Orders / Traffic",
    rollUp: "Sum(Orders) / Sum(Traffic), stores with traffic only",
    source: null,
    status: "tbd",
  },
  {
    key: "aov",
    name: "AOV",
    workingFormula: "GMV / Orders",
    rollUp: "Sum(GMV) / Sum(Orders)",
    source: null,
    status: "tbd",
  },
  {
    key: "roi",
    name: "ROI",
    workingFormula: "GMV / Ads spend",
    rollUp: "Sum(GMV) / Sum(Ads spend), stores with Ads data only",
    source: null,
    status: "tbd",
  },
  {
    key: "weightedGmv",
    name: "GMV theo workload",
    workingFormula: "GMV gian hàng × % workload",
    rollUp: "Sum per person",
    source: null,
    status: "tbd",
  },
  {
    key: "paceThresholds",
    name: "Ngưỡng trạng thái tiến độ",
    workingFormula: "Từ 100%: đúng tiến độ. Từ 85% đến dưới 100%: cần theo dõi. Dưới 85%: chậm tiến độ",
    rollUp: "n/a",
    source: null,
    status: "tbd",
  },
];

export const kpiDefinition = (key: string) => KPI_DEFINITIONS.find((d) => d.key === key);
