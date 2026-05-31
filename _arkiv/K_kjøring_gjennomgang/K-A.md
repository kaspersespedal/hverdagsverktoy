# K-A — Homepage pilot (root `index.html`)

**Dato:** 2026-05-27
**Modell:** Claude Opus 4.7
**Terminaler kjørt:** T1 → T2 → T3 → T4 → Reviewer
**Resultat:** PR [#101](https://github.com/kaspersespedal/hverdagsverktoy/pull/101) — **47 linjer** REFINE-CSS-polish
**Tidsbruk:** ca. 45 min total

---

## Hva K-A skulle gjøre (forventning)

K-A var **pilot** for ny strategi: én K = én side dypt portet i 4 dimensjon-terminaler sekvensielt.

Plan-spec'en sa hver T skulle gjøre dyp port-arbeid:
- **T1 SHELL:** Replace nav-wrap + tabs-wrap + footer fra ZIP Homepage.html (90 min, stor DOM-rewrite)
- **T2 ATMO:** Port 4-layer atmosphere-stack inline + aktivér top-chrome (60 min)
- **T3 I18N:** Re-injekter 29 data-i18n + verify search/a11y/mobile (75 min)
- **T4 ANIM:** Verify animasjoner + ticker + 3 matte-testcases (60 min)
- **Reviewer:** Cherry-pick alle 4 + PR (90 min)

Total forventning: ~6 timer arbeid, 4 separate commits, kompleks cherry-pick-merge.

---

## Hva K-A faktisk gjorde (resultat)

| T | Faktisk arbeid | Commit |
|---|---|---|
| T1 | Nav-wrap + footer var **allerede 1:1** med ZIP. Portet kun REFINE-2026-05-CSS-delta. | 47L `74ee6416` |
| T2 | Atmosphere allerede portet i E80-E83. Verify-only. | NO-OP |
| T3 | i18n + search + a11y allerede ✅. 2 issues flagget utenfor scope. | NO-OP |
| T4 | Animasjoner + ticker alle ✅. Spec henviste til ikke-eksisterende rentemøte-countdown. | NO-OP |

**Total:** 1 commit, 47 linjer typografi-polish.

---

## ✅ Hva som gikk bra

### 1. Dyp diff før commit — fanget at arbeidet allerede var gjort
Da T1-prompten sa "port nav-wrap + footer fra ZIP", grep'et jeg faktisk live vs ZIP først i stedet for å porte blindt. Fant at de var 1:1 identiske allerede. Sparte timer av tom port-arbeid + unngikk overskriving av eksisterende `data-i18n`-attribs.

**Læring:** Premissjekk-grep er den viktigste pre-flight-stegen. Spec'er kan lyve om hva som mangler.

### 2. Brukeravklaring ved tvetydig spec
T1-spec'en var internt inkonsistent (henviste til Subpage Preview-linjer mens source-fil var Homepage.html). Stoppet og spurte i stedet for å gjette → fikk Tolkning D fra deg → klart scope.

**Læring:** `feedback_ask_upfront.md` virker. Stopp og spør når noe er uklart, ikke gå 10 diagnostiske runder.

### 3. NO-OP'er ble erkjent og dokumentert, ikke maskert
T2, T3, T4 var alle NO-OP. I stedet for å oppfinne noe å committe for å rettferdiggjøre terminalen, skrev jeg NO-OP-summary og slettet ubrukte branches. Reviewer fikk renere historikk.

**Læring:** En tom branch er ikke et nederlag. Det er et signal om at pre-arbeid var solid.

### 4. Spawn-tasks for issues utenfor scope
T3 fant 7 manglende i18n-keys + ⌘K hotkey ikke wired. I stedet for å crosse scope-grensen (no.js + search.js read-only), spawnet jeg follow-up-chips. Du har dem i UI'en nå.

**Læring:** Hold scope tight. Flagg, ikke fiks.

### 5. Branch-rot håndtert uten tap
T1's første commit landet på feil branch (`feat/K-J-T3-i18n-a11y`) pga parallell session. Cherry-picket til riktig branch, reset K-J-T3 til origin (kun lokalt, trygt) — ingen K-J-arbeid berørt.

**Læring:** Lokale reset --hard er trygge når target er origin. Sjekk alltid om branch er pushet før destruktive ops.

### 6. Reviewer holdt seg unna parallell-arbeid
Working tree hadde 78+ filer modifisert fra andre agenter (spawn-task + K-D-T2-wt worktree). I stedet for å rydde eller forstyrre, stashet jeg kun mine egne lang-filer og lot resten ligge. PR fikk kun T1's 47L.

**Læring:** Når du ser massiv parallell-aktivitet, gjør det minimum nødvendige og ikke "rydd opp" for andre.

---

## ❌ Hva som gikk dårlig

### 1. Plan-spec'en gjorde IKKE pre-flight-grep mot live
Hovedproblemet. `/plan-split` v1.5 forutsatte at root manglet shell-port, atmosphere-port, i18n-port, animasjon-port. Faktisk: alt var portet 99% allerede (E80-E83 + E136-arbeid). Planen genererte 4 timer arbeid for noe som krevde 15 minutter.

**Rot-årsak:** Plan-skribent leste ZIP og antok "live mangler dette" uten å verifisere mot live. ~310L head-delta ble tolket som "T2 må porte" — i realiteten var det legacy orb-CSS som ZIP selv markerer som "removed when atmosphere ports in".

**Fix-forslag:** `/plan-split` v1.6 må gjøre `grep` av live for hver hypotetisert mangel og bare inkludere T'er der faktisk delta > terskel.

### 2. T-prompts hadde feil linjenumre
T1-prompten henviste til "Homepage.html linje 2192-2205" for nav-wrap. De linjenumrene matchet **Subpage Preview.html**, ikke Homepage. Spec-skribent forvirret to filer. Først tolket jeg det som "kanskje source er Subpage Preview" → satte i gang feil retning.

**Fix-forslag:** Plan-skribere må grep både ZIP-source og live for nøyaktige linjer FØR de skriver T-prompt.

### 3. Spec'en henviste til ikke-eksisterende features
T4-spec sa "verify rentemøte-countdown" og plan-rad T1 sa "Bevart: ... + rentemøte-countdown". **Finnes ikke** — verken i live eller i ZIP. Spec-skribent forvirret med `#dailyDate` + `#dailyStamp` (statisk dato/timestamp).

**Fix-forslag:** Hver feature nevnt i en spec må grep'es mot kilden FØR specen godkjennes.

### 4. Branch-switching mellom parallelle sessions er fragile
Mellom min `git checkout -b feat/K-A-T1-shell` og første commit, switchet aktivt branch til en parallell K-J-T3-sesjon. Commit landet på feil branch. Det var redder-bart, men det skjedde i utgangspunktet fordi flere K-runner deler samme working dir.

**Fix-forslag:** Hver K bør kjøre i sin egen `git worktree` for å unngå active-branch-kollisjoner. K-D bruker dette (K-D-T2-wt på port 8110). K-A burde gjort det samme.

### 5. Preview-router var sticky på feil URL
Etter at preview-vinduet ble navigert til `/selskap/aksjeutvanning/` (sannsynligvis fra en tidligere agent), klarte mine `window.location.assign('http://localhost:8082/index.html')` ikke å bli sittende på root. Sannsynligvis site-shell.js eller localStorage-route som intercepter.

**Fix-forslag:** preview_eval støtter ikke clean state-reset. Trenger en `preview_reset_route` eller manuell clearing av localStorage før navigering. Workaround: gjør verify via Read/Grep på source-fil i stedet for live preview når routeren er forvirret.

### 6. Reviewer-prompt forutsatte 4 T-commits
Reviewer-prompt sa "cherry-pick T1+T2+T3+T4 i rekkefølge". Med kun T1 som faktisk commit, ble cherry-pick-flowen overflødig. Skapte forvirring om hva K-A-homepage-perfekt-port-branch skulle gjøre.

**Fix-forslag:** Reviewer-prompt bør si "cherry-pick available commits — hvis bare 1 finnes, PR direkte". Allerede gjort i denne kjøringen, men neste plan bør reflektere det.

### 7. K-A pilot ga liten leverage for innsats
6 timer (4 T + Reviewer) planlagt, 45 min faktisk, leveranse: 47L typografi-polish. Hvis K-B til K-J er like 99% portet, vil K-pattern fortsette å bruke ressurser på verify uten reell port-arbeid.

**Fix-forslag:** Inverter strategien. Start med pre-flight grep mot ZIP for alle 9 gjenværende sider. Lag prioritert delta-liste. Bruk K-pattern KUN for sider med faktisk stor delta. Direct-fix små deltaer.

---

## Læring til neste K-runde

1. **Pre-flight grep alltid før plan-skriving.** `/plan-split` v1.6 må sammenligne live vs ZIP for hver hypotetisert mangel og bare inkludere T'er med ekte delta.
2. **Verifiser at features finnes** i både live og ZIP før de inkluderes i spec.
3. **Worktree per K** for å unngå branch-switching-kollisjoner.
4. **Tillat NO-OP T'er** eksplisitt i Reviewer-prompt (cherry-pick av N tilgjengelige commits, ikke alltid 4).
5. **Inverter strategi:** Hvis side er ~99% portet, gjør direct-fix, ikke 4-dim K-pattern.
6. **K-pattern reserveres** for sider med >500L faktisk delta (eks. K3 half-measure subpages).

---

## Faktisk leveranse

- ✅ PR [#101](https://github.com/kaspersespedal/hverdagsverktoy/pull/101) klar for merge (47L `.lang-menu h5` + section-comments)
- ✅ 2 follow-up-chips spawnet (7 i18n-keys + ⌘K-hotkey)
- ✅ 4 + 1 summary-filer dokumentert i `kjøring/K-A/`
- ✅ REVIEW.md med pattern-validering i `kjøring/K-A/Terminal Reviewer/REVIEW.md`
