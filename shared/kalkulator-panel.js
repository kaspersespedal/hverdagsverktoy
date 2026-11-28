/* ══ Kalkulator (forsiden) ══════════════════════════════════════════════════
   Kasper 2026-11-28: den enkle kalkulatoren skal ikke være hovedkalkulatoren på
   /kalkulator/, men et lite ikon i dagsoversikt-toppen som åpner den på siden.
   Åpnes fra ikonet (index.html, #kalBoot) og hentes først når ikonet brukes.
   Sidepanel fra høyre på PC, ark nedenfra på telefon, som kalenderen
   (shared/kalender.js). Regner som /kalkulator/enkel/: fortløpende fra venstre
   mot høyre, og «200 + 10 %» blir 220. Tallet blir stående når panelet lukkes.
   Bare norsk tekst: roten har data-ph-skip, som kalenderen. */
(function(){
"use strict";
if(window.HVKalkulator) return;

/* ═══ Regning (samme regler som /kalkulator/enkel/) ═══ */
var OPSYM={"+":"+","-":"−","*":"×","/":"÷"};
var cur="0",prev=null,op=null,fresh=true,eq=false,last=null,err=false,expr="";

function toNum(s){return parseFloat(String(s).replace(",","."));}
/* 15 gjeldende sifre, så støy som 0,30000000000000004 forsvinner */
function canon(n){
  if(!isFinite(n))return "0";
  if(Math.abs(n)>=1e15)return n.toString().replace(".",",");
  if(n===0)return "0";
  var d=Math.min(20,Math.max(0,14-Math.floor(Math.log10(Math.abs(n)))));
  return n.toFixed(d).replace(/0+$/,"").replace(/\.$/,"").replace(".",",");
}
/* Tusenskille i heltallsdelen, desimalene som de er */
function group(s){
  var neg=s.charAt(0)==="-";if(neg)s=s.slice(1);
  var p=s.split(",");
  return (neg?"−":"")+(p[0]||"0").replace(/\B(?=(\d{3})+(?!\d))/g," ")+(p.length>1?","+p[1]:"");
}
function disp(n){return group(canon(n));}

function reset(){cur="0";prev=null;op=null;fresh=true;eq=false;last=null;err=false;expr="";}
function fail(){err=true;expr="";}
function digit(d){
  if(err)reset();
  if(eq){cur="0";prev=null;op=null;eq=false;fresh=false;expr="";}
  if(fresh){cur=d;fresh=false;}
  else if(cur==="0")cur=d;
  else if(cur==="-0")cur="-"+d;
  else cur+=d;
}
function decimal(){
  if(err)reset();
  if(eq){cur="0";prev=null;op=null;eq=false;expr="";}
  if(fresh){cur="0";fresh=false;}
  if(cur.indexOf(",")<0)cur+=",";
}
function compute(){
  var b=toNum(cur),r;
  if(op==="+")r=prev+b;else if(op==="-")r=prev-b;else if(op==="*")r=prev*b;
  else if(op==="/"){if(b===0){fail();return false;}r=prev/b;}
  else return false;
  prev=r;cur=canon(r);return true;
}
function chooseOp(o){
  if(err)return;
  if(op!==null&&!fresh){if(!compute())return;}
  else if(prev===null)prev=(eq&&last!==null)?last:toNum(cur);
  op=o;fresh=true;eq=false;expr=disp(prev)+" "+OPSYM[o];
}
function equals(){
  if(err||op===null||prev===null)return false;
  var a=disp(prev),b=disp(toNum(cur)),s=OPSYM[op];
  if(!compute())return false;
  expr=a+" "+s+" "+b+" =";last=prev;op=null;prev=null;fresh=true;eq=true;
  return true;
}
/* Etter + og − er «10 %» prosent av tallet foran (200 + 10 % = 220), ellers 10 / 100 */
function percent(){
  if(err)return;
  var v=toNum(cur);
  v=((op==="+"||op==="-")&&prev!==null)?prev*v/100:v/100;
  cur=canon(v);fresh=false;
}
function sign(){
  if(err||cur==="0"||cur==="0,")return;
  cur=cur.charAt(0)==="-"?cur.slice(1):"-"+cur;
}
function back(){
  if(err){reset();return;}
  if(eq||fresh)return;
  if(cur.length<=1||(cur.length===2&&cur.charAt(0)==="-"))cur="0";else cur=cur.slice(0,-1);
  if(cur==="-")cur="0";
}

/* ═══ Visning ═══ */
var root=null,panel=null,nowEl=null,exprEl=null,keysEl=null,trigger=null,hideTimer=null,downOutside=false;
var X='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
var KEYS=[
  ["clear","AC","Nullstill","fn"],["back","⌫","Slett siste siffer","fn"],["percent","%","Prosent","fn"],["op/","÷","Delt på","op"],
  ["7"],["8"],["9"],["op*","×","Ganget med","op"],
  ["4"],["5"],["6"],["op-","−","Minus","op"],
  ["1"],["2"],["3"],["op+","+","Pluss","op"],
  ["sign","±","Bytt fortegn","fn"],["0"],["decimal",",","Komma",""],["equals","=","Er lik","eq"]
];
function keysHtml(){
  return KEYS.map(function(k){
    var a=k[0],isOp=a.indexOf("op")===0;
    return '<button type="button" class="hvk-key'+(k[3]?" is-"+k[3]:"")+'" data-k="'+a+'"'+
      (k[2]?' aria-label="'+k[2]+'"':"")+(isOp?' aria-pressed="false"':"")+'>'+(k[1]||a)+'</button>';
  }).join("");
}
function render(pop){
  var s=err?"Kan ikke dele på 0":group(cur);
  nowEl.textContent=s;
  var len=s.replace(/ /g,"").length;
  nowEl.classList.toggle("is-sm",!err&&len>11&&len<=16);
  nowEl.classList.toggle("is-xs",err||len>16);
  exprEl.textContent=expr;
  var ops=keysEl.querySelectorAll("[aria-pressed]");
  for(var i=0;i<ops.length;i++)ops[i].setAttribute("aria-pressed",!err&&ops[i].getAttribute("data-k")==="op"+op?"true":"false");
  if(pop){nowEl.classList.remove("pop");void nowEl.offsetWidth;nowEl.classList.add("pop");}
}
function press(a){
  var pop=false;
  if(/^\d$/.test(a))digit(a);
  else if(a.indexOf("op")===0)chooseOp(a.slice(2));
  else if(a==="decimal")decimal();
  else if(a==="equals")pop=equals();
  else if(a==="percent")percent();
  else if(a==="sign")sign();
  else if(a==="back")back();
  else if(a==="clear")reset();
  render(pop);
}
/* Kort blink på tasten når den trykkes fra tastaturet */
function flash(a){
  var b=keysEl.querySelector('[data-k="'+a+'"]');if(!b)return;
  b.classList.add("is-press");setTimeout(function(){b.classList.remove("is-press");},110);
}

/* ═══ Hendelser ═══ */
function onDown(ev){downOutside=ev.target===root;}
function onClick(ev){
  if(ev.target===root){if(downOutside)close();return;}
  if(ev.target.closest("[data-act=close]")){close();return;}
  var k=ev.target.closest("[data-k]");
  if(k)press(k.getAttribute("data-k"));
}
var KB={",":"decimal",".":"decimal","+":"op+","-":"op-","*":"op*","/":"op/","%":"percent","Enter":"equals","=":"equals","Backspace":"back","Delete":"clear"};
function onKey(ev){
  if(!root||!root.classList.contains("open"))return;
  if(ev.key==="Escape"){ev.preventDefault();ev.stopPropagation();close();return;}
  if(ev.key==="Tab"){trap(ev);return;}
  if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
  /* Enter og mellomrom på lukkeknappen og lenken skal virke som vanlig */
  if((ev.key==="Enter"||ev.key===" ")&&ev.target.closest&&ev.target.closest("[data-act=close],a"))return;
  var a=/^\d$/.test(ev.key)?ev.key:KB[ev.key];
  /* Uten preventDefault ruller piltaster og mellomrom forsiden bak panelet */
  if(!a){if(/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(ev.key)&&!(ev.key===" "&&ev.target.closest&&ev.target.closest("button")))ev.preventDefault();return;}
  /* stopPropagation: «/» skal dele, ikke hoppe til søkefeltet (search.js) */
  ev.preventDefault();ev.stopPropagation();
  press(a);flash(a);
}
/* Fokusfelle: Tab skal ikke vandre ut i forsiden bak panelet */
function trap(ev){
  var all=panel.querySelectorAll("button,[href]"),list=[],i;
  for(i=0;i<all.length;i++)if(all[i].offsetParent!==null)list.push(all[i]);
  if(!list.length)return;
  if(ev.shiftKey&&(document.activeElement===list[0]||document.activeElement===panel)){ev.preventDefault();list[list.length-1].focus();}
  else if(!ev.shiftKey&&document.activeElement===list[list.length-1]){ev.preventDefault();list[0].focus();}
}
/* Siden bak skal ikke rulle. Bare et lavt ark (liten telefon) har noe å rulle selv. */
function canScroll(t){var b=t.closest&&t.closest(".hvk-body");return !!b&&b.scrollHeight>b.clientHeight;}
function onWheel(ev){if(!canScroll(ev.target))ev.preventDefault();}
/* Telefon: dra toppen ned for å lukke arket */
var T=null;
function isSheet(){return window.matchMedia("(max-width:640px)").matches;}
function onTouchStart(ev){
  var head=ev.target.closest(".hvk-head,.hvk-grab");
  T=(ev.touches.length===1&&head&&isSheet()&&!ev.target.closest("button"))?{y:ev.touches[0].clientY,dy:0}:null;
}
function onTouchMove(ev){
  if(!T){if(!canScroll(ev.target))ev.preventDefault();return;}
  ev.preventDefault();
  T.dy=ev.touches[0].clientY-T.y;
  panel.style.transition="none";panel.style.transform="translateY("+Math.max(0,T.dy)+"px)";
}
function onTouchEnd(){
  if(!T)return;
  var dy=T.dy;T=null;
  panel.style.transition="";
  if(dy>90)close();
  panel.style.transform="";
}

/* ═══ Åpne / lukke ═══ */
function build(){
  var st=document.createElement("style");st.id="hvKalkCss";st.textContent=CSS;document.head.appendChild(st);
  root=document.createElement("div");
  root.className="hvk";root.id="hvKalk";root.hidden=true;
  root.setAttribute("aria-hidden","true");root.setAttribute("data-ph-skip","");
  root.innerHTML='<div class="hvk-panel" role="dialog" aria-modal="true" aria-labelledby="hvkTitle" tabindex="-1">'+
    '<div class="hvk-grab" aria-hidden="true"><i></i></div>'+
    '<header class="hvk-head"><h2 class="hvk-eyebrow" id="hvkTitle">Kalkulator</h2>'+
      '<button type="button" class="hvk-x" data-act="close" aria-label="Lukk kalkulatoren">'+X+'</button></header>'+
    '<div class="hvk-body">'+
      '<div class="hvk-display"><div class="hvk-expr" aria-hidden="true"></div>'+
        '<div class="hvk-now" aria-live="polite" aria-atomic="true">0</div></div>'+
      '<div class="hvk-keys" role="group" aria-label="Taster">'+keysHtml()+'</div>'+
      '<p class="hvk-tip">Du kan også skrive med tastaturet: tall, + − * / og Enter for «=».</p>'+
      '<a class="hvk-more" href="/kalkulator/">Flere kalkulatorer <span aria-hidden="true">→</span></a>'+
    '</div></div>';
  document.body.appendChild(root);
  panel=root.firstChild;
  nowEl=panel.querySelector(".hvk-now");exprEl=panel.querySelector(".hvk-expr");keysEl=panel.querySelector(".hvk-keys");
  root.addEventListener("pointerdown",onDown);
  root.addEventListener("click",onClick);
  root.addEventListener("wheel",onWheel,{passive:false});
  root.addEventListener("touchstart",onTouchStart,{passive:true});
  root.addEventListener("touchmove",onTouchMove,{passive:false});
  root.addEventListener("touchend",onTouchEnd);
  root.addEventListener("touchcancel",onTouchEnd);
  /* Fanges før search.js og andre snarveier på siden */
  document.addEventListener("keydown",onKey,true);
}
function open(t){
  if(!root)build();
  if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}
  trigger=t||null;
  render(false);
  root.hidden=false;root.setAttribute("aria-hidden","false");
  if(trigger)trigger.setAttribute("aria-expanded","true");
  /* To bilder: det første lar nettleseren tegne startstillingen, så overgangen faktisk spilles */
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    root.classList.add("open");
    try{panel.focus({preventScroll:true});}catch(_){}
  });});
}
function close(){
  if(!root||root.hidden)return;
  root.classList.remove("open");root.setAttribute("aria-hidden","true");
  if(trigger){trigger.setAttribute("aria-expanded","false");try{trigger.focus({preventScroll:true});}catch(_){}}
  hideTimer=setTimeout(function(){root.hidden=true;hideTimer=null;},360);
}

/* ═══ Utseende ═══ Samme skall som kalenderen; tastene flate og matte. Bare temaets egne farger. */
var CSS=
'.hvk,.hvk *,.hvk *::before,.hvk *::after{box-sizing:border-box}'+
'.hvk{position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.42);opacity:0;transition:opacity .3s var(--ease-out-quart,ease);'+
  'font-family:var(--font-sans,system-ui,sans-serif);color:var(--ink);overscroll-behavior:contain;-webkit-tap-highlight-color:transparent}'+
'.hvk[hidden]{display:none}'+
'.hvk.open{opacity:1}'+
'.hvk-panel{position:absolute;top:0;right:0;bottom:0;width:min(400px,100%);display:flex;flex-direction:column;outline:none;'+
  'background:radial-gradient(130% 34% at 100% 0%,rgba(var(--glow-rgb,200,153,104),.075),transparent 62%),var(--bg);'+
  'border-left:1px solid var(--line-2);box-shadow:-34px 0 90px -34px rgba(0,0,0,.7);'+
  'transform:translateX(100%);transition:transform .42s var(--ease-out-expo,cubic-bezier(.16,1,.3,1))}'+
'[dir="rtl"] .hvk-panel{right:auto;left:0;border-left:0;border-right:1px solid var(--line-2);transform:translateX(-100%)}'+
'.hvk.open .hvk-panel{transform:none}'+
'.hvk-grab{display:none}'+
'.hvk button{font-family:inherit;-webkit-tap-highlight-color:transparent}'+
'.hvk :is(button,a):focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}'+
'.hvk svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}'+

/* Topp */
'.hvk-head{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:34px;padding:18px 22px 14px}'+
'.hvk-eyebrow{margin:0;display:inline-flex;align-items:center;gap:9px;font:600 10.5px/1 var(--font-sans);letter-spacing:1.8px;text-transform:uppercase;color:var(--ink3)}'+
'.hvk-eyebrow::before{content:"";width:16px;height:1px;background:var(--accent);opacity:.85}'+
'.hvk-x{flex-shrink:0;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;'+
  'border:1px solid var(--line-2);background:transparent;color:var(--ink2);cursor:pointer;transition:color .18s,border-color .18s,background .18s}'+
'.hvk-x svg{width:15px;height:15px}'+
'@media(hover:hover){.hvk-x:hover{color:var(--ink);border-color:color-mix(in srgb,var(--accent) 50%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}}'+

/* Skjerm og taster */
'.hvk-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:4px 22px 28px}'+
'.hvk-display{display:flex;flex-direction:column;justify-content:flex-end;gap:6px;min-height:118px;margin:0 0 12px;padding:20px 18px 16px;text-align:right;'+
  'border:1px solid var(--line);border-radius:12px;background:var(--surface)}'+
'.hvk-expr{min-height:19px;font:500 12.5px/1.5 var(--font-sans);letter-spacing:.04em;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}'+
'.hvk-now{font-family:var(--font-serif,Georgia,serif);font-weight:500;font-size:44px;line-height:1.15;letter-spacing:-1px;color:var(--ink);'+
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums lining-nums}'+
'.hvk-now.is-sm{font-size:32px}'+
'.hvk-now.is-xs{font-size:24px}'+
'@keyframes hvkPop{from{opacity:.4;transform:translateY(3px)}}'+
'.hvk-now.pop{animation:hvkPop .22s ease-out}'+
'.hvk-keys{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}'+
'.hvk-key{height:58px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);cursor:pointer;user-select:none;-webkit-user-select:none;'+
  'font:500 20px/1 var(--font-sans);font-variant-numeric:tabular-nums;transition:background .14s,border-color .14s,color .14s}'+
'.hvk-key.is-fn{background:transparent;color:var(--ink2);font-size:15px;font-weight:600;letter-spacing:.04em}'+
'.hvk-key[data-k="sign"]{font-size:22px;font-weight:500;letter-spacing:0}'+
'.hvk-key[data-k="decimal"]{font-size:24px;font-weight:700}'+
'.hvk-key.is-op{background:color-mix(in srgb,var(--accent) 10%,transparent);border-color:color-mix(in srgb,var(--accent) 22%,transparent);color:var(--accent);font-size:23px}'+
'.hvk-key.is-op[aria-pressed="true"],.hvk-key.is-eq{background:var(--accent);border-color:transparent;color:var(--on-accent,var(--bg))}'+
'.hvk-key.is-eq{font-size:23px;font-weight:600}'+
'@media(hover:hover){.hvk-key:hover{border-color:var(--line-2);background:color-mix(in srgb,var(--ink) 6%,var(--surface))}'+
  '.hvk-key.is-fn:hover{background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--ink)}'+
  '.hvk-key.is-op:hover{background:color-mix(in srgb,var(--accent) 18%,transparent)}'+
  '.hvk-key.is-op[aria-pressed="true"]:hover,.hvk-key.is-eq:hover{background:var(--accent-2,var(--accent))}}'+
'.hvk-key:active,.hvk-key.is-press{background:color-mix(in srgb,var(--ink) 10%,var(--surface))}'+
'.hvk-key.is-op:active,.hvk-key.is-op.is-press{background:color-mix(in srgb,var(--accent) 26%,transparent)}'+
'.hvk-key.is-eq:active,.hvk-key.is-eq.is-press{background:var(--accent-deep,var(--accent))}'+
'.hvk-tip{margin:16px 0 0;font:400 12px/1.5 var(--font-sans);color:var(--ink3)}'+
'.hvk-more{display:inline-block;margin-top:12px;font:500 13px/1.4 var(--font-sans);color:var(--ink2);text-decoration:underline;text-decoration-color:var(--line-2);text-underline-offset:3px;border-radius:3px}'+
'@media(hover:hover){.hvk-more:hover{color:var(--ink)}}'+

/* Telefon: ark nedenfra, bare så høyt som kalkulatoren */
'@media (max-width:640px){'+
  '.hvk-panel,[dir="rtl"] .hvk-panel{top:auto;left:0;right:0;bottom:0;width:100%;max-height:calc(100dvh - 20px);border:1px solid var(--line-2);border-bottom:0;'+
    'border-radius:20px 20px 0 0;box-shadow:0 -30px 80px -30px rgba(0,0,0,.7);transform:translateY(100%);'+
    'background:radial-gradient(120% 22% at 50% 0%,rgba(var(--glow-rgb,200,153,104),.07),transparent 70%),var(--bg)}'+
  '.hvk.open .hvk-panel{transform:none}'+
  '.hvk-grab{display:flex;justify-content:center;flex-shrink:0;padding:9px 0 0;touch-action:none}'+
  '.hvk-grab i{width:38px;height:4px;border-radius:999px;background:var(--line-2)}'+
  '.hvk-head{padding:8px 16px 12px;touch-action:none}'+
  '.hvk-body{padding:0 16px calc(20px + env(safe-area-inset-bottom,0px))}'+
  '.hvk-display{min-height:100px;padding:16px 16px 14px}'+
  '.hvk-now{font-size:38px}'+
  '.hvk-key{height:54px}'+
  '.hvk-tip{display:none}'+
'}'+
'@media (prefers-reduced-motion:reduce){'+
  '.hvk,.hvk-panel{transition:opacity .01ms}'+
  '.hvk-panel,[dir="rtl"] .hvk-panel{transform:none}'+
  '.hvk-now.pop{animation:none}'+
'}';

window.HVKalkulator={open:open,close:close};
})();
