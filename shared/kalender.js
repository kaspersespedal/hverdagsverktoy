/* ══ Kalender (forsiden) ═══════════════════════════════════════════════════
   Åpnes fra kalender-knappen i dagsoversikt-toppen (index.html, #kalBoot) og
   hentes først når knappen brukes. Sidepanel fra høyre på PC, ark nedenfra på
   telefon. Ingen avhengigheter utover window.HVFrister (fristene på forsiden).

   Viser: månedsvisning med ukenummer, norske helligdager og merkedager, egne
   avtaler og de fristene brukeren selv har valgt (via «Hvem er du?» eller én
   og én). Alt brukeren legger inn, lagres bare i nettleseren (localStorage).

   Bare norsk tekst foreløpig: roten har data-ph-skip, så frase-ordboka i
   core.js ikke oversetter enkeltord midt i norsk tekst.

   window.HVKalender er veien inn for annen kode (og for en AI-assistent senere):
   open, close, leggTil, fristerFor og settFrist. Skjemaet og fristvelgeren
   bruker de samme funksjonene. */
(function(){
"use strict";
if(window.HVKalender) return;

var F=window.HVFrister||null;
var LS="hvkal_v1";
var MOF=["Januar","Februar","Mars","April","Mai","Juni","Juli","August","September","Oktober","November","Desember"];
var MOL=["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"];
var MOS=["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"];
var WDL=["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"];
var WDS=["man","tir","ons","tor","fre","lør","søn"];
var IMP={k:"Kritisk",h:"Viktig",m:"Vanlig"};

/* ═══ Hjelpere ═══ */
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function pad(n){return n<10?"0"+n:""+n;}
function key(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function fromKey(k){var p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
function day0(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function addDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function diffDays(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function isoWeek(d){
  var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),n=t.getUTCDay()||7;
  t.setUTCDate(t.getUTCDate()+4-n);
  return Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/86400000+1)/7);
}
/* «søndag 22. november», med årstall bare når det ikke er i år */
function longDate(d){
  return WDL[d.getDay()]+" "+d.getDate()+". "+MOL[d.getMonth()]+(d.getFullYear()!==S.today.getFullYear()?" "+d.getFullYear():"");
}
function relText(d){
  var n=diffDays(S.today,d);
  if(n===0)return "I dag";
  if(n===1)return "I morgen";
  if(n===-1)return "I går";
  return n>0?"om "+n+" dager":"for "+(-n)+" dager siden";
}

/* ═══ Lagring: egne avtaler, valgte frister og «hvem er du» ═══
   ev: [{id,t:tittel,d:"ÅÅÅÅ-MM-DD",k:"TT:MM"|"",r:"y"|"",s:kilde}]  fr: [kortnavn på frist]  pr: [målgruppe] */
function okEv(e){
  return e&&typeof e.id==="string"&&typeof e.t==="string"&&e.t&&/^\d{4}-\d{2}-\d{2}$/.test(e.d)&&
    (e.k===""||/^\d{2}:\d{2}$/.test(e.k))&&(e.r===""||e.r==="y");
}
function isStr(s){return typeof s==="string";}
function load(){
  var o=null;
  try{o=JSON.parse(localStorage.getItem(LS)||"null");}catch(e){}
  if(!o||typeof o!=="object")o={};
  return {
    ev:Array.isArray(o.ev)?o.ev.filter(okEv):[],
    fr:Array.isArray(o.fr)?o.fr.filter(isStr):[],
    pr:Array.isArray(o.pr)?o.pr.filter(isStr):[]
  };
}
function save(){
  try{localStorage.setItem(LS,JSON.stringify({v:1,ev:data.ev,fr:data.fr,pr:data.pr}));}catch(e){}
  idx={};
}
var data=load();

/* ═══ Helligdager og merkedager ═══ */
function nthSunday(y,m,n){var d=new Date(y,m,1);d.setDate(1+((7-d.getDay())%7)+7*(n-1));return d;}
function lastSunday(y,m){var d=new Date(y,m+1,0);d.setDate(d.getDate()-d.getDay());return d;}
/* [dato, navn, rød dag] */
function holidays(y){
  var e=F?F.easter(y):null,out=[];
  function ea(n){return new Date(y,e.getMonth(),e.getDate()+n);}
  function add(d,n,red){out.push([d,n,red]);}
  add(new Date(y,0,1),"Første nyttårsdag",1);
  add(new Date(y,4,1),"Arbeidernes dag",1);
  add(new Date(y,4,17),"Grunnlovsdagen",1);
  add(new Date(y,11,25),"Første juledag",1);
  add(new Date(y,11,26),"Andre juledag",1);
  if(e){
    add(ea(-3),"Skjærtorsdag",1);add(ea(-2),"Langfredag",1);add(ea(0),"Første påskedag",1);add(ea(1),"Andre påskedag",1);
    add(ea(39),"Kristi himmelfartsdag",1);add(ea(49),"Første pinsedag",1);add(ea(50),"Andre pinsedag",1);
    add(ea(-7),"Palmesøndag",0);add(ea(-1),"Påskeaften",0);add(ea(48),"Pinseaften",0);
  }
  add(new Date(y,1,6),"Samenes nasjonaldag",0);
  add(nthSunday(y,1,2),"Morsdag",0);
  add(new Date(y,2,8),"Kvinnedagen",0);
  add(lastSunday(y,2),"Sommertid starter",0);
  add(new Date(y,5,23),"Sankthansaften",0);
  add(lastSunday(y,9),"Vintertid starter",0);
  add(nthSunday(y,10,2),"Farsdag",0);
  add(new Date(y,11,24),"Julaften",0);
  add(new Date(y,11,31),"Nyttårsaften",0);
  return out;
}

/* ═══ Frister ═══ Bare de med fast dato kan stå i en kalender. Kortnavnet er nøkkelen. */
function dated(){return F?F.D.filter(function(x){return x.mo||x.monthly||x.terms;}):[];}
function fristById(id){var a=dated();for(var i=0;i<a.length;i++)if(a[i].short===id)return a[i];return null;}
/* Alle datoene fristen har i år y (flyttet til virkedag der regelen sier det) */
function frDates(x,y){
  var out=[],i,d;
  if(x.monthly){for(i=0;i<12;i++)out.push(F.workday(new Date(y,i,x.monthly)));}
  else if(x.terms){x.terms.forEach(function(t){out.push(F.workday(new Date(y,t[0]-1,t[1])));});}
  else{d=F.dateIn(x,y);if(d)out.push(d);}
  return out;
}
function fristerFor(profiler){
  var p=profiler&&profiler.length?profiler:null;
  return dated().filter(function(x){
    if(!p)return true;
    for(var i=0;i<p.length;i++)if(x.a.indexOf(p[i])>=0)return true;
    return false;
  });
}
function settFrist(id,on){
  if(!fristById(id))return false;
  var i=data.fr.indexOf(id);
  if(on&&i<0)data.fr.push(id);
  if(!on&&i>=0)data.fr.splice(i,1);
  save();
  return true;
}
/* Målgruppene som har minst én frist med fast dato, i samme rekkefølge som på forsiden */
function profiles(){
  if(!F)return [];
  var a=dated();
  return Object.keys(F.AUD).filter(function(p){return a.some(function(x){return x.a.indexOf(p)>=0;});});
}

/* ═══ Egne avtaler ═══ */
function leggTil(o){
  if(!o)return null;
  var e={id:o.id||("e"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),
    t:String(o.tittel||"").trim().slice(0,80),d:String(o.dato||""),k:String(o.tid||""),r:o.hvertAar?"y":""};
  if(o.kilde&&o.kilde!=="egen")e.s=String(o.kilde);
  if(!okEv(e)||key(fromKey(e.d))!==e.d)return null;
  var i=evIndex(e.id);
  if(i>=0)data.ev[i]=e;else data.ev.push(e);
  save();
  return e.id;
}
function evIndex(id){for(var i=0;i<data.ev.length;i++)if(data.ev[i].id===id)return i;return -1;}
function fjern(id){var i=evIndex(id);if(i>=0){data.ev.splice(i,1);save();}}
/* Datoen avtalen faller på i år y (29. februar blir 28. i år uten skuddag), ellers null */
function evDateIn(e,y){
  var d=fromKey(e.d);
  if(e.r!=="y")return d.getFullYear()===y?d:null;
  if(y<d.getFullYear())return null;
  var x=new Date(y,d.getMonth(),d.getDate());
  return x.getMonth()===d.getMonth()?x:new Date(y,d.getMonth()+1,0);
}

/* ═══ Oppslag per år: dato → {hol:[],fr:[],ev:[]} ═══ Tømmes ved hver lagring. */
var idx={};
function yearIdx(y){
  if(idx[y])return idx[y];
  var m={};
  function at(d){var k=key(d);return m[k]||(m[k]={hol:[],fr:[],ev:[]});}
  holidays(y).forEach(function(h){at(h[0]).hol.push({n:h[1],red:h[2]});});
  data.fr.forEach(function(id){
    var x=fristById(id);if(!x)return;
    /* Fjoråret er med fordi en frist kan flyttes over nyttår til første virkedag */
    frDates(x,y-1).concat(frDates(x,y)).forEach(function(d){if(d.getFullYear()===y)at(d).fr.push(x);});
  });
  data.ev.forEach(function(e){var d=evDateIn(e,y);if(d)at(d).ev.push(e);});
  Object.keys(m).forEach(function(k){m[k].ev.sort(function(a,b){return (a.k||"")<(b.k||"")?-1:(a.k||"")>(b.k||"")?1:0;});});
  return (idx[y]=m);
}
function dayInfo(d){return yearIdx(d.getFullYear())[key(d)]||null;}
function isRed(d,info){return d.getDay()===0||!!(info&&info.hol.some(function(h){return h.red;}));}

/* ═══ Tilstand ═══ */
var S={today:day0(new Date()),sel:null,y:0,m:0,view:"cal",editId:null,q:"",trigger:null,dir:"",armed:false};
var root=null,panel=null,viewEl=null,hideTimer=null;

/* ═══ Ikoner ═══ */
var I={
  x:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  l:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5"/></svg>',
  r:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>',
  plus:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9"/></svg>',
  pen:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13l.6-2.8 7-7a1.4 1.4 0 0 1 2 0l.2.2a1.4 1.4 0 0 1 0 2l-7 7L3 13z"/></svg>'
};

/* ═══ Visning: kalender ═══ */
function headHtml(title,sub,back){
  return '<header class="kal-head">'+
    '<div class="kal-top">'+
      (back?'<button type="button" class="kal-back" data-act="back">'+I.l+'<span>Kalender</span></button>'
           :'<span class="kal-eyebrow">Kalender</span>')+
      '<button type="button" class="kal-x" data-act="close" aria-label="Lukk kalenderen">'+I.x+'</button>'+
    '</div>'+title+(sub?'<p class="kal-sub">'+sub+'</p>':'')+
  '</header>';
}
function gridHtml(){
  /* Alltid seks uker, så innholdet under ikke hopper når man blar mellom måneder */
  var first=new Date(S.y,S.m,1),start=addDays(first,-((first.getDay()+6)%7)),h='',w,i,d,info,cls,lab,dots,n;
  var tk=key(S.today),sk=key(S.sel);
  h+='<div class="kal-row kal-wd" aria-hidden="true"><span class="kal-wk">uke</span>';
  for(i=0;i<7;i++)h+='<span'+(i===6?' class="is-red"':'')+'>'+WDS[i]+'</span>';
  h+='</div>';
  for(w=0;w<6;w++){
    d=addDays(start,w*7);
    h+='<div class="kal-row"><span class="kal-wk" aria-hidden="true">'+isoWeek(d)+'</span>';
    for(i=0;i<7;i++){
      d=addDays(start,w*7+i);info=dayInfo(d);
      cls="kal-d";lab=longDate(d);dots="";
      if(d.getMonth()!==S.m)cls+=" is-out";
      if(isRed(d,info))cls+=" is-red";
      if(key(d)===tk){cls+=" is-today";lab+=", i dag";}
      if(key(d)===sk)cls+=" is-sel";
      if(info){
        info.hol.forEach(function(x){lab+=", "+x.n;});
        if(info.fr.length){dots+='<i class="f"></i>';lab+=", "+info.fr.length+(info.fr.length===1?" frist":" frister");}
        if(info.ev.length){dots+='<i class="e"></i>';lab+=", "+info.ev.length+(info.ev.length===1?" avtale":" avtaler");}
        if(!dots&&info.hol.some(function(x){return !x.red;}))dots='<i class="h"></i>';
      }
      n=d.getDate();
      h+='<button type="button" class="'+cls+'" data-d="'+key(d)+'" tabindex="'+(key(d)===sk?0:-1)+'" aria-label="'+esc(cap(lab))+'"'+
        (key(d)===sk?' aria-pressed="true"':' aria-pressed="false"')+(key(d)===tk?' aria-current="date"':'')+'>'+
        '<span class="n">'+n+'</span><span class="dots">'+dots+'</span></button>';
    }
    h+='</div>';
  }
  return h;
}
function itemsHtml(d,info){
  var h='';
  if(!info)return h;
  info.hol.forEach(function(x){
    h+='<li class="kal-it is-h"><span class="kal-mk"></span><div class="kal-tx"><b>'+esc(x.n)+'</b><small>'+(x.red?"Helligdag":"Merkedag")+'</small></div></li>';
  });
  info.fr.forEach(function(x){
    h+='<li class="kal-it is-f"><span class="kal-mk"></span><div class="kal-tx"><b>'+esc(x.n)+'</b>'+
      '<small>Frist · '+esc(x.w)+'</small><small>Bommer du: '+esc(x.p)+'</small>'+
      '<a class="kal-src" href="'+esc(x.u)+'" target="_blank" rel="noopener">Kilde: '+esc(x.s)+'</a></div></li>';
  });
  info.ev.forEach(function(e){
    h+='<li class="kal-it is-e"><button type="button" class="kal-evb" data-act="edit" data-id="'+esc(e.id)+'" aria-label="Endre avtalen '+esc(e.t)+'">'+
      '<span class="kal-mk"></span><span class="kal-tx"><b>'+esc(e.t)+'</b><small>'+(e.k?"kl. "+esc(e.k):"Hele dagen")+(e.r==="y"?" · hvert år":"")+'</small></span>'+
      '<span class="kal-pen">'+I.pen+'</span></button></li>';
  });
  return h;
}
/* De neste hendelsene fra i dag: egne avtaler, valgte frister og røde dager. Valgt dag hoppes over (den står rett over). */
function upcoming(max){
  var out=[],y=S.today.getFullYear(),tk=key(S.today),sk=key(S.sel),yy,m,ks,i,info,d;
  for(yy=y;yy<=y+1&&out.length<max;yy++){
    m=yearIdx(yy);ks=Object.keys(m).sort();
    for(i=0;i<ks.length&&out.length<max;i++){
      if(ks[i]<tk||ks[i]===sk)continue;
      info=m[ks[i]];d=fromKey(ks[i]);
      info.ev.forEach(function(e){out.push({d:d,t:e.t,s:e.k?"kl. "+e.k:"Avtale"});});
      info.fr.forEach(function(x){out.push({d:d,t:x.short,s:"Frist"});});
      info.hol.forEach(function(x){if(x.red)out.push({d:d,t:x.n,s:"Helligdag"});});
    }
  }
  return out.slice(0,max);
}
function calHtml(){
  var info=dayInfo(S.sel),items=itemsHtml(S.sel,info),up=upcoming(5),h,n=0;
  data.fr.forEach(function(id){if(fristById(id))n++;});
  h=headHtml(
    '<div class="kal-bar"><h2 class="kal-title" id="kalTitle"><span>'+MOF[S.m]+'</span> <span class="kal-yr">'+S.y+'</span></h2>'+
    '<div class="kal-nav"><button type="button" class="kal-chipbtn" data-act="today">I dag</button>'+
    '<button type="button" class="kal-arrow" data-act="prev" aria-label="Forrige måned">'+I.l+'</button>'+
    '<button type="button" class="kal-arrow" data-act="next" aria-label="Neste måned">'+I.r+'</button></div></div>');
  h+='<div class="kal-body"><div class="kal-pad">';
  h+='<div class="kal-grid'+(S.dir?" go-"+S.dir:"")+'" data-kal-grid>'+gridHtml()+'</div>';
  h+='<p class="kal-legend" aria-hidden="true"><span><i class="f"></i>Frist</span><span><i class="e"></i>Avtale</span><span><i class="h"></i>Merkedag</span><span><b>7</b>Rød dag</span></p>';
  h+='<section class="kal-sec" aria-live="polite"><div class="kal-sec-head"><h3>'+esc(cap(longDate(S.sel)))+'</h3><span class="kal-rel">'+relText(S.sel)+'</span></div>'+
    (items?'<ul class="kal-list">'+items+'</ul>':'<p class="kal-empty">Ingenting denne dagen.</p>')+
    '<button type="button" class="kal-btn kal-add" data-act="new">'+I.plus+'<span>Ny avtale</span></button></section>';
  if(up.length){
    h+='<section class="kal-sec"><h3 class="kal-lbl">Kommer</h3><ul class="kal-list kal-up">';
    up.forEach(function(u){
      h+='<li><button type="button" class="kal-upb" data-act="goto" data-d="'+key(u.d)+'">'+
        '<span class="kal-flak"><b>'+u.d.getDate()+'</b><i>'+MOS[u.d.getMonth()]+'</i></span>'+
        '<span class="kal-tx"><b>'+esc(u.t)+'</b><small>'+esc(u.s)+' · '+relText(u.d)+'</small></span></button></li>';
    });
    h+='</ul></section>';
  }
  if(F){
    h+='<section class="kal-sec"><div class="kal-card"><div class="kal-tx"><b>Frister i kalenderen</b><small>'+
      (n?(n===1?"1 frist er lagt inn.":n+" frister er lagt inn."):"Velg hvem du er, så foreslår kalenderen fristene som gjelder deg.")+
      '</small></div><button type="button" class="kal-btn" data-act="fr">'+(n?"Endre":"Velg frister")+'</button></div></section>';
  }
  h+='</div></div>';
  return h;
}

/* ═══ Visning: velg frister ═══ */
function frVisible(){
  var q=S.q;
  return fristerFor(data.pr).filter(function(x){
    return !q||(x.n+" "+x.short+" "+x.w+" "+x.s).toLowerCase().indexOf(q)>=0;
  });
}
function frListHtml(){
  var vis=frVisible(),h='',on=0;
  vis.forEach(function(x){if(data.fr.indexOf(x.short)>=0)on++;});
  h+='<div class="kal-bulk"><span>'+(vis.length===1?"1 frist":vis.length+" frister")+(on?" · "+on+" valgt":"")+'</span>'+
    (vis.length?'<span class="kal-bulk-b"><button type="button" class="kal-link" data-act="all"'+(on===vis.length?" disabled":"")+'>Legg til alle</button>'+
    '<button type="button" class="kal-link" data-act="none"'+(on?"":" disabled")+'>Fjern alle</button></span>':'')+'</div>';
  if(!vis.length)return h+'<p class="kal-empty">Ingen frister passer søket.</p>';
  F.CATS.forEach(function(c){
    var rows=vis.filter(function(x){return x.c===c.id;});
    if(!rows.length)return;
    h+='<h4 class="kal-lbl">'+esc(c.t)+'</h4><ul class="kal-frl">';
    rows.forEach(function(x){
      var nx=F.nextDate(x,S.today);
      h+='<li><label class="kal-fr"><input type="checkbox" data-fr="'+esc(x.short)+'"'+(data.fr.indexOf(x.short)>=0?" checked":"")+'>'+
        '<span class="kal-tx"><b>'+esc(x.short)+'</b><small>'+(nx?"Neste: "+nx.getDate()+". "+MOL[nx.getMonth()]+" "+nx.getFullYear():"Datoen er ikke klar ennå")+
        " · "+esc(x.f)+'</small></span><span class="kal-imp">'+IMP[x.i]+'</span></label></li>';
    });
    h+='</ul>';
  });
  return h;
}
function frHtml(){
  var h=headHtml('<h2 class="kal-title is-sm" id="kalTitle">Frister</h2>',"Velg hvilke frister som skal stå i kalenderen din.",true);
  h+='<div class="kal-body"><div class="kal-pad">';
  h+='<h3 class="kal-lbl" id="kalWho">Hvem er du?</h3><div class="kal-chips" role="group" aria-labelledby="kalWho">';
  profiles().forEach(function(p){
    h+='<button type="button" class="kal-chip" data-prof="'+esc(p)+'" aria-pressed="'+(data.pr.indexOf(p)>=0)+'">'+esc(F.AUD[p])+'</button>';
  });
  h+='</div><p class="kal-hint">Velg én eller flere. Uten valg vises alle fristene.</p>';
  h+='<input type="search" class="kal-in kal-q" data-kal-q placeholder="Søk i frister" aria-label="Søk i frister" value="'+esc(S.q)+'">';
  h+='<div data-kal-frlist>'+frListHtml()+'</div>';
  h+='<p class="kal-note">Frister uten fast dato, som klagefrister, står under «Viktige frister» på forsiden.</p>';
  h+='</div></div><footer class="kal-foot"><button type="button" class="kal-btn is-primary" data-act="back">Ferdig</button></footer>';
  return h;
}

/* ═══ Visning: ny / endre avtale ═══ */
function formHtml(){
  var e=S.editId?data.ev[evIndex(S.editId)]:null;
  var h=headHtml('<h2 class="kal-title is-sm" id="kalTitle">'+(e?"Endre avtale":"Ny avtale")+'</h2>',"",true);
  h+='<form class="kal-body" data-kal-form novalidate><div class="kal-pad">'+
    '<label class="kal-f"><span>Hva skjer?</span><input class="kal-in" type="text" name="t" maxlength="80" autocomplete="off" placeholder="For eksempel tannlege" value="'+esc(e?e.t:"")+'"></label>'+
    '<div class="kal-f2"><label class="kal-f"><span>Dato</span><input class="kal-in" type="date" name="d" value="'+esc(e?e.d:key(S.sel))+'"></label>'+
    '<label class="kal-f"><span>Klokkeslett <em>valgfritt</em></span><input class="kal-in" type="time" name="k" value="'+esc(e?e.k:"")+'"></label></div>'+
    '<label class="kal-check"><input type="checkbox" name="r"'+(e&&e.r==="y"?" checked":"")+'><span>Gjenta hvert år <small>for eksempel bursdager</small></span></label>'+
    '<p class="kal-err" data-kal-err role="alert" hidden></p>'+
    '<div class="kal-actions"><button type="submit" class="kal-btn is-primary">Lagre</button>'+
    '<button type="button" class="kal-btn" data-act="back">Avbryt</button>'+
    (e?'<button type="button" class="kal-link kal-del" data-act="del">Slett avtalen</button>':'')+'</div>'+
    '<p class="kal-note">Avtalene lagres bare i denne nettleseren, ikke hos oss. <a href="/personvern/">Les om lagring</a></p>'+
  '</div></form>';
  return h;
}

/* ═══ Tegning og fokus ═══ */
function render(focus){
  viewEl.innerHTML=S.view==="fr"?frHtml():S.view==="form"?formHtml():calHtml();
  viewEl.setAttribute("data-view",S.view);
  S.dir="";S.armed=false;
  var el=null;
  if(focus==="day")el=viewEl.querySelector(".kal-d.is-sel");
  else if(focus==="first")el=viewEl.querySelector("input[name=t],.kal-chip");
  else if(focus)el=viewEl.querySelector(focus);
  if(el){try{el.focus({preventScroll:focus==="day"});}catch(_){}}
}
function show(view,focus){
  S.view=view;render(focus);
  var b=viewEl.querySelector(".kal-body");if(b)b.scrollTop=0;
}
/* Velg en dag; bytter måned når dagen ligger utenfor den som vises */
function select(d,focus){
  var nm=d.getFullYear()*12+d.getMonth(),om=S.y*12+S.m;
  S.sel=day0(d);
  if(nm!==om){S.dir=nm>om?"next":"prev";S.y=d.getFullYear();S.m=d.getMonth();}
  render(focus?"day":null);
}
function shiftMonth(n,focus){
  var d=new Date(S.y,S.m+n,1),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  S.dir=n>0?"next":"prev";S.y=d.getFullYear();S.m=d.getMonth();
  /* Samme dag i måneden, eller den siste når måneden er kortere */
  S.sel=new Date(S.y,S.m,Math.min(S.sel.getDate(),last));
  render(focus);
}

/* ═══ Hendelser ═══ */
/* Klikk utenfor panelet lukker, men bare når trykket også startet der. Ellers lukket
   panelet seg når man markerte tekst i et felt og slapp musa utenfor. */
var downOutside=false;
function onDown(ev){downOutside=ev.target===root;}
function onClick(ev){
  if(ev.target===root){if(downOutside)close();return;}
  var day=ev.target.closest(".kal-d");
  if(day){select(fromKey(day.getAttribute("data-d")),true);return;}
  var chip=ev.target.closest("[data-prof]");
  if(chip){
    var p=chip.getAttribute("data-prof"),i=data.pr.indexOf(p);
    if(i>=0)data.pr.splice(i,1);else data.pr.push(p);
    save();render('[data-prof="'+p+'"]');return;
  }
  var b=ev.target.closest("[data-act]");
  if(!b)return;
  var act=b.getAttribute("data-act");
  if(act==="close")close();
  else if(act==="prev")shiftMonth(-1,'[data-act="prev"]');
  else if(act==="next")shiftMonth(1,'[data-act="next"]');
  else if(act==="today")select(S.today,true);
  else if(act==="goto")select(fromKey(b.getAttribute("data-d")),true);
  else if(act==="new"){S.editId=null;show("form","first");}
  else if(act==="edit"){S.editId=b.getAttribute("data-id");show("form","first");}
  else if(act==="fr"){S.q="";show("fr","first");}
  else if(act==="back")show("cal","day");
  else if(act==="all"||act==="none"){
    frVisible().forEach(function(x){
      var i=data.fr.indexOf(x.short);
      if(act==="all"&&i<0)data.fr.push(x.short);
      if(act==="none"&&i>=0)data.fr.splice(i,1);
    });
    save();refreshFrList();
  }
  else if(act==="del"){
    /* To trykk: sletting kan ikke angres */
    if(!S.armed){S.armed=true;b.textContent="Trykk en gang til for å slette";return;}
    fjern(S.editId);show("cal","day");
  }
}
function refreshFrList(){var l=viewEl.querySelector("[data-kal-frlist]");if(l)l.innerHTML=frListHtml();}
function onChange(ev){
  var c=ev.target;
  if(c.matches&&c.matches("[data-fr]")){
    settFrist(c.getAttribute("data-fr"),c.checked);
    var id=c.getAttribute("data-fr");
    refreshFrList();
    var again=viewEl.querySelector('[data-fr="'+id.replace(/"/g,'\\"')+'"]');
    if(again){try{again.focus({preventScroll:true});}catch(_){}}
  }
}
function onInput(ev){
  if(ev.target.matches&&ev.target.matches("[data-kal-q]")){S.q=ev.target.value.trim().toLowerCase();refreshFrList();}
}
function onSubmit(ev){
  var f=ev.target;
  if(!f.matches||!f.matches("[data-kal-form]"))return;
  ev.preventDefault();
  var err=f.querySelector("[data-kal-err]"),t=f.elements.t.value.trim(),d=f.elements.d.value;
  function fail(msg,el){err.textContent=msg;err.hidden=false;el.focus();}
  if(!t)return fail("Skriv hva som skjer.",f.elements.t);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return fail("Velg en dato.",f.elements.d);
  var id=leggTil({id:S.editId||undefined,tittel:t,dato:d,tid:f.elements.k.value,hvertAar:f.elements.r.checked});
  if(!id)return fail("Det ble ikke lagret. Sjekk dato og klokkeslett.",f.elements.d);
  var dt=fromKey(d);
  S.sel=dt;S.y=dt.getFullYear();S.m=dt.getMonth();
  show("cal","day");
}
function onKey(ev){
  if(!root||!root.classList.contains("open"))return;
  if(ev.key==="Escape"){ev.preventDefault();if(S.view==="cal")close();else show("cal","day");return;}
  var day=ev.target.closest&&ev.target.closest(".kal-d");
  if(day){
    var n={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[ev.key];
    if(n){ev.preventDefault();select(addDays(S.sel,n),true);return;}
    if(ev.key==="Home"){ev.preventDefault();select(addDays(S.sel,-((S.sel.getDay()+6)%7)),true);return;}
    if(ev.key==="End"){ev.preventDefault();select(addDays(S.sel,6-((S.sel.getDay()+6)%7)),true);return;}
    if(ev.key==="PageUp"){ev.preventDefault();shiftMonth(-1,"day");return;}
    if(ev.key==="PageDown"){ev.preventDefault();shiftMonth(1,"day");return;}
  }
  /* Piltaster, mellomrom og Page Up/Down skal ikke rulle forsiden bak panelet */
  if(/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(ev.key)&&!(ev.target.closest&&ev.target.closest(".kal-body"))&&
     !(ev.key===" "&&ev.target.closest&&ev.target.closest("button,a,input"))){ev.preventDefault();return;}
  if(ev.key!=="Tab")return;
  /* Fokusfelle: Tab skal ikke vandre ut i forsiden bak panelet */
  var all=panel.querySelectorAll('button,[href],input,[tabindex]:not([tabindex="-1"])'),list=[],i;
  for(i=0;i<all.length;i++)if(all[i].offsetParent!==null&&!all[i].disabled&&all[i].tabIndex>=0)list.push(all[i]);
  if(!list.length)return;
  if(ev.shiftKey&&(document.activeElement===list[0]||document.activeElement===panel)){ev.preventDefault();list[list.length-1].focus();}
  else if(!ev.shiftKey&&document.activeElement===list[list.length-1]){ev.preventDefault();list[0].focus();}
}
/* Siden bak skal ikke rulle. Et rullefelt (.kal-body) som faktisk har noe å rulle,
   holder rullingen for seg selv med overscroll-behavior; alt annet stoppes her. */
function canScroll(t){var b=t.closest&&t.closest(".kal-body");return !!b&&b.scrollHeight>b.clientHeight;}
function onWheel(ev){if(!canScroll(ev.target))ev.preventDefault();}

/* Berøring: sveip sidelengs i rutenettet bytter måned; dra toppen ned lukker arket (telefon) */
var T=null;
function onTouchStart(ev){
  if(ev.touches.length!==1){T=null;return;}
  var t=ev.touches[0],grid=ev.target.closest("[data-kal-grid]"),head=ev.target.closest(".kal-head,.kal-grab");
  T={x:t.clientX,y:t.clientY,dx:0,dy:0,mode:grid?"grid":(head&&isSheet()&&!ev.target.closest("button,a,input")?"sheet":""),lock:""};
}
function isSheet(){return window.matchMedia("(max-width:640px)").matches;}
function onTouchMove(ev){
  if(!T){if(!canScroll(ev.target))ev.preventDefault();return;}
  var t=ev.touches[0];T.dx=t.clientX-T.x;T.dy=t.clientY-T.y;
  if(T.mode==="sheet"){
    ev.preventDefault();
    panel.style.transition="none";panel.style.transform="translateY("+Math.max(0,T.dy)+"px)";
    return;
  }
  if(T.mode==="grid"){
    if(!T.lock&&(Math.abs(T.dx)>10||Math.abs(T.dy)>10))T.lock=Math.abs(T.dx)>Math.abs(T.dy)*1.4?"x":"y";
    if(T.lock==="x"){ev.preventDefault();return;}
  }
  if(!canScroll(ev.target))ev.preventDefault();
}
function onTouchEnd(){
  if(!T)return;
  var t=T;T=null;
  if(t.mode==="sheet"){
    /* Lukk først, så glir arket videre ned fra der fingeren slapp */
    panel.style.transition="";
    if(t.dy>110)close();
    panel.style.transform="";
  }else if(t.mode==="grid"&&t.lock==="x"&&Math.abs(t.dx)>48){
    shiftMonth(t.dx<0?1:-1,null);
  }
}

/* ═══ Åpne / lukke ═══ */
function build(){
  var st=document.createElement("style");st.id="hvKalCss";st.textContent=CSS;document.head.appendChild(st);
  root=document.createElement("div");
  root.className="kal";root.id="hvKal";root.hidden=true;
  root.setAttribute("aria-hidden","true");root.setAttribute("data-ph-skip","");
  root.innerHTML='<div class="kal-panel" role="dialog" aria-modal="true" aria-labelledby="kalTitle" tabindex="-1">'+
    '<div class="kal-grab" aria-hidden="true"><i></i></div><div class="kal-view" data-kal-view></div></div>';
  document.body.appendChild(root);
  panel=root.firstChild;viewEl=panel.querySelector("[data-kal-view]");
  root.addEventListener("pointerdown",onDown);
  root.addEventListener("click",onClick);
  root.addEventListener("change",onChange);
  root.addEventListener("input",onInput);
  root.addEventListener("submit",onSubmit);
  root.addEventListener("wheel",onWheel,{passive:false});
  root.addEventListener("touchstart",onTouchStart,{passive:true});
  root.addEventListener("touchmove",onTouchMove,{passive:false});
  root.addEventListener("touchend",onTouchEnd);
  root.addEventListener("touchcancel",onTouchEnd);
  document.addEventListener("keydown",onKey);
}
function open(trigger){
  if(!root)build();
  if(hideTimer){clearTimeout(hideTimer);hideTimer=null;}
  data=load();idx={};
  S.trigger=trigger||null;S.today=day0(new Date());S.sel=S.today;
  S.y=S.today.getFullYear();S.m=S.today.getMonth();S.view="cal";S.q="";S.editId=null;S.dir="";
  render(null);
  root.hidden=false;root.setAttribute("aria-hidden","false");
  if(S.trigger)S.trigger.setAttribute("aria-expanded","true");
  /* To bilder: det første lar nettleseren tegne startstillingen, så overgangen faktisk spilles */
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    root.classList.add("open");
    try{panel.focus({preventScroll:true});}catch(_){}
  });});
}
function close(){
  if(!root||root.hidden)return;
  root.classList.remove("open");root.setAttribute("aria-hidden","true");
  if(S.trigger){S.trigger.setAttribute("aria-expanded","false");try{S.trigger.focus({preventScroll:true});}catch(_){}}
  hideTimer=setTimeout(function(){root.hidden=true;hideTimer=null;},360);
}

/* ═══ Utseende ═══ Bare temaets egne farger (ingen nye), så panelet følger alle temaene. */
var CSS=
'.kal,.kal *,.kal *::before,.kal *::after{box-sizing:border-box}'+
'.kal{position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,.42);opacity:0;transition:opacity .3s var(--ease-out-quart,ease);'+
  'font-family:var(--font-sans,system-ui,sans-serif);color:var(--ink);overscroll-behavior:contain;-webkit-tap-highlight-color:transparent}'+
'.kal[hidden]{display:none}'+
'.kal.open{opacity:1}'+
'.kal-panel{position:absolute;top:0;right:0;bottom:0;width:min(468px,100%);display:flex;flex-direction:column;outline:none;'+
  'background:radial-gradient(130% 34% at 100% 0%,rgba(var(--glow-rgb,200,153,104),.075),transparent 62%),var(--bg);'+
  'border-left:1px solid var(--line-2);box-shadow:-34px 0 90px -34px rgba(0,0,0,.7);'+
  'transform:translateX(100%);transition:transform .42s var(--ease-out-expo,cubic-bezier(.16,1,.3,1))}'+
'[dir="rtl"] .kal-panel{right:auto;left:0;border-left:0;border-right:1px solid var(--line-2);transform:translateX(-100%)}'+
'.kal.open .kal-panel{transform:none}'+
'.kal-view{display:flex;flex-direction:column;flex:1;min-height:0}'+
'.kal-grab{display:none}'+
'.kal svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}'+
'.kal button{font-family:inherit;-webkit-tap-highlight-color:transparent}'+
'.kal :is(button,a,input):focus-visible{outline:none;box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}'+

/* Topp */
'.kal-head{flex-shrink:0;padding:18px 22px 14px}'+
'.kal-top{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:34px}'+
'.kal-eyebrow{display:inline-flex;align-items:center;gap:9px;font:600 10.5px/1 var(--font-sans);letter-spacing:1.8px;text-transform:uppercase;color:var(--ink3)}'+
'.kal-eyebrow::before{content:"";width:16px;height:1px;background:var(--accent);opacity:.85}'+
'.kal-x,.kal-arrow{flex-shrink:0;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;'+
  'border:1px solid var(--line-2);background:transparent;color:var(--ink2);cursor:pointer;transition:color .18s,border-color .18s,background .18s}'+
'.kal-x svg,.kal-arrow svg{width:15px;height:15px}'+
'.kal-back{display:inline-flex;align-items:center;gap:5px;height:34px;margin-left:-8px;padding:0 12px 0 6px;border:0;border-radius:999px;background:none;'+
  'color:var(--ink2);font:500 13px/1 var(--font-sans);cursor:pointer;transition:color .18s,background .18s}'+
'.kal-back svg{width:15px;height:15px}'+
'.kal-bar{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-top:12px}'+
'.kal-title{margin:0;font-family:var(--font-serif,Georgia,serif);font-weight:500;font-size:31px;line-height:1.1;letter-spacing:-.7px;color:var(--ink)}'+
'.kal-title.is-sm{margin-top:12px;font-size:26px}'+
'.kal-yr{color:var(--ink3)}'+
'.kal-sub{margin:7px 0 0;font:400 13px/1.45 var(--font-sans);color:var(--ink3)}'+
'.kal-nav{display:flex;align-items:center;gap:6px;flex-shrink:0;padding-bottom:1px}'+
'.kal-chipbtn{height:34px;padding:0 13px;border-radius:999px;border:1px solid var(--line-2);background:transparent;color:var(--ink2);'+
  'font:600 11px/1 var(--font-sans);letter-spacing:.3px;cursor:pointer;transition:color .18s,border-color .18s,background .18s}'+
'@media(hover:hover){.kal :is(.kal-x,.kal-arrow,.kal-chipbtn):hover{color:var(--ink);border-color:color-mix(in srgb,var(--accent) 50%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}'+
  '.kal-back:hover{color:var(--ink);background:color-mix(in srgb,var(--ink) 6%,transparent)}}'+

/* Rullefelt */
'.kal-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--line-2) transparent}'+
'.kal-pad{padding:4px 22px 28px}'+

/* Rutenett */
'.kal-grid{touch-action:pan-y;user-select:none;-webkit-user-select:none}'+
'.kal-row{display:grid;grid-template-columns:24px repeat(7,minmax(0,1fr));align-items:center}'+
'.kal-wd{padding-bottom:6px;margin-bottom:4px;border-bottom:1px solid var(--line)}'+
'.kal-wd span{text-align:center;font:600 10px/1.6 var(--font-sans);letter-spacing:1.2px;text-transform:uppercase;color:var(--ink3)}'+
'.kal-row .kal-wk{text-align:left;font:500 10px/1.6 var(--font-sans);letter-spacing:.2px;text-transform:none;color:var(--ink4);font-variant-numeric:tabular-nums}'+
'.kal-d{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;height:52px;padding:5px 0 0;'+
  'border:0;background:none;color:var(--ink);cursor:pointer;border-radius:10px}'+
'.kal-d .n{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;'+
  'font:500 14.5px/1 var(--font-sans);font-variant-numeric:tabular-nums;transition:background .16s,color .16s,box-shadow .16s}'+
/* Nøytral grå (ikke --ink4): i de lyse temaene er --ink4 blålig og lignet på de røde dagene */
'.kal-d.is-out .n{color:color-mix(in srgb,var(--ink) 34%,transparent)}'+
'.kal-d.is-red .n,.kal-wd .is-red{color:var(--accent)}'+
'.kal-d.is-out.is-red .n{color:color-mix(in srgb,var(--accent) 45%,transparent)}'+
'@media(hover:hover){.kal-d:hover .n{background:color-mix(in srgb,var(--ink) 8%,transparent)}}'+
'.kal-d.is-sel .n{box-shadow:inset 0 0 0 1.5px var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent)}'+
'.kal .kal-d.is-today .n{background:var(--accent);color:var(--on-accent,var(--bg));font-weight:600;box-shadow:none}'+
'.kal .kal-d.is-today.is-sel .n{box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px var(--accent)}'+
'.kal .kal-d:focus-visible{box-shadow:none}'+
'.kal .kal-d:focus-visible .n{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--accent)}'+
'.kal-d .dots{display:flex;gap:3px;height:5px}'+
'.kal-d .dots i,.kal-legend i{display:block;width:5px;height:5px;border-radius:50%}'+
'.kal i.f{background:var(--accent)}'+
'.kal i.e{background:var(--ink2)}'+
'.kal i.h{border:1px solid var(--ink3)}'+
'.kal-d.is-out .dots{opacity:.45}'+
'@keyframes kalNext{from{opacity:0;transform:translateX(14px)}}'+
'@keyframes kalPrev{from{opacity:0;transform:translateX(-14px)}}'+
'.kal-grid.go-next{animation:kalNext .26s var(--ease-out-quart,ease) both}'+
'.kal-grid.go-prev{animation:kalPrev .26s var(--ease-out-quart,ease) both}'+
'.kal-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin:8px 0 0;padding:10px 0 0 24px;border-top:1px solid var(--line);font:400 11px/1 var(--font-sans);color:var(--ink3)}'+
'.kal-legend span{display:inline-flex;align-items:center;gap:6px}'+
'.kal-legend b{font-weight:600;color:var(--accent);font-variant-numeric:tabular-nums}'+

/* Seksjoner og lister */
'.kal-sec{margin-top:22px}'+
'.kal-sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}'+
'.kal-sec-head h3{margin:0;font-family:var(--font-serif,Georgia,serif);font-weight:500;font-size:19px;line-height:1.2;letter-spacing:-.3px;color:var(--ink)}'+
'.kal-rel{flex-shrink:0;font:500 11.5px/1 var(--font-sans);color:var(--ink3);font-variant-numeric:tabular-nums}'+
'.kal-lbl{margin:0 0 10px;font:600 10.5px/1 var(--font-sans);letter-spacing:1.6px;text-transform:uppercase;color:var(--ink3)}'+
'.kal-list,.kal-frl{list-style:none;margin:0;padding:0}'+
'.kal-list{border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}'+
'.kal-list>li+li{border-top:1px solid var(--line)}'+
'.kal-it,.kal-evb{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;text-align:left}'+
'.kal-it.is-e{padding:0}'+
'.kal-evb{width:100%;border:0;background:none;color:inherit;cursor:pointer;transition:background .16s}'+
'.kal-mk{flex-shrink:0;width:7px;height:7px;margin-top:6px;border-radius:50%;background:var(--ink2)}'+
'.is-f>.kal-mk{background:var(--accent)}'+
'.is-h>.kal-mk{background:none;border:1px solid var(--ink3)}'+
'.kal-tx{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}'+
'.kal-tx b{font:500 14px/1.35 var(--font-sans);color:var(--ink);overflow-wrap:anywhere}'+
'.kal-tx small{font:400 12px/1.4 var(--font-sans);color:var(--ink3)}'+
'.kal-src{align-self:flex-start;margin-top:2px;font:500 12px/1.4 var(--font-sans);color:var(--ink2);text-decoration:underline;text-decoration-color:var(--line-2);text-underline-offset:3px;border-radius:3px}'+
'.kal-pen{flex-shrink:0;align-self:center;color:var(--ink4);transition:color .16s}'+
'.kal-pen svg{display:block;width:14px;height:14px}'+
'@media(hover:hover){.kal-evb:hover,.kal-upb:hover{background:color-mix(in srgb,var(--ink) 4%,transparent)}.kal-evb:hover .kal-pen{color:var(--ink2)}.kal-src:hover{color:var(--ink)}}'+
'.kal-empty{margin:0;padding:14px;border:1px dashed var(--line-2);border-radius:12px;font:400 13px/1.4 var(--font-sans);color:var(--ink3)}'+
'.kal-upb{display:flex;align-items:center;gap:13px;width:100%;padding:10px 14px;border:0;background:none;color:inherit;text-align:left;cursor:pointer;transition:background .16s}'+
'.kal-flak{flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:38px;height:40px;border-radius:8px;border:1px solid var(--line-2);background:var(--bg)}'+
'.kal-flak b{font:600 15px/1 var(--font-sans);color:var(--ink);font-variant-numeric:tabular-nums}'+
'.kal-flak i{font:600 9px/1 var(--font-sans);font-style:normal;letter-spacing:.9px;text-transform:uppercase;color:var(--ink3)}'+
'.kal-card{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px;border:1px solid var(--line);border-radius:12px;'+
  'background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 5%,transparent),transparent 70%),var(--surface)}'+
'.kal-card small{font-size:12.5px}'+

/* Knapper */
'.kal-btn{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;padding:0 16px;border-radius:999px;border:1px solid var(--line-2);'+
  'background:transparent;color:var(--ink);font:600 12.5px/1 var(--font-sans);letter-spacing:.2px;cursor:pointer;transition:color .18s,border-color .18s,background .18s,transform .14s}'+
'.kal-btn svg{width:14px;height:14px}'+
'.kal-btn:active{transform:translateY(1px)}'+
'.kal-btn.is-primary{background:var(--accent);border-color:transparent;color:var(--on-accent,var(--bg))}'+
'@media(hover:hover){.kal-btn:hover{border-color:color-mix(in srgb,var(--accent) 55%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}'+
  '.kal-btn.is-primary:hover{background:var(--accent-2,var(--accent));border-color:transparent}}'+
'.kal-add{width:100%;margin-top:10px}'+
'.kal-link{padding:6px 2px;border:0;background:none;color:var(--ink2);font:500 12.5px/1 var(--font-sans);text-decoration:underline;text-decoration-color:var(--line-2);text-underline-offset:3px;cursor:pointer;border-radius:3px}'+
'.kal-link:disabled{color:var(--ink4);text-decoration:none;cursor:default}'+
'@media(hover:hover){.kal-link:not(:disabled):hover{color:var(--ink)}}'+

/* Velg frister */
'.kal-chips{display:flex;flex-wrap:wrap;gap:8px}'+
'.kal-chip{height:36px;padding:0 15px;border-radius:999px;border:1px solid var(--line-2);background:transparent;color:var(--ink2);font:600 12px/1 var(--font-sans);letter-spacing:.2px;cursor:pointer;transition:color .18s,border-color .18s,background .18s}'+
'@media(hover:hover){.kal-chip:hover{color:var(--ink);border-color:color-mix(in srgb,var(--accent) 50%,transparent)}}'+
'.kal-chip[aria-pressed="true"]{background:var(--accent);border-color:transparent;color:var(--on-accent,var(--bg))}'+
'.kal-hint{margin:9px 0 16px;font:400 12px/1.4 var(--font-sans);color:var(--ink3)}'+
'.kal-in{width:100%;height:44px;padding:0 13px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink);font:400 16px/1.2 var(--font-sans);'+
  'transition:border-color .18s}'+
'.kal-in::placeholder{color:var(--ink3)}'+
'.kal .kal-in:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent)}'+
'.kal-bulk{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:14px 0 4px;font:500 12px/1.3 var(--font-sans);color:var(--ink3);font-variant-numeric:tabular-nums}'+
'.kal-bulk-b{display:inline-flex;gap:16px}'+
'.kal-frl{margin-bottom:6px;border:1px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}'+
'.kal-frl>li+li{border-top:1px solid var(--line)}'+
'[data-kal-frlist] .kal-lbl{margin:18px 0 9px}'+
'.kal-fr{display:flex;align-items:center;gap:12px;padding:11px 14px;cursor:pointer}'+
'.kal-fr input,.kal-check input{flex-shrink:0;width:18px;height:18px;margin:0;accent-color:var(--accent);cursor:pointer}'+
'.kal-imp{flex-shrink:0;font:600 9.5px/1 var(--font-sans);letter-spacing:1px;text-transform:uppercase;color:var(--ink3)}'+
'.kal-note{margin:18px 0 0;font:400 12px/1.5 var(--font-sans);color:var(--ink3)}'+
'.kal-note a{color:var(--ink2);text-underline-offset:3px;border-radius:3px}'+
'.kal-foot{flex-shrink:0;display:flex;justify-content:flex-end;padding:12px 22px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);background:var(--bg)}'+
'.kal-foot .kal-btn{min-width:120px}'+

/* Skjema */
'.kal-f{display:flex;flex-direction:column;gap:7px;min-width:0;margin-top:14px}'+
'.kal-f>span{font:600 11px/1 var(--font-sans);letter-spacing:.9px;text-transform:uppercase;color:var(--ink3)}'+
'.kal-f em{font-style:normal;font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink4)}'+
'.kal-f2{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px}'+
'.kal-check{display:flex;align-items:center;gap:11px;margin-top:18px;font:500 13.5px/1.35 var(--font-sans);color:var(--ink);cursor:pointer}'+
'.kal-check small{display:block;font:400 12px/1.4 var(--font-sans);color:var(--ink3)}'+
'.kal-err{margin:14px 0 0;padding:10px 12px;border:1px solid var(--line-2);border-left:2px solid var(--accent);border-radius:8px;font:500 13px/1.4 var(--font-sans);color:var(--ink)}'+
'.kal-err[hidden]{display:none}'+
'.kal-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:22px}'+
'.kal-del{margin-left:auto}'+

/* Telefon: ark nedenfra */
'@media (max-width:640px){'+
  '.kal-panel,[dir="rtl"] .kal-panel{top:auto;left:0;right:0;bottom:0;width:100%;height:92vh;height:min(92dvh,100dvh - 20px);border:1px solid var(--line-2);border-bottom:0;'+
    'border-radius:20px 20px 0 0;box-shadow:0 -30px 80px -30px rgba(0,0,0,.7);transform:translateY(100%);'+
    'background:radial-gradient(120% 22% at 50% 0%,rgba(var(--glow-rgb,200,153,104),.07),transparent 70%),var(--bg)}'+
  '.kal.open .kal-panel{transform:none}'+
  '.kal-grab{display:flex;justify-content:center;flex-shrink:0;padding:9px 0 0;touch-action:none}'+
  '.kal-grab i{width:38px;height:4px;border-radius:999px;background:var(--line-2)}'+
  '.kal-head{padding:8px 16px 12px;touch-action:none}'+
  '.kal-pad{padding:4px 16px calc(26px + env(safe-area-inset-bottom,0px))}'+
  '.kal-foot{padding-left:16px;padding-right:16px}'+
  '.kal-foot .kal-btn{width:100%}'+
  '.kal-title{font-size:clamp(22px,6.6vw,27px)}'+
  '.kal-title.is-sm{font-size:24px}'+
  '.kal-d{height:48px}'+
  '.kal-d .n{width:32px;height:32px;font-size:14px}'+
'}'+
'@media (prefers-reduced-motion:reduce){'+
  '.kal,.kal-panel{transition:opacity .01ms}'+
  '.kal-panel,[dir="rtl"] .kal-panel{transform:none}'+
  '.kal-grid.go-next,.kal-grid.go-prev{animation:none}'+
'}';

window.HVKalender={open:open,close:close,leggTil:leggTil,fristerFor:fristerFor,settFrist:settFrist};
})();
