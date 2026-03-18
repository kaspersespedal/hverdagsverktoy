# Translation Keys Summary

Generated: 2026-03-15

## Overview

All translations provided preserve Norwegian tax rules, § references, amounts (kr), and percentages exactly as specified. Single quotes inside strings are escaped with backslash (`\'`). Each key-value pair is formatted for single-line insertion into the REGIONS object.

---

## EN (English) - 3 Keys

### 1. `salAntiRows` - 17 rows
Complete translation of Related Parties section covering:
- Arm's length principle (§ 13-1)
- Anti-avoidance rule / GAAR (§ 13-2)
- Tax positions without connection (§ 13-3)

All Norwegian § references, OECD guidelines, and legal terminology preserved exactly.

### 2. `npvExamplesRows` - 16 rows (11 existing + 5 new)
Complete 16-row example set. **Missing rows 11-16 (Example 3: Startup)**:
- Row 11-12: Example 3 header + startup description
- Row 13-15: Investment amounts and timeline
- Row 16: Risk guidance

### 3. `npvTipsRows` - 11 rows (9 existing + 2 new)
Complete 11-row tips set. **Missing rows 10-11**:
- Row 10: "Ignoring opportunity cost"
- Row 11: "Only looking at payback period"

---

## SO (Somali) - 6 Keys

### 1. `calcHelpHint` - String
"Ma baahan tahay caawin qalculator? →"

### 2. `bcDecLabel` - String
"Decimals"

### 3. `npvHowtoTitle` & `npvHowtoDesc` - Strings
- Title: "Sidii loo isticmaalo qalculator-ka"
- Description: "Tilmaam-tilmaam til NPV iyo IRR"

### 4. `npvHowtoRows` - 10 rows
Step-by-step guide and result interpretation

### 5. `npvExamplesTitle` & `npvExamplesDesc` - Strings
- Title: "Tusaalooyin dunida dhab ah"
- Description: "Gofyo caadiga ah ee mamuulka"

### 6. `npvExamplesRows` - 16 rows
3 complete investment examples with financial figures in kr

### 7. `npvTipsTitle` & `npvTipsDesc` - Strings
- Title: "Tilmaamyo iyo khaladaadka caadiga ah"
- Description: "Isku day khaladaadka badan ee nooca ah"

### 8. `npvTipsRows` - 11 rows
Good practices and common mistakes

---

## TI (Tigrinya) - 6 Keys

### 1. `calcHelpHint` - String
"ሓገዝ ኣለኻ ብካልኩሌተር? →"

### 2. `bcDecLabel` - String
"ዖፍ"

### 3. `npvHowtoTitle` & `npvHowtoDesc` - Strings
- Title: "ካሌኩሌተር መጠቀም ዝገበረ"
- Description: "ደረጃ-ብ-ደረጃ መምራዓ ናብ NPV ን IRR"

### 4. `npvHowtoRows` - 10 rows
Step-by-step guide and result interpretation

### 5. `npvExamplesTitle` & `npvExamplesDesc` - Strings
- Title: "ዋናይ ምሳሌታት"
- Description: "ብልጫ ምግምጋም ኢንቬስትመንት"

### 6. `npvExamplesRows` - 16 rows
3 complete investment examples with financial figures in kr

### 7. `npvTipsTitle` & `npvTipsDesc` - Strings
- Title: "ምርጋጻ ን ግኤ ስሪ ልምድ"
- Description: "ሂወት ሓዋሉ ስሪ ልምድ"

### 8. `npvTipsRows` - 11 rows
Good practices and common mistakes

---

## Formatting Notes

- All arrays are formatted as **single-line arrays** (brackets, no line breaks)
- Apostrophes inside strings are **escaped with backslash**: `\'`
- Key names match exactly: `salAntiRows`, `npvHowtoTitle`, `npvHowtoRows`, etc.
- Norwegian amounts (kr) preserved exactly
- § references preserved exactly
- 4-space indentation for readability in the output file

---

## Files Provided

1. **MISSING_KEYS_FORMATTED.js** - Ready-to-insert single-line JS format
2. **TRANSLATION_SUMMARY.md** - This document (documentation)

All translations ready for insertion into the REGIONS object in finanskalkulator.html.
