#!/usr/bin/env python3
"""
V12 Fase 4 lang-file fixes (based on research_v1 findings).

Fix 1 — Boliglan H5 §-referanser:
  - morStressNote: "§ 4-4" → "§ 5" (verified via research_v1/boliglan-utlansforskriften)
  - morNoteMaxYears: omformuler — maks 30 år er IKKE lovfestet, men bankpraksis
    + Utlånsforskriften § 9 avdragskrav for belåningsgrad > 60 %.

Fix 2 — Selskap R-sel-2 stiftelseslov presisering:
  - selskapAndreBody: "100 000 kr grunnkapital" → presiseres med § 22 200 000 kr
    for næringsdrivende stiftelser.

Strategi: regex find+replace per språk, idempotent (skip hvis allerede fikset).
"""

import re
from pathlib import Path

REPO = Path(r"C:\Users\Kaspe\OneDrive\Skrivebord\Cowork OS\Web Projects Hobby")
LANG_DIR = REPO / "shared" / "lang"

# ─── Fix 1a: morStressNote § 4-4 → § 5 ─────────────────────────────
STRESS_NOTE = {
    "no": (
        "morStressNote:'Utlånsforskriften § 4-4: banken må sjekke at du tåler høyeste av 7 % og rente + 3 prosentpoeng.'",
        "morStressNote:'Utlånsforskriften § 5: banken må sjekke at du tåler høyeste av 7 % og rente + 3 prosentpoeng.'",
    ),
    "en": (
        "morStressNote:'Norwegian Lending Regulation § 4-4: banks must verify borrowers can handle the higher of 7% or rate + 3 pp.'",
        "morStressNote:'Norwegian Lending Regulation § 5: banks must verify borrowers can handle the higher of 7% or rate + 3 pp.'",
    ),
    "ar": (
        "§ 4-4",
        "§ 5",
    ),  # replace_all in morStressNote context
    "zh": (
        "morStressNote:'挪威贷款条例第4-4条：银行必须核实借款人能否承受7%与利率+3个百分点中的较高者。'",
        "morStressNote:'挪威贷款条例第5条：银行必须核实借款人能否承受7%与利率+3个百分点中的较高者。'",
    ),
    "fr": (
        "morStressNote:'Réglementation norvégienne § 4-4 : la banque doit vérifier que vous pouvez supporter le plus élevé entre 7 % et le taux + 3 points de pourcentage.'",
        "morStressNote:'Réglementation norvégienne § 5 : la banque doit vérifier que vous pouvez supporter le plus élevé entre 7 % et le taux + 3 points de pourcentage.'",
    ),
    "pl": (
        "morStressNote:'Norweskie przepisy § 4-4: bank musi sprawdzić, czy kredytobiorca poradzi sobie z wyższą z dwóch wartości — 7% lub oprocentowanie + 3 p.p.'",
        "morStressNote:'Norweskie przepisy § 5: bank musi sprawdzić, czy kredytobiorca poradzi sobie z wyższą z dwóch wartości — 7% lub oprocentowanie + 3 p.p.'",
    ),
    "uk": (
        "§ 4-4",
        "§ 5",
    ),
    "lt": (
        "morStressNote:'Norvegijos skolinimo reglamentas § 4-4: bankas privalo patikrinti, ar paskolos gavėjas atlaikys didesnę iš dviejų reikšmių — 7% arba palūkanas + 3 procentinius punktus.'",
        "morStressNote:'Norvegijos skolinimo reglamentas § 5: bankas privalo patikrinti, ar paskolos gavėjas atlaikys didesnę iš dviejų reikšmių — 7% arba palūkanas + 3 procentinius punktus.'",
    ),
    "so": (
        "morStressNote:'Xeerarka Deynta Norway § 4-4: bangigu waa inuu hubiyo in amaahiyuhu awoodi karo ta ugu badan 7% ama ribada + 3 dhibic boqolkiiba.'",
        "morStressNote:'Xeerarka Deynta Norway § 5: bangigu waa inuu hubiyo in amaahiyuhu awoodi karo ta ugu badan 7% ama ribada + 3 dhibic boqolkiiba.'",
    ),
    "ti": (
        "morStressNote:'ሕጊ ልቓሕ ኖርወይ § 4-4፦ ባንክ ተለቃሒ እቲ ካብ 7% ወይ ወለድ + 3 ሚእታዊ ነጥቢ ዝዓቢ ክኽእል ከረጋግጽ ኣለዎ።'",
        "morStressNote:'ሕጊ ልቓሕ ኖርወይ § 5፦ ባንክ ተለቃሒ እቲ ካብ 7% ወይ ወለድ + 3 ሚእታዊ ነጥቢ ዝዓቢ ክኽእል ከረጋግጽ ኣለዎ።'",
    ),
}

# ─── Fix 1b: morNoteMaxYears omformuler ────────────────────────────
# "Maks løpetid er 30 år (Utlånsforskriften § 4-5)" → "Maks løpetid 30 år (bankpraksis). Lån over 60 % belåningsgrad krever avdrag — Utlånsforskriften § 9."
MAX_YEARS = {
    "no": (
        "morNoteMaxYears:'Maks løpetid er 30 år (Utlånsforskriften § 4-5).'",
        "morNoteMaxYears:'Maks løpetid 30 år (bankpraksis). Lån over 60 % belåningsgrad krever avdrag — Utlånsforskriften § 9.'",
    ),
    "en": (
        "morNoteMaxYears:'Maximum term is 30 years (Norwegian Lending Regulation § 4-5).'",
        "morNoteMaxYears:'Maximum term 30 years (bank practice). Loans above 60 % LTV require amortisation — Norwegian Lending Regulation § 9.'",
    ),
    "zh": (
        "morNoteMaxYears:'最长期限为30年（挪威贷款条例第4-5条）。'",
        "morNoteMaxYears:'最长期限为30年（银行惯例）。贷款成数超过60%须分期偿还——挪威贷款条例第9条。'",
    ),
    "fr": (
        "morNoteMaxYears:'Durée maximale : 30 ans (Réglementation norvégienne § 4-5).'",
        "morNoteMaxYears:'Durée maximale 30 ans (pratique bancaire). Les prêts dépassant 60 % de quotité nécessitent un amortissement — Réglementation norvégienne § 9.'",
    ),
    "pl": (
        "morNoteMaxYears:'Maksymalny okres spłaty: 30 lat (norweskie przepisy § 4-5).'",
        "morNoteMaxYears:'Maksymalny okres spłaty 30 lat (praktyka bankowa). Kredyty powyżej 60 % LTV wymagają spłaty rat kapitałowych — norweskie przepisy § 9.'",
    ),
    "lt": (
        "morNoteMaxYears:'Ilgiausias terminas – 30 metų (Norvegijos skolinimo reglamentas § 4-5).'",
        "morNoteMaxYears:'Ilgiausias terminas 30 metų (bankų praktika). Paskoloms, viršijančioms 60 % LTV, reikalingas grąžinimas dalimis — Norvegijos skolinimo reglamentas § 9.'",
    ),
    "so": (
        "morNoteMaxYears:'Muddada ugu badan 30 sano (Xeerarka Deynta Norway § 4-5).'",
        "morNoteMaxYears:'Muddada ugu badan 30 sano (caadiga bangiga). Deymo ka badan 60% LTV waxay u baahan yihiin qaybyo la bixiyo — Xeerarka Deynta Norway § 9.'",
    ),
    "ti": (
        "morNoteMaxYears:'እቲ ዝበዝሐ ግዜ ልቓሕ 30 ዓመት እዩ (ሕጊ ልቓሕ ኖርወይ § 4-5)።'",
        "morNoteMaxYears:'እቲ ዝበዝሐ ግዜ ልቓሕ 30 ዓመት (ባንካዊ ኣሰራርሓ)። ልቓሓት ካብ 60 % LTV ንላዕሊ መኽፈሊ ክሳብ ይደሊ — ሕጊ ልቓሕ ኖርወይ § 9።'",
    ),
}

# ─── Fix 2: stiftelsesloven § 22 for næringsdrivende ───────────────
STIFTELSE = {
    "no": (
        "Krav: minst 100 000 kr grunnkapital. Regulert av stiftelsesloven (LOV-2001-06-15-59).",
        "Krav: minst 100 000 kr grunnkapital (200 000 kr for næringsdrivende stiftelser, jf. stiftelsesloven § 22). Regulert av stiftelsesloven (LOV-2001-06-15-59).",
    ),
    "en": (
        "Requirement: minimum capital of NOK 100,000",
        "Requirement: minimum capital of NOK 100,000 (NOK 200,000 for commercial foundations, per Foundation Act § 22)",
    ),
}

LANG_CODES = ["no", "en", "ar", "zh", "fr", "pl", "uk", "lt", "so", "ti"]


def fix_file(lang_code: str) -> dict:
    """Apply all applicable fixes for a lang file. Returns dict of {fix_name: status}."""
    path = LANG_DIR / f"{lang_code}.js"
    if not path.exists():
        return {"error": "file not found"}

    text = path.read_text(encoding="utf-8")
    original = text
    results = {}

    # Fix 1a: morStressNote § 4-4 → § 5
    if lang_code in STRESS_NOTE:
        old, new = STRESS_NOTE[lang_code]
        if old in text:
            text = text.replace(old, new)
            results["stress_note"] = "updated"
        elif new in text:
            results["stress_note"] = "already fixed"
        elif lang_code in ("ar", "uk"):
            # For ar/uk we do contextual replace inside morStressNote line only
            # Pattern: find the line containing morStressNote and replace § 4-4 → § 5 within it
            match = re.search(r"(morStressNote:'[^']*?)§ 4-4([^']*?')", text)
            if match:
                text = text[:match.start()] + match.group(1) + "§ 5" + match.group(2) + text[match.end():]
                results["stress_note"] = "updated (contextual)"
            elif "§ 5" in (re.search(r"morStressNote:'[^']*?'", text) or type("X", (), {"group": lambda: ""})).group():
                results["stress_note"] = "already fixed"
            else:
                results["stress_note"] = "NOT FOUND"
        else:
            results["stress_note"] = "NOT FOUND"

    # Fix 1b: morNoteMaxYears omformuler
    if lang_code in MAX_YEARS:
        old, new = MAX_YEARS[lang_code]
        if old in text:
            text = text.replace(old, new)
            results["max_years"] = "updated"
        elif new in text:
            results["max_years"] = "already fixed"
        else:
            results["max_years"] = "NOT FOUND"

    # Fix 2: stiftelsesloven § 22
    if lang_code in STIFTELSE:
        old, new = STIFTELSE[lang_code]
        if old in text:
            text = text.replace(old, new)
            results["stiftelse"] = "updated"
        elif "§ 22" in text and "200 000" in text:
            results["stiftelse"] = "already fixed"
        else:
            results["stiftelse"] = "NOT FOUND (manual needed)"

    if text != original:
        path.write_text(text, encoding="utf-8")
        results["_saved"] = True
    else:
        results["_saved"] = False

    return results


def main():
    print("V12 Fase 4 — lang-file fixes\n")
    for lang_code in LANG_CODES:
        print(f"=== {lang_code}.js ===")
        results = fix_file(lang_code)
        for key, status in results.items():
            if key == "_saved":
                continue
            marker = "[OK]" if status in ("updated", "already fixed", "updated (contextual)") else "[!!]"
            print(f"  {marker} {key}: {status}")
        if results.get("_saved"):
            print(f"  -> saved")
        print()


if __name__ == "__main__":
    main()
