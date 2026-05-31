#!/usr/bin/env python3
"""Add aurora-glow re-enable rules to the 27 inline-atmosphere pages.

These pages inline their full atmosphere CSS (no shared site-shell/calm-override),
have NO kill rule, but their inline `html,body{background:var(--bg)}` paints over
the fixed aurora. Fix: body transparent on dark-family themes + dark opacity boost.
Inserted right after the light-theme hide block so it sits with the atmosphere CSS.

Idempotent: skips files already carrying the GLOW-2026-05-31 marker.
CSS-in-<style> text insertion (not nested HTML) — safe to string-match.
"""
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# The uniform anchor: end of the light-theme hide block. Insert AFTER its closing brace.
ANCHOR = (
    'html:is([data-theme="frost"], [data-theme="glass"], [data-theme="hendrix"], '
    '[data-theme="bw"], [data-theme="pink"]) .film-grain{\n  display:none !important;\n}'
)

INSERT = """
/* GLOW-2026-05-31 — aurora visible on this inline-atmosphere page.
   The atmosphere CSS above renders, but inline html,body{background:var(--bg)}
   painted over the fixed layers. Make body transparent on dark-family themes so
   the aurora shows; light themes already hide it (block above) and keep --bg.
   Dark theme reads faint (cool blue on blue-black) — lift the opacity tokens. */
html:not(:is([data-theme="frost"],[data-theme="glass"],[data-theme="hendrix"],[data-theme="bw"],[data-theme="pink"])) body:not(.embed){background:transparent}
html[data-theme="dark"]{--atmo-band-a-op:.20;--atmo-band-a-op-breathe:.26;--atmo-band-b-op:.13;--atmo-band-b-op-breathe:.17}"""

MARKER = "GLOW-2026-05-31"

def main(paths):
    changed, skipped, missing = [], [], []
    for rel in paths:
        rel = rel.strip()
        if not rel:
            continue
        p = ROOT / rel
        txt = p.read_text(encoding="utf-8")
        if MARKER in txt:
            skipped.append(rel); continue
        if ANCHOR not in txt:
            missing.append(rel); continue
        # Insert once, right after the first anchor occurrence.
        new = txt.replace(ANCHOR, ANCHOR + INSERT, 1)
        if new == txt:
            missing.append(rel); continue
        p.write_text(new, encoding="utf-8")
        changed.append(rel)
    print(f"changed={len(changed)} skipped={len(skipped)} missing={len(missing)}")
    for m in missing:
        print("  MISSING-ANCHOR:", m)
    return 0 if not missing else 1

if __name__ == "__main__":
    paths = sys.stdin.read().splitlines()
    sys.exit(main(paths))
