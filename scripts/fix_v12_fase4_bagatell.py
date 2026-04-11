#!/usr/bin/env python3
"""
V12 Fase 4 bagatellgrense fix: § 9-2 -> § 9-5 tredje ledd i adjBagatell for alle 10 lang-filer.
Research_v1 verifiserte at bagatellgrensen er i Mval. § 9-5 tredje ledd, ikke § 9-2.
"""
from pathlib import Path

REPO = Path(r"C:\Users\Kaspe\OneDrive\Skrivebord\Cowork OS\Web Projects Hobby")
LANG_DIR = REPO / "shared" / "lang"
LANG_CODES = ["no", "en", "ar", "zh", "fr", "pl", "uk", "lt", "so", "ti"]

for lang in LANG_CODES:
    path = LANG_DIR / f"{lang}.js"
    text = path.read_text(encoding="utf-8")
    # Simple replace: (§ 9-2) -> (§ 9-5 tredje ledd) only within adjBagatell line
    lines = text.split("\n")
    changed = False
    for i, line in enumerate(lines):
        if "adjBagatell:" in line and "(§ 9-2)" in line:
            lines[i] = line.replace("(§ 9-2)", "(§ 9-5 tredje ledd)")
            changed = True
    if changed:
        path.write_text("\n".join(lines), encoding="utf-8")
        print(f"  [OK] {lang}.js updated")
    else:
        print(f"  [--] {lang}.js unchanged (already fixed or not found)")

print("\nDone.")
