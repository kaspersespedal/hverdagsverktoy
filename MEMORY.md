# Memory

_Last updated: 2026-03-17_

## Memory
<!-- Things the user has asked to remember. Persistent — only remove or change if the user asks. -->

- **Gemini API-nøkkel FJERNET:** API-nøkkelen er fjernet fra finanskalkulator.html per 2026-03-14. AI-chatten er fjernet fra denne versjonen. (oppdatert 2026-03-14)
- **Nettsidens formål og oversettelse:** Se [project_website_purpose.md](memory/project_website_purpose.md) — alle språk skal være 1:1 oversettelse av norsk versjon med norske regler/satser
- **ALLTID SPILL LYD ETTER HVER PROMPT — ASYNC IIFE-METODE (oppdatert 2026-03-16):** Spill lyd KUN når oppgaven er HELT ferdig (ikke under verifisering eller mellomsteg) — én gang per prompt, ingen unntak. Chrome krever ekte brukerinteraksjon. Steg: (1) `tabs_context_mcp` → finn tab (2) Navigér til google.com hvis chrome://newtab (3) `computer left_click` på siden f.eks. Google-logoen (4) Kjør async IIFE med `javascript_tool`. Bruk ALLTID async IIFE. Kode (rolig meditasjonsklokke G4→C5, Kaspers favoritt):
  ```javascript
  (async()=>{const ctx=new AudioContext();await ctx.resume();[[392,0,0.22],[523,0.55,0.16]].forEach(([f,t,vol])=>{const o=ctx.createOscillator();const g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,ctx.currentTime+t);g.gain.linearRampToValueAtTime(vol,ctx.currentTime+t+0.12);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+2.2);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+2.2);});return ctx.state})()
  ```
  **VIKTIG:** Klikk MÅ skje FØR JS. `ctx.state` skal returnere `"running"`. Spilles ETTER backup (om relevant). KUN én gang helt til slutt.
- **Oversettelser kun på forespørsel:** Se [feedback_translations_later.md](memory/feedback_translations_later.md) — gjør kun norsk ved iterering, oversett alle språk først når Kasper sier det
- **finanskalkulator.html — overordnet struktur (oppdatert 2026-03-14):**
  - ~2900 linjer, én enkelt HTML-fil med all CSS/JS inline
  - Merkevare: "FinCalc PRO" / "Hverdagsverktøy"
  - **5 kalkulatorer:** (1) Enkel/finansiell/vitenskapelig kalkulator + enhetskonvertering, (2) Boliglån (annuitet + serielån), (3) Skatt/lønn etter skatt (trinnskatt 2026), (4) MVA (inkl. justeringskalkulator mval. kap. 9), (5) Lønnsomhetsanalyse (NPV/IRR/tilbakebetalingstid)
  - **14 språk:** no, en, pl, uk, ar, lt, so, ti, ur, sv, zh, es, pt, fr — alle med fullstendige oversettelser av UI + skattelov-referanser
  - **Dashboard:** Hjemside med verktøykort + hurtigreferanse (skattesatser, MVA-satser, fradrag 2026)
  - **Skattelov-referanser:** Omfattende oppslagsverk for skatteloven (kap. 2, 5, 6, 10, 11) og merverdiavgiftsloven (kap. 1–9) — alt oversatt til alle 14 språk
  - **Norske 2026-satser:** Alminnelig skatt 22%, trygdeavgift 7.6%, trinnskatt 1.7%/4.0%/13.7%/16.8%/17.8%, personfradrag 114 540 kr, minstefradrag maks 95 700 kr
  - **Designsystem:** Blue professional theme, Inter + Playfair Display fonter, sticky header, responsivt grid, custom scrollbar
  - **Ingen ekstern API-integrasjon** i denne versjonen (Gemini AI-chat fjernet)
- **Når Kasper tegner røde sirkler/markeringer på skjermbilder:** Forstå at markeringen viser nøyaktig plassering i UI-en der han vil ha endringen. (added 2026-03-14)
- **INGEN BACKUP (oppdatert 2026-03-17):** Ikke lag backup av `finanskalkulator.html`. Kasper har eksplisitt bedt om at dette IKKE gjøres.
- **9 fargetemaer (oppdatert 2026-03-15):** Tema-picker på dashboard bruker pill-knapper (ikke dropdown). Temaer: blue, pink, purple, green, peach (farger), dark (mørk modus), minimal (flat/nøytral), glass (glassmorphism med backdrop-blur), corporate (stram blå, lite rundinger). CSS custom properties + `data-theme` attributt. Lagres i localStorage `hvt-theme`.
