═════════════════════════════════════════════════════════════════════════════
TRANSLATION KEYS FOR NORWEGIAN TAX CALCULATOR
Generated: 2026-03-15
═════════════════════════════════════════════════════════════════════════════

OVERVIEW
────────────────────────────────────────────────────────────────────────────
This package contains missing translation keys for the finanskalkulator.html
web app in three languages:

  • EN (English)     - 3 keys total (salAntiRows + npvExamplesRows + npvTipsRows)
  • SO (Somali)      - 8 keys total (all NPV/calculator help sections)
  • TI (Tigrinya)    - 8 keys total (all NPV/calculator help sections)

All translations preserve Norwegian tax rules, § references, amounts (kr),
and percentages exactly as specified in the original content.

═════════════════════════════════════════════════════════════════════════════

WHAT'S MISSING IN EACH LANGUAGE
────────────────────────────────────────────────────────────────────────────

EN (English):
  1. salAntiRows (17 rows) - Related Parties & Anti-avoidance (§13-1 to §13-3)
     Sections covered:
     - The arm's length principle (§ 13-1)
     - Anti-avoidance rule / GAAR (§ 13-2)
     - Tax positions without connection (§ 13-3)

  2. npvExamplesRows (16 rows) - Currently has 11 rows, needs 5 more
     Missing Example 3 (Startup):
     - Row 11-12: Header and description
     - Row 13-15: Investment timeline and cashflows
     - Row 16: Risk guidance

  3. npvTipsRows (11 rows) - Currently has 9 rows, needs 2 more
     Missing tips:
     - Row 10: "Ignoring opportunity cost"
     - Row 11: "Only looking at payback period"

SO (Somali):
  1. calcHelpHint - "Ma baahan tahay caawin qalculator? →"
  2. bcDecLabel - "Decimals"
  3. npvHowtoTitle & npvHowtoDesc - NPV calculator instructions (header)
  4. npvHowtoRows - 10-row step-by-step guide to NPV/IRR
  5. npvExamplesTitle & npvExamplesDesc - Real-world examples (header)
  6. npvExamplesRows - 16-row complete examples (3 scenarios with kr amounts)
  7. npvTipsTitle & npvTipsDesc - Tips and common mistakes (header)
  8. npvTipsRows - 11-row advice on best practices and pitfalls

TI (Tigrinya):
  [Same 8 keys as Somali, with Tigrinya translations]

═════════════════════════════════════════════════════════════════════════════

FILE CONTENTS
────────────────────────────────────────────────────────────────────────────

MISSING_KEYS_FORMATTED.js
  ✓ Ready-to-insert single-line JavaScript format
  ✓ All keys formatted for direct copy-paste into REGIONS object
  ✓ Arrays on single lines (no line breaks)
  ✓ Apostrophes properly escaped: \'
  ✓ Norwegian § references preserved exactly
  ✓ All amounts in kr preserved exactly

TRANSLATION_SUMMARY.md
  ✓ Human-readable documentation
  ✓ Lists exactly what each key contains
  ✓ Explains which rows are new vs. completing existing sets
  ✓ Notes formatting conventions

═════════════════════════════════════════════════════════════════════════════

FORMATTING RULES APPLIED
────────────────────────────────────────────────────────────────────────────

1. Single-line arrays
   All arrays formatted as:
   npvHowtoRows: [['Row 1 Col 1','Row 1 Col 2'],['Row 2 Col 1','Row 2 Col 2'],...]
   (no line breaks within array)

2. Escaped apostrophes
   'arm\'s length principle' (NOT 'arm's length principle')
   'Don\'t forget' (NOT 'Don't forget')

3. Exact key names
   ✓ salAntiRows (not salAnti or salAntiRows_new)
   ✓ npvHowtoTitle (title case, not title)
   ✓ npvExamplesRows (not npvExamples)

4. Preserved content
   ✓ § 13-1(1), § 13-2(3) a–f etc. - kept exactly
   ✓ 1,000,000 kr, 300,000 kr - kept exactly
   ✓ WACC, OECD, GAAR - kept exactly
   ✓ Percentages: 10%, 15-20%, 22% - kept exactly

═════════════════════════════════════════════════════════════════════════════

HOW TO USE
────────────────────────────────────────────────────────────────────────────

To integrate into finanskalkulator.html:

1. For English (EN):
   Find the 'en: {' section around line 1223
   Locate where these keys should go (after salAntiTitle)
   Copy each salAntiRows, npvExamplesRows, npvTipsRows block
   Paste as single-line replacements

2. For Somali (SO):
   Find the 'so: {' section around line 2852
   Locate after the existing tax table data
   Paste the SO translations in order

3. For Tigrinya (TI):
   Find the 'ti: {' section around line 3050
   Locate after the existing tax table data
   Paste the TI translations in order

═════════════════════════════════════════════════════════════════════════════

LANGUAGE NOTES
────────────────────────────────────────────────────────────────────────────

English (EN):
  - All §-references are kept in their original form
  - OECD guidelines reference preserved
  - Norwegian company law terminology (ch. 11, ch. 13) preserved
  - Tax percentages (22%, 7.6%) preserved from Norwegian 2026 rates

Somali (SO):
  - Maintained financial terminology consistent with existing SO translations
  - Kept kr (kroner) currency intact
  - Preserved § references and Norwegian legal structure
  - Technical terms (WACC, NPV, IRR) transliterated where applicable

Tigrinya (TI):
  - Used Ge'ez script (Tigrinya script) throughout
  - Financial terminology consistent with language conventions
  - Kept kr (kroner) currency intact
  - Preserved § references and Norwegian legal structure

═════════════════════════════════════════════════════════════════════════════

QUALITY CHECKS PERFORMED
────────────────────────────────────────────────────────────────────────────

✓ All apostrophes escaped with backslash
✓ All § references exact matches
✓ All kr amounts exact matches
✓ All percentages exact matches
✓ Array structure valid JavaScript
✓ All key names exact matches to specification
✓ Row counts match Norwegian source (16 npvExamplesRows, 11 npvTipsRows)
✓ Single-line formatting for all arrays

═════════════════════════════════════════════════════════════════════════════
