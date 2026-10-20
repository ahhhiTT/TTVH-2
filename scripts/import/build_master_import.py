"""Build SQL that loads real master data (people, teams, brands, stores, assignments).

    python3 scripts/import/build_master_import.py <HR file.xlsx> <Operation tracking.xlsx> <out.sql>

Reads ONLY the columns the system needs. HR file: ID, name, work status, position, level,
company email, team, department, line manager, start date, official leave date, personal email.
ID numbers, bank accounts, addresses, birth dates, contracts, family data are never read.
Operation tracking: store, StoreID, brand, platform, model, customer code, Growth team,
Growth PIC / Support, Account PIC, Content PIC. Plan figures are not read.

Decisions (Director, 2026-10-20): skip Mai Thị Thảo (outside the centre); Nguyễn Thị Xuân is
teamlead; workload stays TBD (null); only master data, no monthly plan.
"""
import re
import sys
import unicodedata
from datetime import date, datetime

import openpyxl
from openpyxl.utils import column_index_from_string as C

HR, OPS, OUT = sys.argv[1:4]
SKIP = {"Mai Thị Thảo"}
TEAMLEADS = {"Nguyễn Thị Xuân"}
TODAY = date.today().isoformat()

nfc = lambda v: unicodedata.normalize("NFC", str(v)).strip() if v is not None else None


def q(v):
    if v is None or v == "":
        return "null"
    if isinstance(v, (datetime, date)):
        v = v.strftime("%Y-%m-%d")
    return "'" + str(v).replace("'", "''") + "'"


def slug(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def rows_of(path):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = [r for r in ws.iter_rows(values_only=True) if any(v is not None for v in r)]
    return rows[0], rows[1:]


TEAM_ID = {"Growth 3": "g3", "Growth 6": "g6"}

# ---------------------------------------------------------------- people
_, hr = rows_of(HR)
get = lambda r, c: r[C(c) - 1] if C(c) - 1 < len(r) else None
people = []
for r in hr:
    name = nfc(get(r, "B"))
    if not name:
        continue
    people.append({
        "id": nfc(get(r, "A")),
        "name": name,
        "active": nfc(get(r, "C")) == "Đang làm việc",
        "title": nfc(get(r, "G")),
        "level": nfc(get(r, "I")),
        "email": (nfc(get(r, "J")) or "").lower() or None,
        "team": TEAM_ID.get(nfc(get(r, "K"))),
        "department": nfc(get(r, "L")),
        "manager": nfc(get(r, "M")),
        "start": get(r, "N"),
        "left": get(r, "AM"),
        "personal": (nfc(get(r, "S")) or "").lower() or None,
    })
by_name = {p["name"]: p for p in people}
director = next(p for p in people if p["title"] and p["title"].startswith("Director"))

# ---------------------------------------------------------------- stores
_, ops = rows_of(OPS)
stores, brands, assign, extra = [], {}, [], {}
PLATFORM = {"Shopee": "shopee", "TikTok": "tiktok", "Lazada": "lazada", "Website": "website"}
for r in ops:
    sid = get(r, "E")
    if sid is None:
        continue
    brand = nfc(get(r, "CB"))
    bid = slug(brand)
    brands[bid] = brand
    st = {
        "id": f"st{int(sid)}",
        "brand": bid,
        "name": nfc(get(r, "AI")),
        "platform": PLATFORM[nfc(get(r, "BZ"))],
        "team": TEAM_ID.get(nfc(get(r, "AL"))),
        "external": str(int(sid)),
        "customer": nfc(get(r, "AJ")),
        "model": nfc(get(r, "AM")),
        "account": nfc(get(r, "BH")),
        "content": nfc(get(r, "CQ")),
    }
    stores.append(st)
    pic = nfc(get(r, "BL"))
    support = [nfc(x) for x in str(get(r, "BM") or "").split(",") if nfc(x)]
    for name, primary in [(pic, True)] + [(s, False) for s in support]:
        if not name or name in SKIP:
            continue
        if name not in by_name:
            # In the centre but missing from the HR file: create with name only (no email yet).
            pid = "tmp-" + slug(name)
            extra[name] = {"id": pid, "name": name}
            by_name[name] = {"id": pid, "name": name, "active": True}
        assign.append((by_name[name]["id"], st["id"], primary))

# one row per person+store; a person both PIC and Support keeps PIC
seen = {}
for pid, sid, primary in assign:
    seen[(pid, sid)] = seen.get((pid, sid), False) or primary

# ---------------------------------------------------------------- SQL
out = ["begin;",
       "-- remove sample data (fictional)",
       "delete from daily_metrics where source = 'sample';",
       "delete from monthly_targets;",
       "delete from store_assignments;",
       "delete from stores;",
       "delete from brands;",
       "update teams set lead_id = null, manager_id = null;",
       "delete from audit_log;",
       "delete from people where email like '%@example.com';",
       "delete from teams;",
       "-- teams",
       "insert into teams (id, name) values ('g3', 'Growth 3'), ('g6', 'Growth 6');"]
for p in people:
    role = "director" if p is director else ("teamlead" if p["name"] in TEAMLEADS else "staff")
    archived = "null" if p["active"] else q(p["left"] or TODAY)
    out.append(
        "insert into people (id, employee_code, name, email, personal_email, role, title, department, level, team_id, start_date, permissions, granted_store_ids, archived_at) values "
        f"({q(p['id'])}, {q(p['id'])}, {q(p['name'])}, {q(p['email'])}, {q(p['personal'])}, '{role}', {q(p['title'])}, {q(p['department'])}, {q(p['level'])}, "
        f"{q(None if p is director else p['team'])}, {q(p['start'])}, '{{}}', '{{}}', {archived});"
    )
for e in extra.values():
    out.append(f"insert into people (id, name, role, permissions, granted_store_ids) values ({q(e['id'])}, {q(e['name'])}, 'staff', '{{}}', '{{}}');")
for p in people:
    m = by_name.get(p["manager"])
    if m and m["id"] != p["id"]:
        out.append(f"update people set manager_id = {q(m['id'])} where id = {q(p['id'])};")
for e in extra.values():
    out.append(f"update people set manager_id = {q(director['id'])} where id = {q(e['id'])};")
out.append(f"update teams set manager_id = {q(director['id'])};")
for bid, name in sorted(brands.items()):
    out.append(f"insert into brands (id, name) values ({q(bid)}, {q(name)});")
for s in stores:
    out.append(
        "insert into stores (id, brand_id, name, platform, status, team_id, external_id, customer_code, service_model, account_pic, content_pic) values "
        f"({q(s['id'])}, {q(s['brand'])}, {q(s['name'])}, '{s['platform']}', 'active', {q(s['team'])}, {q(s['external'])}, {q(s['customer'])}, {q(s['model'])}, {q(s['account'])}, {q(s['content'])});"
    )
for (pid, sid), primary in seen.items():
    out.append(f"insert into store_assignments (person_id, store_id, workload_pct, is_primary, valid_from) values ({q(pid)}, {q(sid)}, null, {str(primary).lower()}, {q(TODAY)});")
out.append("commit;")
open(OUT, "w", encoding="utf-8").write("\n".join(out) + "\n")

active = [p for p in people if p["active"]]
print(f"people {len(people)} (active {len(active)}, archived {len(people) - len(active)}), extra {sorted(extra)}")
print(f"brands {len(brands)}, stores {len(stores)}, assignments {len(seen)} (PIC {sum(seen.values())})")
print("teamleads found:", [n for n in TEAMLEADS if n in by_name and by_name[n].get('active')])
left_assigned = sorted({p['name'] for p in people if not p['active'] for (pid, _), _x in seen.items() if pid == p['id']})
print("assigned but left:", left_assigned)
no_email = [p["name"] for p in active if not p["email"] and not p["personal"]]
print("active without any email:", no_email)
print("director:", director["name"], "| managers:", sorted({p['manager'] for p in people}))
