"""
Fix V10 Mønster #1 batch 3 — stale satser i 9 ikke-norske lang-filer + NO KS-korrigering.

Basert på research-rapport: research/2026-04-11_research_v10-moenster1-batch3.md
Verifisert mot primærkilder (Skatteetaten, Lovdata, Brønnøysund, Stortingsvedtak 2025-12).

Fire klynger:
  A) skatt H1 — searchDs.{bsu, egenkapital, trygdeavgift} i 9 lang
  B) skatt H3 — searchDs.trinnskatt + search.js desc
  C) selskap H1 — reg.gebyr i 9 lang + NO KS-fix (3 steder)
  D) avgift H2 — salAgaRows fribeløp i 9 lang

Idempotent: skip hvis allerede oppdatert.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANG_DIR = ROOT / "shared" / "lang"
NINE_LANGS = ["ar", "en", "fr", "lt", "pl", "so", "ti", "uk", "zh"]


def load(path):
    return path.read_text(encoding="utf-8")


def save(path, content):
    path.write_text(content, encoding="utf-8")


def report(label, before, after, path):
    if before == after:
        return 0
    # Count replacements (rough estimate via len diff or pattern count — here by re.subn counter passed in)
    print(f"  [{label}] {path.name}: CHANGED")
    return 1


def fix_searchDs_values(content):
    """
    Klynge A + B: replace stale values INSIDE the searchDs block only.
    This avoids touching the same pattern elsewhere (e.g. AGA sone 7,9 %).
    """
    # Find the searchDs block bounds
    m = re.search(r"(searchDs:\s*\{)(.*?)(\}\s*\};?\s*$)", content, re.DOTALL | re.MULTILINE)
    if not m:
        # Try alternative ending
        m = re.search(r"(searchDs:\s*\{)(.*?)(\n\s*\})", content, re.DOTALL)
        if not m:
            return content, 0

    before_block = content[: m.start(2)]
    block = m.group(2)
    after_block = content[m.end(2) :]

    original_block = block

    # Klynge A — BSU 20% → 10%
    # Match "bsu:'...20%..." and replace 20% with 10% within the VALUE
    def fix_bsu(m):
        val = m.group(1)
        new_val = val.replace("20%", "10%")
        return f"bsu:'{new_val}'"

    block = re.sub(r"bsu:'((?:\\.|[^'])*?)'", fix_bsu, block)

    # Klynge A — egenkapital (15%) → (10%)
    def fix_egenkap(m):
        val = m.group(1)
        new_val = val.replace("(15%)", "(10%)")
        return f"egenkapital:'{new_val}'"

    block = re.sub(r"egenkapital:'((?:\\.|[^'])*?)'", fix_egenkap, block)

    # Klynge A — trygdeavgift 7.9%/7,9% → 7.6%/7,6%
    def fix_trygd(m):
        val = m.group(1)
        new_val = val.replace("7.9%", "7.6%").replace("7,9%", "7,6%")
        return f"trygdeavgift:'{new_val}'"

    block = re.sub(r"trygdeavgift:'((?:\\.|[^'])*?)'", fix_trygd, block)

    # Klynge B — trinnskatt "4 X" → "5 X" (per språk)
    # Mapping av eksakte bindestreks-separerte terminologier
    trinn_replacements = [
        ("4 brackets", "5 brackets"),     # en
        ("4 tranches", "5 tranches"),     # fr
        ("4 شرائح", "5 شرائح"),           # ar
        ("4 pakopos", "5 pakopos"),       # lt
        ("4 progi", "5 progów"),          # pl (genitive plural for 5+)
        ("4 heer", "5 heer"),             # so
        ("4 ደረጃታት", "5 ደረጃታት"),          # ti
        ("4 щаблі", "5 щаблів"),          # uk (genitive plural for 5+)
        ("4个档次", "5个档次"),            # zh
    ]

    def fix_trinn(m):
        val = m.group(1)
        for old, new in trinn_replacements:
            if old in val:
                val = val.replace(old, new)
                break
        return f"trinnskatt:'{val}'"

    block = re.sub(r"trinnskatt:'((?:\\.|[^'])*?)'", fix_trinn, block)

    if block == original_block:
        return content, 0

    return before_block + block + after_block, 1


def fix_reg_gebyr(content):
    """Klynge C: replace 2,250 / 2 250 stale reg.gebyr with 3,883 / 3 883."""
    # Count replacements
    n1 = content.count("2,250 kr")
    n2 = content.count("2 250 kr")
    n3 = content.count("2,250 كرونة")

    content = content.replace("2,250 kr", "3,883 kr")
    content = content.replace("2 250 kr", "3 883 kr")
    content = content.replace("2,250 كرونة", "3,883 كرونة")

    return content, n1 + n2 + n3


def extract_array_bounds(content, key):
    """Finn `key: [...]` og returner (start, end) indekser som inneholder hele array-strukturen.

    Bruker bracket-counting og string-aware skip for å håndtere nestede arrays og
    escaped quotes i strenger.
    """
    idx = content.find(f"{key}:")
    if idx < 0:
        return None
    open_idx = content.find("[", idx)
    if open_idx < 0:
        return None
    depth = 1
    i = open_idx + 1
    while i < len(content) and depth > 0:
        c = content[i]
        if c == "'":
            # Skip string content
            i += 1
            while i < len(content):
                if content[i] == "\\" and i + 1 < len(content):
                    i += 2
                    continue
                if content[i] == "'":
                    i += 1
                    break
                i += 1
            continue
        if c == '"':
            i += 1
            while i < len(content):
                if content[i] == "\\" and i + 1 < len(content):
                    i += 2
                    continue
                if content[i] == '"':
                    i += 1
                    break
                i += 1
            continue
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return (open_idx, i + 1)
        i += 1
    return None


def fix_aga_fribelop(content):
    """Klynge D: salAgaRows fribeløp 500,000 → 850,000.

    KRITISK: "500,000" og "500 000" finnes i mange kontekster (NPV-eksempel,
    LVU-eksempel, salDeprRows saldo-eksempel, lvuInfoText). Bruk bracket-bounded
    parsing for å bare treffe salAgaRows.

    Kinesisk bruker 50万克朗 (50 × 10 000 = 500 000) — håndteres spesifikt.
    """
    bounds = extract_array_bounds(content, "salAgaRows")
    if not bounds:
        return content, 0
    start, end = bounds
    block = content[start:end]
    original = block
    # Western format variants
    block = block.replace("500,000 kr", "850,000 kr")
    block = block.replace("500 000 kr", "850 000 kr")
    block = block.replace("500,000", "850,000")  # fallback for comma-no-kr context
    block = block.replace("500 000", "850 000")  # fallback for space-no-kr context
    # Chinese format: 50万克朗 (50 × 10,000 = 500,000 kroner)
    block = block.replace("50万克朗", "85万克朗")
    if block == original:
        return content, 0
    return content[:start] + block + content[end:], 1


def extract_key_block_bounds(content, key, next_key_prefixes):
    """Finn start:end indekser for `key:` helt til neste top-level key.

    Siden selskapKsBody er en string-konkateneringskjede med `+`, kan vi ikke
    enkelt finne slutten via string-literals. Bruk i stedet "start av neste key"
    som terminator.
    """
    idx = content.find(f"{key}:")
    if idx < 0:
        return None
    # Søk etter neste key etter vår key, for hver kandidat
    end = len(content)
    for prefix in next_key_prefixes:
        next_idx = content.find(prefix, idx + len(key) + 1)
        if 0 < next_idx < end:
            end = next_idx
    return (idx, end)


def fix_no_ks_regressjon(no_path):
    """NO-spesifikk: 3 steder der KS har feil 6 825 kr (skal være 3 883 kr).

    V10 Mønster #1 korrigering: V10-audit klassifiserte feilaktig KS som
    "begrenset ansvar" og dermed 6 825 kr. Lovdata FOR-2015-12-11-1668 § 5
    viser at kun AS/ASA faller i 6 825-kategorien. KS (komplementær har
    ubegrenset ansvar) er i 3 883-kategorien sammen med ANS/DA/SA/NUF.
    """
    content = load(no_path)
    original = content
    changes = 0

    # Fix 1: selskapKsBody — block-scoped replace (unngå å ramme selskapAsBody)
    ks_bounds = extract_key_block_bounds(
        content,
        "selskapKsBody",
        ["selskapCompareTitle", "selskapCompareBody", "selskapRegTitle", "selskapRegBody"],
    )
    if ks_bounds:
        ks_start, ks_end = ks_bounds
        ks_block = content[ks_start:ks_end]
        old = 'Registreringsgebyr</span><span style="font-weight:700;color:var(--ink);">6 825 kr'
        new = 'Registreringsgebyr</span><span style="font-weight:700;color:var(--ink);">3 883 kr'
        if old in ks_block:
            new_block = ks_block.replace(old, new, 1)
            content = content[:ks_start] + new_block + content[ks_end:]
            changes += 1

    # Fix 2: selskapCompareBody last column (KS column) — unique 3-element pattern
    cmp_old = "3 883 kr</td><td>6 825 kr</td></tr>"
    cmp_new = "3 883 kr</td><td>3 883 kr</td></tr>"
    if cmp_old in content:
        content = content.replace(cmp_old, cmp_new, 1)
        changes += 1

    # Fix 3: selskapRegBody text — unique combined pattern
    reg_old = "ANS/DA: 3 883 kr, KS: 6 825 kr"
    reg_new = "ANS/DA/KS: 3 883 kr"
    if reg_old in content:
        content = content.replace(reg_old, reg_new, 1)
        changes += 1

    return content, changes, original != content


def fix_search_js_trinnskatt(search_path):
    """Klynge B: search.js:64 desc '4 trinn' → '5 trinn'."""
    content = load(search_path)
    original = content
    content = content.replace(
        "'Progressiv skatt som øker med inntekten — 4 trinn'",
        "'Progressiv skatt som øker med inntekten — 5 trinn'",
        1
    )
    return content, original != content


def main():
    print("V10 Mønster #1 batch 3 — fix stale satser")
    print("=" * 50)

    total_changes = 0
    files_changed = 0

    # 9 ikke-norske lang-filer
    for lang in NINE_LANGS:
        path = LANG_DIR / f"{lang}.js"
        if not path.exists():
            print(f"MISSING: {path}")
            continue

        content = load(path)
        original = content

        # Klynge A + B — searchDs block
        content, a_changed = fix_searchDs_values(content)

        # Klynge C — reg.gebyr (global, 2,250/2 250 → 3,883/3 883)
        content, c_count = fix_reg_gebyr(content)

        # Klynge D — salAgaRows fribeløp
        content, d_changed = fix_aga_fribelop(content)

        if content != original:
            save(path, content)
            files_changed += 1
            flags = []
            if a_changed:
                flags.append("A+B")
            if c_count:
                flags.append(f"C({c_count})")
            if d_changed:
                flags.append("D")
            print(f"  {lang}.js: {' '.join(flags)}")

    # NO-spesifikk fix: KS-regressjon i 3 steder
    no_path = LANG_DIR / "no.js"
    if no_path.exists():
        new_content, ks_changes, ks_changed = fix_no_ks_regressjon(no_path)
        if ks_changed:
            save(no_path, new_content)
            files_changed += 1
            print(f"  no.js: C-NO-KS ({ks_changes} steder)")

    # search.js trinnskatt desc
    search_path = ROOT / "shared" / "search.js"
    if search_path.exists():
        new_content, s_changed = fix_search_js_trinnskatt(search_path)
        if s_changed:
            save(search_path, new_content)
            files_changed += 1
            print(f"  search.js: B (trinnskatt desc)")

    print("=" * 50)
    print(f"Filer endret: {files_changed}")


if __name__ == "__main__":
    main()
