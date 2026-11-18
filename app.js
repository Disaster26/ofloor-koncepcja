(function(){
'use strict';
var P=window.PRODUCTS||[];
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var num=function(v){return v==null?NaN:parseFloat(String(v).replace(',','.'))};
var fmt=function(n,d){return n.toLocaleString('pl-PL',{minimumFractionDigits:d||0,maximumFractionDigits:d==null?2:d})};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var A=function(p,k){return p.a[k]||''};
var SITE='https://ofloor.pl';
var COLORS={'Beżowy':'#CDB089','Brązowy':'#8B6A4A','Szary':'#8F9496','Czarny':'#2B2B2B','Biały':'#F4F2EE','Czerwony':'#9C3B2E'};
var UK={'Deska':'deska','Jodełka':'jodelka','Płytka':'plytka','Puzzle':'puzzle'};
var KOLIMG={Lambert:1,Gibson:1,Eastwood:1,Douglas:1,Redford:1,Hopkins:1,Foster:1,Breton:1};
var isClick=function(p){return /click|unizip|bezklej|looselay/i.test(A(p,'Sposób montażu'))};
var kom=function(p){return num(A(p,'Klasa użytkowa komercyjna'))||0};
var gr=function(p){return num(A(p,'Grubość (mm)'))};
var glyph=function(p){var u=UK[A(p,'Układ ułożenia')]||'deska';return '<svg viewBox="0 0 120 64" aria-hidden="true"><use href="#u-'+u+'"/></svg>'};
var specLine=function(p){var m=A(p,'Sposób montażu').replace(' (Dryback)','').replace('Solide','Solid');return A(p,'Układ ułożenia')+' · '+A(p,'Szerokość (mm)')+' x '+A(p,'Długość (mm)')+' mm · '+A(p,'Grubość (mm)')+' mm · '+m};
var title=function(p){return p.dek?p.dek:p.kod};

/* ---------- jezyk naturalny ---------- */
var RULES=[
 [/jasn|beż|bez\b|naturaln|bielon|kremow/i,'kolor','Beżowy','kolor jasny / beżowy'],
 [/brąz|braz|ciepł|orzech|ciemne drewno|miod/i,'kolor','Brązowy','kolor brązowy'],
 [/szar|beton|grafit|popiel|loft/i,'kolor','Szary','kolor szary'],
 [/czarn|antracyt/i,'kolor','Czarny','kolor czarny'],
 [/jodeł|jodel|herringbone|chevron|klasyczn.*jod/i,'uklad','Jodełka','układ jodełka'],
 [/\bdesk|panel/i,'uklad','Deska','układ deska'],
 [/płytk|plytk|kafel|kafl|kamie|marmur/i,'uklad','Płytka','układ płytka'],
 [/puzzl|siłown|silown|strefa zabaw|mata/i,'uklad','Puzzle','puzzle'],
 [/laminat/i,'material','Laminat','laminat'],
 [/winyl|lvt/i,'material','Winyl','winyl']
];
var SOFT=[
 [/klik|click|zamek|bez kleju|sam(odzieln)?\s*(położ|poloz|ułoż|uloz)|szybki montaż/i,'click','montaż na klik'],
 [/klej|dryback|dry back/i,'glue','montaż klejony'],
 [/kuchn|łazien|lazien|wilg|wod|pralni/i,'wet','kuchnia / łazienka'],
 [/pies|psa|psy|kot|zwierz|pazur/i,'pets','zwierzęta'],
 [/dzieci|dziec|maluch|zabawk/i,'kids','dzieci'],
 [/ogrzew|podłogówk|podlogowk/i,'heat','ogrzewanie podłogowe'],
 [/cich|akust|hałas|halas|wygłusz|wyglusz|sąsiad/i,'quiet','cicha podłoga'],
 [/biur|sklep|lokal|hotel|restaur|gabinet|salon fryz|kawiar/i,'lokal','lokal użytkowy'],
 [/przedpok|korytarz|hol\b|wejści/i,'hall','przedpokój']
];
function parse(q){
 var r={hard:{},soft:{},tags:[]};if(!q)return r;
 RULES.forEach(function(x){if(x[0].test(q)){(r.hard[x[1]]=r.hard[x[1]]||[]).indexOf(x[2])<0&&r.hard[x[1]].push(x[2]);r.tags.push(x[3])}});
 if(r.hard.uklad&&r.hard.uklad.indexOf('Płytka')>=0&&/beton|kamie/i.test(q))r.soft.stone=1;
 SOFT.forEach(function(x){if(x[0].test(q)){r.soft[x[1]]=1;r.tags.push(x[2])}});
 return r;
}

/* ---------- dopasowanie i uzasadnienie ---------- */
function score(p,s,h){
 var sc=50,why=[],k=kom(p),m=A(p,'Sposób montażu'),mat=A(p,'Materiał'),g=gr(p);s=s||{};h=h||{};
 if(h.kolor&&h.kolor.length){if(h.kolor.indexOf(A(p,'Kolor'))>=0){sc+=14;why.push('kolor '+A(p,'Kolor').toLowerCase()+', zgodny z wyborem')}else sc-=18}
 if(h.uklad&&h.uklad.length){if(h.uklad.indexOf(A(p,'Układ ułożenia'))>=0){sc+=14;why.push('układ '+A(p,'Układ ułożenia').toLowerCase()+', dekor '+A(p,'Rodzaj dekoru').toLowerCase())}else sc-=18}
 if(h.material&&h.material.length){if(h.material.indexOf(mat)>=0)sc+=8;else sc-=25}
 if(s.pets||s.kids||s.hall){if(k>=34){sc+=14;why.push('klasa użytkowa 34 - do miejsc z najbardziej intensywnym ruchem')}else if(k>=33){sc+=10;why.push('klasa użytkowa 33 (komercyjna) - wytrzyma pazury, zabawki i codzienny ruch')}else{sc-=6}}
 if(s.lokal){if(k>=33){sc+=12;why.push('klasa '+k+' dopuszcza użycie w lokalach użytkowych, klasa ogniowa '+A(p,'Odporność na ogień'))}else sc-=14}
 if(s.wet){if(mat==='Winyl'){sc+=8;why.push('winyl nie boi się wody - dobry do kuchni i łazienki')}else{sc-=22}}
 if(s.heat){if(/Dryback/.test(m)&&g<=3){sc+=12;why.push('cienka podłoga klejona ('+A(p,'Grubość (mm)')+' mm) dobrze oddaje ciepło z ogrzewania podłogowego')}else{sc+=2;why.push('przydatność do ogrzewania podłogowego - w karcie technicznej')}}
 if(s.quiet){var lw=num(p.lw);if(lw>=11){sc+=12;why.push('podkład zintegrowany, wyciszenie kroków Lw = '+p.lw+' dB')}else sc-=6}
 if(s.click){if(isClick(p)){sc+=10;why.push('montaż '+m.replace('Solide','Solid')+' - bez kleju, szybciej')}else sc-=10}
 if(s.glue){if(/Dryback/.test(m)){sc+=8;why.push('podłoga klejona - stabilna, cienka, łatwa do łączenia z płytkami')}else sc-=6}
 if(s.stone&&A(p,'Rodzaj dekoru')==='Kamień')sc+=6;
 if(s.soft){if(/Tkanina/.test(A(p,'Rodzaj dekoru'))||A(p,'Układ ułożenia')==='Puzzle'){sc+=16;why.push('puzzle kładzione luzem - łatwo wymienić pojedynczy element')}else sc-=10}
 if(p.pack)sc+=1;
 return {p:p,sc:Math.max(0,Math.min(99,sc)),why:why};
}

/* ---------- filtry katalogu ---------- */
var F=[
 {k:'zast',t:'Zastosowanie',opts:[['dom','Dom i mieszkanie'],['lokal','Lokal użytkowy (klasa 33+)'],['intens','Intensywny ruch (klasa 34)']],test:function(p,v){return v==='dom'?!!A(p,'Klasa użytkowa domowa'):v==='lokal'?kom(p)>=33:kom(p)>=34}},
 {k:'kolor',t:'Kolor',sw:1,attr:'Kolor'},
 {k:'uklad',t:'Sposób ułożenia',vis:1,attr:'Układ ułożenia'},
 {k:'montaz',t:'Rodzaj montażu',attr:'Sposób montażu'},
 {k:'material',t:'Materiał',attr:'Materiał'},
 {k:'gr',t:'Grubość (mm)',attr:'Grubość (mm)',sort:1},
 {k:'szer',t:'Szerokość',opts:[['s1','do 150 mm'],['s2','150-200 mm'],['s3','200-300 mm'],['s4','ponad 300 mm']],test:function(p,v){var w=num(A(p,'Szerokość (mm)'));return v==='s1'?w<=150:v==='s2'?w>150&&w<=200:v==='s3'?w>200&&w<=300:w>300}},
 {k:'dl',t:'Długość',opts:[['d1','do 700 mm'],['d2','700-1300 mm'],['d3','ponad 1300 mm']],test:function(p,v){var l=num(A(p,'Długość (mm)'));return v==='d1'?l<=700:v==='d2'?l>700&&l<=1300:l>1300}},
 {k:'kolekcja',t:'Kolekcja',attr:'__col'}
];
F.forEach(function(f){if(f.attr){var vals={};P.forEach(function(p){var v=f.attr==='__col'?p.col:A(p,f.attr);if(v)vals[v]=1});var o=Object.keys(vals);o.sort(f.sort?function(a,b){return num(a)-num(b)}:function(a,b){return a.localeCompare(b,'pl')});f.opts=o.map(function(v){return [v,v]});f.test=function(p,v){return (f.attr==='__col'?p.col:A(p,f.attr))===v}}});
var st={f:{},q:'',sort:'dop'};
function pass(p,skip){return F.every(function(f){if(f.k===skip)return true;var sel=st.f[f.k];return !sel||!sel.length||sel.some(function(v){return f.test(p,v)})})}
function renderFilters(){
 var h='';
 F.forEach(function(f){
  var sel=st.f[f.k]||[];
  h+='<div class="fgr"><h3>'+f.t+(sel.length?' <button type="button" class="note" data-clr="'+f.k+'" style="border:0;background:none;cursor:pointer;color:var(--teal-d);font-weight:700">Wyczyść</button>':'')+'</h3><div class="'+(f.vis?'fvis':'fchips')+'">';
  f.opts.forEach(function(o){
   var n=P.filter(function(p){return pass(p,f.k)&&f.test(p,o[0])}).length;var on=sel.indexOf(o[0])>=0;
   if(!n&&!on&&f.k!=='zast')return;
   var inner=f.sw?'<span class="sw" style="background:'+(COLORS[o[0]]||'#ccc')+'"></span>'+o[1]:f.vis?'<svg viewBox="0 0 120 64"><use href="#u-'+(UK[o[0]]||'deska')+'"/></svg>'+o[1]:esc(o[1]);
   h+='<button type="button" class="fc" aria-pressed="'+on+'" data-f="'+f.k+'" data-v="'+esc(o[0])+'">'+inner+' <small>'+n+'</small></button>';
  });
  h+='</div></div>';
 });
 $('#filters').innerHTML=h;
}
function card(r,showWhy){
 var p=r.p||r;
 return '<a class="pc" href="#/produkt/'+p.s+'"><div class="ph"><img src="'+p.img+'" width="400" height="400" loading="lazy" alt="'+esc(p.n)+' - próbka dekoru"></div><div class="t"><span class="col">Kolekcja '+p.col+'</span><h3>'+esc(title(p))+'</h3><span class="note">'+(p.dek?p.kod:A(p,'Materiał')+', '+A(p,'Kolor').toLowerCase())+'</span>'+(showWhy&&r.why&&r.why.length?'<span class="why">'+esc(r.why[0])+'</span>':'')+'<span class="spec">'+glyph(p)+'<span>'+esc(specLine(p))+'</span></span></div></a>';
}
function renderGrid(){
 var pr=parse(st.q);
 var list=P.filter(function(p){return pass(p)}).map(function(p){return score(p,pr.soft,pr.hard)});
 if(st.q&&(pr.hard.kolor||pr.hard.uklad||pr.hard.material)){var strict=list.filter(function(r){return (!pr.hard.kolor||pr.hard.kolor.indexOf(A(r.p,'Kolor'))>=0)&&(!pr.hard.uklad||pr.hard.uklad.indexOf(A(r.p,'Układ ułożenia'))>=0)&&(!pr.hard.material||pr.hard.material.indexOf(A(r.p,'Materiał'))>=0)});if(strict.length>=4)list=strict;else if(strict.length){var ids=strict.map(function(r){return r.p.s});list.sort(function(a,b){return b.sc-a.sc});list=strict.sort(function(a,b){return b.sc-a.sc}).concat(list.filter(function(r){return ids.indexOf(r.p.s)<0}));st.sort==='dop'&&(list.__keep=1)}}
 if(st.sort==='dop'&&!list.__keep)list.sort(function(a,b){return b.sc-a.sc});
 else if(st.sort==='kol')list.sort(function(a,b){return a.p.n.localeCompare(b.p.n,'pl')});
 else list.sort(function(a,b){return st.sort==='gr'?gr(a.p)-gr(b.p):gr(b.p)-gr(a.p)});
 $('#count').textContent=list.length+' '+(list.length===1?'wzór':list.length%10>=2&&list.length%10<=4&&(list.length%100<10||list.length%100>20)?'wzory':'wzorów');
 $('#grid').innerHTML=list.length?list.map(function(r){return card(r,!!st.q)}).join(''):'<div class="empty" style="grid-column:1/-1">Brak wzorów dla tych filtrów w makiecie. Usuń jeden z filtrów.</div>';
 var u=$('#understood');
 if(st.q){u.hidden=false;u.innerHTML=pr.tags.length?'Zrozumiałem: '+pr.tags.map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join('')+' <button type="button" data-qclr style="border:0;background:none;color:var(--teal-d);font-weight:700;cursor:pointer">Wyczyść</button>':'Nie rozpoznałem parametrów w "'+esc(st.q)+'". Spróbuj np. "szara deska na klik do kuchni".'}else u.hidden=true;
}
function renderKatalog(qs){
 st.f={};st.q='';
 var u=new URLSearchParams(qs||'');
 u.forEach(function(v,k){if(k==='q')st.q=v;else if(F.some(function(f){return f.k===k}))(st.f[k]=st.f[k]||[]).push(v)});
 $('#q2').value=st.q;$('#sort').value=st.sort;
 renderFilters();renderGrid();
}

/* ---------- karta produktu ---------- */
function bySlug(s){return P.filter(function(p){return p.s===s})[0]}
function jsonld(p){
 var props=[['Szerokość','Szerokość (mm)','MMT'],['Długość','Długość (mm)','MMT'],['Grubość','Grubość (mm)','MMT']].map(function(x){return {'@type':'PropertyValue',name:x[0],value:num(A(p,x[1])),unitCode:x[2]}});
 ['Sposób montażu','Układ ułożenia','Klasa użytkowa komercyjna','Odporność na ogień','Rodzaj dekoru'].forEach(function(k){if(A(p,k))props.push({'@type':'PropertyValue',name:k,value:A(p,k)})});
 if(p.pack)props.push({'@type':'PropertyValue',name:'Zawartość paczki',value:p.pack.szt+' szt. = '+fmt(p.pack.m2,3)+' m2'});
 var url=SITE+'/podlogi-winylowe/'+p.col.toLowerCase()+'/'+p.s+'/';
 return [{'@context':'https://schema.org','@type':'Product',name:p.n,sku:p.kod,url:url,image:SITE+'/'+p.imgL,description:p.d.slice(0,300),brand:{'@type':'Brand',name:'O.FLOOR'},manufacturer:{'@type':'Organization',name:'P.H. MAM Sp. z o.o.'},material:A(p,'Materiał'),color:A(p,'Kolor'),pattern:A(p,'Układ ułożenia'),additionalProperty:props,isVariantOf:{'@type':'ProductGroup',name:'O.FLOOR '+p.col,productGroupID:p.col.toLowerCase(),url:SITE+'/podlogi-winylowe/'+p.col.toLowerCase()+'/',variesBy:['https://schema.org/color','https://schema.org/pattern','https://schema.org/size']}},
 {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Strona główna',item:SITE+'/'},{'@type':'ListItem',position:2,name:'Podłogi winylowe',item:SITE+'/podlogi-winylowe/'},{'@type':'ListItem',position:3,name:'Kolekcja '+p.col,item:SITE+'/podlogi-winylowe/'+p.col.toLowerCase()+'/'},{'@type':'ListItem',position:4,name:p.n,item:url}]}];
}
function renderProdukt(slug){
 var p=bySlug(slug)||bySlug('lambert-lh7001f');
 var imgs=[[p.imgL,'Dekor '+p.n]];
 if(p.s==='lambert-lh7001f')imgs.push(['img/g-lambert-lh7001f-salon-1000.webp','LH7001F w strefie barowej'],['img/g-lambert-lh7001f-1000.webp','LH7001F w kuchni'],['img/g-lambert-lh7001f-2-1000.webp','LH7001F w salonie']);
 else if(KOLIMG[p.col])imgs.push(['img/kol-'+p.col.toLowerCase()+'-600.webp','Kolekcja '+p.col+' we wnętrzu']);
 var defZ=A(p,'Układ ułożenia')==='Deska'?5:10;
 var facts=[['Układ',A(p,'Układ ułożenia')],['Montaż',A(p,'Sposób montażu').replace('Solide','Solid')],['Wymiary',A(p,'Szerokość (mm)')+' x '+A(p,'Długość (mm)')+' mm'],['Grubość',A(p,'Grubość (mm)')+' mm'],['Klasa użytkowa',[A(p,'Klasa użytkowa domowa'),A(p,'Klasa użytkowa komercyjna'),A(p,'Klasa użytkowa przemysłowa')].filter(Boolean).join(' / ')],['Kolor i dekor',A(p,'Kolor')+', '+A(p,'Rodzaj dekoru').toLowerCase()]];
 var tech=Object.keys(p.a).map(function(k){return [k,p.a[k]]});
 if(p.lw&&!A(p,'Wygłuszenie (dB)'))tech.push(['Wyciszenie kroków Lw (dB)',String(p.lw)]);
 tech.push(['Paczka',p.pack?p.pack.szt+' szt. = '+fmt(p.pack.m2,3)+' m²':'do uzupełnienia w CMS']);
 var same=P.filter(function(x){return x.col===p.col&&x.s!==p.s});if(same.length<3)same=same.concat(P.filter(function(x){return x.col!==p.col&&A(x,'Układ ułożenia')===A(p,'Układ ułożenia')}).slice(0,6-same.length));
 var ld=jsonld(p);
 var h='<nav class="crumb" aria-label="Okruszki"><a href="#/">Strona główna</a><span>/</span><a href="#/katalog">Podłogi</a><span>/</span><a href="#/katalog?kolekcja='+p.col+'">Kolekcja '+p.col+'</a><span>/</span>'+esc(p.kod)+'</nav>'+
 '<div class="pv"><div class="gal n'+imgs.length+'">'+imgs.map(function(x,i){return '<button type="button" data-lb="'+x[0]+'" aria-label="Powiększ: '+esc(x[1])+'"><img src="'+x[0]+'" alt="'+esc(x[1])+'" '+(i?'loading="lazy"':'')+' width="900" height="900"></button>'}).join('')+'<p class="cap">Zdjęcia z ofloor.pl. Docelowo przy każdym wzorze: dekor, zbliżenie struktury i zdjęcia we wnętrzu.</p></div>'+
 '<div class="pinfo"><span class="col">Kolekcja '+p.col+' · '+A(p,'Materiał')+'</span><h1>'+esc(p.n)+'</h1><p class="kod">Kod produktu: '+esc(p.kod)+'</p>'+
 '<div class="facts">'+facts.map(function(f){return '<div><span>'+f[0]+'</span><b>'+esc(f[1])+'</b></div>'}).join('')+'</div>'+
 '<div class="pact"><a class="btn" href="#/wspolpraca?probka='+encodeURIComponent(p.n)+'">Zamów próbkę</a><a class="btn line" href="#docs">Dokumenty do pobrania</a></div>'+
 '<div class="calc" id="calc"><h2>Ile paczek potrzebujesz?</h2>'+
 '<div class="mode"><button type="button" class="fc" aria-pressed="true" data-mode="m2">Znam powierzchnię</button><button type="button" class="fc" aria-pressed="false" data-mode="dim">Podam wymiary pokoju</button></div>'+
 '<div class="in"><label data-m2>Powierzchnia (m²)<input type="number" inputmode="decimal" min="0" step="0.1" value="20" data-c="m2"></label><label data-dim hidden>Długość (m)<input type="number" inputmode="decimal" min="0" step="0.01" value="5" data-c="l"></label><label data-dim hidden>Szerokość (m)<input type="number" inputmode="decimal" min="0" step="0.01" value="4" data-c="w"></label><label>Zapas na docinki<select data-c="z"><option value="5"'+(defZ===5?' selected':'')+'>5% - deska, prosty pokój</option><option value="10"'+(defZ===10?' selected':'')+'>10% - jodełka, płytka, skosy</option><option value="15">15% - dużo narożników</option></select></label></div>'+
 '<div class="res" id="res" aria-live="polite"></div></div>'+
 '</div></div>'+
 '<section class="psec"><div class="ptwo"><div><h2>Parametry techniczne</h2><table class="tech"><tbody>'+tech.map(function(t){return '<tr><th>'+esc(t[0])+'</th><td>'+esc(t[1])+'</td></tr>'}).join('')+'</tbody></table><p class="note" style="margin-top:12px">Parametry zapisane w CMS jako pola, nie tylko w PDF - z nich korzystają filtry, kalkulator, konfigurator i dane dla Google.</p></div>'+
 '<div id="docs"><h2>Dokumenty do pobrania</h2><ul class="docs">'+(p.docs.length?p.docs.map(function(d){return '<li><a href="'+d.u+'" target="_blank" rel="noopener"><span class="pdf">PDF</span><span>'+esc(d.t)+'<small>kolekcja '+p.col+' · otwiera plik z ofloor.pl</small></span></a></li>'}).join(''):'<li class="miss">Dla tej kolekcji nie znalazłem karty technicznej na obecnej stronie. Po wdrożeniu dokumenty przypisuje się do produktu w panelu i pojawiają się tutaj.</li>')+'</ul></div></div></section>'+
 '<section class="psec"><h2>Opis</h2><p class="pdesc">'+esc(p.d)+'</p><details class="ld"><summary>Dane strukturalne tej karty dla Google (Product, ProductGroup, BreadcrumbList)</summary><pre>'+esc(JSON.stringify(ld,null,2))+'</pre></details></section>'+
 '<section class="psec"><div class="shead" style="margin-bottom:20px"><h2 style="margin:0">'+(same.some(function(x){return x.col===p.col})?'Inne wzory z kolekcji '+p.col:'Podobne wzory')+'</h2></div><div class="row" id="samerow">'+same.map(function(x){return card(x)}).join('')+'</div></section>';
 $('#pview').innerHTML=h;
 setLd(ld);
 calc(p);
 document.title=p.n+' - '+(A(p,'Materiał')==='Laminat'?'panele laminowane':'podłoga winylowa')+', '+A(p,'Układ ułożenia').toLowerCase()+' | O.FLOOR';
}
function calc(p){
 var box=$('#calc');var mode='m2';
 function run(){
  var v=function(k){return num($('[data-c="'+k+'"]',box).value)||0};
  var area=mode==='m2'?v('m2'):v('l')*v('w');var z=v('z');var need=area*(1+z/100);
  var r=$('#res',box);
  if(!area){r.innerHTML='<p>Podaj powierzchnię.</p>';return}
  if(p.pack){var pk=Math.ceil(need/p.pack.m2-1e-9);r.innerHTML='<b class="big">'+pk+' '+(pk===1?'paczka':pk%10>=2&&pk%10<=4&&(pk%100<10||pk%100>20)?'paczki':'paczek')+' = '+fmt(pk*p.pack.m2,2)+' m²</b><p>'+fmt(area,2)+' m² + '+z+'% zapasu = '+fmt(need,2)+' m². Sprzedaż na pełne paczki: 1 paczka = '+p.pack.szt+' szt. = '+fmt(p.pack.m2,3)+' m², razem '+pk*p.pack.szt+' szt. Dane z: '+p.pack.src+'.</p>'}
  else r.innerHTML='<b class="big">'+fmt(need,2)+' m² z zapasem</b><p>Dla tego wzoru nie ma jeszcze danych paczki na stronie. Po uzupełnieniu pola "paczka" w CMS kalkulator od razu pokaże liczbę pełnych paczek.</p>';
 }
 box.addEventListener('input',run);box.addEventListener('change',run);
 $$('[data-mode]',box).forEach(function(b){b.addEventListener('click',function(){mode=b.dataset.mode;$$('[data-mode]',box).forEach(function(x){x.setAttribute('aria-pressed',x===b)});$$('[data-dim]',box).forEach(function(x){x.hidden=mode!=='dim'});$$('[data-m2]',box).forEach(function(x){x.hidden=mode!=='m2'});run()})});
 run();
}

/* ---------- konfigurator ---------- */
var Q=[
 {k:'room',t:'Gdzie położysz podłogę?',o:[['salon','Salon lub sypialnia'],['kuchnia','Kuchnia lub łazienka'],['dziecko','Pokój dziecka'],['hall','Przedpokój, korytarz'],['lokal','Biuro, sklep, lokal'],['strefa','Siłownia, strefa zabaw']]},
 {k:'pets',t:'Czy w domu są zwierzęta?',o:[['tak','Tak, pies lub kot'],['nie','Nie']]},
 {k:'kids',t:'Czy po podłodze będą biegać dzieci?',o:[['tak','Tak'],['nie','Nie']]},
 {k:'heat',t:'Czy masz ogrzewanie podłogowe?',o:[['tak','Tak'],['nie','Nie'],['nw','Jeszcze nie wiem']]},
 {k:'styl',t:'Jaki styl lubisz?',o:[['drewno','Naturalne drewno, deska'],['jodelka','Jodełka'],['kamien','Kamień lub beton'],['obojetne','Bez znaczenia']]},
 {k:'kolor',t:'Jaki kolor podłogi?',o:[['Beżowy','Jasny, beżowy'],['Brązowy','Ciepły brąz'],['Szary','Szary'],['Czarny','Ciemny'],['obojetne','Bez znaczenia']]},
 {k:'budzet',t:'Jaki masz budżet?',hint:'W makiecie budżet nie zmienia wyniku, bo na stronie nie ma cen. Po wdrożeniu użyjemy przedziału cenowego zapisanego przy produkcie.',o:[['eko','Jak najniższy'],['sred','Średni'],['prem','Liczy się jakość'],['nw','Nie wiem']]}
];
var cfg={step:0,a:{}};
function renderCf(){
 var el=$('#cf');
 if(cfg.step>=Q.length)return renderCfRes(el);
 var q=Q[cfg.step];
 el.className='cf';
 el.innerHTML='<nav class="crumb" aria-label="Okruszki"><a href="#/">Strona główna</a><span>/</span>Dobierz podłogę</nav><div class="steps" aria-label="Pytanie '+(cfg.step+1)+' z '+Q.length+'">'+Q.map(function(_,i){return '<i class="'+(i<cfg.step?'on':i===cfg.step?'on cur':'')+'"></i>'}).join('')+'<span>Pytanie '+(cfg.step+1)+' z '+Q.length+'</span></div><h1>'+q.t+'</h1>'+(q.hint?'<p class="hint">'+q.hint+'</p>':'<p class="hint">Wybierz jedną odpowiedź.</p>')+'<div class="opts">'+q.o.map(function(o){return '<button type="button" class="opt" aria-pressed="'+(cfg.a[q.k]===o[0])+'" data-cfa="'+o[0]+'">'+o[1]+'</button>'}).join('')+'</div><div class="nav2">'+(cfg.step?'<button type="button" class="btn line" data-cfback>Wstecz</button>':'<span></span>')+'<button type="button" class="btn line" data-cfskip>'+(cfg.step===Q.length-1?'Pokaż wyniki':'Pomiń')+'</button></div>';
 document.title='Dobierz podłogę - pytanie '+(cfg.step+1)+' | O.FLOOR';
}
function cfPrefs(){
 var a=cfg.a,s={},h={};
 if(a.room==='kuchnia')s.wet=1;if(a.room==='lokal')s.lokal=1;if(a.room==='hall')s.hall=1;if(a.room==='dziecko')s.kids=1;if(a.room==='strefa')s.soft=1;
 if(a.pets==='tak')s.pets=1;if(a.kids==='tak')s.kids=1;if(a.heat==='tak')s.heat=1;
 if(a.styl==='drewno')h.uklad=['Deska'];if(a.styl==='jodelka')h.uklad=['Jodełka'];if(a.styl==='kamien'){h.uklad=['Płytka'];s.stone=1}
 if(a.kolor&&a.kolor!=='obojetne')h.kolor=[a.kolor];
 if(a.room==='strefa')h.uklad=['Puzzle'];
 return {s:s,h:h};
}
function renderCfRes(el){
 var pr=cfPrefs();
 var list=P.map(function(p){return score(p,pr.s,pr.h)}).sort(function(a,b){return b.sc-a.sc});
 var top=list.filter(function(r){return r.sc>=list[0].sc-22}).slice(0,5);if(top.length<3)top=list.slice(0,3);
 el.className='cf cfres';
 el.innerHTML='<nav class="crumb" aria-label="Okruszki"><a href="#/">Strona główna</a><span>/</span>Dobierz podłogę</nav><h1>Te podłogi pasują do Twoich odpowiedzi</h1><p class="hint">'+top.length+' propozycje z 15 wzorów makiety. Docelowo konfigurator przeszukuje cały katalog (411 wzorów).</p><div class="rgrid">'+top.map(function(r){var p=r.p;var why=r.why.slice(0,4);if(!why.length)why=['uniwersalny wzór pasujący do większości wnętrz'];return '<article class="rcard"><div class="ph"><img src="'+p.img+'" width="400" height="400" alt="'+esc(p.n)+'" loading="lazy"></div><div class="t"><span class="m">Dopasowanie '+r.sc+'% · Kolekcja '+p.col+'</span><h3>'+esc(p.n)+'</h3><span class="note">'+esc(specLine(p))+'</span><ul>'+why.map(function(w){return '<li>'+esc(w)+'</li>'}).join('')+'</ul><div class="btns"><a class="btn" href="#/produkt/'+p.s+'">Karta produktu</a><a class="btn line" href="#/wspolpraca?probka='+encodeURIComponent(p.n)+'">Zamów próbkę</a></div></div></article>'}).join('')+'</div><div class="nav2"><button type="button" class="btn line" data-cfback>Zmień ostatnią odpowiedź</button><button type="button" class="btn dark" data-cfreset>Zacznij od nowa</button></div>';
 document.title='Dobrane podłogi | O.FLOOR';
}

/* ---------- doradca ---------- */
function advise(q){
 var pr=parse(q);
 if(!pr.tags.length)return 'Nie rozpoznałem jeszcze, czego szukasz. Napisz, do jakiego pomieszczenia, jaki kolor lub układ i czy są zwierzęta, dzieci albo ogrzewanie podłogowe.';
 var list=P.map(function(p){return score(p,pr.soft,pr.hard)}).sort(function(a,b){return b.sc-a.sc}).slice(0,3);
 return 'Rozumiem: '+pr.tags.join(', ')+'. Proponuję:<ul>'+list.map(function(r){return '<li><a href="#/produkt/'+r.p.s+'">'+esc(r.p.n)+'</a> - '+esc((r.why[0]||specLine(r.p)))+(r.why[1]?'; '+esc(r.why[1]):'')+'</li>'}).join('')+'</ul>Wszystkie wyniki: <a href="#/katalog?q='+encodeURIComponent(q)+'">katalog</a>.';
}

/* ---------- router ---------- */
var LD=null;
function setLd(o){if(LD){LD.remove();LD=null}if(!o)return;LD=document.createElement('script');LD.type='application/ld+json';LD.textContent=JSON.stringify(o);document.head.appendChild(LD)}
function route(){
 var h=location.hash.replace(/^#/,'')||'/';
 var anchor=null,view='home',arg='';
 var m=h.match(/^\/(katalog|produkt|dobierz|wspolpraca)(?:\/([^?]*))?(?:\?(.*))?$/);
 if(m){view=m[1];arg=m[1]==='produkt'?m[2]:(m[3]||'')}else{var a=h.match(/^\/#(.+)$/);if(a)anchor=a[1]}
 $$('[data-view]').forEach(function(v){v.classList.toggle('on',v.dataset.view===view)});
 var cur=view==='home'?(anchor||'home'):view;
 $$('[data-nav]').forEach(function(n){if(n.dataset.nav===cur)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current')});
 setLd(null);
 if(view==='katalog'){renderKatalog(arg);document.title='Podłogi winylowe i laminowane - katalog | O.FLOOR'}
 if(view==='produkt')renderProdukt(arg);
 if(view==='dobierz')renderCf();
 if(view==='wspolpraca'){var pq=new URLSearchParams(arg).get('probka');if(pq)$('#samplefld').value=pq;document.title='Współpraca i próbki | O.FLOOR'}
 if(view==='home')document.title='Podłogi winylowe i laminowane O.FLOOR - propozycja layoutu';
 closeMenu();
 if(anchor){var t=document.getElementById(anchor);if(t){setTimeout(function(){t.scrollIntoView({behavior:'auto'})},0);return}}
 window.scrollTo(0,0);
}
function closeMenu(){document.body.classList.remove('fo');$('#fpanel').classList.remove('open');$('.scrim').hidden=true;var m=$('#mnav');m.hidden=true;$('.burger').setAttribute('aria-expanded','false')}

/* ---------- zdarzenia ---------- */
document.addEventListener('click',function(e){
 var t=e.target.closest('button,a');if(!t)return;
 if(t.matches('.burger')){var m=$('#mnav');m.hidden=!m.hidden;t.setAttribute('aria-expanded',!m.hidden);return}
 if(t.dataset.q){location.hash='#/katalog?q='+encodeURIComponent(t.dataset.q);return}
 if(t.dataset.f){var k=t.dataset.f,v=t.dataset.v,s=st.f[k]=st.f[k]||[];var i=s.indexOf(v);i<0?s.push(v):s.splice(i,1);renderFilters();renderGrid();return}
 if(t.dataset.clr){st.f[t.dataset.clr]=[];renderFilters();renderGrid();return}
 if(t.hasAttribute('data-qclr')){st.q='';$('#q2').value='';renderGrid();return}
 if(t.hasAttribute('data-fopen')){$('#fpanel').classList.add('open');$('.scrim').hidden=false;document.body.classList.add('fo');return}
 if(t.hasAttribute('data-fclose')){document.body.classList.remove('fo');$('#fpanel').classList.remove('open');$('.scrim').hidden=true;return}
 if(t.closest('[data-quick]')&&t.dataset.a){cfg={step:1,a:{room:t.dataset.a}};location.hash='#/dobierz';if(location.hash==='#/dobierz')renderCf();return}
 if(t.dataset.cfa){cfg.a[Q[cfg.step].k]=t.dataset.cfa;cfg.step++;renderCf();window.scrollTo(0,0);return}
 if(t.hasAttribute('data-cfback')){cfg.step=Math.max(0,cfg.step-1);renderCf();return}
 if(t.hasAttribute('data-cfskip')){cfg.step++;renderCf();return}
 if(t.hasAttribute('data-cfreset')){cfg={step:0,a:{}};renderCf();return}
 if(t.dataset.lb){var lb=$('.lb');$('img',lb).src=t.dataset.lb;$('img',lb).alt=t.getAttribute('aria-label')||'';lb.hidden=false;return}
 if(t.closest('.lb')){$('.lb').hidden=true;return}
 if(t.matches('.adv')){var p=$('#advp');p.hidden=!p.hidden;t.setAttribute('aria-expanded',!p.hidden);if(!p.hidden)$('#advq').focus();return}
 if(t.hasAttribute('data-advclose')){$('#advp').hidden=true;$('.adv').setAttribute('aria-expanded','false');return}
 if(t.closest('.arrows')){var row=document.getElementById(t.closest('.arrows').dataset.for);var c=row.firstElementChild;row.scrollBy({left:(+t.dataset.d)*(c.offsetWidth+20)*(innerWidth>1100?2:1),behavior:'smooth'});return}
 if(t.matches('a[href="#docs"]')){e.preventDefault();$('#docs').scrollIntoView({behavior:'smooth'});return}
});
$('.scrim').addEventListener('click',function(){$('#fpanel').classList.remove('open');this.hidden=true});
$('.lb').addEventListener('click',function(e){if(e.target===this)this.hidden=true});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){$('.lb').hidden=true;$('#advp').hidden=true;closeMenu()}});
document.addEventListener('submit',function(e){
 var f=e.target;
 if(f.matches('[data-ask],[data-ask2]')){e.preventDefault();var q=$('input',f).value.trim();if(f.matches('[data-ask2]')&&location.hash.indexOf('#/katalog')===0){st.q=q;renderGrid();return}location.hash='#/katalog'+(q?'?q='+encodeURIComponent(q):'')}
 if(f.matches('[data-advform]')){e.preventDefault();var inp=$('#advq',f),q2=inp.value.trim();if(!q2)return;var ms=$('#msgs');ms.insertAdjacentHTML('beforeend','<div class="msg me">'+esc(q2)+'</div><div class="msg ai">'+advise(q2)+'</div>');inp.value='';ms.scrollTop=ms.scrollHeight}
});
$('#sort').addEventListener('change',function(){st.sort=this.value;renderGrid()});
/* przeciaganie pasow myszka */
document.addEventListener('pointerdown',function(e){
 var row=e.target.closest('.row');if(!row||e.pointerType!=='mouse')return;
 var x0=e.clientX,s0=row.scrollLeft,moved=false;
 function mv(ev){var dx=ev.clientX-x0;if(Math.abs(dx)>5){moved=true;row.classList.add('drag')}row.scrollLeft=s0-dx}
 function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);setTimeout(function(){row.classList.remove('drag')},0);if(moved){var c=row.firstElementChild,w=c.offsetWidth+parseFloat(getComputedStyle(row).columnGap||20);row.scrollTo({left:Math.round(row.scrollLeft/w)*w,behavior:'smooth'})}}
 document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);
});
document.addEventListener('dragstart',function(e){if(e.target.closest('.row'))e.preventDefault()});
$$('[data-year]').forEach(function(y){y.textContent=new Date().getFullYear()});
function topc(){document.body.classList.toggle('top',location.hash.replace('#','').replace(/^\/$/,'')===''&&scrollY<innerHeight*.6)}addEventListener('scroll',topc,{passive:true});window.addEventListener('hashchange',function(){route();topc()});topc();
route();
})();
