// Repas : saisie libre → analyse Claude (kcal, protéines, glucides, lipides, IG, charge glycémique) → totaux du jour.
let mealDay = isoDay(), mealKind = null;
const igClass = ig => ig == null || ig === '' ? '' : ig <= 55 ? 'bas' : ig < 70 ? 'moyen' : 'eleve';
const igWord = { bas: 'bas', moyen: 'moyen', eleve: 'élevé' };
const r0 = n => Math.round(Number(n) || 0);
function defaultKind() { const h = new Date().getHours(); return h < 11 ? 'Petit-déjeuner' : h < 15 ? 'Déjeuner' : h < 18 ? 'Collation' : 'Dîner'; }
function setKind(k) { mealKind = k; document.querySelectorAll('#mealType .chip').forEach(b => b.classList.toggle('on', b.dataset.m === k)); }
$('mealType').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) setKind(b.dataset.m); });
function shiftDay(n) { const [y, m, d] = mealDay.split('-').map(Number); const dt = new Date(y, m - 1, d + n); if (isoDay(dt) > isoDay()) return; mealDay = isoDay(dt); renderMeals(); }
$('dPrev').onclick = () => shiftDay(-1); $('dNext').onclick = () => shiftDay(1);

function dayMeals(day) { return Object.values(meals()).filter(m => m.date === day).sort((a, b) => (a.time || '').localeCompare(b.time || '')); }
function dayTotals(day) {
  const t = { kcal: 0, p: 0, g: 0, l: 0, cg: 0 };
  for (const m of dayMeals(day)) { t.kcal += +m.tot.kcal || 0; t.p += +m.tot.p || 0; t.g += +m.tot.g || 0; t.l += +m.tot.l || 0; t.cg += +m.tot.cg || 0; }
  return t;
}
function bar(v, goal) { const pct = goal ? Math.min(100, v / goal * 100) : 0; return `<div class="bar"><i class="${v > goal * 1.05 ? 'over' : ''}" style="width:${pct}%"></i></div>`; }
function renderMeals() {
  const st = settings(), t = dayTotals(mealDay), list = dayMeals(mealDay);
  $('dLabel').textContent = dayLabel(mealDay); $('dNext').disabled = mealDay >= isoDay();
  const cgClass = t.cg < 80 ? 'bas' : t.cg <= 120 ? 'moyen' : 'eleve';
  $('totals').innerHTML = `
    <div class="tot"><b>${r0(t.kcal)}</b><span>kcal sur ${st.kcal}</span>${bar(t.kcal, st.kcal)}</div>
    <div class="tot"><b>${r0(t.p)} g</b><span>protéines sur ${st.prot} g</span>${bar(t.p, st.prot)}</div>
    <div class="tot"><b>${r0(t.g)} g · ${r0(t.l)} g</b><span>glucides · lipides</span></div>
    <div class="tot"><b>${r0(t.cg)} <span class="ig ${list.length ? cgClass : ''}">${list.length ? igWord[cgClass] : '—'}</span></b><span>charge glycémique du jour</span></div>`;
  $('mealList').innerHTML = list.length ? list.map(m => `<div class="meal"><div class="row"><b class="grow">${esc(m.type || 'Repas')} · ${esc(m.time || '')}</b><span class="small"><b>${r0(m.tot.kcal)} kcal</b> · ${r0(m.tot.p)} g prot.</span><button class="danger" data-del="${esc(m.id)}" style="padding:4px 9px">✕</button></div>
    <table><thead><tr><th>Aliment</th><th>kcal</th><th>P</th><th>G</th><th>L</th><th>IG</th></tr></thead><tbody>${(m.items || []).map(i => `<tr><td>${esc(i.aliment)}${i.quantite ? ' <span class="muted">(' + esc(i.quantite) + ')</span>' : ''}</td><td>${r0(i.kcal)}</td><td>${r0(i.proteines_g)}</td><td>${r0(i.glucides_g)}</td><td>${r0(i.lipides_g)}</td><td>${i.ig == null || i.ig === '' ? '—' : `<span class="ig ${igClass(i.ig)}">${r0(i.ig)}</span>`}</td></tr>`).join('')}</tbody></table>
    ${m.remarque ? `<p class="small muted" style="margin:6px 0 0">${esc(m.remarque)}</p>` : ''}</div>`).join('')
    : '<p class="muted small" style="margin:0">Aucun repas noté pour ce jour.</p>';
}
$('mealList').addEventListener('click', e => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  if (!confirm('Supprimer ce repas ?')) return;
  saveMeal({ id: b.dataset.del, deleted: true });
});
$('mealGo').onclick = async () => {
  const text = $('mealText').value.trim();
  if (!text) { $('mealMsg').textContent = 'Écris ce que tu as mangé, avec les quantités si tu les connais.'; return; }
  const btn = $('mealGo'); btn.disabled = true; $('mealMsg').className = 'status'; $('mealMsg').textContent = 'Analyse en cours… (10 à 20 s)';
  try {
    const r = await callScript({ action: 'meal', text, type: mealKind || defaultKind() });
    if (!r.ok) throw new Error(r.error === 'need_key' ? 'il faut d’abord activer le coach IA (clé API dans Suivi → Réglages)' : r.error || 'réponse invalide');
    const items = r.analyse.items || [], tot = { kcal: 0, p: 0, g: 0, l: 0, cg: 0 };
    for (const i of items) { tot.kcal += +i.kcal || 0; tot.p += +i.proteines_g || 0; tot.g += +i.glucides_g || 0; tot.l += +i.lipides_g || 0; tot.cg += +i.charge_glycemique || 0; }
    const now = new Date();
    saveMeal({ id: 'm' + now.getTime().toString(36) + Math.random().toString(36).slice(2, 6), date: mealDay, time: mealDay === isoDay() ? pad(now.getHours()) + ':' + pad(now.getMinutes()) : '', type: mealKind || defaultKind(), text, items, tot, remarque: r.analyse.remarque || '' });
    $('mealText').value = ''; $('mealMsg').className = 'status ok'; $('mealMsg').textContent = 'Repas ajouté.';
  } catch (err) { $('mealMsg').className = 'status warn'; $('mealMsg').textContent = 'Échec : ' + err.message; }
  finally { btn.disabled = false; }
};
tabHooks.repas = () => { if (!mealKind) setKind(defaultKind()); renderMeals(); };
syncHooks.meals.push(() => { if (document.body.dataset.tab === 'repas') renderMeals(); });
