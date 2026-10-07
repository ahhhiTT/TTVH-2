# Report tool translations

`public/reports/*.html` are the Director's original report tools (Vietnamese).
`public/reports/en/*.html` are generated English copies. Never edit the
generated files by hand.

    python3 scripts/report-i18n/apply.py <name>   # e.g. sp_shopee

`extract.py` lists every Vietnamese string token (HTML text, attributes, JS
strings and template chunks; regexes and comments are never touched).
`en/<name>.json` gives an English translation per token id, or keeps the token.

Kept on purpose (data-matching, must stay Vietnamese): column names and aliases
used to read marketplace exports, sheet names, status values from the data,
province keys, combo keywords. Display strings that code compares with `===`
are translated identically on both sides.

If an original file changes, token ids shift: rerun `extract.py`, review the
diff and update the JSON before regenerating.
