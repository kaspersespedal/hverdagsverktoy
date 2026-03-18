# Fix goToDeprCard() scroll precision in finanskalkulator.html

## Problem
In `finanskalkulator.html`, there's a function `goToDeprCard()` (around line ~4275) that runs when the user clicks the link "sktl. §§ 14-40 til 14-48" inside the avskrivning (depreciation) calculator intro text. This link should scroll the user directly and precisely to the **saldogrupper depreciation rates table** (Gruppe a – 30%, Gruppe b – 20%, etc.) inside the salary calculator's `sal-depr-card`.

## Current behavior
The scroll lands too high — at the card title or intro text area — instead of at the actual depreciation groups table.

## What the function needs to do (in order)
1. Call `switchCalc('salary', true)` — switches to the salary calculator (the `true` parameter is `skipScroll` to prevent switchCalc from doing its own scroll)
2. Open the `.law-group` containing `#sal-depr-card` (add class `open`, set `.law-group-body` maxHeight to `none`) — **without animation**
3. Expand the card (remove `collapsed` class from `#sal-depr-card`) — **without animation**
4. Wait for the browser to fully reflow/repaint the now-visible content
5. Find the `.ir` element inside `#sal-depr-rows` whose text contains "Gruppe a" (this is the first depreciation group row: "Gruppe a – 30% – Kontormaskiner...")
6. Scroll so that "Gruppe a – 30%" row is at the top of the viewport, accounting for `stickyOffset()` (the sticky header + calc nav height)
7. Use `behavior:'smooth'` for the scroll

## Key context
- `infoRowsHTML()` generates the card content. Header rows (keys starting with `—`) get class `ir ir-hdr`. Normal rows get class `ir`.
- The content of `#sal-depr-rows` is populated by `updateSalaryUI()` and is already in the DOM when the card is collapsed — it's just hidden.
- `stickyOffset()` returns the pixel height of the sticky header + calc-nav bar
- `switchCalc()` toggles visibility of calculator panels and calls `resetCalcPanel()` — this causes significant DOM reflow
- The card has a CSS class `bc-panel-anim` with a 300ms animation (`translateY(8px)` + `opacity:0`). This animation can interfere with `getBoundingClientRect()` — disable it before reading positions.
- The `.law-group-body` normally uses `maxHeight` transition for open/close animation — set `transition:'none'` and `maxHeight:'none'` to bypass.
- All 10 languages have translations. Norwegian says "Gruppe a", English says "Group a", etc. The search should work for all languages.

## What I've tried that didn't work well enough
- Single `requestAnimationFrame` — fires before layout settles
- Double `requestAnimationFrame` — better but still imprecise
- `void card.offsetHeight` force reflow — helps but not enough
- Targeting `.ir-hdr` with SALDOGRUPP text — lands at the header, not the group rows
- Targeting `.nextElementSibling` of the SALDOGRUPP header — still not precise enough

## Files
- Only file: `finanskalkulator.html` (single-file HTML app, ~2900 lines)
- Function location: search for `function goToDeprCard`
- NO BACKUPS — edit the file directly, do not create .bak files

## Test
After fixing, clicking the "sktl. §§ 14-40 til 14-48" link in the avskrivning calculator intro should smoothly scroll to show "Gruppe a – 30%" at the top of the visible area.
