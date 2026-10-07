#!/usr/bin/env python3
"""Build the English copy of a report tool.

Usage: apply.py <name>   (reads public/reports/<name>.html and
                          scripts/report-i18n/en/<name>.json,
                          writes public/reports/en/<name>.html)

Translation JSON:
  {"text": {"<exact vietnamese token>": "<english>", ...},
   "ids": {"<token id>": "<english>", ...},                # overrides text
   "keep": ["<token kept verbatim everywhere>", ...],     # data-matching strings
   "keep_ids": [12, 40, ...],                              # keep only these occurrences
   "raw": [["old", "new"], ...]}                           # exact replacements, must match

Every Vietnamese token must be either translated or explicitly kept, so
nothing is skipped silently. JS blocks are syntax-checked with node after
replacement. The source file is never modified.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
from extract import LIB_MIN, extract  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def js_check(html):
    for i, m in enumerate(re.finditer(r"<script\b([^>]*)>(.*?)</script>", html, re.S)):
        attrs, body = m.group(1), m.group(2)
        if "src=" in attrs or len(body) >= LIB_MIN or not body.strip():
            continue
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write(body)
        r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
        os.unlink(f.name)
        if r.returncode != 0:
            raise SystemExit(f"JS syntax error in script #{i}:\n{r.stderr[:2000]}")


def main(name):
    src_path = os.path.join(ROOT, "public", "reports", f"{name}.html")
    tr_path = os.path.join(ROOT, "scripts", "report-i18n", "en", f"{name}.json")
    out_path = os.path.join(ROOT, "public", "reports", "en", f"{name}.html")
    src = open(src_path, encoding="utf-8").read()
    tr = json.load(open(tr_path, encoding="utf-8"))
    text_map = tr.get("text", {})
    id_map = tr.get("ids", {})  # per-occurrence translations, keyed by token id
    keep = set(tr.get("keep", []))
    keep_ids = set(tr.get("keep_ids", []))

    tokens = extract(src)
    missing = []
    out = src
    for t in reversed(tokens):
        if t["id"] in keep_ids or t["text"] in keep:
            continue
        en = id_map.get(str(t["id"]), text_map.get(t["text"]))
        if en is None:
            missing.append(t)
            continue
        # Translations are raw source text (escapes such as \n are kept as
        # written); only unescaped delimiters are escaped.
        if t["kind"] == "js-str":
            q = src[t["start"] - 1]
            en = re.sub(r"(?<!\\)" + re.escape(q), lambda _: "\\" + q, en)
        elif t["kind"] == "js-tpl":
            en = re.sub(r"(?<!\\)`", lambda _: "\\`", en).replace("${", "\\${")
        elif t["kind"] == "attr":
            en = en.replace('"', "&quot;")
        out = out[: t["start"]] + en + out[t["end"] :]

    if missing:
        for t in missing:
            print(f"MISSING {t['id']}|{t['kind']}|{t['text'][:120]!r}")
        raise SystemExit(f"{len(missing)} untranslated tokens; add them to text or keep.")

    # Exact raw replacements for UI text the token scan cannot see (e.g. Vietnamese
    # words without diacritics). Each must match at least once.
    for old, new in tr.get("raw", []):
        n = out.count(old)
        if n == 0:
            raise SystemExit(f"raw replacement not found: {old!r}")
        out = out.replace(old, new)

    out = re.sub(r'<html([^>]*)\blang="vi"', r'<html\1lang="en"', out, count=1)
    js_check(out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    open(out_path, "w", encoding="utf-8").write(out)
    print(f"wrote {out_path} ({len(tokens)} tokens, {len(keep_ids) + sum(1 for t in tokens if t['text'] in keep)} kept)")


if __name__ == "__main__":
    main(sys.argv[1])
