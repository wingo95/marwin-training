const $=id=>document.getElementById(id);
const squat=['3 × 8 à 87,5 kg','3 × 8 à 92,5 kg','4 × 6 à 102,5 kg','3 × 5 à 107,5 kg'];
const bench=['3 × 8 à 67,5 kg','3 × 8 à 70 kg','4 × 6 à 77,5 kg','3 × 5 à 82,5 kg'];
const saved=JSON.parse(localStorage.getItem('marwin.v1')||'{}');
let week=saved.week||1, session=saved.session||'A', mode=saved.mode||'down';
const clocks=saved.clocks||{down:{ms:600000,since:0},up:{ms:0,since:0}};
let duration=saved.duration||10;
function save(){localStorage.setItem('marwin.v1',JSON.stringify({week,session,mode,clocks,duration}))}
function plan(){
const w=week-1, em=w<2?9:12;
const data={
 A:['Squat, dos et portés','50 min · Séance principale',[
 ['Échauffement','9 min','3 min vélo, 10 montées sur pointes, équilibre 20 s par pied, 8 squats à vide. Puis squat barre vide × 8, 50 kg × 5, 70 kg × 3.'],
 ['Force','22 min','Squat '+squat[w]+', repos 2 min. Puis 3 tours de 8 tractions assistées et 10 pompes, repos 75 s entre les tours.'],
 ['WOD repère','10 min','Enchaîne 1 min vélo, 8 goblet squats à 12 kg et 30 m de farmer walk à 2 × 14 kg. Compte les tours et garde une allure régulière.'+(w===3?' Compare ton score avec la semaine 1 au même réglage de vélo.':'')],
 ['Abdos','4 min','2 tours de 8 dead bugs par côté. Repos 30 s.'],['Retour au calme','3 min','Marche lente puis étire doucement mollets et quadriceps.']]],
 B:['Pecs, dos et burpees','50 min · Séance principale',[
 ['Échauffement','9 min','3 min elliptique, 12 tirages élastique, 8 flexions de hanches. Au couché : barre vide × 10, 40 kg × 5, 55 kg × 3.'],
 ['Force','23 min','Développé couché '+bench[w]+', repos 2 min. Puis 3 tours de 10 soulevés de terre roumains à 2 × 16 kg et 10 tirages à la poulie. Repos 75 s.'],
 ['WOD · EMOM',em+' min','À chaque nouvelle minute, change d’atelier : ① 40 s vélo soutenu ② 6 burpees mains sur banc stable, sans saut ③ 8 montées alternées sur step bas. Repose-toi sur le temps restant. '+(em===9?'3 tours.':'4 tours si tu gardes 15 s de repos par minute, sinon 3.')],
 ['Abdos','4 min','Planche latérale 2 × 25 s par côté. Repos 20 s.'],['Retour au calme','3 min','Vélo doux puis étirement léger des pectoraux.']]],
 C:['Technique, bras et cardio','45 min · Séance facultative',[
 ['Échauffement','7 min','Vélo facile puis mobilité des poignets et des épaules.'],['Technique','8 min','4 passages tranquilles : 5 squats avant barre vide et 15 s suspendu à la barre, épaules actives, si le mouvement est confortable.'],['Musculation','12 min','3 tours de 12 curls haltères, 12 extensions triceps à la corde et 12 élévations latérales. Garde 3 répétitions en réserve. Repos 60 s.'],['Cardio','12 min','Vélo ou elliptique à une allure qui te permet de parler en phrases complètes.'],['Abdos','2 min','2 planches de 30 s, repos 30 s.'],['Retour au calme','4 min','Marche lente et étirements doux.']]]};
data.D=['Course facile et mobilité','18 à 25 min · Dimanche',[
 ['Échauffement','5 min','Marche active sur tapis plat.'],
 ['Course / marche', ['6 min','8 min','10 min','12 min'][w],['3','4','5','6'][w]+' tours de 30 s de jogging facile et 90 s de marche. Tu dois pouvoir parler. Si la cheville gêne ou si les matchs ont été intenses, marche ou pédale à la place.'],
 ['Renforcement','4 min','2 tours de 10 montées sur pointes contrôlées et 20 s d’équilibre par pied près d’un support.'],
 ['Retour au calme','3 min','Marche lente.']
 ]];
data.A[1]='35 à 45 min · Lundi';data.B[1]='35 à 45 min · Jeudi';
if(session==='A'||session==='B'){
 const list=data[session][2];list[1][1]='15 à 20 min';list[1][2]=list[1][2].replace('3 tours','2 tours');
 list[2][2]+=' Avec deux matchs soutenus le même jour, remplace ce WOD par 5 min de vélo facile.';
}
data.C[1]='25 min · Mercredi';data.C[2]=[
 ['Échauffement','5 min','Vélo très facile et mobilité des épaules.'],
 ['Technique','5 min','3 passages : 5 squats avant à vide et 10 s de suspension active si confortable. Repos libre.'],
 ['Bras','6 min','2 tours de 10 curls et 10 extensions à la corde, repos 45 s. Garde 3 répétitions en réserve.'],
 ['Cardio','5 min','Vélo à allure de conversation.'],
 ['Abdos','2 min','2 × 25 s de planche, repos 30 s.'],['Retour au calme','2 min','Marche lente.']
];
renderMoves(session);
const [title,time,rows]=data[session];$('title').textContent=title;$('duration').textContent=time;$('rows').innerHTML=rows.map(([b,t,v])=>'<tr><td>'+b+'<small>'+t+'</small></td><td>'+v+'</td></tr>').join('');
$('tip').textContent=(w===0?'Garde 3 à 4 répétitions en réserve. Allège dès la première série si besoin.':'Monte la charge si tu gardes 2 répétitions en réserve et une technique stable.')+' '+(session==='B'?'Seul, utilise les sécurités du rack ou la presse à pectoraux. Si le step gêne ta cheville, fais 35 s de vélo.':session==='A'?'Règle les sécurités du rack avant tes squats.':'Priorité à la récupération si tes deux matchs de padel sont exigeants.');
for(const b of $('sessions').children)b.setAttribute('aria-pressed',b.dataset.s===session);save()}
for(const s of ['A','B','C','D']){const b=document.createElement('button');b.textContent='Séance '+s;b.dataset.s=s;b.onclick=()=>{session=s;plan()};$('sessions').append(b)}
$('progress').innerHTML=squat.map((v,i)=>'<tr><td>'+ (i+1)+'</td><td>'+v+'</td><td>'+bench[i]+'</td></tr>').join('');
$('week').value=week;$('week').onchange=e=>{week=Number(e.target.value);plan()};plan();
function value(m){const c=clocks[m],delta=c.since?Date.now()-c.since:0;return Math.max(0,c.ms+(m==='down'?-delta:delta))}
let audio;
function tick(){if(clocks.down.since&&value('down')===0){clocks.down={ms:0,since:0};if(audio?.state==='running'){const o=audio.createOscillator(),g=audio.createGain();g.gain.value=.14;o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.45)}save()}
const c=clocks[mode],s=Math[mode==='down'?'ceil':'floor'](value(mode)/1000);
$('display').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
$('start').textContent=c.since?'Pause':mode==='down'&&c.ms===0?'Relancer':c.ms===(mode==='down'?duration*60000:0)?'Démarrer':'Reprendre';
$('status').textContent=clocks.down.ms===0&&!clocks.down.since?'Minuteur terminé.':'';
$('minutes').disabled=!!clocks.down.since}
function show(){for(const m of ['down','up'])$(m).setAttribute('aria-pressed',mode===m);$('setting').hidden=mode==='up';tick();save()}
for(const m of ['down','up'])$(m).onclick=()=>{mode=m;show()};
$('minutes').value=duration;$('minutes').onchange=e=>{if(!e.target.value||!e.target.validity.valid){e.target.value=duration;return}duration=Number(e.target.value);clocks.down={ms:duration*60000,since:0};show()};
$('start').onclick=()=>{if(mode==='down'&&!audio){try{audio=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{})}catch{}}
const c=clocks[mode];if(c.since){c.ms=value(mode);c.since=0}else{if(mode==='down'&&!c.ms)c.ms=duration*60000;c.since=Date.now()}show()};
$('reset').onclick=()=>{clocks[mode]={ms:mode==='down'?duration*60000:0,since:0};show()};show();setInterval(tick,150);
