#!/usr/bin/env python3
"""Extract Vietnamese text tokens from a report tool HTML file.

Tokens are: HTML text nodes, attribute values, JS string literals and the
static parts of JS template literals, inside <script> blocks that are not the
inlined SheetJS library. Comments and regex literals are never tokens, so
matching logic that lives in regexes is never touched.

Usage: extract.py <file.html>  -> prints JSON list of tokens
Each token: {id, kind, start, end, text, ctx}
"""
import json
import re
import sys

VN = re.compile(
    r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
    r"ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]"
)
LIB_MIN = 300_000  # script blocks this large are the inlined xlsx library

REGEX_PREV = set("(,=:[!&|?{};+-*%<>~^")
REGEX_KW = ("return", "typeof", "case", "do", "else", "in", "of", "void", "yield", "await")


def js_tokens(src, base):
    """Yield (kind, start, end) for string literals / template chunks in JS."""
    i, n = 0, len(src)
    last_sig = ""  # last significant char or keyword, for regex detection
    tpl_stack = []  # brace depth at which each open template's ${ started
    depth = 0

    def word_before(pos):
        m = re.search(r"([A-Za-z_$][\w$]*)\s*$", src[:pos])
        return m.group(1) if m else ""

    while i < n:
        c = src[i]
        if c in " \t\r\n":
            i += 1
            continue
        if src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == "\\":
                    j += 1
                elif src[j] == "\n":
                    break
                j += 1
            yield ("js-str", base + i + 1, base + j)
            i = j + 1
            last_sig = "a"
            continue
        if c == "`" or (c == "}" and tpl_stack and tpl_stack[-1] == depth):
            if c == "}":
                tpl_stack.pop()
            j = i + 1
            start = j
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "`":
                    yield ("js-tpl", base + start, base + j)
                    j += 1
                    break
                if src.startswith("${", j):
                    yield ("js-tpl", base + start, base + j)
                    tpl_stack.append(depth)
                    j += 2
                    break
                j += 1
            i = j
            last_sig = "a"
            continue
        if c == "/":
            kw = word_before(i)
            if last_sig in REGEX_PREV or last_sig == "" or kw in REGEX_KW:
                # regex literal: skip it entirely (never a token)
                j = i + 1
                in_class = False
                while j < n:
                    if src[j] == "\\":
                        j += 2
                        continue
                    if src[j] == "[":
                        in_class = True
                    elif src[j] == "]":
                        in_class = False
                    elif src[j] == "/" and not in_class:
                        break
                    elif src[j] == "\n":
                        break
                    j += 1
                j += 1
                while j < n and src[j].isalpha():
                    j += 1
                i = j
                last_sig = "a"
                continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        if re.match(r"[\w$]", c):
            m = re.match(r"[\w$]+", src[i:])
            w = m.group(0)
            i += len(w)
            last_sig = "(" if w in REGEX_KW else "a"
            continue
        last_sig = c if c not in ")]" else "a"
        i += 1


def html_tokens(s):
    """Yield (kind, start, end) for text nodes and attribute values outside script/style."""
    for m in re.finditer(r"<(script|style)\b[^>]*>.*?</\1>|<!--.*?-->|<[^>]+>|[^<]+", s, re.S):
        chunk = m.group(0)
        if chunk.startswith("<script") or chunk.startswith("<style") or chunk.startswith("<!--"):
            continue
        if chunk.startswith("<"):
            for a in re.finditer(r'\s([\w:-]+)\s*=\s*"([^"]*)"', chunk):
                if a.group(1) in ("title", "placeholder", "alt", "aria-label", "data-tip", "value", "content"):
                    yield ("attr", m.start() + a.start(2), m.start() + a.end(2))
            continue
        yield ("html-text", m.start(), m.end())


def extract(s):
    toks = []
    for k, a, b in html_tokens(s):
        toks.append((k, a, b))
    for m in re.finditer(r"<script\b[^>]*>(.*?)</script>", s, re.S):
        body = m.group(1)
        if len(body) >= LIB_MIN or not body.strip():
            continue
        toks.extend(js_tokens(body, m.start(1)))
    out = []
    for k, a, b in sorted(toks, key=lambda t: t[1]):
        text = s[a:b]
        if not VN.search(text):
            continue
        ctx = s[max(0, a - 90):a].replace("\n", " ")
        out.append({"id": len(out), "kind": k, "start": a, "end": b, "text": text, "ctx": ctx})
    return out


if __name__ == "__main__":
    src = open(sys.argv[1], encoding="utf-8").read()
    print(json.dumps(extract(src), ensure_ascii=False, indent=0))
