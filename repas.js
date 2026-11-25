// Repas : menu du jour, photo ou texte → calories, IG et note A-E, score du jour et série.
let mealDay = isoDay(), mealKind = null, photo = null;
const MENUS = 'marwin.menus';
const igClass = ig => ig == null || ig === '' ? '' : ig <= 55 ? 'bas' : ig < 70 ? 'moyen' : 'eleve';
const igWord = { bas: 'bas', moyen: 'moyen', eleve: 'élevé' };
const r0 = n => Math.round(Number(n) || 0);
const KINDS = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'];
const ALERT_TXT = { trop_gras: 'trop gras', friture: 'friture', trop_sucre: 'trop sucré', trop_sale: 'trop salé', peu_proteines: 'peu de protéines', ultra_transforme: 'ultra-transformé', portion_trop_grosse: 'portion trop grosse', peu_de_legumes: 'peu de légumes' };
const gradeOf = s => s >= 80 ? 'A' : s >= 65 ? 'B' : s >= 50 ? 'C' : s >= 35 ? 'D' : 'E';
function defaultKind() { const h = new Date().getHours(); return h < 11 ? 'Petit-déjeuner' : h < 15 ? 'Déjeuner' : h < 18 ? 'Collation' : 'Dîner'; }
function setKind(k) { mealKind = k; document.querySelectorAll('#mealType .chip').forEach(b => b.classList.toggle('on', b.dataset.m === k)); }
$('mealType').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setKind(b.dataset.m); });
function shiftDay(n) { const [y, m, d] = mealDay.split('-').map(Number); const dt = new Date(y, m - 1, d + n); if (isoDay(dt) > isoDay()) return; mealDay = isoDay(dt); renderMeals(); }
$('dPrev').onclick = () => shiftDay(-1); $('dNext').onclick = () => shiftDay(1);

function dayMeals(day) { return Object.values(meals()).filter(m => m.date === day).sort((a, b) => (a.time || '').localeCompare(b.time || '')); }
function sumItems(items) {
  const t = { kcal: 0, p: 0, g: 0, l: 0, cg: 0 };
  for (const i of items || []) { t.kcal += +i.kcal || 0; t.p += +i.proteines_g || 0; t.g += +i.glucides_g || 0; t.l += +i.lipides_g || 0; t.cg += +i.charge_glycemique || 0; }
  return t;
}
function dayTotals(day) {
  const t = { kcal: 0, p: 0, g: 0, l: 0, cg: 0 };
  for (const m of dayMeals(day)) for (const k in t) t[k] += +m.tot[k] || 0;
  return t;
}
// Score du jour : moyenne des notes des repas, pondérée par les calories.
function dayScore(day) {
  let w = 0, s = 0;
  for (const m of dayMeals(day)) if (m.bilan && m.bilan.score != null) { const k = Math.max(80, +m.tot.kcal || 0); w += k; s += k * m.bilan.score; }
  return w ? Math.round(s / w) : null;
}
// Série : jours consécutifs avec au moins 2 repas notés et un score ≥ 60.
const dayOk = day => dayMeals(day).length >= 2 && (dayScore(day) ?? 0) >= 60;
function streak() {
  const d = new Date(); let n = 0;
  if (!dayOk(isoDay(d))) d.setDate(d.getDate() - 1);
  while (dayOk(isoDay(d)) && n < 999) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function bar(v, goal) { const pct = goal ? Math.min(100, v / goal * 100) : 0; return `<div class="bar"><i class="${v > goal * 1.05 ? 'over' : ''}" style="width:${pct}%"></i></div>`; }
const badge = (note, score, big) => `<span class="grade g${note}${big ? ' big' : ''}">${note}${score != null ? `<small>${score}</small>` : ''}</span>`;

function renderMeals() {
  const st = settings(), t = dayTotals(mealDay), list = dayMeals(mealDay), sc = dayScore(mealDay), sk = streak();
  $('dLabel').textContent = dayLabel(mealDay); $('dNext').disabled = mealDay >= isoDay();
  const cgClass = t.cg < 80 ? 'bas' : t.cg <= 120 ? 'moyen' : 'eleve';
  const left = Math.round(st.prot - t.p);
  const msg = sc == null ? 'Note tes repas pour obtenir ton score.' : sc >= 80 ? 'Journée de champion.' : sc >= 65 ? 'Bonne journée, continue.' : sc >= 50 ? 'Correct, mais tu peux mieux faire.' : 'Journée difficile : rattrape-toi au prochain repas.';
  $('game').innerHTML = `${sc == null ? '<span class="grade gN big">?</span>' : badge(gradeOf(sc), sc, true)}
    <div class="grow"><b>Score du jour</b><div class="small">${msg}</div>
    <div class="pills"><span>🔥 ${sk} jour${sk > 1 ? 's' : ''} de suite</span><span>${left <= 0 ? '💪 Protéines : objectif atteint' : '💪 Encore ' + left + ' g de protéines'}</span></div></div>`;
  $('totals').innerHTML = `
    <div class="tot"><b>${r0(t.kcal)}</b><span>kcal sur ${st.kcal}</span>${bar(t.kcal, st.kcal)}</div>
    <div class="tot"><b>${r0(t.p)} g</b><span>protéines sur ${st.prot} g</span>${bar(t.p, st.prot)}</div>
    <div class="tot"><b>${r0(t.g)} g · ${r0(t.l)} g</b><span>glucides · lipides</span></div>
    <div class="tot"><b>${r0(t.cg)} <span class="ig ${list.length ? cgClass : ''}">${list.length ? igWord[cgClass] : '—'}</span></b><span>charge glycémique du jour</span></div>`;
  $('mealList').innerHTML = list.length ? list.map(mealCard).join('') : '<p class="muted small" style="margin:0">Aucun repas noté pour ce jour.</p>';
  renderMenu();
}
function mealCard(m) {
  const b = m.bilan;
  return `<div class="meal" id="meal-${esc(m.id)}"><div class="row" style="align-items:flex-start">${m.thumb ? `<img class="thumb" src="${esc(m.thumb)}" alt="">` : ''}${b ? badge(b.note, b.score) : ''}
    <div class="grow"><b>${esc(m.type || 'Repas')}${m.time ? ' · ' + esc(m.time) : ''}</b>${m.plat ? `<div class="small">${esc(m.plat)}</div>` : ''}<div class="small"><b>${r0(m.tot.kcal)} kcal</b> · ${r0(m.tot.p)} g prot. · ${r0(m.tot.l)} g lip.</div></div>
    <button class="danger" data-del="${esc(m.id)}" style="padding:4px 9px">✕</button></div>
    ${b ? `<p class="verdict">${esc(b.verdict || '')}</p><div class="pills">${(b.points_forts || []).map(x => `<span class="pos">✓ ${esc(x)}</span>`).join('')}${(b.alertes || []).map(a => `<span class="neg">⚠ ${esc(ALERT_TXT[a] || a)}</span>`).join('')}${(b.points_faibles || []).slice(0, 2).map(x => `<span class="neg">− ${esc(x)}</span>`).join('')}</div>${b.conseil ? `<p class="small" style="margin:6px 0 0">💡 ${esc(b.conseil)}</p>` : ''}` : ''}
    <details class="det"><summary class="small">Détail par aliment</summary><table><thead><tr><th>Aliment</th><th>kcal</th><th>P</th><th>G</th><th>L</th><th>IG</th></tr></thead><tbody>${(m.items || []).map(i => `<tr><td>${esc(i.aliment)}${i.quantite ? ' <span class="muted">(' + esc(i.quantite) + ')</span>' : ''}</td><td>${r0(i.kcal)}</td><td>${r0(i.proteines_g)}</td><td>${r0(i.glucides_g)}</td><td>${r0(i.lipides_g)}</td><td>${i.ig == null || i.ig === '' ? '—' : `<span class="ig ${igClass(i.ig)}">${r0(i.ig)}</span>`}</td></tr>`).join('')}</tbody></table>
    ${m.remarque ? `<p class="small muted" style="margin:6px 0 0">${esc(m.remarque)}</p>` : ''}</details></div>`;
}
$('mealList').addEventListener('click', e => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  if (!confirm('Supprimer ce repas ?')) return;
  saveMeal({ id: b.dataset.del, deleted: true });
});
const newMealId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function nowTime(day) { const n = new Date(); return day === isoDay() ? pad(n.getHours()) + ':' + pad(n.getMinutes()) : ''; }

// ---------- Photo ----------
function loadImage(file) {
  return new Promise((ok, ko) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { ok(im); URL.revokeObjectURL(u); }; im.onerror = () => ko(new Error('image illisible')); im.src = u; });
}
function shrink(im, max, q) {
  const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
  c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
$('photoBtn').onclick = () => $('photoIn').click();
$('photoIn').onchange = async () => {
  const f = $('photoIn').files[0]; $('photoIn').value = '';
  if (!f) return;
  try {
    const im = await loadImage(f);
    photo = { full: shrink(im, 1024, 0.72), thumb: shrink(im, 160, 0.6) };
    $('photoPrev').innerHTML = `<img src="${photo.thumb}" alt="Photo du plat"><button id="photoDel" class="danger" style="padding:4px 9px">✕</button>`;
    $('photoPrev').hidden = false;
    $('mealText').placeholder = 'Précision facultative : ex. 200 g de riz, cuit au beurre, sans le pain';
    $('mealGo').textContent = 'Analyser la photo';
  } catch (err) { $('mealMsg').className = 'status warn'; $('mealMsg').textContent = 'Photo illisible : ' + err.message; }
};
function clearPhoto() {
  photo = null; $('photoPrev').hidden = true; $('photoPrev').innerHTML = '';
  $('mealText').placeholder = 'Ex. 3 œufs, 2 tranches de pain complet, 1 banane, café sans sucre';
  $('mealGo').textContent = 'Calculer et noter le repas';
}
$('photoPrev').addEventListener('click', e => { if (e.target.id === 'photoDel') clearPhoto(); });

$('mealGo').onclick = async () => {
  const text = $('mealText').value.trim();
  if (!text && !photo) { $('mealMsg').className = 'status warn'; $('mealMsg').textContent = 'Prends une photo ou écris ce que tu as mangé.'; return; }
  const btn = $('mealGo'); btn.disabled = true; $('mealMsg').className = 'status'; $('mealMsg').textContent = photo ? 'Analyse de la photo… (15 à 30 s)' : 'Analyse en cours… (10 à 20 s)';
  const st = settings(), kind = mealKind || defaultKind();
  try {
    const r = await callScript({ action: 'meal', text, type: kind, goals: { kcal: st.kcal, prot: st.prot }, eaten: dayTotals(mealDay), ...(photo ? { image: photo.full.split(',')[1], mime: 'image/jpeg' } : {}) });
    if (!r.ok) throw new Error(r.error === 'need_key' ? 'il faut d’abord activer le coach IA (clé API dans Suivi → Réglages)' : r.error || 'réponse invalide');
    const a = r.analyse, items = a.items || [], id = newMealId();
    saveMeal({ id, date: mealDay, time: nowTime(mealDay), type: kind, text: text || (a.plat ? 'Photo : ' + a.plat : 'Photo'), plat: a.plat || '', src: photo ? 'photo' : 'texte', items, tot: sumItems(items), bilan: a.bilan || null, remarque: a.remarque || '', ...(photo ? { thumb: photo.thumb } : {}) });
    $('mealText').value = ''; clearPhoto();
    $('mealMsg').className = 'status ok';
    $('mealMsg').textContent = a.bilan ? `Note ${a.bilan.note} (${a.bilan.score}/100)${a.confiance === 'faible' ? ' · estimation peu sûre, ajoute une précision la prochaine fois' : ''}` : 'Repas ajouté.';
    const el = document.getElementById('meal-' + id); if (el) { el.classList.add('flash'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  } catch (err) { $('mealMsg').className = 'status warn'; $('mealMsg').textContent = 'Échec : ' + err.message; }
  finally { btn.disabled = false; }
};

// ---------- Menu du jour ----------
const it = (aliment, quantite, kcal, p, g, l, ig, cg) => ({ aliment, quantite, kcal, proteines_g: p, glucides_g: g, lipides_g: l, ig, charge_glycemique: cg });
const bl = (score, verdict) => ({ note: gradeOf(score), score, verdict, points_forts: [], points_faibles: [], alertes: [], conseil: '' });
const MENUS_TYPE = [
  { titre: 'Journée poulet-riz', astuce: 'Cuisine le poulet et le riz pour 2 jours : 15 min gagnées demain.', repas: [
    { type: 'Petit-déjeuner', nom: 'Omelette, pain baladi et crudités', preparation: 'Omelette de 3 œufs + 2 blancs à la poêle antiadhésive, avec tomate et concombre.', bilan: bl(82, 'Protéiné et rassasiant.'), items: [it('Œufs entiers', '3 œufs', 235, 19, 1, 16, null, 0), it('Blancs d’œufs', '2 blancs', 34, 7, 1, 0, null, 0), it('Pain baladi complet', '1 pain (100 g)', 250, 9, 50, 2, 58, 25), it('Tomate et concombre', '150 g', 30, 1, 6, 0, 15, 1)] },
    { type: 'Déjeuner', nom: 'Poulet grillé, riz, salade', preparation: 'Blanc de poulet grillé aux épices, riz basmati, salade avec 1 c. à soupe d’huile d’olive.', bilan: bl(86, 'Le classique qui marche.'), items: [it('Blanc de poulet grillé', '200 g cuit', 330, 62, 0, 7, null, 0), it('Riz basmati cuit', '180 g', 230, 5, 50, 1, 58, 29), it('Salade verte + huile d’olive', '150 g + 1 c. à soupe', 115, 1, 4, 10, 15, 1)] },
    { type: 'Collation', nom: 'Shake whey + banane', preparation: '1 dose de whey dans 250 ml d’eau froide, une banane à côté.', bilan: bl(80, 'Parfait après la séance.'), items: [it('Whey isolate', '1 dose (33 g)', 110, 26, 1, 1, null, 0), it('Banane', '1 moyenne (120 g)', 105, 1, 27, 0, 51, 12)] },
    { type: 'Dîner', nom: 'Thon, gebna areesh et légumes sautés', preparation: 'Légumes sautés avec 1 c. à café d’huile, thon égoutté et gebna areesh à côté.', bilan: bl(84, 'Léger et très protéiné.'), items: [it('Thon au naturel égoutté', '1 boîte (120 g)', 140, 31, 0, 1, null, 0), it('Gebna areesh', '150 g', 145, 18, 5, 4, 30, 1), it('Légumes sautés + huile', '200 g + 1 c. à café', 110, 3, 12, 5, 30, 3), it('Pain baladi complet', '½ pain (50 g)', 125, 5, 25, 1, 58, 14)] }] },
  { titre: 'Journée foul et kofta', astuce: 'Le foul est riche en fibres et en protéines : garde l’huile à 1 c. à café.', repas: [
    { type: 'Petit-déjeuner', nom: 'Foul, œufs durs et ½ baladi', preparation: 'Foul réchauffé avec cumin, citron et 1 c. à café d’huile d’olive ; 2 œufs durs.', bilan: bl(78, 'Le petit-déj égyptien en version sèche.'), items: [it('Foul medames', '200 g', 220, 15, 30, 1, 40, 9), it('Huile d’olive', '1 c. à café', 45, 0, 0, 5, null, 0), it('Œufs durs', '2 œufs', 155, 13, 1, 11, null, 0), it('Pain baladi complet', '½ pain (50 g)', 125, 5, 25, 1, 58, 14)] },
    { type: 'Déjeuner', nom: 'Kofta maigre, patate douce, salade tahina', preparation: 'Kofta de bœuf haché 5 % grillée, patate douce au four, salade avec un filet de tahina.', bilan: bl(80, 'Bon équilibre, surveille la tahina.'), items: [it('Kofta bœuf haché 5 %', '180 g cuit', 300, 46, 0, 12, null, 0), it('Patate douce au four', '200 g', 172, 3, 40, 0, 63, 23), it('Salade + tahina', '150 g + 1 c. à soupe', 90, 3, 5, 8, 15, 1)] },
    { type: 'Collation', nom: 'Yaourt grec et amandes', preparation: 'Un pot de yaourt grec 0 % et une poignée d’amandes.', bilan: bl(76, 'Simple et efficace.'), items: [it('Yaourt grec 0 %', '200 g', 120, 20, 8, 0, 11, 1), it('Amandes', '15 g', 88, 3, 2, 8, 15, 0)] },
    { type: 'Dîner', nom: 'Poulet au four, légumes rôtis, shake', preparation: 'Filet de poulet et légumes rôtis 25 min au four avec 1 c. à soupe d’huile ; shake whey au lait écrémé.', bilan: bl(84, 'Fin de journée très protéinée.'), items: [it('Filet de poulet au four', '150 g cuit', 248, 47, 0, 5, null, 0), it('Légumes rôtis + huile', '250 g + 1 c. à soupe', 160, 4, 18, 10, 30, 4), it('Whey isolate', '1 dose (33 g)', 110, 26, 1, 1, null, 0), it('Lait écrémé', '200 ml', 70, 7, 10, 0, 32, 3)] }] },
  { titre: 'Journée poisson et shawarma maison', astuce: 'Jour de repos : moins de féculents, autant de protéines.', repas: [
    { type: 'Petit-déjeuner', nom: 'Porridge protéiné', preparation: 'Flocons d’avoine cuits dans le lait écrémé, whey ajoutée hors du feu, fraises.', bilan: bl(80, 'Sucré sans sucre ajouté.'), items: [it('Flocons d’avoine', '50 g', 185, 7, 30, 4, 55, 15), it('Lait écrémé', '200 ml', 70, 7, 10, 0, 32, 3), it('Whey isolate', '1 dose (33 g)', 110, 26, 1, 1, null, 0), it('Fraises', '100 g', 32, 1, 6, 0, 40, 2)] },
    { type: 'Déjeuner', nom: 'Shawarma poulet maison', preparation: 'Poulet émincé saisi aux épices shawarma, pita complète, sauce yaourt-ail, crudités.', bilan: bl(82, 'Le goût du shawarma sans la graisse.'), items: [it('Poulet émincé', '170 g cuit', 280, 53, 0, 6, null, 0), it('Pita complète', '1 (60 g)', 160, 6, 30, 1, 57, 16), it('Sauce yaourt-ail', '60 g', 40, 3, 3, 1, 15, 0), it('Crudités', '100 g', 20, 1, 4, 0, 15, 0)] },
    { type: 'Collation', nom: 'Œufs durs, concombre et pomme', preparation: 'À préparer la veille.', bilan: bl(72, 'Pratique à emporter.'), items: [it('Œufs durs', '2 œufs', 155, 13, 1, 11, null, 0), it('Concombre', '150 g', 20, 1, 4, 0, 15, 0), it('Pomme', '1 (150 g)', 78, 0, 19, 0, 36, 6)] },
    { type: 'Dîner', nom: 'Bolti grillé, molokhia légère, riz', preparation: 'Bolti (tilapia) grillé au citron, molokhia sans ghee, petite portion de riz.', bilan: bl(85, 'Poisson maigre, top pour la sèche.'), items: [it('Bolti grillé', '250 g cuit', 320, 65, 0, 7, null, 0), it('Molokhia légère', '250 ml', 90, 4, 8, 5, 30, 1), it('Riz cuit', '120 g', 155, 3, 34, 0, 58, 19)] }] }
];
const menusAll = () => read(MENUS, {});
function trainingToday() {
  const c = read('marwin.coach', null), done = Object.keys(logs()).filter(k => k.slice(0, 10) === isoDay()).map(k => k.slice(13));
  if (done.length) return 'séance faite : ' + done.join(', ');
  if (c && c.day === isoDay() && c.seance) return 'séance prévue : ' + c.seance.titre;
  return 'pas de séance prévue (repos ou à décider)';
}
function renderMenu() {
  const box = $('menuBox'), saved = menusAll()[mealDay];
  if (!saved) {
    box.innerHTML = mealDay === isoDay()
      ? '<p class="small muted" style="margin:0 0 8px">Un menu calé sur tes objectifs et ta séance du jour, avec les repas déjà notés pris en compte.</p><button class="go" id="menuGo" style="width:100%">Proposer mon menu du jour</button>'
      : '<p class="small muted" style="margin:0">Pas de menu pour ce jour.</p>';
    return;
  }
  const m = saved.menu, eaten = saved.eaten || {}, tot = sumItems(m.repas.flatMap(r => r.items));
  box.innerHTML = `<div class="row"><b class="grow">${esc(m.titre || 'Menu du jour')}</b><span class="small muted">${r0(tot.kcal)} kcal · ${r0(tot.p)} g prot.</span></div>
    ${m.repas.map((r, i) => { const t = sumItems(r.items), done = eaten[i] && meals()[eaten[i]]; return `<div class="menuitem${done ? ' done' : ''}">
      <div class="row" style="align-items:flex-start">${r.bilan ? badge(r.bilan.note) : ''}<div class="grow"><b>${esc(r.type)}</b> · ${esc(r.nom)}<div class="small muted">${r0(t.kcal)} kcal · ${r0(t.p)} g prot.</div></div></div>
      <ul>${r.items.map(x => `<li>${esc(x.quantite)} · ${esc(x.aliment)}</li>`).join('')}</ul>
      ${r.preparation ? `<p class="small muted" style="margin:0 0 6px">${esc(r.preparation)}</p>` : ''}
      ${done ? '<span class="small" style="color:var(--ok);font-weight:700">✓ Noté dans tes repas</span>' : `<button data-eat="${i}">✓ J’ai mangé ça</button>`}</div>`; }).join('')}
    ${m.astuce ? `<p class="small" style="margin:8px 0 0">💡 ${esc(m.astuce)}</p>` : ''}
    ${mealDay === isoDay() ? `<div class="row" style="margin-top:8px"><button id="menuGo" class="grow">↻ Autre menu</button></div>` : ''}
    <p class="small muted" style="margin:6px 0 0">${saved.source === 'ia' ? 'Proposé par Claude.' : 'Menu type (coach IA indisponible).'}</p>`;
}
$('menuBox').addEventListener('click', async e => {
  const eat = e.target.closest('[data-eat]');
  if (eat) {
    const all = menusAll(), saved = all[mealDay], i = +eat.dataset.eat, r = saved.menu.repas[i], id = newMealId();
    saveMeal({ id, date: mealDay, time: nowTime(mealDay), type: r.type, text: 'Menu : ' + r.nom, plat: r.nom, src: 'menu', items: r.items, tot: sumItems(r.items), bilan: r.bilan || null, remarque: '' });
    saved.eaten = { ...(saved.eaten || {}), [i]: id }; all[mealDay] = saved; write(MENUS, all);
    renderMeals(); return;
  }
  if (e.target.id !== 'menuGo') return;
  const btn = e.target; btn.disabled = true; $('menuMsg').className = 'status'; $('menuMsg').textContent = 'Claude compose ton menu… (30 à 60 s)';
  const st = settings(), all = menusAll(), eatenList = dayMeals(isoDay());
  const todo = KINDS.filter(k => !eatenList.some(m => m.type === k));
  let menu = null, source = 'modele', note = '';
  try {
    const r = await callScript({ action: 'menu', today: isoDay(), todo, goals: { kcal: st.kcal, prot: st.prot }, training: trainingToday(), prefs: st.menuPrefs || '',
      eaten: dayTotals(isoDay()), eatenText: eatenList.map(m => m.type + ' : ' + (m.plat || m.text)).join(' ; '),
      recent: Object.entries(all).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6).map(([, v]) => v.menu.titre + ' (' + v.menu.repas.map(x => x.nom).join(', ') + ')') });
    if (r.ok && r.menu) { menu = r.menu; source = 'ia'; } else note = r.error === 'need_key' ? 'Coach IA sans clé : menu type proposé.' : 'Coach IA indisponible (' + (r.error || 'erreur') + ') : menu type proposé.';
  } catch (err) { note = 'Coach IA injoignable (' + err.message + ') : menu type proposé.'; }
  if (!menu) {
    const base = MENUS_TYPE[(Object.keys(all).length + (all[isoDay()] ? 1 : 0)) % MENUS_TYPE.length];
    menu = JSON.parse(JSON.stringify(base)); menu.repas = menu.repas.filter(x => todo.includes(x.type)); if (!menu.repas.length) menu.repas = JSON.parse(JSON.stringify(base.repas));
  }
  all[isoDay()] = { menu, source, created: Date.now(), eaten: {} };
  for (const d of Object.keys(all).sort().slice(0, -30)) delete all[d];
  write(MENUS, all);
  $('menuMsg').className = 'status ' + (source === 'ia' ? 'ok' : 'warn'); $('menuMsg').textContent = source === 'ia' ? 'Menu prêt.' : note;
  renderMenu();
});

tabHooks.repas = () => { if (!mealKind) setKind(defaultKind()); renderMeals(); };
syncHooks.meals.push(() => { if (document.body.dataset.tab === 'repas') renderMeals(); });
