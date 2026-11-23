// Sauvegarde et transfert du journal (export fichier / texte, import fichier / texte collé).
const LAST_EXPORT = 'marwin.lastExport';

function journalAsText(entries) {
  return Object.entries(entries).sort(([a],[b]) => b.localeCompare(a))
    .map(([k, e]) => k + ' · Difficulté ' + e.rating + '/10\n' + e.result).join('\n\n');
}

// Lit le texte copié depuis l'historique (ancienne ou nouvelle version).
function parseJournalText(text) {
  const out = {};
  const head = /(\d{4}-\d{2}-\d{2})\s*\/\s*(.+?)\s*[·•\-–]\s*Difficulté\s*(\d{1,2})\s*\/\s*10/g;
  const marks = [...text.replace(/\r/g, '').matchAll(head)];
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    const result = text.slice(m.index + m[0].length, end)
      .replace(/^\s+|\s+$/g, '')
      .split(/\n\s*(?:Planning alimentaire|Ajouter à l’écran d’accueil|Sauvegarder ou transférer|Cloud, sauvegarde)/)[0]
      .replace(/\n?Modifier\s*Supprimer\s*$/,'')
      .trim();
    const rating = Math.min(10, Math.max(1, Number(m[3])));
    out[m[1] + ' / ' + m[2].trim()] = { rating: String(rating), result: result || '—' };
  });
  return out;
}

function parseImport(raw) {
  const text = raw.trim();
  if (text.startsWith('{')) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Fichier illisible : JSON invalide.'); }
    const entries = data && data.app === 'marwin-training' ? data.journal : data;
    if (!entries || typeof entries !== 'object') throw new Error('Aucune entrée trouvée dans le fichier.');
    const clean = {};
    for (const [k, e] of Object.entries(entries)) {
      if (!/^\d{4}-\d{2}-\d{2} \/ .+/.test(k) || !e || typeof e.result !== 'string') continue;
      clean[k] = { rating: String(e.rating ?? ''), result: e.result, ...(e.updated ? { updated: Number(e.updated) } : {}) };
    }
    return clean;
  }
  return parseJournalText(text);
}

// Fusion : ajoute ce qui manque ; en cas de conflit, garde la version modifiée le plus récemment.
function mergeJournal(incoming) {
  const entries = logs();
  const stats = { added: 0, replaced: 0, same: 0, kept: 0 };
  for (const [k, e] of Object.entries(incoming)) {
    const cur = entries[k];
    if (!cur) { entries[k] = e; stats.added++; queueOp(k, e); }
    else if (cur.result === e.result && String(cur.rating) === String(e.rating)) stats.same++;
    else if ((e.updated || 0) > (cur.updated || 0)) { entries[k] = e; stats.replaced++; queueOp(k, e); }
    else stats.kept++;
  }
  write('marwin.journal', entries);
  renderHistory(); loadEntry(); backupState(); scheduleSync();
  return stats;
}

function report(stats, total) {
  if (!total) return 'Aucune entrée reconnue. Vérifie que chaque entrée commence par « 2026-11-17 / Séance A · Difficulté 7/10 ».';
  const parts = [stats.added + ' ajoutée' + (stats.added > 1 ? 's' : '')];
  if (stats.replaced) parts.push(stats.replaced + ' mise' + (stats.replaced > 1 ? 's' : '') + ' à jour');
  if (stats.same) parts.push(stats.same + ' déjà présente' + (stats.same > 1 ? 's' : ''));
  if (stats.kept) parts.push(stats.kept + ' en conflit, version de cet appareil conservée');
  return 'Import terminé : ' + parts.join(', ') + '.';
}

function runImport(raw) {
  try {
    const incoming = parseImport(raw);
    const total = Object.keys(incoming).length;
    $('syncMsg').textContent = report(total ? mergeJournal(incoming) : {}, total);
    return total;
  } catch (err) { $('syncMsg').textContent = err.message; return 0; }
}

function backupState() {
  const n = Object.keys(logs()).length, last = Number(localStorage.getItem(LAST_EXPORT) || 0);
  const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
  const el = $('backupState');
  el.textContent = n + ' entrée' + (n > 1 ? 's' : '') + ' sur cet appareil · Dernière sauvegarde : ' +
    (last ? (days === 0 ? 'aujourd’hui' : 'il y a ' + days + ' j') : 'jamais');
  el.classList.toggle('late', n > 0 && (!last || days >= 14));
}

$('exportFile').onclick = async () => {
  const entries = logs();
  if (!Object.keys(entries).length) { $('syncMsg').textContent = 'Le journal est vide.'; return; }
  const d = new Date(), stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const body = JSON.stringify({ app: 'marwin-training', version: 1, exported: d.toISOString(), journal: entries }, null, 1);
  const name = 'journal-marwin-' + stamp + '.json';
  const file = new File([body], name, { type: 'application/json' });
  const done = () => { localStorage.setItem(LAST_EXPORT, String(Date.now())); backupState(); };
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Journal Marwin Training' }); done(); $('syncMsg').textContent = 'Fichier exporté.'; }
    catch (err) { if (err.name !== 'AbortError') $('syncMsg').textContent = 'Partage impossible : ' + err.message; }
    return;
  }
  const url = URL.createObjectURL(file), a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  done(); $('syncMsg').textContent = 'Fichier « ' + name + ' » téléchargé.';
};

$('copyText').onclick = async () => {
  const text = journalAsText(logs());
  if (!text) { $('syncMsg').textContent = 'Le journal est vide.'; return; }
  try { await navigator.clipboard.writeText(text); $('syncMsg').textContent = 'Journal copié. Colle-le dans Notes, un mail ou l’autre appareil.'; }
  catch { $('pasteBox').value = text; $('pasteBox').select(); $('syncMsg').textContent = 'Copie automatique bloquée : le texte est sélectionné dans la zone ci-dessus, copie-le manuellement.'; }
};

$('pickFile').onclick = () => $('importFile').click();
$('importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  runImport(await f.text()); e.target.value = '';
};
$('importText').onclick = () => { if (runImport($('pasteBox').value)) $('pasteBox').value = ''; };

// ---------- Synchronisation cloud (Google Sheets via Apps Script) ----------
const CLOUD = 'marwin.cloud', QUEUE = 'marwin.queue';
const cloud = () => read(CLOUD, null);
const pending = () => read(QUEUE, {});
function queueOp(k, e) {
  if (!cloud()) return;
  const q = pending();
  q[k] = e ? { key: k, rating: String(e.rating), result: e.result, updated: e.updated || 0 } : { key: k, deleted: true, updated: Date.now() };
  write(QUEUE, q);
}
function journalChanged(k, e) { queueOp(k, e); scheduleSync(); }
let syncTimer = 0, syncing = false, syncAgain = false;
function scheduleSync(delay = 1200) {
  if (!cloud()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay);
  cloudState();
}
function applyRemote(remote, gone) {
  const entries = logs(), q = pending();
  let changed = false;
  const known = new Set();
  for (const t of gone || []) {
    known.add(t.key);
    const cur = entries[t.key];
    if (cur && !q[t.key] && (cur.updated || 0) <= t.updated) { delete entries[t.key]; changed = true; }
  }
  for (const r of remote || []) {
    known.add(r.key);
    if (q[r.key]) continue;
    const cur = entries[r.key];
    if (!cur || (r.updated > (cur.updated || 0) && (cur.result !== r.result || String(cur.rating) !== String(r.rating)))) {
      entries[r.key] = { rating: String(r.rating), result: r.result, updated: r.updated };
      changed = true;
    }
  }
  // Entrées présentes seulement sur cet appareil (créées avant la connexion ou hors ligne) : à envoyer.
  let missing = 0;
  for (const [k, e] of Object.entries(entries)) if (!known.has(k) && !q[k]) { q[k] = { key: k, rating: String(e.rating), result: e.result, updated: e.updated || 0 }; missing++; }
  if (missing) write(QUEUE, q);
  if (changed) { write('marwin.journal', entries); renderHistory(); loadEntry(); }
  return missing;
}
async function syncNow(followUp = true) {
  const c = cloud();
  if (!c) return;
  if (syncing) { syncAgain = true; return; }
  if (!navigator.onLine) { cloudState(); return; }
  syncing = true; cloudState('Synchronisation…');
  try {
    const ops = Object.values(pending());
    const res = await fetch(c.url, { method: 'POST', body: JSON.stringify({ ops }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'réponse invalide');
    const q = pending();
    for (const op of ops) if (q[op.key] && q[op.key].updated === op.updated && !!q[op.key].deleted === !!op.deleted) delete q[op.key];
    write(QUEUE, q);
    const missing = applyRemote(data.entries, data.deleted);
    write(CLOUD, { ...cloud(), lastSync: Date.now(), error: '' });
    if (missing && followUp) syncAgain = true;
  } catch (err) {
    const cur = cloud();
    if (cur) write(CLOUD, { ...cur, error: err.message || String(err) });
  } finally {
    syncing = false; cloudState();
    if (syncAgain) { syncAgain = false; setTimeout(() => syncNow(false), 300); }
  }
}
function ago(ms) {
  const m = Math.floor((Date.now() - ms) / 60000);
  return m < 1 ? 'à l’instant' : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.floor(m / 60) + ' h' : 'il y a ' + Math.floor(m / 1440) + ' j';
}
function cloudState(busy) {
  const c = cloud(), el = $('cloudState'), n = Object.keys(pending()).length;
  $('cloudOff').hidden = !!c; $('cloudOn').hidden = !c;
  el.className = 'cloud';
  if (!c) { el.textContent = 'Cloud non connecté : le journal n’est enregistré que sur cet appareil.'; el.classList.add('warn'); return; }
  if (busy) { el.textContent = '☁ ' + busy; return; }
  if (c.error) { el.textContent = '☁ Erreur de synchronisation (' + c.error + ')' + (n ? ' · ' + n + ' en attente' : '') + '. Nouvel essai automatique.'; el.classList.add('warn'); return; }
  if (n) { el.textContent = '☁ ' + n + ' modification' + (n > 1 ? 's' : '') + ' en attente' + (navigator.onLine ? '' : ' (hors ligne)') + '.'; return; }
  el.textContent = '☁ Synchronisé avec Google Sheets ' + (c.lastSync ? ago(c.lastSync) : '') + '.';
  el.classList.add('ok');
}
$('cloudConnect').onclick = () => {
  const url = $('cloudLink').value.trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec\?k=[\w-]+$/.test(url)) {
    $('syncMsg').textContent = 'Lien invalide. Il doit ressembler à https://script.google.com/macros/s/…/exec?k=…';
    return;
  }
  write(CLOUD, { url, lastSync: 0, error: '' });
  $('cloudLink').value = '';
  $('syncMsg').textContent = 'Connecté. Synchronisation en cours…';
  syncNow();
};
$('cloudSync').onclick = () => syncNow();
$('cloudOff2').onclick = () => {
  if (!confirm('Déconnecter cet appareil du cloud ? Le journal reste sur l’appareil et dans le Google Sheet.')) return;
  localStorage.removeItem(CLOUD); localStorage.removeItem(QUEUE); cloudState();
};
addEventListener('online', () => syncNow());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
setInterval(() => { if (cloud() && Object.keys(pending()).length) syncNow(); else cloudState(); }, 60000);

// ---------- Suivi : séances par semaine ----------
function renderStats() {
  const weeks = {};
  for (const [k, e] of Object.entries(logs())) {
    const [y, m, d] = k.slice(0, 10).split('-').map(Number), day = new Date(y, m - 1, d);
    day.setDate(day.getDate() - (day.getDay() + 6) % 7);
    const w = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
    const s = weeks[w] ||= { n: 0, sum: 0, rated: 0, padel: 0 };
    s.n++; if (Number(e.rating)) { s.sum += Number(e.rating); s.rated++; }
    if (/padel/i.test(k)) s.padel++;
  }
  const list = Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
  if (!list.length) { $('stats').replaceChildren(); return; }
  const rows = list.map(([w, s]) => '<tr><td>' + w.slice(8, 10) + '/' + w.slice(5, 7) + '</td><td>' + s.n + (s.padel ? ' (dont ' + s.padel + ' padel)' : '') + '</td><td>' + (s.rated ? (s.sum / s.rated).toFixed(1).replace('.', ',') + '/10' : '—') + '</td></tr>').join('');
  $('stats').innerHTML = '<h3>Suivi par semaine</h3><table><thead><tr><th>Semaine du</th><th>Séances</th><th>Difficulté moy.</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

backupState(); cloudState(); renderStats(); if (cloud()) syncNow();
