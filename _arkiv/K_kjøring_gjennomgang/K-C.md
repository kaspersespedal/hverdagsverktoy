# K-C gjennomgang — Selskap landing + aksjeutvanning (HYBRID-K) — 2026-05-27

**Resultat:** ✅ PR #100 merget `e51c86e0` mot `feat/redesign-2026-05-full-port`.
**Pipeline:** T1 → T2 (jeg) → T3 (jeg) → T4 (jeg) → Reviewer-T (jeg) → merge → /save-w
**Faktisk tid:** ~2,5 timer (T2 ~45 min, T3 ~30 min, T4 ~5 min re-verify, Reviewer ~5 min verify, /save-w ~5 min)
**Brain_HV-epoke:** E140

---

## ✅ Det som gikk bra

### Pre-flight og avklaring

1. **Stoppet og avklarte Tolkning D før koding** — første reaksjon var å lese "Replace nav-wrap → ZIP" som literal, men 8 nylige merged PRs (#87–#94) viste minimum-scope-injection-mønsteret. Brukte `AskUserQuestion` med 3 tolkninger + anbefaling. Brukeren ga "Tolkning D" som blandet design+funksjonalitet. Forhindret regresjon på theme/lang/search-funksjonalitet.
2. **T3 stilte spørsmål om tabs-count og footer-language** før endring — fikk klar bruker-direksjon (8 tabs + Personvern/Kontakt). Ingen stille design-valg.

### Teknisk utførelse

3. **T2 SHELL+ATMO-port fungerte teknisk** — alle verifications PASS: 5 SHELL-CSS + 2 SHELL-JS lastet, top-chrome auto-injekterte theme/lang-meny, matte bevart 100% (10M/2M/10%pool → 75+15+10 sum 100%).
4. **T3 fanget T2-regresjon** — T2's full ZIP-replace fjernet `<script src="/shared/search.js">` og `#site-search-anchor` uten å vite det. Cross-page-T-mønsteret virket som design-safety-net.
5. **Reviewer cherry-picks 0 konflikter** — T1+T2 disjoint på fil. T3 fix-1 + fix-2 disjoint (kun aksjeutvanning). Clean linear stack på K-branch.
6. **T4 dropt korrekt** — empty docs-commit ble skippet av Reviewer per "ingen kode-endring" pragmatisk regel.

### Verifikasjon og dokumentasjon

7. **Live preview-verifikasjon på K-branch HEAD** etter merge — atmo layers 4/4, JSON-LD 6/6, matte 100% match, 0 console errors, 0 failed network på begge filer.
8. **Comprehensive summary.md per T** + REVIEW.md med læringspunkter for K-E/K-F/K-I.
9. **E140 + ny regel dokumentert i Brain_HV** — historikk.md (kompakt 10-15L), regler.md (strategi-konsensus-regel for HYBRID-K), log.md (én linje).

---

## ⚠️ Det som gikk dårlig

### Working-tree branch-bleeding (gjentakende problem gjennom hele økten)

10. **T2 commit endte på FEIL branch** — `cc49b470` ble committet på `feat/K-J-T2-atmo-chrome` istedenfor `feat/K-C-T2-aksjeutvanning`. Parallell K-J-terminal byttet HEAD i bakgrunnen mellom min `git checkout -b` og `git commit`. Måtte cherry-picke til riktig branch + `git update-ref` for å reset lokal K-J-T2-atmo-chrome til origin. ~5 min ekstra arbeid.
11. **T3 working tree byttet flere ganger** av K-A-T1, K-A-T2, K-C-T4-terminaler mens jeg jobbet. Hver gang måtte jeg `git checkout feat/K-C-T3-cross-i18n` på nytt. Finalize-commit krevde `git stash push + checkout + stash pop`. Hele Edit/Read-cycle ble korrumpert noen ganger ("File has been modified since read").
12. **Mitigering glemt:** `git worktree add` ble nevnt som lærdom etter K-D men ikke brukt for K-C. Per E139 lærdom + ny regel: K-A..K-J som kjører parallelt MÅ bruke dedikerte worktrees. Denne kjøringen brukte samme working tree.

### Strategi-divergens (T1 vs T2)

13. **T1 valgte surgical (+8L), T2 valgte full Tolkning D-replace (+32/-155L)** — kraftig strategi-divergens på tvers av to T som skulle være parallelle. Resultat: 8 vs 9 tabs + Privacy/Contact vs Personvern/Kontakt på tvers av to filer i samme K.
14. **T3 brukte ~30 min på cleanup** som kunne vært unngått hvis plan.md hadde sagt eksplisitt "alle T bruker surgical" eller "alle T bruker full replace" FØR T1+T2 startet. Ny regel i regler.md adresserer dette for fremtidige HYBRID-K (K-E/K-F/K-I).
15. **T2 satte engelsk "Privacy · Contact"** istedenfor norsk "Personvern · Kontakt" — bryter site-konvensjon (personlig/lov/regnskap/T1-selskap). Var en bug i min interpretasjon av "re-add Privacy/Contact-lenker" fra brukerens Tolkning D-tekst.
16. **T2 stripped search.js + #site-search-anchor** uten å erkjenne det. Var en ekte regresjon som T3 fix-1 måtte rette opp.

### Tooling-friksjon

17. **Screenshot timed out flere ganger** pga atmosphere.js cursor-light rAF-loop (continuous animation). Måtte fallback til `preview_snapshot` (accessibility tree) for verifikasjon. Funket, men mindre visuell bevis enn ønsket.
18. **Service worker / cache-issues** etter T3-fix — preview viste fortsatt 9 tabs etter Edit. Måtte unregister SW + `caches.delete()` for hver eldre cache + reload. Burde vært første instinkt, kostet ~3 min å figure out.
19. **Brain_Master_Thesis pull feilet** ved sesjonsstart ("Aborting"). Ikke direkte K-C-issue, men sesjonsmiljø-flag som ikke ble håndtert.

### Scope-overlap

20. **T4 var no-op** — T3 cross-page-arbeid (i18n+search+a11y+DOM-align) dekket alt T4 skulle verifisere på cross-matte. T4 ble empty docs-commit. Indikerer at T3+T4 burde slås sammen for fremtidige HYBRID-K, eller T4-scope må snevres inn.
21. **Tidligere T-attempts på K-branchene** — `feat/K-C-T3-cross-i18n` hadde allerede T1+T2 cherry-picks + en T3-commit (`452a0ce9`) fra tidligere økt. Måtte navigere det istedenfor ren start. Lignende for T4 (`9569418b` empty-commit fantes) og Reviewer (REVIEW.md var allerede skrevet). Bra at arbeidet var bevart, men brøt "ren start"-forventning fra prompt.

---

## 🎯 Konkrete forbedringer for K-E / K-F / K-I (neste HYBRID-K)

| # | Tiltak | Hvor |
|---|---|---|
| 1 | Bruk `git worktree add ../K-X-TN-wt -b feat/K-X-TN-... origin/<parent>` fra T1, IKKE shared working tree | T1-prompt steg 0 |
| 2 | plan.md angir "Strategi-konsensus: surgical / full Tolkning D / hybrid" som første linje | /plan-split v5+ Phase 2 |
| 3 | T2-spec sier eksplisitt: "Bevar search.js + #site-search-anchor selv om ZIP ikke har det" | T2-prompt sjekkliste |
| 4 | T2-spec sier eksplisitt: "Footer-tekst på norsk (Personvern/Kontakt), ikke engelsk" | T2-prompt sjekkliste |
| 5 | Slå sammen T3+T4 til én T (cross-verify) — frigjør én T til andre dimensjoner | plan.md tabell |
| 6 | Verify-pipeline pre-flight: clear SW + caches automatisk før første preview | Reviewer-T prompt |

---

## 📊 Statistikk

**Commits utført (mine):**
- T2: `cc49b470` (orphaned) → `7decb044` (origin/feat/K-C-T2-aksjeutvanning)
- T3 fix-1: `452a0ce9` (re-inject search) — fra tidligere økt, gjenbrukt
- T3 fix-2: `9e7af39f` (DOM-align 8 tabs + Personvern/Kontakt)
- T4: `9569418b` (empty docs) — fra tidligere økt, skippet i Reviewer
- Reviewer K-branch HEAD: `960726f2`
- Merge SHA: `e51c86e0`

**Diff totalt (PR #100):**
- `selskap/index.html`: +8/−0 (T1 tabs-utvidelse)
- `selskap/aksjeutvanning/index.html`: +37/−160 (T2 full replace + T3-fix +5/−5)

**Verifikasjoner kjørt:**
- 5 testcases på matte (alle PASS)
- 3 viewports (480, 768, desktop)
- 2 cross-page-audit (i18n + a11y)
- 0 console errors gjennom hele økten

**Læringspunkter til Brain_HV:**
- E140 historikk-entry (10 linjer)
- Ny regel i regler.md ("Strategi-konsensus i plan.md FØR T1+T2 starter")
- Én log-linje
