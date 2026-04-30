# Hverdagsverktøy — Design System

> "UTROLIG ENKELT" — gratis norske finanskalkulatorer som får brukere som føler seg dumme til å føle seg smarte.

Hverdagsverktøy is a privacy-first Norwegian web app providing 27 finance and legal calculators across 7 sections (Skatt, Kalkulator, Boliglån, Avgift, Personlig økonomi, Selskap, Om). Vanilla HTML/CSS/JS, no build pipeline, deployed via GitHub Pages. 10 languages (no/en/ar/zh/fr/pl/uk/lt/so/ti). 8 user-selectable themes. PWA, mobile-first.

All calculations run locally in the browser — no tracking, no cookies, no data leaves the device.

## Sources

- **Codebase:** [kaspersespedal/hverdagsverktoy](https://github.com/kaspersespedal/hverdagsverktoy) — branch `main`. Static site, no build step. The single source of truth is `shared/style.css` (~106KB) and `index.html`.
- **Live site:** [hverdagsverktoy.com](https://hverdagsverktoy.com)
- **llms.txt:** [hverdagsverktoy.com/llms.txt](https://hverdagsverktoy.com/llms.txt)
- No Figma file. No design-system documentation outside the codebase itself.

## Index

| File | What's in it |
|------|---|
| `README.md` | This file — context, content & visual foundations, iconography |
| `colors_and_type.css` | All 8 theme palettes + Inter/Playfair type scale as CSS variables |
| `SKILL.md` | Agent skill manifest (also usable as a Claude Code skill) |
| `assets/` | Logos, icons, og-card image, manifest |
| `preview/` | Design system cards (typography, colors, components, themes) |
| `ui_kits/site/` | Recreation of core hverdagsverktoy.com screens (homepage + calculator) |

## Brand essence

- **Name:** Hverdagsverktøy ("everyday tools")
- **Voice:** precise but everyday Norwegian. Plain language. No jargon. Faglig solid uten fagslang.
- **Default theme:** `carbon` — warm charcoal (#161616 / #1e1e1e) with an amber accent (#d4a574).
- **Hero typeface:** Playfair Display *italic* — provides the "premium" tone.
- **Body typeface:** Inter, full weight range 300–900.
- **Symmetry as meta-principle.** Layouts read as balanced/mirrored where possible.
- **No emoji.** Strictly forbidden in product copy.

## CONTENT FUNDAMENTALS

### Voice
- Plain Norwegian (bokmål). Everyday register, not academic. The audience includes immigrants, working-class users, and small-business owners — all speak in non-jargon Norwegian.
- Sentences are short. Periods do work. Commas separate examples.
- Faglig solid uten fagslang — facts are precise (e.g. "Stortingets skattevedtak STV-2025-12-18-2747"), but framing is warm.
- "Du" (informal you), never "De". The tone is direct, helpful, never condescending.
- Numbers with thin/non-breaking separators: `30 000 kr`, `2,5 %`, `STV-2025-12-18-2747`. Always a space before `kr` and `%`.

### Casing
- **Sentence case** for headings, buttons, nav, card titles. Examples: "Beregn skatt", "Praktiske verktøy for privatøkonomi", "Hva er Hverdagsverktøy?"
- ALL-CAPS reserved for tiny eyebrow labels (group labels in dropdowns) — letter-spacing `1.2px–2.5px`, font-size 10–14px.
- Single-word logo: "Hverdagsverktøy".

### Examples (lifted directly from index.html / privacy / contact)

> "Praktiske verktøy for privatøkonomi"
> — hero subhead, sentence case, no period.

> "Lønnsskatten har 5 nivåer — jo mer du tjener, jo høyere prosent (fra 1,7 % til 17,8 %)."
> — explanatory copy. Em-dash. Concrete numbers immediately after the rule.

> "Vi tar personvernet ditt på alvor — og den enkleste måten å beskytte det på er å aldri samle inn data i utgangspunktet."
> — privacy intro. Conversational, but the claim is sharp.

> "Beregningene er veiledende og erstatter ikke profesjonell rådgivning."
> — disclaimer. Honest. Never hidden in tiny gray.

> "© 2026 Hverdagsverktøy — Veiledende beregninger basert på kjente satser. Ikke profesjonell rådgivning."
> — footer. Same disclaimer surfaces everywhere.

### Punctuation tics
- Em-dashes (—) liberally, with a space on each side.
- Norwegian quotation marks `«…»` in formal contexts; ASCII `"…"` is fine in code/dev copy.
- "kr" not "NOK" in user copy.

### What we never do
- No emoji in content (tested to be glitchy + breaks the premium tone).
- No "Hey there!" or "Hi friend!" greetings.
- No marketing fluff ("revolutionary", "best-in-class").
- No hidden disclaimers — say it plainly.

## VISUAL FOUNDATIONS

### Color philosophy
- **Theme variables only.** Never hardcode hex in components — always `var(--accent)`, `var(--card)`, `var(--text)`, etc. The 8 themes (carbon, dark, light/frost, glass, hendrix, disco, pink, bw) all override the same token surface.
- Each theme has its own emotional register: carbon = professional dark default, frost = premium indigo, hendrix = 60s psychedelic, disco = neon nightclub, bw = Swiss minimalist.
- Most dark themes use a warm or saturated accent (carbon amber, dark indigo, disco magenta). Light themes lean cool (frost indigo, glass periwinkle).

### Type system
- **Inter** for everything UI. Range used: 300–900. Most weights live around 400 (body), 500 (controls), 600–700 (titles), 800 (logo).
- **Playfair Display Italic** is reserved for the hero `<h1>` and gives the site its "premium pdfmake-rapport" tone. Combined with Inter for the small uppercase eyebrow underneath.
- Hero size is fluid: `clamp(36px, 5.5vw, 60px)`. Heroes always have a thin centered dash-rule above and below — `48px × 2px`, `var(--accent-l)`, opacity .5.
- Tabular numbers in calculators (numerals are aligned).

### Spacing & layout
- **Container:** `max-width: 1180–1200px`, `padding: 0 24–28px`.
- Card grid is 2 columns desktop (≥901px), 1 column on mobile.
- Specific breakpoints: **768px** (general mobile), **480px** (small mobile), **901px** (calc grid stack), **1201px** (3-column variant on `/skatt`).
- **Mobile-first** — most styles are mobile, desktop is the override.
- Sticky header (z:200, height ~64px) + sticky calc-nav below it (z:100, top:65px).
- **Symmetry as principle.** Hero is centered. Cards are 50/50. Forms align labels.

### Cards (the dominant UI element)
- `.card` and `.info-card`. Surface `var(--surface)`, border `1px solid var(--border)`, radius `var(--r)` (default 14px, varies by theme: 8px bw, 12px hendrix/disco, 16px frost).
- Subtle shadow: `0 1px 3px rgba(14,40,110,.05), 0 4px 18px rgba(14,40,110,.07)`. Each theme tunes shadow color (dark themes use rgba black, frost uses indigo).
- **Focus mode:** any `.info-card` has a "Fokus" button (small SVG arrow icon, top-right of card header). Click → card isolates fullscreen-style. Close via "Skjul fokus" pill.
- Nested info-cards are intentionally flat (no border, no radius, no shadow) — they look like accordion sections within the parent card.

### Backgrounds
- **Hero spotlight pust-animasjon.** Each theme has a `.hero::after` radial-gradient that breathes via `@keyframes heroSpotlight` (16s ease-in-out infinite, opacity .7→1).
- Hendrix and disco have additional fixed body radial-gradients (psychedelic / neon).
- A subtle **noise dither** layer is overlaid on the hero in dark/carbon/frost/glass/pink themes via inline SVG `feTurbulence` — disrupts 8-bit color banding.
- Glass uses `backdrop-filter: blur(16px)` on cards.

### Animation
- Easing: `cubic-bezier(.22,1,.36,1)` (frost premium ease) and `cubic-bezier(.34,1.56,.64,1)` (slight overshoot on hover).
- Durations: micro-interactions 150–250ms; hero/card entrance 400–900ms; gradient breathes 16–22s.
- **Hover effects MUST be wrapped in `@media(hover:hover)`** — otherwise they glitch on touch devices. This is rule #1 in the codebase.
- Reduced motion: every animation has a `@media(prefers-reduced-motion:reduce)` fallback.

### Hover / press states
- **Hover:** translateY(-2px to -4px), border-color brightens to `--accent` or `--accent-l`, soft shadow expands. On dark themes, additional `box-shadow: 0 4px 20px rgba(accent,.15)` glow.
- **Press / active:** `transform: translateY(0) scale(.97–.98)`, shadow shrinks. 100ms transition, easing back snappy.
- Inputs on focus: `border-color: var(--accent)`, `box-shadow: 0 0 0 3px rgba(accent,.1), 0 0 0 1px rgba(accent,.2)`.

### Borders, shadows, radii summary
- Borders: `1px` or `1.5px solid var(--border)`. Border color is theme-bound.
- Shadows: two-layer stack — close-tight (1–2px blur, 5–10% opacity) + far-soft (16–56px blur, 7–15% opacity). Color matches the theme's accent or pure black.
- Radii: vary per theme (`bw` is 8px, default 14px, `frost` is 16px). Tabs and buttons use `--rs` (smaller radius).

### Transparency & blur
- Glass theme is the only one that leans heavily on transparent surfaces (`rgba(255,255,255,.55)`) + `backdrop-filter: blur(16px)`.
- Other themes are opaque. Header has 1px border + tiny shadow, no blur.

### Imagery vibe
- The og-card image is the truest visual: deep navy bg → bright white serif title → clean blue accent ("hverdagsverktoy.com") → quiet gray subtext. **Cool, professional, never warm photography.**
- No stock imagery. No illustrations. The site is essentially text + numbers + small flag PNGs (from `flagcdn.com`).

### Layout rules (fixed elements)
- Header sticks at top. Logo left, region-selector + theme-picker right.
- Hero spans below header — the only "rich" surface.
- Calc-nav below hero (sticky beneath header at top:65px) — a 7-tab pill bar with active-tab pill animated via JS.
- Footer is full-width, separated by `1px solid var(--border)`.
- "Fokus" close-pill is `position: fixed; top-right` when focus mode is active.

## ICONOGRAPHY

Hverdagsverktøy is **deliberately icon-light**. There is no icon font, no icon sprite, and no Lucide/Heroicons CDN. The codebase uses inline SVG sparingly for the few UI affordances that need a glyph.

### What's actually used

1. **App / favicon** — inline SVG, blue rounded square with white "calculator rows" pattern. Defined as a data URI in `index.html` `<link rel="icon">`. A PNG version (`icons/icon-192.png`, `icons/icon-512.png`) is shipped for PWA / og-card use.
2. **Focus-card button (top-right of every info-card)** — a tiny corner-bracket SVG drawn inline in JS:
   ```html
   <svg viewBox="0 0 16 16" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
     <path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"/>
   </svg>
   ```
   16×16, currentColor, 2px stroke. This is the single most representative icon style in the system.
3. **Chevrons** — Unicode `▼` for the region-selector dropdown caret. No SVG.
4. **Complexity dots** — three Unicode bullets (`●●○`, `●●●`) in CSS `content`, color-coded green/yellow/red, per `[data-complexity]` attribute. Sits bottom-right of collapsed cards.
5. **Skip-link / back-arrow** — plain Unicode `←` characters (`← Tilbake`).
6. **Flags** — PNG flag images from `flagcdn.com/w80/<iso>.png`. Loaded on demand, lazy. Used only in the language-selector dropdown.
7. **Submit-button affordance** — Unicode `→` ("Send melding →").

### Style rules
- **Stroke style:** when SVG is used, stroke 2px, currentColor, round caps & joins. Never filled.
- **Sizes:** 12px or 16px square. Never larger than the text next to them.
- **Color:** always inherits `currentColor` so themes drive it.
- **No emoji.** No exceptions.
- **No flat illustrations.** No 3D renders. No isometric scenes.
- **Numerical glyphs as decoration:** the favicon is a calculator-row grid of opacity-stepped white rectangles. This pattern (a grid of small rounded squares) is the closest thing to a brand mark.

### Substitutions (flagged for user review)
None — all icons in this design system are copied directly from the codebase or use the same Unicode/currentColor-SVG approach as production. **No CDN icon library is needed or recommended.** If a calculator needs more glyphs in the future, prefer Unicode → minimal inline SVG (matching the focus-button style above) → only as a last resort consider a CDN like Lucide.

## Caveats
- **No webfont files** — `fonts/google-fonts.css` is empty in the repo. Production loads Inter + Playfair from `fonts.bunny.net`. This design system imports from the same CDN.
- **No standalone Figma file** — every design decision was reverse-engineered from `shared/style.css` and `index.html`.
- The `/personlig`, `/skatt`, `/avgift` etc. inner pages share the same shell as `index.html` but have not been individually copied — the UI kit demonstrates the homepage + a representative calculator page only.
