/* ═══════════════════════════════════════════════════════════
   Hverdagsverktøy — Timer (nedtelling 1–50 min)

   Én motor, to skinn. Monteres på hvert element med [data-hv-timer]:
     data-variant="full"     → kortet på /kalkulator/timer/
     data-variant="compact"  → popover-en under timer-pilla på forsiden

   Hvorfor alt ligger i denne fila (også CSS-en):
   Timeren finnes to steder med to størrelser. Hadde stilen ligget i et
   eget stilark og markupen i to HTML-filer, ville de to kopiene drevet
   fra hverandre — samme felle som søkefeltet gikk i (E192). Her er det
   én kilde: JS bygger DOM-en og injiserer stilen, og de to variantene
   skiller seg bare på noen få størrelses-tokens.

   Bakgrunnstiden: nettleseren struper setInterval til ~1/min i faner som
   ikke er synlige, så en ren JS-nedtelling ville ringt opptil et minutt
   for sent. Lyden planlegges derfor på AudioContext-klokka (sample-
   nøyaktig og upåvirket av strupingen), mens intervallet kun oppdaterer
   det man ser. Se armAudio()/reconcile().

   Ingen lydfiler: alle ni lydene synthes med Web Audio, så de virker
   offline og koster ingen nedlasting.
   © 2026 Hverdagsverktøy.
   ═══════════════════════════════════════════════════════════ */

(function(){
'use strict';

var MIN_M = 1, MAX_M = 50, DEF_M = 20;
var PRESETS = [5, 10, 15, 20, 25, 45];
var LS_STATE = 'hvt-timer', LS_SOUND = 'hvt-timer-snd', LS_TONE = 'hvt-timer-tone';
var DEF_SND = 'sus';
var TICK_MS = 200;
var R_RING = 44, C_RING = 2 * Math.PI * R_RING;

/* ─── Oversettelse ───────────────────────────────────────────
   R() kommer fra core.js. Samme hjelper som search.js bruker. */
function T(key, fallback){ try { var v = R()[key]; return v || fallback; } catch(e){ return fallback; } }

/* Merker elementet for i18n-motoren i core.js OG skriver teksten nå.
   _hvtI18nTextOrig settes eksplisitt til den norske teksten, slik at
   fallbacken ved en manglende nøkkel alltid blir norsk — ikke det
   språket som tilfeldigvis var aktivt da elementet ble bygget. */
function label(el, key, no){
  if(!el) return el;
  el.setAttribute('data-i18n', key);
  el._hvtI18nTextOrig = no;
  el._hvtI18nTextApplied = undefined;
  el.textContent = T(key, no);
  return el;
}

function clampMin(m){
  m = Math.round(Number(m) || 0);
  return m < MIN_M ? MIN_M : (m > MAX_M ? MAX_M : m);
}
function fmt(ms){
  var s = Math.max(0, Math.ceil(ms / 1000));
  var m = Math.floor(s / 60);
  s = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

/* ═══════════════ LYD ═══════════════════════════════════════
   Ni klanger å velge mellom, fra et sus som knapt merkes til et pip som
   river deg ut av det du holder på med. Valget ligger i localStorage og
   gjelder begge stedene timeren finnes — popover-en på forsiden har ingen
   velger, men følger det som er valgt på timer-siden.

   Alle ni bygges av de samme tre klossene: voice() lager én tone med sine
   overtoner, noise() anslaget (klubba, kolven, den lille knepsen), og
   lowpass() tar av det skarpeste. Hver lyd er en ren funksjon av (klokke,
   starttid, utgang, node-liste) — derfor kan de planlegges fram i tid på
   lydklokka nøyaktig som den ene klangen kunne før.

   Nivåene er ikke satt på øret: alle ni er rendret offline og målt A-vektet
   (slik øret veier frekvenser mot hverandre), og åtte av dem ligger innenfor
   3,5 dB. «Mykt sus» er bevisst lagt noen dB under — den skal være diskret.
   Endrer du en styrke, mål på nytt: rått utslag lyver, en dyp og en lys tone
   med samme utslag høres ikke like sterke ut. */
var ctx = null, soundNodes = [], demoNodes = [], armed = null;

function audio(){
  if(ctx) return ctx;
  var AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  try { ctx = new AC(); } catch(e){ ctx = null; }
  return ctx;
}
function wake(){
  var c = audio();
  if(c && c.state === 'suspended'){ try { c.resume(); } catch(e){} }
  return c;
}

/* ── klosser ── */
function lowpass(c, dest, freq, q, list){
  var f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q;
  f.connect(dest); list.push(f);
  return f;
}
/* Én tone: grunntone + overtoner, hver med sin egen utklang.
   partial = [forhold, styrke, utklang-faktor, svevning]. Svevningen er en
   tvilling like ved unisont; den gir den langsomme dirringen ekte metall har. */
function voice(c, dest, at, f, peak, attack, decay, partials, list){
  for(var i = 0; i < partials.length; i++){
    var p = partials[i];
    var d = decay * (p[2] === undefined ? 1 : p[2]);
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * p[1]), at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + d);
    g.connect(dest); list.push(g);
    var o = c.createOscillator();
    o.type = 'sine'; o.frequency.value = f * p[0];
    o.connect(g); o.start(at); o.stop(at + d + 0.05);
    list.push(o);
    if(p[3]){
      var o2 = c.createOscillator(), g2 = c.createGain();
      o2.type = 'sine'; o2.frequency.value = f * p[0] * p[3];
      g2.gain.value = 0.55;
      o2.connect(g2); g2.connect(g);
      o2.start(at); o2.stop(at + d + 0.05);
      list.push(o2, g2);
    }
  }
}
/* Kort støypuls gjennom et smalt filter — selve anslaget. */
function noise(c, dest, at, gain, freq, q, dur, list){
  var len = Math.max(1, Math.floor(c.sampleRate * dur));
  var buf = c.createBuffer(1, len, c.sampleRate);
  var d = buf.getChannelData(0);
  for(var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  var src = c.createBufferSource(); src.buffer = buf;
  var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
  var g = c.createGain(); g.gain.value = gain;
  src.connect(bp); bp.connect(g); g.connect(dest);
  src.start(at);
  list.push(src, bp, g);
}

/* ── de ni ──
   Rekkefølgen er stigende påtrengenhet, og den er også rekkefølgen i
   velgeren. id-ene lagres i localStorage og må derfor ligge fast. */
var SOUNDS = [
  {
    id: 'sus', key: 'timerSoundSus', no: 'Mykt sus',
    /* Uten anslag: akkorden toner inn over 1,2 s mens filteret åpner seg,
       og lukker seg igjen på vei ut. */
    build: function(c, t0, dest, list){
      var f = c.createBiquadFilter();
      f.type = 'lowpass'; f.Q.value = 0.7;
      f.frequency.setValueAtTime(380, t0);
      f.frequency.linearRampToValueAtTime(1900, t0 + 1.7);
      f.frequency.linearRampToValueAtTime(600, t0 + 4.8);
      f.connect(dest); list.push(f);
      var notes = [[196.00, 0.226], [261.63, 0.165], [329.63, 0.133], [523.25, 0.085]];
      for(var i = 0; i < notes.length; i++){
        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(notes[i][1], t0 + 1.25 + i * 0.12);
        g.gain.setValueAtTime(notes[i][1], t0 + 2.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.8);
        g.connect(f); list.push(g);
        var o = c.createOscillator();
        o.type = 'sine'; o.frequency.value = notes[i][0];
        o.connect(g); o.start(t0); o.stop(t0 + 4.9); list.push(o);
        var o2 = c.createOscillator(), g2 = c.createGain();
        o2.type = 'sine'; o2.frequency.value = notes[i][0] * 1.0035;
        g2.gain.value = 0.5;
        o2.connect(g2); g2.connect(g);
        o2.start(t0); o2.stop(t0 + 4.9); list.push(o2, g2);
      }
    }
  },
  {
    id: 'bolle', key: 'timerSoundBowl', no: 'Syngeskål',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 1500, 0.5, list);
      noise(c, f, t0, 0.05, 240, 1.1, 0.05, list);
      voice(c, f, t0, 174.61, 0.30, 0.05, 6.8,
        [[1, 1, 1, 1.004], [2.74, 0.55, 0.78], [5.36, 0.25, 0.55], [8.93, 0.09, 0.40]], list);
    }
  },
  {
    id: 'klang', key: 'timerSoundChime', no: 'Klang',
    /* Den timeren hadde før velgeren kom: to toner en ren kvint fra
       hverandre, og så det samme én gang til, litt svakere. */
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 2300, 0.6, list);
      var phrase = [{f: 523.25, t: 0.00, g: 1.00}, {f: 783.99, t: 0.55, g: 0.88}];
      var partials = [[1, 1], [2, 0.18], [3.01, 0.06]];
      var repeats = [{t: 0.0, g: 1.0}, {t: 3.2, g: 0.74}];
      for(var r = 0; r < repeats.length; r++){
        for(var n = 0; n < phrase.length; n++){
          var note = phrase[n];
          var at = t0 + repeats[r].t + note.t;
          var peak = 0.19 * note.g * repeats[r].g;
          var env = c.createGain();
          env.gain.setValueAtTime(0.0001, at);
          env.gain.exponentialRampToValueAtTime(peak, at + 0.03);
          env.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
          env.connect(f); list.push(env);
          for(var p = 0; p < partials.length; p++){
            var o = c.createOscillator(), pg = c.createGain();
            o.type = 'sine';
            o.frequency.value = note.f * partials[p][0];
            pg.gain.value = partials[p][1];
            o.connect(pg); pg.connect(env);
            o.start(at); o.stop(at + 3.3);
            list.push(o, pg);
          }
        }
      }
    }
  },
  {
    id: 'spill', key: 'timerSoundBox', no: 'Spilledåse',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 6200, 0.4, list);
      var partials = [[1, 1, 1], [2.03, 0.28, 0.70], [3.42, 0.11, 0.50], [5.70, 0.045, 0.38]];
      var notes = [[1046.50, 0.00, 1.25, 0.124], [1318.51, 0.15, 1.25, 0.117],
                   [1567.98, 0.30, 1.30, 0.117], [2093.00, 0.45, 2.30, 0.131]];
      for(var i = 0; i < notes.length; i++){
        var at = t0 + notes[i][1];
        noise(c, f, at, 0.026, 5200, 2.2, 0.012, list);
        voice(c, f, at, notes[i][0], notes[i][3], 0.004, notes[i][2], partials, list);
      }
    }
  },
  {
    id: 'marimba', key: 'timerSoundMarimba', no: 'Marimba',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 4200, 0.5, list);
      /* Overtonen på 3,93 er marimbaens egen: staven er skåret slik at den
         ligger nær to oktaver over grunntonen, og det er den som gjør
         klangen treaktig i stedet for metallisk. */
      var partials = [[1, 1, 1], [3.93, 0.20, 0.45], [9.20, 0.045, 0.28]];
      var figure = [[523.25, 0], [659.25, 0.13], [783.99, 0.26]];
      var reps = [[0, 1], [1.20, 0.68]];
      for(var r = 0; r < reps.length; r++){
        for(var n = 0; n < figure.length; n++){
          var at = t0 + reps[r][0] + figure[n][1];
          noise(c, f, at, 0.040 * reps[r][1], 1800, 1.4, 0.014, list);
          voice(c, f, at, figure[n][0], 0.25 * reps[r][1], 0.006, 0.62, partials, list);
        }
      }
    }
  },
  {
    id: 'fanfare', key: 'timerSoundFanfare', no: 'Fanfare',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 3400, 0.6, list);
      var partials = [[1, 1, 1], [2, 0.26, 0.70], [3, 0.085, 0.50]];
      var notes = [[523.25, 0.00, 1.4], [659.25, 0.11, 1.4], [783.99, 0.22, 1.5], [1046.50, 0.33, 2.4]];
      for(var i = 0; i < notes.length; i++){
        voice(c, f, t0 + notes[i][1], notes[i][0], 0.136, 0.008, notes[i][2], partials, list);
      }
    }
  },
  {
    id: 'varsel', key: 'timerSoundAlert', no: 'Varsel',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 4200, 0.5, list);
      var partials = [[1, 1, 1], [2, 0.20, 0.60], [3.02, 0.06, 0.45]];
      var pair = [[880.00, 0.00, 0.50], [1174.66, 0.10, 0.80]];
      var reps = [[0, 1], [0.72, 0.85]];
      for(var r = 0; r < reps.length; r++){
        for(var n = 0; n < pair.length; n++){
          voice(c, f, t0 + reps[r][0] + pair[n][1], pair[n][0],
            0.21 * reps[r][1], 0.005, pair[n][2], partials, list);
        }
      }
    }
  },
  {
    id: 'bjelle', key: 'timerSoundBell', no: 'Bjelle',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 5400, 0.5, list);
      /* En ekte bjelle har skjeve overtoner — hum en oktav under, ters på
         1,19 og nominal på det dobbelte. Det er nettopp de skjeve forholdene
         som gjør at den høres ut som metall og ikke som en ren tone. */
      var partials = [[0.50, 0.32, 1.30], [1, 1, 1], [1.19, 0.55, 0.80], [1.50, 0.32, 0.62],
                      [2.00, 0.42, 0.55], [2.50, 0.18, 0.40], [3.02, 0.10, 0.34], [4.14, 0.05, 0.24]];
      var strikes = [[0, 1], [0.80, 0.72]];
      for(var s = 0; s < strikes.length; s++){
        var at = t0 + strikes[s][0];
        noise(c, f, at, 0.050 * strikes[s][1], 4200, 1.2, 0.022, list);
        voice(c, f, at, 587.33, 0.17 * strikes[s][1], 0.003, 2.8, partials, list);
      }
    }
  },
  {
    id: 'pip', key: 'timerSoundBeep', no: 'Pip',
    build: function(c, t0, dest, list){
      var f = lowpass(c, dest, 2600, 0.7, list);
      var at = [0, 0.14, 0.28, 0.70, 0.84, 0.98];
      for(var i = 0; i < at.length; i++){
        var t = t0 + at[i];
        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.19, t + 0.005);
        g.gain.setValueAtTime(0.19, t + 0.055);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
        g.connect(f); list.push(g);
        var o = c.createOscillator();
        o.type = 'square'; o.frequency.value = 880;
        o.connect(g); o.start(t); o.stop(t + 0.09);
        list.push(o);
      }
    }
  }
];

var tone = DEF_SND;
try {
  var savedTone = localStorage.getItem(LS_TONE);
  for(var si = 0; si < SOUNDS.length; si++) if(SOUNDS[si].id === savedTone) tone = savedTone;
} catch(e){}

function soundDef(){
  for(var i = 0; i < SOUNDS.length; i++) if(SOUNDS[i].id === tone) return SOUNDS[i];
  return SOUNDS[0];
}
function setTone(id){
  for(var i = 0; i < SOUNDS.length; i++){
    if(SOUNDS[i].id !== id) continue;
    tone = id;
    try { localStorage.setItem(LS_TONE, id); } catch(e){}
    return;
  }
}

/* Bygger den valgte lyden inn i `into` og gir tilbake starttidspunktet. */
function scheduleChime(c, t0, into){
  var out = c.createGain();
  out.gain.value = 1;
  out.connect(c.destination);
  into.push(out);
  soundDef().build(c, t0, out, into);
  return t0;
}

function release(list){
  for(var i = 0; i < list.length; i++){
    var n = list[i];
    try { if(n.stop) n.stop(); } catch(e){}
    try { n.disconnect(); } catch(e){}
  }
  list.length = 0;
}
function stopSound(){ release(soundNodes); armed = null; }
function stopDemo(){ release(demoNodes); }

/* Planlegger klangen `sec` sekunder fram i tid på lydklokka.
   Returnerer ctx-tidspunktet den er satt til, så reconcile() kan
   se om fanen har sovet og planen har glidd. */
function armAudio(sec){
  stopSound();
  var c = wake();
  if(!c) return null;
  armed = {at: scheduleChime(c, c.currentTime + Math.max(0, sec), soundNodes), ctx: c};
  return armed.at;
}
/* Forhåndslytting går på sin egen node-liste. Ellers ville et trykk på
   «Hør lyden» — eller på et lydvalg — revet ned klangen som allerede er
   planlagt for en nedtelling som går, og varselet ville kommet for sent. */
function playNow(){
  stopDemo();
  var c = wake();
  if(!c) return;
  scheduleChime(c, c.currentTime + 0.02, demoNodes);
}

/* ═══════════════ CSS ═══════════════════════════════════════ */
var CSS = [
'/* Timer — injisert av shared/timer.js. Alle farger er tema-tokens. */',
/* Startknappen har mørk etikett på mørke temaer og lys etikett på lyse.
   Fyllet må derfor gå hver sin vei for å holde 4,5:1 på 13,5 px tekst:
   mørke temaer lysner (--accent-2 → --accent), lyse mørkner (mot --ink).
   Målt over alle ni temaene; disco er den trangeste med 4,87:1 i bunnen —
   med det gamle fallet mot --accent-deep lå den på 3,48. */
'.tmr{--tmr-accent:var(--accent);--tmr-fill-a:var(--accent-2);--tmr-fill-b:var(--accent);',
'  color:var(--ink);-webkit-tap-highlight-color:transparent}',
'/* De fire lyse temaene: --accent forsvinner mot hvit flate, og lys tekst',
'   på en --accent-knapp faller under AA. Samme grep som i enkel-kalkulatoren',
'   (PR #216): hele trioen ned et hakk, og fyllet blandes mot blekket. */',
'html:is([data-theme="frost"],[data-theme="glass"],[data-theme="pink"],[data-theme="hendrix"]) .tmr{',
'  --tmr-accent:var(--accent-deep);',
'  --tmr-fill-a:color-mix(in srgb, var(--accent-deep) 82%, var(--ink));',
'  --tmr-fill-b:color-mix(in srgb, var(--accent-deep) 66%, var(--ink))}',

'.tmr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',

/* — urskive — */
'.tmr-dial{position:relative;width:100%;max-width:var(--tmr-dial,286px);aspect-ratio:1/1;margin:0 auto}',
'.tmr-ring{display:block;width:100%;height:100%;transform:rotate(-90deg)}',
'.tmr-track{fill:none;stroke:var(--line-2);stroke-width:3.5}',
'.tmr-prog{fill:none;stroke:var(--tmr-accent);stroke-width:3.5;stroke-linecap:round;',
'  transition:stroke-dashoffset .22s linear}',
'.tmr-halo{position:absolute;inset:9%;border-radius:50%;pointer-events:none;opacity:0;',
'  background:radial-gradient(circle, rgba(var(--glow-rgb),.45), transparent 66%)}',
'.tmr.is-done .tmr-halo{animation:tmrPulse 1.9s ease-in-out infinite}',
'@keyframes tmrPulse{0%,100%{opacity:.30;transform:scale(1)}50%{opacity:.06;transform:scale(1.05)}}',
'.tmr-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;',
'  justify-content:center;gap:9px;text-align:center;padding:0 12%}',
'.tmr-time{font-family:var(--font-serif);font-weight:500;font-size:var(--tmr-face-size,54px);',
'  line-height:1;letter-spacing:-1.6px;color:var(--ink);font-variant-numeric:tabular-nums lining-nums}',
'.tmr-state{font:600 9.5px/1 var(--font-sans);letter-spacing:.2em;text-transform:uppercase;color:var(--ink3)}',
'.tmr.is-done .tmr-state{color:var(--tmr-accent)}',

/* — minutt-velger — */
'.tmr-set{display:flex;align-items:center;justify-content:center;gap:var(--tmr-gap,14px);margin-top:22px}',
'.tmr-step{width:34px;height:34px;flex:0 0 auto;border-radius:50%;border:1px solid var(--line-2);',
'  background:transparent;color:var(--ink2);font:400 17px/1 var(--font-sans);cursor:pointer;',
'  display:inline-flex;align-items:center;justify-content:center;',
'  transition:color .15s ease,border-color .15s ease,background .15s ease}',
'.tmr-val{min-width:92px;text-align:center;font-family:var(--font-serif);font-weight:500;font-size:21px;',
'  color:var(--ink);font-variant-numeric:tabular-nums lining-nums;letter-spacing:-.3px}',
'.tmr-unit{font-family:var(--font-sans);font-weight:500;font-size:12px;color:var(--ink3);',
'  margin-left:6px;letter-spacing:.02em}',
'.tmr-range{-webkit-appearance:none;appearance:none;width:100%;margin:14px 0 0;height:22px;',
'  background:transparent;cursor:pointer;display:block}',
'.tmr-range::-webkit-slider-runnable-track{height:4px;border-radius:99px;',
'  background:linear-gradient(90deg,var(--tmr-accent) 0 var(--fill,0%),var(--line-2) var(--fill,0%) 100%)}',
'.tmr-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:15px;height:15px;',
'  margin-top:-5.5px;border-radius:50%;background:var(--tmr-accent);border:2px solid var(--surface);',
'  box-shadow:0 1px 5px rgba(0,0,0,.35)}',
'.tmr-range::-moz-range-track{height:4px;border-radius:99px;background:var(--line-2)}',
'.tmr-range::-moz-range-progress{height:4px;border-radius:99px;background:var(--tmr-accent)}',
'.tmr-range::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:var(--tmr-accent);',
'  border:2px solid var(--surface);box-shadow:0 1px 5px rgba(0,0,0,.35)}',
'.tmr-range[disabled]{opacity:.4;cursor:default}',

/* — hurtigvalg — */
/* Rutenett, ikke flex-wrap: seks hurtigvalg får ikke plass på én linje, og
   fri flyt satte det siste alene på rad to. Tre like kolonner gir et jevnt
   2×3-felt i begge varianter. */
'.tmr-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:13px}',
'.tmr-chip{font:500 12px/1 var(--font-sans);padding:7px 13px;border-radius:99px;background:transparent;',
'  border:1px solid var(--line);color:var(--ink2);cursor:pointer;font-variant-numeric:tabular-nums lining-nums;',
'  transition:color .15s ease,border-color .15s ease,background .15s ease}',
'.tmr-chip[aria-pressed="true"]{color:var(--tmr-accent);border-color:var(--line-warm);',
'  background:color-mix(in srgb, var(--tmr-accent) 10%, transparent)}',
'.tmr-chip[disabled]{opacity:.45;cursor:default}',

/* — lydvalg, kun i full visning — */
'.tmr-snd{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}',
'.tmr-sndlab{margin:0 0 9px;font:600 9.5px/1 var(--font-sans);letter-spacing:.2em;',
'  text-transform:uppercase;color:var(--ink3)}',
'.tmr-sounds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}',
/* Her står ord, ikke minutter: navnene må få bryte, og de tre kolonnene
   skal holde samme høyde selv om ett navn tar to linjer. */
'.tmr-sounds .tmr-chip{white-space:normal;line-height:1.25;padding:7px 9px;min-height:31px}',

/* — knapper — */
'.tmr-actions{display:flex;gap:9px;margin-top:20px}',
'.tmr-btn{flex:1;padding:var(--tmr-btn-pad,13px 18px);border-radius:9px;border:1px solid var(--line-2);',
'  background:transparent;color:var(--ink);font:600 var(--tmr-btn-size,13.5px)/1 var(--font-sans);',
'  cursor:pointer;letter-spacing:.01em;',
'  transition:background .16s ease,border-color .16s ease,color .16s ease,filter .16s ease,transform .07s ease}',
'.tmr-btn.primary{border-color:transparent;color:var(--bg);',
'  background:linear-gradient(180deg,var(--tmr-fill-a),var(--tmr-fill-b));',
'  box-shadow:0 8px 22px -12px rgba(var(--glow-rgb),.8)}',
'.tmr-btn:active{transform:translateY(1px)}',
'.tmr-btn[disabled]{opacity:.42;cursor:default;transform:none;box-shadow:none}',

/* — bunnrad — */
'.tmr-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;',
'  margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}',
'.tmr-mute{display:inline-flex;align-items:center;gap:7px;background:transparent;border:0;padding:3px 0;',
'  cursor:pointer;font:500 12px/1 var(--font-sans);color:var(--ink3);transition:color .15s ease}',
'.tmr-mute svg{width:14px;height:14px;flex:0 0 auto}',
'.tmr-mute[aria-pressed="true"]{color:var(--tmr-accent)}',
/* Brukes både på <a> (popover) og <button> (Hør lyden) — derfor knappe-nullstillingen. */
'.tmr-link{font:500 12px/1 var(--font-sans);color:var(--ink3);text-decoration:none;',
'  display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;padding:3px 0;',
'  cursor:pointer;transition:color .15s ease}',
'.tmr-link svg{width:14px;height:14px;flex:0 0 auto}',
'.tmr-link[disabled]{opacity:.45;cursor:default}',

/* — popover på forsiden — */
/* Pilla (.tmr-popwrap / .tmr-pill) styles IKKE herfra. Den markupen står i
   index.html, og denne fila lastes med `defer` — stilen ville kommet etter
   første maling, med en 63 px klokke og en sprukken navrad i mellomtiden.
   Pille-stilen bor derfor sammen med markupen, ved siden av .nav-search-pill
   som den speiler. Panelet under er bygget av JS og hører hjemme her. */
'.tmr-pop{position:absolute;top:calc(100% + 11px);right:0;z-index:60;',
'  width:min(320px, calc(100vw - 28px));background:var(--surface);border:1px solid var(--line-2);',
'  border-radius:13px;padding:17px 18px 15px;text-align:left;',
'  box-shadow:0 26px 60px -26px rgba(0,0,0,.75), 0 2px 6px rgba(0,0,0,.22);',
'  opacity:0;visibility:hidden;transform:translateY(-6px) scale(.985);transform-origin:top right}',
/* Overgangen slås på først etter at den lukkede tilstanden er tegnet (se
   mount()). Uten det ville stilen bli injisert PÅ en umalt, arvet «synlig»
   tilstand, og panelet tonet ut for øynene på folk ved hver sidelast. */
'.tmr-pop.tmr-anim{transition:opacity .16s ease,transform .16s ease,visibility 0s linear .16s}',
'.tmr-pop.open{opacity:1;visibility:visible;transform:none}',
'.tmr-pop.tmr-anim.open{transition:opacity .16s ease,transform .16s ease,visibility 0s}',
'.tmr-pophead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}',
'.tmr-poptitle{font:600 10px/1 var(--font-sans);letter-spacing:.2em;text-transform:uppercase;color:var(--ink3)}',
'.tmr-x{width:26px;height:26px;flex:0 0 auto;border:0;background:transparent;color:var(--ink3);',
'  border-radius:6px;cursor:pointer;font:400 17px/1 var(--font-sans);',
'  display:inline-flex;align-items:center;justify-content:center;transition:color .15s ease}',
/* På smale skjermer er det ikke plass til 320 px til venstre for pilla — panelet
   ville stukket utenfor skjermkanten. Da festes det til skjermen i stedet, med
   overkanten satt fra pillas posisjon når det åpnes (setOpen). */
'@media(max-width:560px){',
'  .tmr-pop{position:fixed;top:var(--tmr-top,68px);left:14px;right:14px;width:auto;',
'    transform-origin:top center}}',

/* — varianter — */
'.tmr-compact{--tmr-dial:150px;--tmr-face-size:32px;--tmr-gap:10px;--tmr-btn-pad:11px 14px;--tmr-btn-size:12.5px}',
'.tmr-compact .tmr-set{margin-top:16px}',
'.tmr-compact .tmr-time{letter-spacing:-1px}',
'.tmr-full{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:30px 30px 24px;',
'  box-shadow:inset 0 1px 0 color-mix(in srgb, var(--ink) 6%, transparent),',
'    0 1px 2px rgba(0,0,0,.16), 0 26px 56px -28px rgba(0,0,0,.5)}',
'@media(max-width:560px){',
'  .tmr-full{padding:22px 20px 18px;border-radius:16px;--tmr-face-size:46px}',
'  .tmr-full .tmr-dial{max-width:230px}}',

/* — hover og fokus — */
'@media(hover:hover){',
'  .tmr-step:hover,.tmr-chip:hover:not([disabled]){color:var(--ink);border-color:var(--line-warm)}',
'  .tmr-btn:not(.primary):hover:not([disabled]){border-color:var(--line-warm);',
'    background:color-mix(in srgb, var(--ink) 5%, transparent)}',
'  .tmr-btn.primary:hover:not([disabled]){filter:brightness(1.07)}',
'  .tmr-mute:hover,.tmr-x:hover{color:var(--ink)}',
'  .tmr-link:hover{color:var(--tmr-accent)}}',
/* --tmr-accent settes på .tmr, altså på panelet. Pilla står utenfor panelet og
   så aldri tokenet: hele outline-erklæringen falt derfor bort som ugyldig, og
   tastaturfokus på pilla ble helt usynlig. Den er tatt ut av lista her og
   arver i stedet sidens egen :focus-visible-ring, som alle andre knapper. */
'.tmr-btn:focus-visible,.tmr-chip:focus-visible,.tmr-step:focus-visible,.tmr-mute:focus-visible,',
'.tmr-link:focus-visible,.tmr-x:focus-visible,.tmr-range:focus-visible{',
'  outline:2px solid var(--tmr-accent);outline-offset:2px;border-radius:6px}',

'@media(prefers-reduced-motion:reduce){',
'  .tmr-prog{transition:none}',
'  .tmr.is-done .tmr-halo{animation:none;opacity:.22}',
'  .tmr-pop{transition:opacity .01ms,visibility 0s}',
'  .tmr-btn:active{transform:none}}'
].join('\n');

function injectCSS(){
  if(document.getElementById('tmrStyle')) return;
  var s = document.createElement('style');
  s.id = 'tmrStyle';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ═══════════════ IKONER ════════════════════════════════════ */
var ICO_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>';
var ICO_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 10a6 6 0 0 1 12 0c0 4 1.4 5.4 1.4 5.4H4.6S6 14 6 10Z"/><path d="M10 19a2.3 2.3 0 0 0 4 0"/></svg>';
var ICO_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 10a6 6 0 0 1 8.5-5.4"/><path d="M18 12.4V10"/><path d="M4.6 15.4h13"/><path d="M10 19a2.3 2.3 0 0 0 4 0"/><line x1="4" y1="3.4" x2="20.5" y2="20.6"/></svg>';

/* ═══════════════ MONTERING ═════════════════════════════════ */
function build(el, variant){
  var compact = variant === 'compact';
  /* classList, ikke className: popover-en på forsiden bærer .tmr-pop
     fra HTML-en, og den skal ikke skrives over her. */
  el.classList.add('tmr', compact ? 'tmr-compact' : 'tmr-full');

  var html = [];
  if(compact){
    html.push('<div class="tmr-pophead">',
      '<span class="tmr-poptitle" data-r="title">Nedtelling</span>',
      '<button type="button" class="tmr-x" data-r="close" aria-label="Lukk nedtellingen" title="Lukk nedtellingen">&#215;</button>',
      '</div>');
  }
  html.push(
    '<div class="tmr-dial">',
      '<div class="tmr-halo" aria-hidden="true"></div>',
      '<svg class="tmr-ring" viewBox="0 0 100 100" aria-hidden="true">',
        '<circle class="tmr-track" cx="50" cy="50" r="' + R_RING + '"/>',
        '<circle class="tmr-prog" data-r="prog" cx="50" cy="50" r="' + R_RING + '"',
        ' stroke-dasharray="' + C_RING.toFixed(2) + '" stroke-dashoffset="0"/>',
      '</svg>',
      '<div class="tmr-face">',
        '<div class="tmr-time" data-r="time" role="timer" aria-live="off">00:00</div>',
        '<div class="tmr-state" data-r="state">Klar</div>',
      '</div>',
    '</div>',
    '<div class="tmr-set">',
      '<button type="button" class="tmr-step" data-r="minus" aria-label="Ett minutt mindre" title="Ett minutt mindre">&#8722;</button>',
      '<span class="tmr-val"><span data-r="num">' + DEF_M + '</span><span class="tmr-unit" data-r="unit">min</span></span>',
      '<button type="button" class="tmr-step" data-r="plus" aria-label="Ett minutt mer" title="Ett minutt mer">+</button>',
    '</div>',
    '<input type="range" class="tmr-range" data-r="range" min="' + MIN_M + '" max="' + MAX_M + '" step="1" value="' + DEF_M + '" aria-label="Minutter">',
    '<div class="tmr-presets" data-r="presets"></div>',
    '<div class="tmr-actions">',
      '<button type="button" class="tmr-btn primary" data-r="go">Start</button>',
      '<button type="button" class="tmr-btn" data-r="reset">Nullstill</button>',
    '</div>',
    (compact ? '' :
      '<div class="tmr-snd">' +
        '<p class="tmr-sndlab" id="tmrSndLab" data-r="sndlab">Lyd når tiden er ute</p>' +
        '<div class="tmr-sounds" role="group" aria-labelledby="tmrSndLab" data-r="sounds"></div>' +
      '</div>'),
    '<div class="tmr-foot">',
      '<button type="button" class="tmr-mute" data-r="mute" aria-pressed="true">',
        '<span data-r="muteico">' + ICO_ON + '</span><span data-r="mutetxt">Lyd på</span>',
      '</button>',
      (compact
        ? '<a class="tmr-link" data-r="link" href="/kalkulator/timer/"><span data-r="linktxt">Full visning</span> &#8594;</a>'
        : '<button type="button" class="tmr-link" data-r="demo">' + ICO_ON + '<span data-r="demotxt">Hør lyden</span></button>'),
    '</div>',
    '<p class="tmr-sr" data-r="live" role="status" aria-live="polite"></p>'
  );
  el.innerHTML = html.join('');

  var r = {};
  var nodes = el.querySelectorAll('[data-r]');
  for(var i = 0; i < nodes.length; i++) r[nodes[i].getAttribute('data-r')] = nodes[i];
  return r;
}

function mount(el){
  if(el._tmrMounted) return;
  el._tmrMounted = true;
  injectCSS();

  var variant = el.getAttribute('data-variant') === 'compact' ? 'compact' : 'full';
  var compact = variant === 'compact';
  var r = build(el, variant);

  /* statiske etiketter */
  if(r.title) label(r.title, 'timerTitle', 'Nedtelling');
  label(r.unit, 'timerUnitMin', 'min');
  label(r.reset, 'timerReset', 'Nullstill');
  if(r.linktxt) label(r.linktxt, 'timerFullLink', 'Full visning');
  if(r.demotxt) label(r.demotxt, 'timerHear', 'Hør lyden');
  if(r.sndlab) label(r.sndlab, 'timerSoundPick', 'Lyd når tiden er ute');

  /* hurtigvalg */
  var chips = [];
  for(var p = 0; p < PRESETS.length; p++){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tmr-chip';
    b.setAttribute('data-m', PRESETS[p]);
    b.setAttribute('aria-pressed', 'false');
    b.textContent = PRESETS[p] + ' min';
    r.presets.appendChild(b);
    chips.push(b);
  }

  /* lydvalg */
  var toneChips = [];
  for(var q = 0; r.sounds && q < SOUNDS.length; q++){
    var sb = document.createElement('button');
    sb.type = 'button';
    sb.className = 'tmr-chip';
    sb.setAttribute('data-snd', SOUNDS[q].id);
    sb.setAttribute('aria-pressed', 'false');
    label(sb, SOUNDS[q].key, SOUNDS[q].no);
    r.sounds.appendChild(sb);
    toneChips.push(sb);
  }

  /* ── tilstand ──
     mode: 'idle' | 'run' | 'pause' | 'done'
     deadline: veggklokke-tidspunkt (ms) når den går
     rest: gjenstående ms når den er satt på pause */
  var minutes = DEF_M, mode = 'idle', deadline = 0, rest = 0;
  var sound = true, timer = null, lastFace = '';

  try { sound = localStorage.getItem(LS_SOUND) !== '0'; } catch(e){}

  function total(){ return minutes * 60000; }
  function remaining(){
    if(mode === 'run') return Math.max(0, deadline - Date.now());
    if(mode === 'pause') return rest;
    if(mode === 'done') return 0;
    return total();
  }

  function save(){
    try {
      localStorage.setItem(LS_STATE, JSON.stringify({
        m: minutes,
        d: mode === 'run' ? deadline : 0,
        r: mode === 'pause' ? rest : 0
      }));
    } catch(e){}
  }

  function say(msg){ if(r.live) r.live.textContent = msg; }

  /* ── tegning ── */
  var STATES = {
    idle:  ['timerStateReady', 'Klar'],
    run:   ['timerStateRunning', 'Teller ned'],
    pause: ['timerStatePaused', 'Pauset'],
    done:  ['timerStateDone', 'Ferdig']
  };

  /* Pilla i toppen viser nedtellingen så lenge den går, ellers ordet «Timer».
     Når den står stille eier core.js teksten via data-i18n — derfor skrives
     det bare når verdien faktisk endrer seg. */
  function paintPill(){
    if(!pillTxt) return;
    var live = (mode === 'run' || mode === 'pause');
    var t = live ? fmt(remaining()) : T('timerTitle', 'Nedtelling');
    if(pillTxt.textContent !== t) pillTxt.textContent = t;
  }

  function paint(){
    var ms = remaining(), face = fmt(ms);
    if(face !== lastFace){
      r.time.textContent = face;
      lastFace = face;
    }
    paintPill();
    var frac = mode === 'idle' ? 1 : (total() > 0 ? ms / total() : 0);
    r.prog.setAttribute('stroke-dashoffset', (C_RING * (1 - frac)).toFixed(2));
  }

  function paintControls(){
    var live = mode === 'run';
    r.num.textContent = minutes;
    r.range.value = minutes;
    r.range.style.setProperty('--fill', ((minutes - MIN_M) / (MAX_M - MIN_M) * 100).toFixed(1) + '%');
    r.range.disabled = live;
    r.minus.disabled = live || minutes <= MIN_M;
    r.plus.disabled = live || minutes >= MAX_M;
    for(var i = 0; i < chips.length; i++){
      chips[i].disabled = live;
      chips[i].setAttribute('aria-pressed', Number(chips[i].getAttribute('data-m')) === minutes ? 'true' : 'false');
    }
    r.reset.disabled = mode === 'idle';

    var st = STATES[mode];
    label(r.state, st[0], st[1]);
    if(mode === 'run') label(r.go, 'timerPause', 'Pause');
    else if(mode === 'pause') label(r.go, 'timerResume', 'Fortsett');
    else if(mode === 'done') label(r.go, 'timerAgain', 'Start på nytt');
    else label(r.go, 'timerStart', 'Start');

    el.classList.toggle('is-done', mode === 'done');
    if(pill) pill.classList.toggle('is-live', mode === 'run' || mode === 'pause');
    paintPill();
  }

  function paintSound(){
    r.mute.setAttribute('aria-pressed', sound ? 'true' : 'false');
    r.muteico.innerHTML = sound ? ICO_ON : ICO_OFF;
    label(r.mutetxt, sound ? 'timerSoundOn' : 'timerSoundOff', sound ? 'Lyd på' : 'Lyd av');
    if(r.demo) r.demo.disabled = !sound;
    /* Er lyden av, er det ingenting å velge mellom heller. */
    for(var i = 0; i < toneChips.length; i++) toneChips[i].disabled = !sound;
  }

  /* Hvilken lyd som er markert. Selve valget er felles for begge variantene
     av timeren, så det leses fra modulen og ikke fra dette kortet. */
  function paintTone(){
    for(var i = 0; i < toneChips.length; i++){
      toneChips[i].setAttribute('aria-pressed',
        toneChips[i].getAttribute('data-snd') === tone ? 'true' : 'false');
    }
  }

  /* ── klokka ──
     Intervallet tegner bare. Selve varslingen er planlagt på lydklokka
     (armAudio), som ikke strupes når fanen ligger i bakgrunnen. */
  function startTick(){
    stopTick();
    timer = setInterval(function(){
      paint();
      if(mode === 'run'){
        pushTitle();
        reconcile();
        if(remaining() <= 0) finish();
      }
    }, TICK_MS);
  }
  function stopTick(){ if(timer){ clearInterval(timer); timer = null; } }

  /* Har fanen sovet, har AudioContext-klokka stått stille mens veggklokka
     gikk videre — da ligger den planlagte klangen feil. Legg den på nytt
     hvis avviket er merkbart. Det siste halvsekundet står vi over: der er
     klangen i ferd med å spille, og en ny planlegging ville spilt den to ganger. */
  function reconcile(){
    if(!armed || !armed.ctx) return;
    var left = remaining() / 1000;
    if(left < 0.5) return;
    if(Math.abs((armed.ctx.currentTime + left) - armed.at) > 0.4) armAudio(left);
  }

  var titleOrig = null;
  function pushTitle(){
    if(mode !== 'run'){ popTitle(); return; }
    if(titleOrig === null) titleOrig = document.title;
    var want = fmt(remaining()) + ' · ' + titleOrig;
    if(document.title !== want) document.title = want;
  }
  function popTitle(){
    if(titleOrig !== null){ document.title = titleOrig; titleOrig = null; }
  }

  function finish(){
    if(mode === 'done') return;
    mode = 'done';
    rest = 0;
    stopTick();
    popTitle();
    /* Klangen er allerede planlagt på lydklokka. Fikk vi den ikke armet
       (ingen Web Audio, eller nettleseren nektet uten et klikk), spiller
       vi den her i stedet — bedre sent enn stille. */
    if(sound && !armed) playNow();
    try { if(sound && navigator.vibrate) navigator.vibrate([180, 90, 180, 90, 260]); } catch(e){}
    paint(); paintControls(); save();
    say(T('timerSrDone', 'Tiden er ute.'));
  }

  function start(){
    if(mode === 'done'){ mode = 'idle'; rest = 0; }
    var ms = (mode === 'pause' && rest > 0) ? rest : total();
    mode = 'run';
    deadline = Date.now() + ms;
    lastFace = '';
    if(sound) armAudio(ms / 1000); else stopSound();
    startTick(); paint(); paintControls(); pushTitle(); save();
    say(T('timerSrStarted', 'Timeren går.') + ' ' + fmt(ms));
  }
  function pause(){
    if(mode !== 'run') return;
    rest = remaining();
    mode = 'pause';
    stopSound(); stopTick(); popTitle();
    paint(); paintControls(); save();
    say(T('timerSrPaused', 'Timeren er pauset.') + ' ' + fmt(rest));
  }
  function reset(){
    mode = 'idle'; rest = 0; deadline = 0; lastFace = '';
    stopSound(); stopTick(); popTitle();
    paint(); paintControls(); save();
    say(T('timerSrReset', 'Timeren er nullstilt.'));
  }
  function setMinutes(m){
    if(mode === 'run') return;
    minutes = clampMin(m);
    if(mode === 'pause' || mode === 'done'){ mode = 'idle'; rest = 0; }
    stopSound(); lastFace = '';
    paint(); paintControls(); save();
  }

  /* ── hendelser ── */
  r.go.addEventListener('click', function(){
    wake();
    if(mode === 'run') pause(); else start();
  });
  r.reset.addEventListener('click', reset);
  r.minus.addEventListener('click', function(){ setMinutes(minutes - 1); });
  r.plus.addEventListener('click', function(){ setMinutes(minutes + 1); });
  r.range.addEventListener('input', function(){ setMinutes(r.range.value); });
  r.presets.addEventListener('click', function(e){
    var b = e.target.closest('.tmr-chip');
    if(b && !b.disabled) setMinutes(b.getAttribute('data-m'));
  });
  r.mute.addEventListener('click', function(){
    sound = !sound;
    try { localStorage.setItem(LS_SOUND, sound ? '1' : '0'); } catch(e){}
    if(!sound) stopSound();
    else if(mode === 'run') armAudio(remaining() / 1000);
    paintSound();
  });
  if(r.demo) r.demo.addEventListener('click', function(){ if(sound) playNow(); });

  /* Trykket er både valget og forhåndslyttingen — ett trykk, ett svar.
     Går det en nedtelling, planlegges klangen på nytt, slik at det nye
     valget er det som faktisk ringer når tiden er ute. */
  if(r.sounds) r.sounds.addEventListener('click', function(e){
    var b = e.target.closest('.tmr-chip');
    if(!b || b.disabled) return;
    setTone(b.getAttribute('data-snd'));
    paintTone();
    playNow();
    if(mode === 'run' && sound) armAudio(remaining() / 1000);
  });

  document.addEventListener('visibilitychange', function(){
    if(document.hidden || mode !== 'run') return;
    wake();
    reconcile();
    paint();
    if(remaining() <= 0) finish();
  });

  /* Nettleseren nekter lyd før siden er rørt. Har vi en gjenopptatt
     nedtelling fra forrige sidevisning, vekker vi lyden ved første
     berøring eller tastetrykk — én gang, så koster den ingenting. */
  function unlock(){
    if(mode === 'run' && sound && !armed) armAudio(remaining() / 1000);
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  /* Mellomrom starter/pauser, R nullstiller — kun på den dedikerte siden,
     der timeren er sidens hovedsak. */
  if(!compact){
    window.addEventListener('keydown', function(e){
      var t = e.target;
      if(t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if(e.ctrlKey || e.metaKey || e.altKey) return;
      if(e.key === ' ' || e.key === 'Spacebar'){
        e.preventDefault(); wake();
        if(mode === 'run') pause(); else start();
      } else if(e.key === 'r' || e.key === 'R'){
        reset();
      }
    });
  }

  /* ── popover-en på forsiden ── */
  var pill = null, pillTxt = null;
  var wrap = compact ? el.closest('[data-hv-timer-pop]') : null;
  if(wrap){
    pill = wrap.querySelector('[data-tmr-toggle]');
    pillTxt = wrap.querySelector('[data-tmr-pill-label]');
    if(pillTxt) label(pillTxt, 'timerTitle', 'Nedtelling');
    /* Pilla har ligget usynlig i en ferdig reservert boks siden første maling
       (se .tmr-pill i index.html). Nå står etiketten på riktig språk og
       tema/språk-klyngen er på plass, så den kan tones inn — ferdig plassert,
       uten hopp. */
    if(pill) pill.classList.add('show');
    /* To bilder ut: nå er den lukkede tilstanden malt, og overgangen kan
       trygt kobles på uten å spille av seg selv ved sidelast. */
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ el.classList.add('tmr-anim'); });
    });
    var open = false;
    function setOpen(v){
      open = v;
      /* Overkanten til det skjermfestede panelet (se media-spørringen).
         Toppraden er sticky, så verdien holder seg mens panelet er åpent. */
      if(v) el.style.setProperty('--tmr-top', Math.round(wrap.getBoundingClientRect().bottom + 11) + 'px');
      el.classList.toggle('open', v);
      if(pill) pill.setAttribute('aria-expanded', v ? 'true' : 'false');
      if(v){ wake(); setTimeout(function(){ try{ r.go.focus(); }catch(e){} }, 60); }
    }
    if(pill) pill.addEventListener('click', function(){ setOpen(!open); });
    if(r.close) r.close.addEventListener('click', function(){ setOpen(false); if(pill) pill.focus(); });
    document.addEventListener('click', function(e){
      if(open && !wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function(e){
      if(open && e.key === 'Escape'){ setOpen(false); if(pill) pill.focus(); }
    });
  }

  /* ── gjenopptakelse ──
     En nedtelling som gikk ut mens fanen var lukket, ringer ikke i
     ettertid — da ville lyden kommet uten forvarsel. Vi henter bare
     minuttvalget tilbake. */
  try {
    var raw = localStorage.getItem(LS_STATE);
    if(raw){
      var s = JSON.parse(raw);
      minutes = clampMin(s && s.m ? s.m : DEF_M);
      if(s && s.d && s.d > Date.now() + 500){
        mode = 'run'; deadline = s.d;
        startTick(); pushTitle();
        if(sound) armAudio((deadline - Date.now()) / 1000);
      } else if(s && s.r && s.r > 500){
        mode = 'pause'; rest = s.r;
      }
    }
  } catch(e){}

  paintSound(); paintTone(); paint(); paintControls();
}

function init(){
  var els = document.querySelectorAll('[data-hv-timer]');
  for(var i = 0; i < els.length; i++) mount(els[i]);
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.HVTimer = { mount: mount, init: init };

})();
