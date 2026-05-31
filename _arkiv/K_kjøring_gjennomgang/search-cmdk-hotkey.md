# Kjøring: search-cmdk-hotkey

**Dato:** 2026-05-27
**Oppgave:** Legge til ⌘K (macOS) / Ctrl+K (Windows/Linux) hotkey for global søk i `shared/search.js`. Bakgrunn fra K-A T3-verify: `index.html:1529` viste `<kbd>⌘</kbd><kbd>K</kbd>`-hint, men handler manglet — kun `/` var implementert.
**Tiltenkt branch:** `feat/search-cmdk-hotkey` fra `origin/feat/redesign-2026-05-full-port`

---

## Hva gikk bra

### 1. Kode-fixen var korrekt
Endringen i `shared/search.js` (linje 787–799) ble gjort presist og kirurgisk:
- Utvidet eksisterende `keydown`-handler i samme `initSearch()`-scope
- Identisk struktur til `/`-handler (samme guard mot INPUT/TEXTAREA/SELECT)
- `(e.metaKey || e.ctrlKey)` dekker både macOS og Windows/Linux
- Brukte `e.key === 'k'` (lowercase som er korrekt for keydown event)
- `preventDefault()` + `focus()` + `select()` matcher eksisterende mønster

### 2. Pre-flight var grundig
- Leste `shared/search.js:780–795` og `index.html:1520–1540` for å bekrefte premiss
- Grep'et `search\.js\?v=` for å mappe alle filer som måtte cache-bustes
- Identifiserte at root `index.html` har egen page-local handler (Cmd+K finnes der allerede på linje 2283)
- Verifiserte branch-base eksisterte før checkout

### 3. Git branch-strategi fulgte CLAUDE.md
Lagde `feat/search-cmdk-hotkey` fra `origin/feat/redesign-2026-05-full-port` i stedet for å committe på en eksisterende branch.

### 4. Annen agent gjorde samme fix riktig (parallell-discovery)
Under min runtime committet en annen agent samme Cmd+K-fix i to commits:
- `a4dfbc60` feat(search): ⌘K/Ctrl+K hotkey + 7 i18n footer/hero keys (K-C T3 follow-up)
- `a9019a43` feat(search): ⌘K/Ctrl+K hotkey for global search input

Min Cmd+K-endring er dermed ALLEREDE i `feat/i18n-fix-home-foot-7-keys` HEAD — kode-målet er nådd, bare ikke via min branch.

---

## Hva gikk dårlig

### 1. KRITISK: PowerShell-script rotet i andre agenters worktrees
Mitt bulk-bump-script for cache-bust hadde feil exclude-filter:
```powershell
Where-Object { $_.Name -notlike "*-old.html" -and $_.FullName -notlike "*\kjøring\*" -and $_.FullName -notlike "*\_incoming\*" -and $_.FullName -notlike "*\audit\*" -and $_.FullName -notlike "*\split_skill\*" }
```
Manglet `*\.claude\*` exclusion. Scriptet gikk rekursivt inn i `.claude/worktrees/` og endret **~1400 HTML-filer på tvers av 16 agent-worktrees**:
- Cache-bust `search.js?v=v28/v29/v30` → `v125` (mitt mål)
- UTF-8 BOM strippet fra alle filene (PowerShell `[System.Text.UTF8Encoding]::new($false)` write-bug)

**Lærdom:** Når PowerShell-script gjør recursive file write, MÅ exclude-filter eksplisitt inkludere `.claude/`, `node_modules/`, `.git/`, og andre interne mapper.

### 2. PowerShell UTF-8 BOM-bug
`[System.Text.UTF8Encoding]::new($false)` skriver UTF-8 UTEN BOM. Original filer i repo har UTF-8 MED BOM. Mitt write fjernet BOM fra hver fil → ekstra diff-linje på linje 1 av hver fil, parallelt med min faktiske cache-bust endring.

**Lærdom:** Read med `Get-Content -Raw -Encoding UTF8` returnerer string uten BOM-info. For BOM-bevarende write, bruk byte-level read/write eller `[System.IO.File]::ReadAllText`/`WriteAllText` med encoding som matcher original (eller bruk Edit-verktøyet for kirurgiske endringer).

### 3. Første revert-script var for streng
Mitt første revert-script krevde `plus==1 && minus==1 && mine==2` (1 endret linje, kun min). Men ALLE filer hadde plus=2/minus=2 (BOM + search.js). Scriptet SKIPPED dermed alt og reverterte 0 filer. Måtte kjøre nytt script med relaxed kriterium.

**Lærdom:** Revert-kriterier må matche det FAKTISKE diff-mønsteret (inkludert sideeffekter som BOM-stripping), ikke det IDEELLE mønsteret.

### 4. Hovedrepo branch byttet under min runtime (uavhengig)
`git symbolic-ref HEAD` viste at hovedrepo skiftet fra `feat/search-cmdk-hotkey` → `feat/K-A-T1-shell` → `feat/i18n-fix-home-foot-7-keys` mens jeg jobbet. En parallell agent (eller automasjon) eierte hovedrepo og byttet branches. Min uncommitted HTML-bump-endringer ble auto-stashed og senere reverted.

**Lærdom:** Når flere agenter/prosesser jobber på samme repo parallelt, kan branch-state endre seg uten varsel. Verifiser HEAD med `cat .git/HEAD` eller `git symbolic-ref HEAD` (ikke bare `git branch --show-current` som kan vise cached info).

### 5. Verify-steget aldri kjørt
Plan var å verifisere ⌘K-fokus i preview på localhost:8082. Aldri kjørt fordi:
- Branch-instabilitet gjorde at jeg ikke visste hvilken state preview ville servere
- Skader på worktrees krevde recovery først
- Annen agent committet samme fix uavhengig (verify burde gjøres på deres commit)

**Lærdom:** Verify må komme FØR bulk cache-bust hvis det er noen risiko i bulk-operasjonen.

### 6. Branch hadde 0 commits
Min `feat/search-cmdk-hotkey` ble laget men aldri committet på grunn av rotet med worktrees + branch-byttet. Branchen pekte på samme commit som base og ble slettet uten tap.

**Lærdom:** Commit ofte, særlig før bulk-operasjoner. Hvis kode-fixen var committet umiddelbart etter `shared/search.js` Edit (før cache-bust), ville den vært bevart.

---

## Endelig tilstand

| Komponent | Status |
|---|---|
| `shared/search.js` Cmd+K-fix | ✅ Committed i `a9019a43` (annen agent) |
| HTML cache-bust | ❌ Ikke gjort i noen branch |
| Stash@{1} duplikat | ✅ Dropped |
| `feat/search-cmdk-hotkey` branch | ✅ Slettet (var tom) |
| Worktree-skader (~1400 filer) | ✅ 1089 reverted, 0 skipped (alle andre filer var allerede rene da scriptet kjørte) |
| Verify i preview | ❌ Ikke gjort |

## Anbefalt oppfølging (separat oppgave)

1. **Verify ⌘K i preview** på commit `a9019a43` (annen agents fix er sammenlignbar med min — bekreft Cmd+K og Ctrl+K fokuserer søke-input).
2. **HTML cache-bust** for `shared/search.js` — bør gjøres via kirurgisk script som:
   - Eksplisitt ekskluderer `.claude/`, `node_modules/`, `.git/`, `kjøring/`
   - Bevarer UTF-8 BOM (byte-level eller Edit-verktøy)
   - Kjøres på en ren branch uten parallell-aktivitet
3. **Dedupe `shared/top-chrome.js:479`** — annen agents commit-message nevner pre-eksisterende `⌘K`-handler der som targets feil ID (`#search-input` istedenfor `#searchInput`). Egen ryddeoppgave.
