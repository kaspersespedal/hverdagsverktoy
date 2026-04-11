"""
Fix V10 Mønster #2 rest + Mønster #4 hover-wrap.

Mønster #2 (a11y div→button):
- 13× .cm-opt i kalkulator/index.html → button.cm-opt
- 1× #cc-swap i kalkulator/index.html → button#cc-swap
- Total: 14 elementer

Mønster #4 (hover-wrap):
- 7 :hover-regler med transform/box-shadow som mangler @media(hover:hover)
- Unwrapped: line 29, 90-93, 249-252, 413-417, 544, 560, 700
- Fix: wrap hver regel i @media(hover:hover) { ... }

Også: legg til button.cm-opt,button#cc-swap i eksisterende CSS reset
(line 750: button.card-hdr,button.priv-back{...}).

Idempotent: skip hvis allerede konvertert.
"""
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parent.parent
KALKULATOR_HTML = ROOT / "kalkulator" / "index.html"
STYLE_CSS = ROOT / "shared" / "style.css"


def fix_kalkulator_html():
    """Mønster #2: convert 13 div.cm-opt + 1 div#cc-swap to buttons.

    Surgical string-replace (IKKE BS4 serialization — den reformaterer hele filen
    og ødelegger meta-tags, attribute order, osv). Bruker line-based replacement
    på eksakte strings.

    Hver cm-opt er 3 linjer:
      <div class="cm-opt[ cm-active]?" onclick="..." id="cm-X" style="...">
        <span ...></span> <span id="lbl-X">Label</span>
      </div>

    Vi finner <div class="cm-opt"...> linjen og den matchende </div> (2 linjer ned)
    og bytter tag-navnet.
    """
    content = KALKULATOR_HTML.read_text(encoding="utf-8")
    original = content
    changes = 0

    # Match pattern: <div class="cm-opt[ extra]" onclick="..." id="cm-X" style="...">
    # Replace opener with <button type="button" class="cm-opt..." onclick="..." id="cm-X" style="...">
    # The closing </div> is the one 2 lines below the opener — match surgically by
    # finding the specific block each cm-opt creates.
    # Safer: use a regex that matches the entire cm-opt div block (3 lines) by anchoring
    # on the unique combination of class="cm-opt..." + id="cm-X"

    # Find all cm-opt openers and their closing </div>
    # Pattern: div class="cm-opt" or class="cm-opt cm-active"
    cm_opt_pattern = re.compile(
        r'<div(\s+class="cm-opt(?:\s+cm-active)?"[^>]*?)>'
    )

    lines = content.splitlines(keepends=True)
    new_lines = list(lines)
    cm_count = 0
    # Walk lines and for each opener, find matching </div> 2 lines below
    i = 0
    while i < len(new_lines):
        m = cm_opt_pattern.search(new_lines[i])
        if m:
            # Convert opener
            new_lines[i] = new_lines[i].replace(
                "<div" + m.group(1) + ">",
                '<button type="button"' + m.group(1) + ">",
                1,
            )
            # Find closing </div> — should be 2 lines below (one content line, one </div>)
            if i + 2 < len(new_lines) and "</div>" in new_lines[i + 2]:
                new_lines[i + 2] = new_lines[i + 2].replace("</div>", "</button>", 1)
                cm_count += 1
                i += 3
                continue
            else:
                print(f"WARN: cm-opt at line {i+1} has unexpected structure")
        i += 1

    content = "".join(new_lines)
    changes += cm_count

    # #cc-swap: single-line self-closing block
    # <div id="cc-swap" onclick="ccSwap()" style="...">⇅ Bytt</div>
    # → <button type="button" id="cc-swap" onclick="ccSwap()" style="...">⇅ Bytt</button>
    cc_pattern = re.compile(
        r'<div(\s+id="cc-swap"[^>]*?)>(.*?)</div>'
    )
    m = cc_pattern.search(content)
    if m:
        new_block = '<button type="button"' + m.group(1) + ">" + m.group(2) + "</button>"
        content = content.replace(m.group(0), new_block, 1)
        changes += 1

    if content == original:
        print("kalkulator/index.html: NOOP")
        return 0

    KALKULATOR_HTML.write_text(content, encoding="utf-8")
    print(f"kalkulator/index.html: {cm_count} cm-opt + 1 cc-swap = {changes} konverteringer")
    return changes


def fix_hover_wrap_in_css():
    """Mønster #4: wrap 7 :hover-regler i @media(hover:hover)."""
    content = STYLE_CSS.read_text(encoding="utf-8")
    original = content
    changes = 0

    # Wrap helper: replace old_block with @media(hover:hover){old_block}
    def wrap(old_block):
        return "@media(hover:hover){" + old_block + "}"

    # 1. Line 29 — single-line bw btn-calc
    old = '[data-theme="bw"] .btn-calc:hover{background:#111;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.12);}'
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    # 2. Lines 90-93 — multi-line pink btn-calc
    old = (
        '[data-theme="pink"] .btn-calc:hover{\n'
        '  background:linear-gradient(135deg,#b85a74,#c86882);\n'
        '  box-shadow:0 4px 16px rgba(184,90,116,.3);\n'
        '  transform:translateY(-2px);\n'
        "}"
    )
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    # 3. Lines 249-253 — multi-line hendrix btn-calc
    old = (
        '[data-theme="hendrix"] .btn-calc:hover {\n'
        "  background-position:100% 0;\n"
        "  box-shadow: 0 0 20px rgba(123,45,142,.3), 0 0 40px rgba(196,94,44,.15);\n"
        "  transform:translateY(-2px);\n"
        "}"
    )
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    # 4. Lines 413-417 — multi-line disco btn-calc
    old = (
        '[data-theme="disco"] .btn-calc:hover {\n'
        "  background-position:100% 0;\n"
        "  box-shadow: 0 0 20px rgba(233,30,140,.4), 0 0 40px rgba(123,47,247,.2);\n"
        "  transform:translateY(-2px);\n"
        "}"
    )
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    # 5. Line 544 — single-line frost btn-calc
    old = '[data-theme="frost"] .btn-calc:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(79,95,229,.35);}'
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    # 6. Line 560 — single-line frost dash-ref-card
    old = '[data-theme="frost"] .dash-ref-card:hover{box-shadow:0 4px 20px rgba(79,95,229,.1);}'
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    # 7. Line 700 — single-line focus-card-btn
    old = ".focus-card-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent);transform:scale(1.1);}"
    if old in content and wrap(old) not in content:
        content = content.replace(old, wrap(old), 1)
        changes += 1

    if content == original:
        print(f"style.css: NOOP (hover-wraps)")
    else:
        STYLE_CSS.write_text(content, encoding="utf-8")
        print(f"style.css: {changes} hover-wraps + ")

    return changes


def add_button_cm_opt_reset():
    """Legg til button.cm-opt i eksisterende button.card-hdr CSS reset."""
    content = STYLE_CSS.read_text(encoding="utf-8")
    old = "button.card-hdr,button.priv-back{font:inherit;color:inherit;background:transparent;border:0;text-align:left;width:100%;cursor:pointer;}"
    new = "button.card-hdr,button.priv-back,button.cm-opt,button#cc-swap{font:inherit;color:inherit;background:transparent;border:0;text-align:left;width:100%;cursor:pointer;}"
    if new in content:
        return 0  # already done
    if old not in content:
        print("WARN: button.card-hdr reset not found, button.cm-opt reset NOT added")
        return 0
    content = content.replace(old, new, 1)
    # Also add focus-visible
    old_fv = "button.card-hdr:focus-visible,button.priv-back:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}"
    new_fv = "button.card-hdr:focus-visible,button.priv-back:focus-visible,button.cm-opt:focus-visible,button#cc-swap:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}"
    if new_fv not in content and old_fv in content:
        content = content.replace(old_fv, new_fv, 1)
    STYLE_CSS.write_text(content, encoding="utf-8")
    print(f"style.css: button.cm-opt + button#cc-swap CSS reset lagt til")
    return 1


def main():
    print("V10 Mønster #2 + #4 fix")
    print("=" * 50)
    html_changes = fix_kalkulator_html()
    css_hover_changes = fix_hover_wrap_in_css()
    css_reset_changes = add_button_cm_opt_reset()
    print("=" * 50)
    print(f"HTML a11y-konverteringer: {html_changes}")
    print(f"CSS hover-wraps: {css_hover_changes}")
    print(f"CSS button reset: {css_reset_changes}")


if __name__ == "__main__":
    main()
