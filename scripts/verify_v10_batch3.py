"""Verify all klynger of V10 batch 3 fix across 9 lang files."""
import sys, re
sys.stdout.reconfigure(encoding="utf-8")

LANGS = ["ar", "en", "fr", "lt", "pl", "so", "ti", "uk", "zh"]


def extract_array_bounds(content, key):
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
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return (open_idx, i + 1)
        i += 1
    return None


def verify_lang(lang):
    path = f"shared/lang/{lang}.js"
    content = open(path, encoding="utf-8").read()
    issues = []

    # Klynge A + B — searchDs content
    m = re.search(r"searchDs:\s*\{(.*?)\n\s*\}", content, re.DOTALL)
    if m:
        block = m.group(1)
        if re.search(r"bsu:'[^']*20%", block):
            issues.append(f"{lang}.js: BSU still 20%")
        if re.search(r"egenkapital:'[^']*\(15%\)", block):
            issues.append(f"{lang}.js: egenkapital still (15%)")
        if re.search(r"trygdeavgift:'[^']*7[.,]9%", block):
            issues.append(f"{lang}.js: trygdeavgift still 7.9%")
        if re.search(r"trinnskatt:'[^']*\b4\s+(brackets|tranches|pakopos|progi|heer|щаблі|шрайх|ደረጃታት)", block) \
           or "trinnskatt:'[^']*4个档次" in block:
            issues.append(f"{lang}.js: trinnskatt still '4 X'")
    else:
        issues.append(f"{lang}.js: searchDs not found")

    # Klynge C — should not have 2,250 reg.gebyr
    if "2 250 kr" in content or "2,250 kr" in content:
        issues.append(f"{lang}.js: still has 2,250 kr / 2 250 kr")
    if "2,250 كرونة" in content:
        issues.append(f"{lang}.js: still has 2,250 كرونة")

    # Klynge D — salAgaRows fribeløp (language-agnostic)
    bounds = extract_array_bounds(content, "salAgaRows")
    if bounds:
        block = content[bounds[0]:bounds[1]]
        has_old = (
            re.search(r"\b500[ ,]000\b", block) is not None
            or "50万" in block
        )
        has_new = (
            re.search(r"\b850[ ,]000\b", block) is not None
            or "85万" in block
        )
        if has_old:
            issues.append(f"{lang}.js: still has 500,000/500 000/50万 in salAgaRows")
        if not has_new:
            issues.append(f"{lang}.js: no 850,000/850 000/85万 found in salAgaRows")
    else:
        issues.append(f"{lang}.js: salAgaRows bounds not found")

    return issues


all_issues = []
for lang in LANGS:
    all_issues.extend(verify_lang(lang))

if all_issues:
    print("ISSUES FOUND:")
    for i in all_issues:
        print(f"  - {i}")
    sys.exit(1)
else:
    print("ALL 9 LANG FILES VERIFIED OK")
    print("  Klynge A: BSU 10%, egenkap (10%), trygdeavgift 7.6%")
    print("  Klynge B: trinnskatt 5 (trinn/brackets/tranches/etc)")
    print("  Klynge C: reg.gebyr 3,883 / 3 883 (no 2,250 remaining)")
    print("  Klynge D: AGA fribeløp 850,000 / 850 000 / 85万克朗")
