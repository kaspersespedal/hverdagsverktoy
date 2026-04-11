#!/usr/bin/env python3
"""
V9 batch 2 a11y fix (Mønster #2): Convert remaining div→button for:
  1. <div class="card-hdr" onclick=...> in boliglan + personlig (20 total)
     — these were skipped in 77c1acc (which only processed avgift + selskap)
  2. <div class="priv-back" onclick=...> in all 7 pages (14 total)
     — fully untouched by 77c1acc; audit cited on boliglan+personlig
     but the same issue exists on the other 5 pages.

Uses same approach as convert_card_hdr.py (BS4 identify + surgical text
replacement to preserve formatting exactly, avoid the 2026-04-10 regex
regression and full-file reserialization drift).

CSS infra (button.card-hdr / button.priv-back reset) already exists in
shared/style.css:750-751. Idempotent — if no targets found, file is not
touched.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import re

REPO = Path(__file__).resolve().parent.parent

# All 7 pages for priv-back sweep; card-hdr is scoped by BS4 selector per file.
TARGETS = [
    REPO / "index.html",
    REPO / "skatt" / "index.html",
    REPO / "kalkulator" / "index.html",
    REPO / "boliglan" / "index.html",
    REPO / "avgift" / "index.html",
    REPO / "personlig" / "index.html",
    REPO / "selskap" / "index.html",
]


def find_matching_close(text: str, open_end: int, open_tag: str = "div") -> int:
    """Return start position of the matching closing </div> (handles nesting)."""
    depth = 1
    pos = open_end
    open_needle = f"<{open_tag}"
    close_needle = f"</{open_tag}>"
    while depth > 0:
        next_open = text.find(open_needle, pos)
        next_close = text.find(close_needle, pos)
        if next_close == -1:
            raise ValueError(f"No matching </{open_tag}> found starting at {open_end}")
        if next_open != -1 and next_open < next_close:
            following = text[next_open + len(open_needle) : next_open + len(open_needle) + 1]
            if following in (" ", ">", "\t", "\n", "/"):
                depth += 1
                pos = next_open + len(open_needle)
                continue
            else:
                pos = next_open + len(open_needle)
                continue
        depth -= 1
        if depth == 0:
            return next_close
        pos = next_close + len(close_needle)
    raise ValueError("unreachable")


def convert_class_divs(text: str, class_name: str) -> tuple[str, int]:
    """Convert <div class="CLASS" ... onclick="..."> ... </div> to
    <button type="button" class="CLASS" ... onclick="..."> ... </button>.
    Returns (new_text, count_converted).
    """
    soup = BeautifulSoup(text, "html.parser")
    expected = len(soup.select(f'div.{class_name}[onclick]'))
    if expected == 0:
        return text, 0

    pat = re.compile(
        r'<div\b[^>]*\bclass="' + re.escape(class_name) + r'"[^>]*\bonclick="[^"]*"[^>]*>'
    )

    replacements = []
    for m in pat.finditer(text):
        open_start = m.start()
        open_end = m.end()
        open_tag = m.group(0)
        new_open = '<button type="button"' + open_tag[len('<div'):]
        close_start = find_matching_close(text, open_end, "div")
        close_end = close_start + len("</div>")
        replacements.append((open_start, open_end, new_open, close_start, close_end))

    if len(replacements) != expected:
        raise RuntimeError(
            f"Mismatch on {class_name}: BS4 {expected}, regex {len(replacements)}"
        )

    new_text = text
    for open_start, open_end, new_open, close_start, close_end in reversed(replacements):
        new_text = new_text[:close_start] + "</button>" + new_text[close_end:]
        new_text = new_text[:open_start] + new_open + new_text[open_end:]

    return new_text, expected


def main():
    totals = {"card-hdr": 0, "priv-back": 0}
    for target in TARGETS:
        if not target.exists():
            print(f"SKIP {target} (not found)")
            continue
        text = target.read_text(encoding="utf-8")
        text, n_hdr = convert_class_divs(text, "card-hdr")
        text, n_back = convert_class_divs(text, "priv-back")
        if n_hdr + n_back > 0:
            target.write_text(text, encoding="utf-8")
            print(f"OK   {target.relative_to(REPO)}: {n_hdr} card-hdr + {n_back} priv-back")
        else:
            print(f"NOOP {target.relative_to(REPO)}: nothing to convert")
        totals["card-hdr"] += n_hdr
        totals["priv-back"] += n_back
    print(f"TOTAL: {totals['card-hdr']} card-hdr + {totals['priv-back']} priv-back")


if __name__ == "__main__":
    main()
