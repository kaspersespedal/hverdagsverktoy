#!/usr/bin/env python3
"""
V12 Fase 3 P12-M8: Add 14 missing i18n keys to all 10 lang files.

Keys identified by V12 audit (skatt sub-agent personlig):
- budsjettColDescI/budsjettColAmountI (income table cols)
- budsjettColDescE/budsjettColAmountE (expense table cols)
- budDefaultExpense (fallback row label)
- budOptEkstra/budOptKapital/budOptNav (income category options)
- budOptKlaer/budOptSparing (expense category options)
- aboPriceChangeTitle/aboTotalChange/aboTotalChangeYear (subscription delta UI)
- budCsvTipLabel (label for "Tip:" before CSV usage tip)

Also fixes "Belop" typo (already corrected in core.js fallback).

Strategy: insert new keys directly after the existing budCsvTip line in each
lang file. The new keys are added on a new line in the same const-block, so
formatting is preserved and existing keys are untouched.
"""

import re
from pathlib import Path

REPO = Path(r"C:\Users\Kaspe\OneDrive\Skrivebord\Cowork OS\Web Projects Hobby")
LANG_DIR = REPO / "shared" / "lang"

# Translations per language
TRANSLATIONS = {
    "no": {
        "budsjettColDescI": "Beskrivelse",
        "budsjettColAmountI": "Beløp",
        "budsjettColDescE": "Beskrivelse",
        "budsjettColAmountE": "Beløp",
        "budDefaultExpense": "Post",
        "budOptEkstra": "Ekstrajobb/freelance",
        "budOptKapital": "Kapitalinntekter",
        "budOptNav": "NAV-ytelser",
        "budOptKlaer": "Klær og personlig",
        "budOptSparing": "Sparing/BSU",
        "aboPriceChangeTitle": "Prisendringer siste år",
        "aboTotalChange": "Total prisøkning / mnd",
        "aboTotalChangeYear": "Per år",
        "budCsvTipLabel": "Tips",
    },
    "en": {
        "budsjettColDescI": "Description",
        "budsjettColAmountI": "Amount",
        "budsjettColDescE": "Description",
        "budsjettColAmountE": "Amount",
        "budDefaultExpense": "Item",
        "budOptEkstra": "Side hustle/freelance",
        "budOptKapital": "Capital income",
        "budOptNav": "NAV benefits",
        "budOptKlaer": "Clothing & personal",
        "budOptSparing": "Savings/BSU",
        "aboPriceChangeTitle": "Price changes last year",
        "aboTotalChange": "Total price increase / mo",
        "aboTotalChangeYear": "Per year",
        "budCsvTipLabel": "Tip",
    },
    "ar": {
        "budsjettColDescI": "الوصف",
        "budsjettColAmountI": "المبلغ",
        "budsjettColDescE": "الوصف",
        "budsjettColAmountE": "المبلغ",
        "budDefaultExpense": "بند",
        "budOptEkstra": "عمل إضافي/مستقل",
        "budOptKapital": "دخل رأس المال",
        "budOptNav": "إعانات NAV",
        "budOptKlaer": "الملابس والشخصية",
        "budOptSparing": "ادخار/BSU",
        "aboPriceChangeTitle": "تغيرات الأسعار العام الماضي",
        "aboTotalChange": "إجمالي الزيادة / شهر",
        "aboTotalChangeYear": "في السنة",
        "budCsvTipLabel": "نصيحة",
    },
    "zh": {
        "budsjettColDescI": "描述",
        "budsjettColAmountI": "金额",
        "budsjettColDescE": "描述",
        "budsjettColAmountE": "金额",
        "budDefaultExpense": "项目",
        "budOptEkstra": "兼职/自由职业",
        "budOptKapital": "资本收益",
        "budOptNav": "NAV福利",
        "budOptKlaer": "服装和个人",
        "budOptSparing": "储蓄/BSU",
        "aboPriceChangeTitle": "去年价格变动",
        "aboTotalChange": "总涨幅/月",
        "aboTotalChangeYear": "每年",
        "budCsvTipLabel": "提示",
    },
    "fr": {
        "budsjettColDescI": "Description",
        "budsjettColAmountI": "Montant",
        "budsjettColDescE": "Description",
        "budsjettColAmountE": "Montant",
        "budDefaultExpense": "Poste",
        "budOptEkstra": "Travail d\\'appoint",
        "budOptKapital": "Revenus du capital",
        "budOptNav": "Prestations NAV",
        "budOptKlaer": "Vêtements et personnel",
        "budOptSparing": "Épargne/BSU",
        "aboPriceChangeTitle": "Variations de prix l\\'année dernière",
        "aboTotalChange": "Augmentation totale / mois",
        "aboTotalChangeYear": "Par an",
        "budCsvTipLabel": "Astuce",
    },
    "pl": {
        "budsjettColDescI": "Opis",
        "budsjettColAmountI": "Kwota",
        "budsjettColDescE": "Opis",
        "budsjettColAmountE": "Kwota",
        "budDefaultExpense": "Pozycja",
        "budOptEkstra": "Praca dodatkowa",
        "budOptKapital": "Dochody kapitałowe",
        "budOptNav": "Świadczenia NAV",
        "budOptKlaer": "Odzież i osobiste",
        "budOptSparing": "Oszczędności/BSU",
        "aboPriceChangeTitle": "Zmiany cen w zeszłym roku",
        "aboTotalChange": "Łączny wzrost / mies.",
        "aboTotalChangeYear": "Rocznie",
        "budCsvTipLabel": "Wskazówka",
    },
    "uk": {
        "budsjettColDescI": "Опис",
        "budsjettColAmountI": "Сума",
        "budsjettColDescE": "Опис",
        "budsjettColAmountE": "Сума",
        "budDefaultExpense": "Стаття",
        "budOptEkstra": "Підробіток",
        "budOptKapital": "Капітальний дохід",
        "budOptNav": "Виплати NAV",
        "budOptKlaer": "Одяг та особисте",
        "budOptSparing": "Заощадження/BSU",
        "aboPriceChangeTitle": "Зміни цін за минулий рік",
        "aboTotalChange": "Загальний приріст / міс",
        "aboTotalChangeYear": "На рік",
        "budCsvTipLabel": "Підказка",
    },
    "lt": {
        "budsjettColDescI": "Aprašymas",
        "budsjettColAmountI": "Suma",
        "budsjettColDescE": "Aprašymas",
        "budsjettColAmountE": "Suma",
        "budDefaultExpense": "Įrašas",
        "budOptEkstra": "Papildomas darbas",
        "budOptKapital": "Kapitalo pajamos",
        "budOptNav": "NAV išmokos",
        "budOptKlaer": "Drabužiai ir asmeniniai",
        "budOptSparing": "Santaupos/BSU",
        "aboPriceChangeTitle": "Kainų pokyčiai pernai",
        "aboTotalChange": "Bendras padidėjimas / mėn",
        "aboTotalChangeYear": "Per metus",
        "budCsvTipLabel": "Patarimas",
    },
    "so": {
        "budsjettColDescI": "Sharaxaad",
        "budsjettColAmountI": "Qiimaha",
        "budsjettColDescE": "Sharaxaad",
        "budsjettColAmountE": "Qiimaha",
        "budDefaultExpense": "Halbeeg",
        "budOptEkstra": "Shaqo dheeraad ah",
        "budOptKapital": "Dakhliga raasumaalka",
        "budOptNav": "Faa\\'iidooyinka NAV",
        "budOptKlaer": "Dharka iyo shakhsi",
        "budOptSparing": "Kaydinta/BSU",
        "aboPriceChangeTitle": "Isbeddelka qiimaha sannadkii hore",
        "aboTotalChange": "Wadarta korodho / bil",
        "aboTotalChangeYear": "Sannadkii",
        "budCsvTipLabel": "Talo",
    },
    "ti": {
        "budsjettColDescI": "መግለጺ",
        "budsjettColAmountI": "መጠን",
        "budsjettColDescE": "መግለጺ",
        "budsjettColAmountE": "መጠን",
        "budDefaultExpense": "ኣይነት",
        "budOptEkstra": "ተወሳኺ ስራሕ",
        "budOptKapital": "ኣታዊ ካፒታል",
        "budOptNav": "ናይ NAV ጥቕምታት",
        "budOptKlaer": "ክዳውንቲ ን ብሕታዊ",
        "budOptSparing": "ቑጠባ/BSU",
        "aboPriceChangeTitle": "ለውጢ ዋጋ ዓሚ",
        "aboTotalChange": "ጠቕላላ ወሰኽ / ወርሒ",
        "aboTotalChangeYear": "ብዓመት",
        "budCsvTipLabel": "ምኽሪ",
    },
}

# Order of keys in the new line
KEY_ORDER = [
    "budsjettColDescI",
    "budsjettColAmountI",
    "budsjettColDescE",
    "budsjettColAmountE",
    "budDefaultExpense",
    "budOptEkstra",
    "budOptKapital",
    "budOptNav",
    "budOptKlaer",
    "budOptSparing",
    "aboPriceChangeTitle",
    "aboTotalChange",
    "aboTotalChangeYear",
    "budCsvTipLabel",
]


def build_new_line(lang_code: str) -> str:
    """Build the new const-block line with all 14 keys for a language."""
    trans = TRANSLATIONS[lang_code]
    parts = []
    for key in KEY_ORDER:
        val = trans[key]
        parts.append(f"{key}:'{val}'")
    return "    " + ", ".join(parts) + ","


def insert_after_budcsvtip(file_path: Path, lang_code: str) -> bool:
    """Insert new keys line right after the line containing 'budCsvTip:'."""
    text = file_path.read_text(encoding="utf-8")

    # Check if any of our new keys already exist (idempotent)
    if any(f"{k}:" in text for k in KEY_ORDER):
        existing = [k for k in KEY_ORDER if f"{k}:" in text]
        print(f"  SKIP {lang_code}: keys already present: {existing[:3]}...")
        return False

    new_line = build_new_line(lang_code)

    lines = text.split("\n")
    out_lines = []
    inserted = False
    for line in lines:
        out_lines.append(line)
        if not inserted and "budCsvTip:" in line:
            out_lines.append(new_line)
            inserted = True

    if not inserted:
        print(f"  ERROR {lang_code}: budCsvTip: not found in file")
        return False

    file_path.write_text("\n".join(out_lines), encoding="utf-8")
    print(f"  OK {lang_code}: inserted 14 keys after budCsvTip")
    return True


def main():
    print("V12 Fase 3 P12-M8: Adding 14 missing i18n keys to 10 lang files\n")
    success = 0
    total = 0
    for lang_code in TRANSLATIONS:
        file_path = LANG_DIR / f"{lang_code}.js"
        if not file_path.exists():
            print(f"  MISS {lang_code}: file not found")
            continue
        total += 1
        if insert_after_budcsvtip(file_path, lang_code):
            success += 1
    print(f"\n{success}/{total} files updated.")


if __name__ == "__main__":
    main()
