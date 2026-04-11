#!/usr/bin/env python3
"""
V10 avgift H1: Remove 5% ekstra AGA row from salAgaRows in all remaining
lang-files. The scheme was discontinued from 1 Jan 2025 per Skatteetaten,
but all 10 lang-files still described it as active.

no.js was already fixed manually. This script handles the remaining 9 files.

Strategy: Find the row containing 'ftrl. § 23-2a' and replace it with a
"Repealed 2025" note in each language. Row count is preserved so nothing
breaks in the render pipeline.
"""
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LANG_DIR = REPO / "shared" / "lang"

# Each entry: (filename, old_row_pattern, new_row)
REPLACEMENTS = {
    "en.js": (
        "['Extra tax on high salaries?','From 2023: 5% extra employer social security contribution on salary above 750,000 kr per employee (applies to all zones).','ftrl. § 23-2a']",
        "['Extra tax on high salaries?','Repealed from 1 Jan 2025. Previously 5% extra on salary above 850,000 kr per employee.','Repealed 2025']",
    ),
    "fr.js": (
        "['Cotisation supplémentaire sur les salaires élevés ?','À partir de 2023 : cotisation patronale supplémentaire de 5 % sur les salaires supérieurs à 750 000 kr par salarié (s\\'applique à toutes les zones).','ftrl. § 23-2a']",
        "['Cotisation supplémentaire sur les salaires élevés ?','Abrogée à partir du 1er janvier 2025. Auparavant 5 % supplémentaires sur les salaires supérieurs à 850 000 kr par salarié.','Abrogée 2025']",
    ),
    "ar.js": (
        "['رسم إضافي على الرواتب المرتفعة؟','من 2023: رسم صاحب عمل إضافي بنسبة 5 % على الراتب الذي يزيد عن 750 000 كرونة لكل موظف (ينطبق على جميع المناطق).','ftrl. § 23-2a']",
        "['رسم إضافي على الرواتب المرتفعة؟','أُلغي اعتباراً من 1 يناير 2025. سابقاً كان 5 % إضافية على الراتب فوق 850 000 كرونة لكل موظف.','أُلغي 2025']",
    ),
    "lt.js": (
        "['Papildomas mokestis aukštiems atlyginimams?','Nuo 2023: 5% papildomas darbdavio mokestis už atlyginimą, viršijantį 750 000 kr vienam darbuotojui (galioja visose zonose).','ftrl. § 23-2a']",
        "['Papildomas mokestis aukštiems atlyginimams?','Panaikintas nuo 2025 m. sausio 1 d. Anksčiau 5 % papildomai atlyginimui virš 850 000 kr vienam darbuotojui.','Panaikinta 2025']",
    ),
    "pl.js": (
        "['Dodatkowa opłata na wysokie pensje?', 'Od 2023 r.: dodatkowa 5 % opłata pracodawcy na pensje powyżej 750 000 kr na pracownika (dotyczy wszystkich stref).', 'ftrl. § 23-2a']",
        "['Dodatkowa opłata na wysokie pensje?', 'Zniesiona od 1 stycznia 2025 r. Wcześniej dodatkowe 5 % na pensje powyżej 850 000 kr na pracownika.', 'Zniesiona 2025']",
    ),
    "so.js": (
        "['Canshuurta dheedheer oo kordheysay hakad?','Laga bilaabo 2023: Canshuurta caasimadora dheedheer oo 5 % oo lagu bixi hakad ka badan 750 000 kr per shaqaale (waxaa la adeegsadaa goboladda oo dhan).','ftrl. § 23-2a']",
        "['Canshuurta dheedheer oo kordheysay hakad?','Waxaa la baajiyey 1 Janaayo 2025. Hore waxay ahayd 5 % dheeraad ah hakad ka badan 850 000 kr shaqaale kasta.','La baajiyey 2025']",
    ),
    "ti.js": (
        "['ስጡር ስቅ ወርሒ?','ካብ 2023: 5 % ጨርሃ ምሞቕ መሪሕ ወርሒ ላዕ 750 000 kr ነበር ስራሕ (ሓንሳብ ሳንትታት።','ftrl. § 23-2a']",
        "['ስጡር ስቅ ወርሒ?','ካብ 1 ጥር 2025 ተሳሒቡ። ቀደም 5 % ተወሳኺ ወርሒ ላዕ 850 000 kr ነበር ሰራሕተኛ።','ተሳሒቡ 2025']",
    ),
    "uk.js": (
        "['Додатковий збір на високі зарплати?', 'З 2023 р.: додатковий 5 % збір роботодавця на зарплати понад 750 000 kr на одного працівника (стосується всіх зон).', 'ftrl. § 23-2a']",
        "['Додатковий збір на високі зарплати?', 'Скасовано з 1 січня 2025 р. Раніше додаткові 5 % на зарплати понад 850 000 kr на одного працівника.', 'Скасовано 2025']",
    ),
    "zh.js": (
        "['高工资的额外费用?','从2023年起：对超过每位员工75万克朗的工资征收5%的额外雇主社会保险费（适用于所有区域）。','ftrl. § 23-2a']",
        "['高工资的额外费用?','自2025年1月1日起废止。之前为对超过每位员工85万克朗工资征收5%的额外费用。','已废止 2025']",
    ),
}


def main():
    total = 0
    for filename, (old, new) in REPLACEMENTS.items():
        path = LANG_DIR / filename
        if not path.exists():
            print(f"SKIP {filename} (not found)")
            continue
        text = path.read_text(encoding="utf-8")
        if old not in text:
            print(f"NOOP {filename}: old row not found (already fixed or pattern differs)")
            continue
        new_text = text.replace(old, new, 1)
        path.write_text(new_text, encoding="utf-8")
        print(f"OK   {filename}: replaced 1 row")
        total += 1
    print(f"TOTAL: {total} files updated")


if __name__ == "__main__":
    main()
