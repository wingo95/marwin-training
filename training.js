const read=(key,fallback)=>JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const fmt=seconds=>Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
const extra=read('marwin.intervals',{restSec:75,end:0,interval:null});
const persist=()=>write('marwin.intervals',extra);
let alarm;
function unlock(){try{alarm ||= new (window.AudioContext||window.webkitAudioContext)();alarm.resume().catch(()=>{})}catch{}}
function beep(){if(alarm?.state!=='running')return;const o=alarm.createOscillator(),g=alarm.createGain();o.connect(g);g.connect(alarm.destination);g.gain.value=.12;o.start();o.stop(alarm.currentTime+.35)}
for(const s of [15,20,30,45,60,75,90,120,150,180,240,300])$('rest').add(new Option(fmt(s),s));
$('rest').value=extra.restSec;$('rest').onchange=()=>{extra.restSec=Number($('rest').value);persist()};
$('restGo').onclick=()=>{unlock();extra.end=extra.end?0:Date.now()+extra.restSec*1000;persist();refresh()};
function refresh(){const left=Math.ceil((extra.end-Date.now())/1000);
if(extra.end&&left<=0){extra.end=0;persist();beep();if(typeof speakCue==='function')speakCue('Repos terminé');$('restClock').textContent='Terminé'}
else if(extra.end)$('restClock').textContent=fmt(left);
else if($('restClock').textContent!=='Terminé')$('restClock').textContent='';
$('restGo').textContent=extra.end?'Arrêter':'Lancer le repos'}
refresh();setInterval(refresh,200);
const date=new Date();$('day').value=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
$('rating').add(new Option('Choisir',''));for(let i=1;i<=10;i++)$('rating').add(new Option(i+(i===1?' · Très facile':i===5?' · Modéré':i===10?' · Maximal':''),i));
$('activity').value='Séance '+session;
const logs=()=>read('marwin.journal',{}),key=()=>$('day').value+' / '+$('activity').value;
function loadEntry(){const entry=logs()[key()];$('rating').value=entry?.rating||'';$('result').value=entry?.result||'';$('feedback').textContent=''}
function setActivity(name){if(![...$('activity').options].some(o=>o.value===name))$('activity').add(new Option(name));$('activity').value=name}
function editEntry(k){const i=k.indexOf(' / ');$('day').value=k.slice(0,i);setActivity(k.slice(i+3));loadEntry();$('logForm').scrollIntoView({behavior:'smooth',block:'start'});$('result').focus({preventScroll:true})}
function deleteEntry(k){if(!confirm('Supprimer l’entrée « '+k+' » ?'))return;const entries=logs();delete entries[k];write('marwin.journal',entries);renderHistory();loadEntry();if(typeof journalChanged==='function')journalChanged(k,null)}
function renderHistory(){$('history').replaceChildren();for(const [date,entry] of Object.entries(logs()).sort(([a],[b])=>b.localeCompare(a))){const line=document.createElement('div');line.className='entry';line.append(date+' · Difficulté '+entry.rating+'/10\n'+entry.result);const act=document.createElement('div');act.className='entry-actions';const ed=document.createElement('button');ed.type='button';ed.textContent='Modifier';ed.onclick=()=>editEntry(date);const del=document.createElement('button');del.type='button';del.className='danger';del.textContent='Supprimer';del.onclick=()=>deleteEntry(date);act.append(ed,del);line.append(act);$('history').append(line)}if(typeof renderStats==='function')renderStats()}
$('logForm').onsubmit=e=>{e.preventDefault();const result=$('result').value.trim();if(!result)return;const entries=logs();entries[key()]={rating:$('rating').value,result,updated:Date.now()};write('marwin.journal',entries);renderHistory();$('feedback').textContent='Résultat enregistré.';if(typeof journalChanged==='function')journalChanged(key(),entries[key()])};
$('day').onchange=$('activity').onchange=loadEntry;loadEntry();renderHistory();
const menus=[
 ['Avoine, lait, banane','Poulet, riz et poivrons','Yaourt et dattes','Saumon, pommes de terre et haricots verts'],
 ['Œufs, pain complet et orange','Salade de pâtes au thon','Banane et yaourt à boire','Bœuf mijoté, carottes et semoule'],
 ['Yaourt grec, avoine et poire','Boulgour, poulet et courgettes','Compote et tartine au miel','Omelette, pommes de terre et salade'],
 ['Pain, œufs et banane','Riz, bœuf et légumes','Yaourt, banane et eau','Poisson au four, semoule et carottes'],
 ['Fromage blanc, avoine et pomme','Wrap poulet et crudités, fruit','Dattes et lait','Riz aux lentilles, œuf et salade'],
 ['Omelette, pain et fruit','Pâtes au poulet, légumes','Compote et yaourt','Poisson, patate douce et courgettes'],
 ['Yaourt, muesli et banane','Poulet, pommes de terre et salade','Tartine au miel et lait','Bœuf, riz et haricots verts']
];
const days=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];days.forEach((d,i)=>$('mealDay').add(new Option(d,i)));
$('mealDay').value=(date.getDay()+6)%7;function mealPlan(){$('meals').innerHTML=menus[Number($('mealDay').value)].map((v,i)=>'<tr><td>'+['Petit déjeuner','Déjeuner','Entre les matchs','Dîner'][i]+'</td><td>'+v+'</td></tr>').join('')}
$('mealDay').onchange=mealPlan;mealPlan();
