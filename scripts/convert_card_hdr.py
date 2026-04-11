#!/usr/bin/env python3
"""
L4/L5 a11y fix: Convert <div class="card-hdr" onclick="..."> to <button class="card-hdr" type="button" ...>
in avgift/index.html and selskap/index.html.

Uses BeautifulSoup to IDENTIFY targets (safe parsing of nested HTML),
then performs surgical text replacement on the original file to preserve
formatting exactly. This avoids the regex-only regression from 2026-04-10
(which destroyed 83 cards) and also avoids BS4 full-file reserialization.

CSS infrastructure (button.card-hdr reset) is already in shared/style.css:750.
"""
from pathlib import Path
from bs4 import BeautifulSoup

REPO = Path(__file__).resolve().parent.parent
TARGETS = [
    REPO / "avgift" / "index.html",
    REPO / "selskap" / "index.html",
]


def find_matching_close(text: str, open_end: int, open_tag: str = "div") -> int:
    """Given position right after an opening tag, return the start position of
    the matching closing tag, handling nested open/close pairs.
    """
    depth = 1
    pos = open_end
    open_needle = f"<{open_tag}"
    close_needle = f"</{open_tag}>"
    while depth > 0:
        next_open = text.find(open_needle, pos)
        next_close = text.find(close_needle, pos)
        if next_close == -1:
            raise ValueError(f"No matching </{open_tag}> found starting at {open_end}")
        # Only count a following <div that is actually a tag (next char is space/>/newline)
        if next_open != -1 and next_open < next_close:
            following = text[next_open + len(open_needle) : next_open + len(open_needle) + 1]
            if following in (" ", ">", "\t", "\n", "/"):
                depth += 1
                pos = next_open + len(open_needle)
                continue
            else:
                # Not a real tag (e.g. <divider>) — skip past it
                pos = next_open + len(open_needle)
                continue
        depth -= 1
        if depth == 0:
            return next_close
        pos = next_close + len(close_needle)
    raise ValueError("unreachable")


def convert_file(path: Path) -> int:
    """Convert card-hdr divs to buttons in place. Returns count converted."""
    text = path.read_text(encoding="utf-8")
    soup = BeautifulSoup(text, "html.parser")

    # Find all targets to confirm count and ensure we only touch div.card-hdr[onclick]
    targets = soup.select('div.card-hdr[onclick]')
    expected = len(targets)
    if expected == 0:
        return 0

    # Scan the raw text for each opening tag position, convert opening+matching close
    # We find openings by looking for `<div` followed by attributes containing class="card-hdr"
    # and onclick=. To be safe, we iterate all `<div ` positions and check via regex-ish matching.
    import re
    open_re = re.compile(r'<div\b[^>]*\bclass="card-hdr"[^>]*\bonclick="[^"]*"[^>]*>')
    # Build replacements as (start, end, new_open_text, close_start)
    replacements = []
    for m in open_re.finditer(text):
        open_start = m.start()
        open_end = m.end()
        open_tag = m.group(0)
        # Build button version: swap <div for <button type="button" (insert type before existing attrs)
        new_open = '<button type="button"' + open_tag[len('<div'):]
        # Find matching </div>
        close_start = find_matching_close(text, open_end, "div")
        close_end = close_start + len("</div>")
        replacements.append((open_start, open_end, new_open, close_start, close_end))

    if len(replacements) != expected:
        raise RuntimeError(
            f"Mismatch: BS4 found {expected} div.card-hdr[onclick], "
            f"regex scanner found {len(replacements)}"
        )

    # Apply from end to start to preserve positions
    new_text = text
    for open_start, open_end, new_open, close_start, close_end in reversed(replacements):
        # Replace close first, then open (since close is later in text)
        new_text = new_text[:close_start] + "</button>" + new_text[close_end:]
        new_text = new_text[:open_start] + new_open + new_text[open_end:]

    path.write_text(new_text, encoding="utf-8")
    return expected


def main():
    total = 0
    for target in TARGETS:
        if not target.exists():
            print(f"SKIP {target} (not found)")
            continue
        n = convert_file(target)
        print(f"OK   {target.relative_to(REPO)}: converted {n} card-hdr div -> button")
        total += n
    print(f"TOTAL {total} conversions")


if __name__ == "__main__":
    main()
