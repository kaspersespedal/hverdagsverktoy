# K-D — Avgift landing perfekt-port — Gjennomgang

**Dato:** 2026-05-27
**Scope:** `avgift/index.html` (parking-page: MVA + AGA + Dokumentavgift info)
**Pattern:** Ny 1-side-K-strategi (K3-half-measure + K4-full-sweep forkastet) — 4 dimensjon-T sekvensielt + Reviewer
**Sluttilstand:** PR [#99](https://github.com/kaspersespedal/hverdagsverktoy/pull/99) ✅ MERGET som `7352d97f` mot `feat/redesign-2026-05-full-port`
**Diff:** `avgift/index.html` 1136L → 1046L (−90 linjer)

---

## ✅ Det som gikk BRA

### 1. Cherry-pick var deterministisk
Reviewer cherry-pick av alle 4 T-commits produserte **byte-identisk** fil med T4-worktree (md5: `ed7b88be74c826fd1d8a4695e8f879e8`). 0 konflikter. Det betyr at sekvensiell-T-pattern (T1→T2→T3→T4 alltid bygd på forrige) er **pålitelig reproducerbar**.

### 2. 0 console errors gjennom HELE prosessen
Fra T1 første preview til Reviewer cross-verify — ingen JS-feil oppstod. Inline IIFE-cleanup (T2) brøt ingen ting fordi null-guards var på plass fra start.

### 3. Worktree-strategi fra T2 unngikk all race
Da T1 hadde race (main worktree switchet av parallell K-J-sesjon), tok jeg lærdommen umiddelbart: T2+T3+T4+Reviewer brukte alle dedikerte worktrees (`../K-D-T2-wt` osv.). **Null race-issues etter T1.**

### 4. Reality-check oppdaget at T2-spec var foreldet
T2-prompt antok atmosphere CSS+DOM måtte portes fra ZIP. Grep av eksisterende fil viste at det **allerede var ved canonical-state** (via E83-tokens — mer komplett enn ZIP). T2 ble omdefinert til cleanup-only. Dette sparte 30+ min unødvendig duplikat-arbeid og forhindret introduksjon av regression.

### 5. Bevisste divergenser ble dokumentert med begrunnelse
Hver T som avvek fra spec dokumenterte det i summary.md med rationale:
- Footer KEPT (ikke ZIP-erstattet) — fl-* IDs trengs av core.js setText for i18n
- 9 tabs (ikke peer-skatts 6) — K-D er "perfekt-port"
- Tab-i18n droppet — peer-pattern (site-wide change out of scope)

Reviewer hadde komplett oversikt over alle avvik → ✅ GO uten spørsmål.

### 6. Empty-commit-strategi bevarte milestone-chain
T3+T4 var verify-only → brukte `git commit --allow-empty`. Det bevarte chain-en (T1→T2→T3→T4) i git-log slik at Reviewer kunne cherry-picke alle 4 + verify-rapport blir dokumentert i commit-msg. Renere enn å hoppe over T-er.

### 7. Hver T's summary.md ga klar overlevering
Strukturert oppskrift: status + commit-hash + verify-bevis + endringer + bevisst-divergens + notat-til-neste-T. Neste T trengte ikke spørre om noe.

### 8. Reviewer-flow var smooth
Cherry-pick (4/4 clean) → cross-verify (alle dimensjoner) → REVIEW.md → push → `gh pr create` → merge → cleanup. Alt i én smooth gjennomgang uten blokkere.

### 9. /save-w + merge + cleanup ferdig samme sesjon
Etter PR-create kom `/save-w` rollup (historikk E139 + log) + merge + worktree-remove + local branch-delete + preview-server-stop. **Ingen "skitten" tilstand igjen** (bortsett fra launch.json-entries som er kosmetisk).

---

## ❌ Det som gikk DÅRLIG

### 1. T1 race-condition på main worktree (5-10 min tap)
Parallell K-J-sesjon switchet main worktree fra `feat/K-D-T1-shell` til `feat/K-J-T1-shell` mellom min `git checkout -b` og min `Edit`. Edit havnet derfor på K-J-branch.

**Konsekvens:** Måtte `git stash push` → `git checkout feat/K-D-T1-shell` → `git stash pop` → verify fil-state → committe. **Risiko for fil-corruption** hvis stash-pop hadde hatt konflikter.

**Rotårsak:** Brukte ikke worktree fra T1. T-prompt sa `git checkout -b` (single-worktree-pattern) istedenfor `git worktree add` (isolert).

**Lærdom:** Bruk `git worktree add` **fra T1**, ikke vente til T2. Pattern: `git worktree add ../K-X-TN-wt -b feat/K-X-TN-... origin/<parent>`.

### 2. Service Worker cachet pre-port HTML (10+ min debug)
PWA service worker registrert på `http://localhost:8082/` returnerte **gammel HTML** fra cache selv etter:
- File saved (verified via grep — disk hadde nye 9 tabs)
- `window.location.reload()`
- Cache-bust querystring (`?cache=` + timestamp)
- Direct curl bypass viste at SERVER returnerte ny HTML

**Konsekvens:** Brukte 10+ min på å mistenke at fil-edit ikke virket. Måtte manuelt `navigator.serviceWorker.getRegistrations().then(r => r.unregister())` + `caches.delete()` for å se nye endringer.

**Lærdom:** SW må unregistreres som første preview-step i nye worktrees. Eller: bytt til en worktree-spesifikk port (8110-8113 fungerte) som har egen SW-scope.

### 3. Screenshot timeout konsekvent (T1, T2, T4)
`preview_screenshot` timer ut etter 30s flere ganger — trolig pga atmosphere CSS-animasjoner som overbelaster renderer. Måtte stole på `preview_snapshot` (text-based a11y-tre) i stedet for visual proof.

**Konsekvens:** Ingen visual diff-bevis for PR. Måtte beskrive "ser ut som forventet" basert på snapshot-tre alene.

**Lærdom:** Disable atmosphere via `preview_eval` (sett `animation: none`) FØR screenshot. Eller: bruk `preview_snapshot` som primær verify-metode.

### 4. T2-spec antok port-arbeid som var unødvendig
T2-prompt sa "Adder atmosphere CSS-blokker + DOM-stack" — men begge var **allerede ved canonical-state**. Spec ble dermed misvisende. Hvis jeg hadde fulgt spec literalt ville jeg lagt til DUPLIKAT CSS som ville brutt theme-tokens.

**Konsekvens:** Måtte grep-verifisere eksisterende state manuelt + omdefinere T2 til cleanup-only. T2-summary måtte forklare hvorfor scope ble endret.

**Lærdom:** /split-n/K-spec-skriver må grep eksisterende state **FØR** work-estimat. Pattern matcher [[feedback_split_n_spec_rigor]] som allerede er lagret.

### 5. T3-spec referte ikke-eksisterende global
`typeof window.openSearch === 'function'` returnerte `"undefined"`. Faktisk eksposisjon av search.js v30 er via `window.onsearch` + `window.hvtSearchInvalidate` + event-handlers.

**Konsekvens:** Måtte gjette alternativ verify (hotkey-fokus-test) for å bevise at search faktisk virker.

**Lærdom:** Verify-spec bør refere til verifiserbare invariants (event-effekter), ikke globals med usikre navn.

### 6. Maks 5 preview-servers blokkerte Reviewer-start
`preview_start K-D-review-wt` feilet med "Maximum 5 servers per worktree". Måtte enten stoppe en eksisterende eller stole på at K-D-T4-server (8113) viste byte-identisk fil.

**Konsekvens:** Reviewer brukte T4-server som proxy istedenfor egen review-server. Risiko: hvis Reviewer hadde forskjellig fil enn T4 hadde ikke verify oppdaget det. (Heldigvis verifiserte jeg md5-likhet før shortcut.)

**Lærdom:** Cleanup gamle preview-servers før neste T. Eller: vurder å heve cap (5 er lavt for K-pattern med 5 worktrees + 1 main).

### 7. Launch.json shared mellom parallelle sessions
Annen session la til `K-J-T4-wt` på launch.json mens jeg jobbet. Edit-tool varsler om dette, men risikoen for race på selve config-filen er reell.

**Konsekvens:** Ingen i denne sesjonen, men risiko ved samtidige writes.

**Lærdom:** Vurder en append-only-pattern for launch.json eller per-worktree config.

### 8. Tunge summary.md-filer (5KB+ hver)
T1/T2/T3/T4-summaries + REVIEW.md ble alle lange. Disse er ikke i token-budget for /save-w, men de tar plass i `kjøring/K-D/`. Hvis kjøring/-mappa skal slettes etter merge, blir mye prosa-arbeid kastet.

**Lærdom:** Vurder å kondensere summaries til mindre format ETTER PR er merget, eller bare commite hovedlæringer til Brain_HV (allerede gjort via E139).

### 9. K-D Reviewer-prompt hadde fuzzy quote-syntaks
`gh pr create --body "..."` med embedded markdown + emojis fungerte heldigvis via HEREDOC-pattern fra Bash-skill, men prompt-en hadde ingen eksplisitt HEREDOC-eksempel. Liten risiko for escape-issues.

**Lærdom:** K-Reviewer-prompts bør eksplisitt ha HEREDOC-eksempel for `gh pr create --body`.

### 10. .claude/launch.json beholdt K-D-entries etter cleanup
Etter cleanup ble launch.json-entries for K-D-T2/T3/T4/review **ikke fjernet**. Kosmetisk issue — config-fila vokser. Annen session må ikke se K-D-entries når de er borte.

**Lærdom:** Cleanup-step bør inkludere fjerning av launch.json-entries for ferdige worktrees.

---

## 🔄 Forslag til neste K-session (K-A, K-B, K-E, ..., K-J)

### Adopter umiddelbart:
1. **Worktree fra T1** — `git worktree add ../K-X-T1-wt -b feat/K-X-T1-... origin/<parent>` (skill /plan-split bør generere dette)
2. **SW-unregister som T1-step 0a** — `navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))` før første preview_eval
3. **Grep eksisterende state FØR work-estimat** — T-spec-skriver må verifisere at jobben faktisk ikke er gjort allerede
4. **HEREDOC eksempel i Reviewer-prompt** — `git commit -m "$(cat <<'EOF' ... EOF)"` og `gh pr create --body "$(cat <<'EOF' ... EOF)"` pattern explicit

### Vurder for fremtid:
1. **Slå sammen T3+T4 til én verify-T?** — Hvis T1+T2 alltid dekker mesteparten av arbeidet, blir T3+T4 ofte empty-commits. En kombinert "T3 Verify" kunne være mer effektiv.
2. **K-Reviewer skript som automatiserer cherry-pick + push + PR-create** — Less manual git-magic.
3. **Sats-research som integrert T-step** — I stedet for å flagge som "out of scope", kjør `/research` for kritiske sats-verdier som del av T4.

---

## 📊 Tids-estimat vs faktisk

| T | Estimat | Faktisk | Diff |
|---|---|---|---|
| T1 SHELL | 75 min | ~35 min (inkl race-handtering) | −40 min |
| T2 ATMO | 50 min | ~15 min (cleanup-only) | −35 min |
| T3 i18n/a11y | 60 min | ~20 min (verify-only) | −40 min |
| T4 sats | 50 min | ~10 min (verify-only) | −40 min |
| Reviewer | 75 min | ~15 min (clean cherry-pick) | −60 min |
| **Total** | **310 min** | **~95 min** | **−215 min (69% raskere)** |

Faktisk var **drastisk** raskere enn estimat — primært fordi T2 og T3+T4 var enklere enn antatt (atmosphere allerede portet + i18n allerede komplett).

**Lærdom:** Estimater for K-D type sessions er for konservative. Atmosphere-already-canonical + i18n-already-complete bør være "common case", ikke unntak.

---

## 🎯 Sluttkarakter

**8/10**

**Bra:** Smooth flow, 0 console errors, 0 cherry-pick-konflikter, dokumentasjon i Brain_HV, alle dimensjoner verifisert.

**Trekk:** T1 race-condition (kunne vært unngått) + SW-cache debug-tid (kunne vært unngått) + screenshot ikke fungerte (irriterende men ikke blokkerende).

**Anbefalt for produksjon:** Ja, med tilpassinger ovenfor for fremtidige K-sessions.
