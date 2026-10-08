import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_META } from "@/components/module-meta";
import { Badge, buttonPrimary, buttonSecondary, Card, cx, EmptyState, Notice, PageHeader, td, th } from "@/components/ui";
import { endAssignment, saveEntity, setArchived } from "@/lib/admin-actions";
import { ENTITIES, ENTITY_KEYS, type EntityKey, type FieldSpec, type OptionSource, STATIC_OPTIONS } from "@/lib/admin-schema";
import { type Data, getData, readAudit } from "@/lib/data/dataset";
import { supabase, writesEnabled } from "@/lib/db/supabase";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { canOpen } from "@/lib/rbac";
import { getI18n, requireUser } from "@/lib/session";

type Tab = EntityKey | "audit";
type Row = Record<string, unknown> & { id: string | number; archived_at: string | null };

// Rows in database column naming, so the schema drives display and forms.
function rowsOf(d: Data, entity: EntityKey): Row[] {
  switch (entity) {
    case "brands":
      return d.brands.map((b) => ({ id: b.id, name: b.name, category: b.category, archived_at: b.archivedAt }));
    case "stores":
      return d.stores.map((s) => ({
        id: s.id,
        name: s.name,
        brand_id: s.brandId,
        platform: s.channel,
        scale: s.scale,
        difficulty: s.difficulty,
        status: s.status,
        archived_at: s.archivedAt,
      }));
    case "people":
      return d.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        title: u.title,
        department: u.department,
        level: u.level,
        team_id: u.teamId,
        manager_id: u.managerId,
        permissions: u.permissions,
        granted_store_ids: u.grantedStoreIds,
        archived_at: u.archivedAt,
      }));
    case "teams":
      return d.teams.map((t) => ({ id: t.id, name: t.name, lead_id: t.leadId, manager_id: t.managerId, archived_at: t.archivedAt }));
    case "assignments":
      return d.assignments.map((a) => ({
        id: a.id,
        person_id: a.userId,
        store_id: a.storeId,
        workload_pct: a.workloadPct,
        is_primary: a.isPrimary,
        valid_from: a.validFrom,
        valid_to: a.validTo,
        archived_at: a.archivedAt,
      }));
  }
}

function optionsFor(d: Data, t: Dictionary, source: OptionSource): { value: string; label: string }[] {
  const fixed = STATIC_OPTIONS[source];
  if (fixed) {
    const label = (v: string) =>
      source === "platforms"
        ? t.channel[v as keyof typeof t.channel]
        : source === "storeStatus"
          ? t.storeStatus[v as keyof typeof t.storeStatus]
          : source === "roles"
            ? t.roles[v as keyof typeof t.roles]
            : source === "permissions"
              ? t.admin.permissionNames[v as keyof typeof t.admin.permissionNames]
              : v;
    return fixed.map((v) => ({ value: v, label: label(v) }));
  }
  const list =
    source === "brands" ? d.listBrands() : source === "teams" ? d.listTeams() : source === "people" ? d.listUsers() : d.listStores();
  return list.map((x) => ({ value: x.id, label: `${x.name} (${x.id})` }));
}

function labelOf(t: Dictionary, f: FieldSpec) {
  const a = t.admin as Record<string, unknown>;
  const c = t.common as Record<string, unknown>;
  return String(a[f.label] ?? c[f.label] ?? f.label);
}

function display(d: Data, t: Dictionary, f: FieldSpec, v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (f.type === "checkbox") return v ? labelOf(t, f) : "-";
  if (f.type === "multi") {
    const values = v as string[];
    if (!values.length) return "-";
    if (f.options === "permissions") return values.map((x) => t.admin.permissionNames[x as "peers:view"] ?? x).join(", ");
    return values.join(", ");
  }
  const s = String(v);
  switch (f.options) {
    case "brands":
      return d.getBrand(s)?.name ?? s;
    case "people":
      return d.getUser(s)?.name ?? s;
    case "teams":
      return d.getTeam(s)?.name ?? s;
    case "stores":
      return d.getStore(s)?.name ?? s;
    case "platforms":
      return t.channel[s as "shopee"] ?? s;
    case "storeStatus":
      return t.storeStatus[s as "active"] ?? s;
    case "roles":
      return t.roles[s as "staff"] ?? s;
  }
  return s;
}

const input =
  "h-10 w-full rounded-xl border border-hairline-strong bg-canvas px-3 text-sm text-ink outline-none focus:border-ink disabled:opacity-60";

function FieldInput({ d, t, f, value, mode }: { d: Data; t: Dictionary; f: FieldSpec; value: unknown; mode: "create" | "update" }) {
  const locked = mode === "update" && f.createOnly;
  const label = labelOf(t, f);
  const common = { name: f.column, id: `f-${f.column}`, disabled: locked, required: f.required && !locked };
  let control;
  if (f.type === "checkbox") {
    control = <input type="checkbox" {...common} defaultChecked={Boolean(value)} className="size-4 accent-[var(--ink)]" />;
  } else if (f.type === "multi") {
    const selected = new Set((value as string[] | undefined) ?? []);
    control = (
      <div className="max-h-44 overflow-y-auto rounded-xl border border-hairline-strong p-2">
        {optionsFor(d, t, f.options!).map((o) => (
          <label key={o.value} className="flex items-center gap-2 px-1 py-0.5 text-[13px] text-ink">
            <input type="checkbox" name={f.column} value={o.value} defaultChecked={selected.has(o.value)} disabled={locked} />
            {o.label}
          </label>
        ))}
      </div>
    );
  } else if (f.type === "select") {
    control = (
      <select {...common} defaultValue={value === null || value === undefined ? "" : String(value)} className={input}>
        {!f.required && <option value="">-</option>}
        {optionsFor(d, t, f.options!).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...common}
        type={f.type}
        min={f.min}
        max={f.max}
        step={f.type === "number" ? "any" : undefined}
        defaultValue={value === null || value === undefined ? "" : String(value)}
        className={input}
      />
    );
  }
  return (
    <div className={cx(f.type === "multi" && "sm:col-span-2")}>
      <label htmlFor={`f-${f.column}`} className="mb-1 block text-[13px] font-medium text-body">
        {label}
        {f.required && !locked && " *"}
      </label>
      {control}
    </div>
  );
}

export default async function MasterDataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!canOpen(user, "settings")) notFound();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : null);
  const tab = ([...ENTITY_KEYS, "audit"] as Tab[]).includes(one("tab") as Tab) ? (one("tab") as Tab) : "brands";
  const [d, { locale, t }] = await Promise.all([getData(), getI18n()]);
  const a = t.admin;
  const canWrite = writesEnabled();
  const showArchived = one("archived") === "1";
  const editId = one("edit");
  const err = one("err");
  const ok = one("ok");

  const tabHref = (k: Tab, extra: Record<string, string> = {}) =>
    `/settings/data?${new URLSearchParams({ tab: k, ...extra })}`;

  let body;
  if (tab === "audit") {
    const entries = await readAudit();
    body = (
      <Card index={2} padded={false}>
        {entries.length === 0 ? (
          <EmptyState>{supabase() ? a.noAudit : a.readOnlySeed}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  <th className={th}>{a.when}</th>
                  <th className={th}>{a.actor}</th>
                  <th className={th}>{a.action}</th>
                  <th className={th}>{a.entity}</th>
                  <th className={th}>{a.changes}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {entries.map((e) => {
                  const keys = [...new Set([...Object.keys(e.before ?? {}), ...Object.keys(e.after ?? {})])].filter(
                    (k) => k !== "created_at" && JSON.stringify(e.before?.[k]) !== JSON.stringify(e.after?.[k]),
                  );
                  return (
                    <tr key={e.id} className="align-top">
                      <td className={`${td} tabular whitespace-nowrap`}>
                        {new Date(e.at).toLocaleString(locale === "vi" ? "vi-VN" : "en-US")}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{e.actorId ? (d.getUser(e.actorId)?.name ?? e.actorId) : "-"}</td>
                      <td className={td}>{a.actions[e.action]}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {a.tabs[e.entity as EntityKey] ?? e.entity} {e.entityId}
                      </td>
                      <td className={`${td} min-w-64 text-[12.5px] text-body`}>
                        {keys.map((k) => (
                          <div key={k}>
                            <span className="font-medium text-ink">{k}</span>: {JSON.stringify(e.before?.[k] ?? null)} {"->"}{" "}
                            {JSON.stringify(e.after?.[k] ?? null)}
                          </div>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  } else {
    const spec = ENTITIES[tab];
    const all = rowsOf(d, tab);
    const rows = all.filter((r) => showArchived || r.archived_at === null);
    const editing = editId === "new" ? null : all.find((r) => String(r.id) === editId) ?? null;
    const mode = editId === "new" ? "create" : editing ? "update" : null;
    const listed = spec.fields.filter((f) => f.type !== "multi");
    const today = new Date().toISOString().slice(0, 10);
    const totals =
      tab === "assignments"
        ? Map.groupBy(
            d.activeAssignments().map((x) => x),
            (x) => x.userId,
          )
        : null;

    body = (
      <div className="space-y-4">
        {mode && canWrite && (
          <Card index={2} title={mode === "create" ? a.add : `${a.edit}: ${String(editing?.name ?? editing?.id)}`}>
            <form action={saveEntity} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="entity" value={tab} />
              <input type="hidden" name="mode" value={mode} />
              {mode === "update" && <input type="hidden" name="id" value={String(editing!.id)} />}
              {spec.fields.map((f) => (
                <FieldInput key={f.column} d={d} t={t} f={f} value={editing?.[f.column]} mode={mode} />
              ))}
              <div className="flex gap-2 sm:col-span-2">
                <button className={buttonPrimary}>{a.save}</button>
                <Link href={tabHref(tab)} className={buttonSecondary}>
                  {a.cancel}
                </Link>
              </div>
            </form>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={tabHref(tab, showArchived ? {} : { archived: "1" })}
            className="text-[13px] font-medium text-body hover:text-ink"
          >
            {showArchived ? a.hideArchived : a.showArchived}
          </Link>
          {canWrite && !mode && (
            <Link href={tabHref(tab, { edit: "new" })} className={buttonPrimary}>
              {a.add}
            </Link>
          )}
        </div>

        <Card index={3} padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-hairline">
                <tr>
                  {!spec.textId && <th className={th}>{a.id}</th>}
                  {listed.map((f) => (
                    <th key={f.column} className={th}>
                      {labelOf(t, f)}
                    </th>
                  ))}
                  {tab === "assignments" && <th className={`${th} text-right`}>{a.workloadTotal}</th>}
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {rows.map((r) => {
                  const archived = r.archived_at !== null;
                  const personTotal =
                    totals && typeof r.person_id === "string"
                      ? (totals.get(r.person_id) ?? []).reduce((acc, x) => acc + x.workloadPct, 0)
                      : null;
                  return (
                    <tr key={String(r.id)} className={cx(archived && "opacity-60", String(r.id) === ok && "bg-panel")}>
                      {!spec.textId && <td className={`${td} tabular text-muted`}>{String(r.id)}</td>}
                      {listed.map((f) => (
                        <td key={f.column} className={cx(td, "whitespace-nowrap", f.type === "number" && "tabular text-right")}>
                          {f.column === "valid_to" && r.valid_to === null ? (
                            <span className="text-muted">{a.open}</span>
                          ) : (
                            display(d, t, f, r[f.column])
                          )}
                        </td>
                      ))}
                      {tab === "assignments" && (
                        <td className={cx(td, "tabular text-right", personTotal !== null && personTotal > 100 && "font-semibold text-error")}>
                          {personTotal === null ? "-" : `${personTotal}%`}
                        </td>
                      )}
                      <td className={`${td} whitespace-nowrap text-right`}>
                        {archived && <Badge className="mr-2">{a.archived}</Badge>}
                        {canWrite && (
                          <span className="inline-flex items-center gap-1.5">
                            {!archived && (
                              <Link href={tabHref(tab, { edit: String(r.id) })} className="rounded-full px-2.5 py-1 text-[13px] font-medium text-ink hover:bg-panel">
                                {a.edit}
                              </Link>
                            )}
                            {tab === "assignments" && !archived && r.valid_to === null && String(r.valid_from) <= today && (
                              <form action={endAssignment}>
                                <input type="hidden" name="entity" value={tab} />
                                <input type="hidden" name="id" value={String(r.id)} />
                                <button className="rounded-full px-2.5 py-1 text-[13px] font-medium text-ink hover:bg-panel">{a.endToday}</button>
                              </form>
                            )}
                            <form action={setArchived}>
                              <input type="hidden" name="entity" value={tab} />
                              <input type="hidden" name="id" value={String(r.id)} />
                              <input type="hidden" name="archive" value={archived ? "0" : "1"} />
                              <button className="rounded-full px-2.5 py-1 text-[13px] font-medium text-body hover:bg-panel hover:text-ink">
                                {archived ? a.restore : a.archive}
                              </button>
                            </form>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        back={{ href: "/settings", label: t.common.back }}
        accent={MODULE_META.settings.accent}
        title={a.title}
        subtitle={a.subtitle}
        actions={<Badge>{d.source === "supabase" ? t.source.supabase : t.source.seed}</Badge>}
      />
      <div className="mb-4 space-y-2">
        {!supabase() ? <Notice tone="warning">{a.readOnlySeed}</Notice> : !canWrite && <Notice tone="warning">{a.readOnlyFlag}</Notice>}
        {canWrite && <Notice>{a.archiveNote}</Notice>}
        {err && (
          <Notice tone="warning">
            {err === "invalid" ? a.invalid : err === "exists" ? a.exists : err === "readonly" ? a.readOnlyFlag : a.error.replace("{msg}", err)}
          </Notice>
        )}
        {ok && !err && <Notice>{a.saved}</Notice>}
      </div>
      <nav className="mb-5 flex flex-wrap gap-1.5" aria-label={a.title}>
        {([...ENTITY_KEYS, "audit"] as Tab[]).map((k) => (
          <Link
            key={k}
            href={tabHref(k)}
            aria-current={k === tab ? "page" : undefined}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              k === tab ? "bg-primary text-on-primary" : "border border-hairline-strong text-ink hover:bg-canvas-soft",
            )}
          >
            {a.tabs[k]}
          </Link>
        ))}
      </nav>
      {body}
    </>
  );
}
