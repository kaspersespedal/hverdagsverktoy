# PageSpeed Insights — FULL RAPPORT alle 7 sider
**Kilde:** Gmail-draft fra Mac, 13. april 2026
**Status:** Referansedokument

## Performance Scores

| Side | Mobil | Desktop |
|---|---|---|
| / (forside) | 82 | 98 |
| /skatt | 86 | 100 |
| /kalkulator | 86 | 100 |
| /boliglan | 84 | 100 |
| /personlig | 82 | 99 |
| /avgift | 86 | 100 |
| /selskap | 86 | 100 |
| **Snitt** | **84.6** | **99.6** |

## Core Web Vitals (Lab Data)

| Side | FCP mob | LCP mob | TBT mob | CLS mob | FCP desk | LCP desk |
|---|---|---|---|---|---|---|
| / | 2.9s | 3.4s | 0ms | 0 | 0.7s | 0.8s |
| /skatt | 2.9s | 3.4s | 0ms | 0 | 0.5s | 0.6s |
| /kalkulator | 2.9s | 3.5s | 0ms | 0 | 0.5s | 0.8s |
| /boliglan | 2.9s | 3.4s | 0ms | 0 | 0.5s | 0.7s |
| /personlig | 3.3s | 3.8s | 0ms | 0.002 | 0.7s | 0.8s |
| /avgift | 2.9s | 3.5s | 0ms | 0 | 0.5s | 0.6s |
| /selskap | 2.9s | 3.4s | 0ms | 0 | 0.4s | 0.7s |

NB: Ingen CrUX field data — ikke nok trafikk enna.

## Andre scores
- Accessibility: 90-96
- Best Practices: 100
- SEO: 92-100

## Topp 3 forbedringer

### MOBIL:
1. **Render-blocking resources** — 1 690-2 030 ms besparelse. DEN STOERSTE FAKTOREN.
2. **Cache policy** — 173 KiB sitewide
3. **Ubrukt JavaScript** — 73-121 KiB (/personlig verst)

### DESKTOP:
1. Cache policy — 173 KiB
2. Render-blocking — 130-360 ms
3. Minifiser/ubrukt JS — 20-80 KiB

## Prioriterte anbefalinger
1. **[HOEYESTE]** Inline critical CSS + defer resten -> mobil 82-86 -> 90-95
2. **[HOEY]** Cache-Control: max-age=31536000 pa statiske assets
3. **[MEDIUM]** Code-split /personlig (121 KiB ubrukt JS)
4. **[LAV]** /personlig tregest (FCP 3.3s, LCP 3.8s) — prioriter her
