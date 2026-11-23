// Suivi : journal, stats hebdo, réglages, sauvegarde. Démarrage de l’app.
let logRating = 0, logEditKey = null;
$('rate').innerHTML = Array.from({ length: 10 }, (_, i) => `<button data-r="${i + 1}">${i + 1}</button>`).join('');
$('rate').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; logRating = +b.dataset.r; document.querySelectorAll('#rate button').forEach(x => x.classList.toggle('on', +x.dataset.r === logRating)); });
function openLog({ type = 'CrossFit', text = '', day = isoDay(), rating = 0, key = null } = {}) {
  logEditKey = key; $('logTitle').textContent = key ? 'Modifier la séance' : 'Noter la séance';
  $('logDay').value = day;
  if (![...$('logType').options].some(o => o.value === type)) $('logType').add(new Option(type));
  $('logType').value = type; $('logText').value = text; $('logMsg').textContent = '';
  logRating = Number(rating) || 0; document.querySelectorAll('#rate button').forEach(x => x.classList.toggle('on', +x.dataset.r === logRating));
  $('logSheet').classList.add('on');
}
$('logCancel').onclick = () => $('logSheet').classList.remove('on');
$('logSheet').addEventListener('click', e => { if (e.target.id === 'logSheet') $('logSheet').classList.remove('on'); });
$('logSave').onclick = () => {
  const day = $('logDay').value, text = $('logText').value.trim();
  if (!day || !text) { $('logMsg').textContent = 'Indique la date et ce que tu as fait.'; return; }
  if (!logRating) { $('logMsg').textContent = 'Choisis une difficulté de 1 à 10.'; return; }
  let key = day + ' / ' + $('logType').value;
  const all = logs();
  if (!logEditKey) { let n = 2; while (all[key]) key = day + ' / ' + $('logType').value + ' ' + n++; }
  if (logEditKey && logEditKey !== key) saveEntry(logEditKey, null);
  saveEntry(key, { rating: String(logRating), result: text });
  $('logSheet').classList.remove('on');
  renderHistory();
};
$('addEntry').onclick = () => openLog({});

function renderHistory() {
  const list = Object.entries(logs()).sort(([a], [b]) => b.localeCompare(a)).slice(0, 60);
  $('history').innerHTML = list.length ? list.map(([k, e]) => `<div class="entry"><b>${esc(dayLabel(k.slice(0, 10)))} · ${esc(k.slice(13))}</b> <span class="muted small">difficulté ${esc(e.rating)}/10</span>
    <div>${esc(e.result)}</div><div class="row" style="margin-top:6px"><button data-edit="${esc(k)}" style="padding:5px 10px">Modifier</button><button class="danger" data-delk="${esc(k)}" style="padding:5px 10px">Supprimer</button></div></div>`).join('')
    : '<p class="muted small">Aucune séance enregistrée. Après ta séance, touche « Séance terminée → noter ».</p>';
  renderStats();
}
$('history').addEventListener('click', e => {
  const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-delk]');
  if (ed) { const k = ed.dataset.edit, en = logs()[k]; openLog({ key: k, day: k.slice(0, 10), type: k.slice(13).replace(/ \d+$/, ''), text: en.result, rating: en.rating }); }
  if (del && confirm('Supprimer cette séance ?')) { saveEntry(del.dataset.delk, null); renderHistory(); }
});
function renderStats() {
  const weeks = {};
  const wk = iso => { const [y, m, d] = iso.split('-').map(Number); return isoDay(mondayOf(new Date(y, m - 1, d))); };
  for (const [k, e] of Object.entries(logs())) {
    const s = weeks[wk(k.slice(0, 10))] ||= { n: 0, mu: 0, cf: 0, sum: 0, rated: 0, days: {} };
    s.n++; const kd = kindOf(k); if (kd === 'muscu') s.mu++; else if (kd === 'crossfit') s.cf++; else if (kd === 'hyrox' || kd === 'prepa') s.hx = (s.hx || 0) + 1;
    if (+e.rating) { s.sum += +e.rating; s.rated++; }
  }
  for (const m of Object.values(meals())) {
    const s = weeks[wk(m.date)] ||= { n: 0, mu: 0, cf: 0, sum: 0, rated: 0, days: {} };
    const d = s.days[m.date] ||= { kcal: 0, p: 0 }; d.kcal += +m.tot.kcal || 0; d.p += +m.tot.p || 0;
  }
  const rows = Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a)).slice(0, 8);
  if (!rows.length) { $('stats').innerHTML = '<p class="muted small">Le suivi apparaîtra après ta première séance ou ton premier repas noté.</p>'; return; }
  $('stats').innerHTML = '<table class="stats"><thead><tr><th>Semaine</th><th>Séances</th><th>Diff.</th><th>kcal/j</th><th>Prot./j</th></tr></thead><tbody>' + rows.map(([w, s]) => {
    const ds = Object.values(s.days), avg = f => ds.length ? Math.round(ds.reduce((a, d) => a + d[f], 0) / ds.length) : '—';
    return `<tr><td>${w.slice(8, 10)}/${w.slice(5, 7)}</td><td>${s.n}${s.n ? ` <span class="muted small">(${s.cf} CF · ${s.mu} M${s.hx ? ' · ' + s.hx + ' HX' : ''})</span>` : ''}</td><td>${s.rated ? (s.sum / s.rated).toFixed(1).replace('.', ',') : '—'}</td><td>${avg('kcal')}</td><td>${avg('p')}${ds.length ? ' g' : ''}</td></tr>`;
  }).join('') + '</tbody></table>';
}

// Cloud
function ago(ms) { const m = Math.floor((Date.now() - ms) / 60000); return m < 1 ? 'à l’instant' : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.floor(m / 60) + ' h' : 'il y a ' + Math.floor(m / 1440) + ' j'; }
function cloudState() {
  const c = cloud(), el = $('cloudState'), n = pendingCount();
  $('cloudOff').hidden = !!c; $('cloudOn').hidden = !c;
  if (!c) { el.className = 'status warn'; el.textContent = 'Cloud non connecté : tes données restent sur ce téléphone. Réglages → Cloud Google Sheets.'; return; }
  if (syncing) { el.className = 'status'; el.textContent = '☁ Synchronisation…'; return; }
  if (c.error) { el.className = 'status warn'; el.textContent = '☁ Erreur de synchronisation (' + c.error + ')' + (n ? ' · ' + n + ' en attente' : '') + '.'; return; }
  if (n) { el.className = 'status'; el.textContent = '☁ ' + n + ' modification' + (n > 1 ? 's' : '') + ' en attente' + (navigator.onLine ? '' : ' (hors ligne)') + '.'; return; }
  el.className = 'status ok'; el.textContent = '☁ Synchronisé avec Google Sheets ' + (c.lastSync ? ago(c.lastSync) : '') + '.';
}
syncHooks.state.push(cloudState);
syncHooks.journal.push(() => { if (document.body.dataset.tab === 'suivi') renderHistory(); });
$('cloudConnect').onclick = () => {
  const url = $('cloudLink').value.trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec\?k=[\w-]+$/.test(url)) { $('cloudLink').setCustomValidity('Lien invalide'); $('cloudLink').reportValidity(); $('cloudLink').setCustomValidity(''); return; }
  write(CLOUD, { url, lastSync: 0, error: '' }); $('cloudLink').value = ''; syncNow(); checkCoach().then(coachUi);
};
$('cloudSync').onclick = () => syncNow();
$('cloudOff2').onclick = () => { if (confirm('Déconnecter cet appareil du cloud ? Tes données restent sur le téléphone et dans le Google Sheet.')) { localStorage.removeItem(CLOUD); localStorage.removeItem(QUEUE); localStorage.removeItem(MQUEUE); cloudState(); } };

// Coach
function coachUi() {
  const el = $('coachState');
  if (!cloud()) { el.className = 'status warn'; el.textContent = 'Connecte d’abord le cloud.'; return; }
  el.className = 'status ' + (coachReady ? 'ok' : 'warn');
  el.textContent = coachReady ? '✓ Coach prêt (séances et repas analysés par Claude)' : coachReady === false ? 'Coach pas encore activé : clé API manquante ou script à mettre à jour.' : 'Statut du coach inconnu (pas de réseau ?).';
}
$('coachKeySave').onclick = async () => {
  const key = $('coachKey').value.trim();
  if (!/^sk-ant-[\w-]{20,}$/.test(key)) { $('coachState').className = 'status warn'; $('coachState').textContent = 'Clé invalide : elle commence par « sk-ant- ».'; return; }
  try {
    const r = await callScript({ action: 'setKey', key });
    if (!r.ok || r.hasKey !== true) throw new Error(r.error || 'script Google pas encore mis à jour');
    $('coachKey').value = ''; coachReady = true; coachUi();
  } catch (err) { $('coachState').className = 'status warn'; $('coachState').textContent = 'Échec : ' + err.message; }
};
(function () {
  const p = coachProfile(); $('coachRefs').value = p.refs; $('coachNotes').value = p.notes;
  const save = () => write(COACH_PROFILE, { refs: $('coachRefs').value, notes: $('coachNotes').value });
  $('coachRefs').onchange = save; $('coachNotes').onchange = save;
})();

// Réglages son et objectifs
(function () {
  const st = settings();
  $('voiceMode').value = st.voice; $('prepSec').value = String(st.prep); $('goalKcal').value = st.kcal; $('goalProt').value = st.prot;
  $('voiceMode').onchange = () => { setSetting('voice', $('voiceMode').value); if ($('voiceMode').value === 'clips') loadClips(); };
  $('prepSec').onchange = () => setSetting('prep', Number($('prepSec').value));
  $('goalKcal').onchange = () => { const v = +$('goalKcal').value; if (v >= 1000 && v <= 5000) setSetting('kcal', v); };
  $('goalProt').onchange = () => { const v = +$('goalProt').value; if (v >= 40 && v <= 400) setSetting('prot', v); };
  $('testSound').onclick = testSound;
})();

// Sauvegarde
function backupState() {
  const n = Object.keys(logs()).length, m = Object.keys(meals()).length, last = read('marwin.lastExport', 0);
  $('backupState').textContent = n + ' séance' + (n > 1 ? 's' : '') + ' et ' + m + ' repas sur ce téléphone · dernier export : ' + (last ? ago(last) : 'jamais');
}
$('exportFile').onclick = async () => {
  const body = JSON.stringify({ app: 'marwin-training', version: 2, exported: new Date().toISOString(), journal: logs(), meals: meals() });
  const name = 'marwin-training-' + isoDay() + '.json', file = new File([body], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); write('marwin.lastExport', Date.now()); backupState(); } catch {} return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); a.remove();
  write('marwin.lastExport', Date.now()); backupState();
};
$('copyText').onclick = async () => {
  const text = Object.entries(logs()).sort(([a], [b]) => b.localeCompare(a)).map(([k, e]) => k + ' · Difficulté ' + e.rating + '/10\n' + e.result).join('\n\n');
  try { await navigator.clipboard.writeText(text); $('syncMsg').textContent = 'Journal copié.'; } catch { $('pasteBox').value = text; $('syncMsg').textContent = 'Copie bloquée : le texte est dans la zone ci-dessous.'; }
};
function runImport(raw) {
  try { const r = mergeImport(parseImport(raw)); $('syncMsg').textContent = r.total || r.mAdded ? `Import : ${r.added} ajoutée(s), ${r.replaced} mise(s) à jour, ${r.same} déjà présente(s)${r.mAdded ? ', ' + r.mAdded + ' repas' : ''}.` : 'Aucune entrée reconnue.'; renderHistory(); backupState(); }
  catch (err) { $('syncMsg').textContent = err.message; }
}
$('pickFile').onclick = () => $('importFile').click();
$('importFile').onchange = async e => { const f = e.target.files[0]; if (f) runImport(await f.text()); e.target.value = ''; };
$('importText').onclick = () => { runImport($('pasteBox').value); $('pasteBox').value = ''; };

$('prepaRestart').onclick = () => { if (!confirm('Recommencer la prépa HYROX à la semaine 1 ? Tes séances déjà notées restent dans le journal.')) return; setSetting('prepaStart', isoDay(new Date(Date.now() + 1000))); const t = Object.keys(logs()).filter(k => kindOf(k) === 'prepa' && k.slice(0, 10) >= isoDay()).length; if (t) setSetting('prepaStart', isoDay(new Date(Date.now() + 86400000))); renderPrepaInfo(); };
tabHooks.suivi = () => { renderHistory(); cloudState(); coachUi(); backupState(); renderPrepaInfo(); };

// Démarrage
showTab(location.hash.slice(1) || 'seance');
cloudState();
if (cloud()) { syncNow(); checkCoach().then(coachUi); }
