// Synchronisation avec le Google Sheet : journal (clé « date / activité ») et repas (id).
const JOURNAL = 'marwin.journal', QUEUE = 'marwin.queue', MEALS = 'marwin.meals', MQUEUE = 'marwin.mealQueue';
const logs = () => read(JOURNAL, {});
const meals = () => read(MEALS, {});
const syncHooks = { journal: [], meals: [], state: [] };
const emit = k => syncHooks[k].forEach(f => { try { f(); } catch (e) { console.error(e); } });

function saveEntry(key, entry) {
  const all = logs();
  if (entry) all[key] = { ...entry, updated: Date.now() }; else delete all[key];
  write(JOURNAL, all);
  queueOp(QUEUE, key, entry ? { key, rating: String(all[key].rating ?? ''), result: all[key].result, updated: all[key].updated } : { key, deleted: true, updated: Date.now() });
  emit('journal'); scheduleSync();
}
function saveMeal(meal) {
  const all = meals();
  if (meal.deleted) delete all[meal.id]; else all[meal.id] = { ...meal, updated: Date.now() };
  write(MEALS, all);
  queueOp(MQUEUE, meal.id, meal.deleted ? { id: meal.id, deleted: true, updated: Date.now() } : all[meal.id]);
  emit('meals'); scheduleSync();
}
function queueOp(q, k, op) { if (!cloud()) return; const all = read(q, {}); all[k] = op; write(q, all); }
const pendingCount = () => Object.keys(read(QUEUE, {})).length + Object.keys(read(MQUEUE, {})).length;

let syncTimer = 0, syncing = false, syncAgain = false;
function scheduleSync(delay = 1200) { if (!cloud()) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, delay); emit('state'); }
async function syncNow(followUp = true) {
  const c = cloud();
  if (!c) return;
  if (syncing) { syncAgain = true; return; }
  if (!navigator.onLine) { emit('state'); return; }
  syncing = true; emit('state');
  try {
    const ops = Object.values(read(QUEUE, {})), mealOps = Object.values(read(MQUEUE, {}));
    const r = await fetch(c.url, { method: 'POST', body: JSON.stringify({ ops, mealOps }) });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error || 'réponse invalide');
    clearSent(QUEUE, ops, 'key'); clearSent(MQUEUE, mealOps, 'id');
    const missing = applyJournal(data.entries, data.deleted) + (data.meals ? applyMeals(data.meals, data.mealsDeleted) : 0);
    write(CLOUD, { ...cloud(), lastSync: Date.now(), error: '' });
    if (missing && followUp) syncAgain = true;
  } catch (err) {
    const cur = cloud(); if (cur) write(CLOUD, { ...cur, error: err.message || String(err) });
  } finally {
    syncing = false; emit('state');
    if (syncAgain) { syncAgain = false; setTimeout(() => syncNow(false), 300); }
  }
}
function clearSent(q, sent, id) {
  const all = read(q, {});
  for (const op of sent) if (all[op[id]] && all[op[id]].updated === op.updated && !!all[op[id]].deleted === !!op.deleted) delete all[op[id]];
  write(q, all);
}
function applyJournal(remote, gone) {
  const all = logs(), q = read(QUEUE, {}), known = new Set(); let changed = false;
  for (const t of gone || []) { known.add(t.key); const cur = all[t.key]; if (cur && !q[t.key] && (cur.updated || 0) <= t.updated) { delete all[t.key]; changed = true; } }
  for (const r of remote || []) {
    known.add(r.key); if (q[r.key]) continue;
    const cur = all[r.key];
    if (!cur || (r.updated > (cur.updated || 0) && (cur.result !== r.result || String(cur.rating) !== String(r.rating)))) { all[r.key] = { rating: String(r.rating), result: r.result, updated: r.updated }; changed = true; }
  }
  let missing = 0;
  for (const [k, e] of Object.entries(all)) if (!known.has(k) && !q[k]) { q[k] = { key: k, rating: String(e.rating ?? ''), result: e.result, updated: e.updated || 0 }; missing++; }
  if (missing) write(QUEUE, q);
  if (changed) { write(JOURNAL, all); emit('journal'); }
  return missing;
}
function applyMeals(remote, gone) {
  const all = meals(), q = read(MQUEUE, {}), known = new Set(); let changed = false;
  for (const t of gone || []) { known.add(t.id); const cur = all[t.id]; if (cur && !q[t.id] && (cur.updated || 0) <= t.updated) { delete all[t.id]; changed = true; } }
  for (const r of remote || []) {
    known.add(r.id); if (q[r.id]) continue;
    const cur = all[r.id];
    if (!cur || r.updated > (cur.updated || 0)) { all[r.id] = r; changed = true; }
  }
  let missing = 0;
  const since = isoDay(new Date(Date.now() - 85 * 86400000));
  for (const [id, m] of Object.entries(all)) if (!known.has(id) && !q[id] && m.date >= since) { q[id] = m; missing++; }
  if (missing) write(MQUEUE, q);
  if (changed) { write(MEALS, all); emit('meals'); }
  return missing;
}
addEventListener('online', () => syncNow());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
setInterval(() => { if (cloud() && pendingCount()) syncNow(); else emit('state'); }, 60000);

// Lecture d’un ancien journal copié en texte (« 2026-11-17 / Séance A · Difficulté 7/10 … »).
function parseJournalText(text) {
  const out = {}, head = /(\d{4}-\d{2}-\d{2})\s*\/\s*(.+?)\s*[·•\-–]\s*Difficulté\s*(\d{1,2})\s*\/\s*10/g;
  const marks = [...text.replace(/\r/g, '').matchAll(head)];
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    const result = text.slice(m.index + m[0].length, end).trim().split(/\n\s*(?:Planning alimentaire|Ajouter à l’écran d’accueil|Réglages)/)[0].replace(/\n?Modifier\s*Supprimer\s*$/, '').trim();
    out[m[1] + ' / ' + m[2].trim()] = { rating: String(Math.min(10, Math.max(1, Number(m[3])))), result: result || '—' };
  });
  return out;
}
function parseImport(raw) {
  const text = raw.trim();
  if (text.startsWith('{')) {
    let data; try { data = JSON.parse(text); } catch { throw new Error('Fichier illisible : JSON invalide.'); }
    const entries = data && data.app === 'marwin-training' ? data.journal : data;
    if (!entries || typeof entries !== 'object') throw new Error('Aucune entrée trouvée dans le fichier.');
    const clean = {};
    for (const [k, e] of Object.entries(entries)) if (/^\d{4}-\d{2}-\d{2} \/ .+/.test(k) && e && typeof e.result === 'string') clean[k] = { rating: String(e.rating ?? ''), result: e.result, ...(e.updated ? { updated: Number(e.updated) } : {}) };
    return { journal: clean, meals: data && data.meals && typeof data.meals === 'object' ? data.meals : {} };
  }
  return { journal: parseJournalText(text), meals: {} };
}
function mergeImport({ journal, meals: ms }) {
  const all = logs(), st = { added: 0, replaced: 0, same: 0, kept: 0 };
  for (const [k, e] of Object.entries(journal)) {
    const cur = all[k];
    if (!cur) { all[k] = e; st.added++; queueOp(QUEUE, k, { key: k, rating: String(e.rating), result: e.result, updated: e.updated || 0 }); }
    else if (cur.result === e.result && String(cur.rating) === String(e.rating)) st.same++;
    else if ((e.updated || 0) > (cur.updated || 0)) { all[k] = e; st.replaced++; queueOp(QUEUE, k, { key: k, rating: String(e.rating), result: e.result, updated: e.updated || 0 }); }
    else st.kept++;
  }
  write(JOURNAL, all);
  const am = meals(); let mAdded = 0;
  for (const [id, m] of Object.entries(ms || {})) if (!am[id] && m && m.date) { am[id] = m; mAdded++; queueOp(MQUEUE, id, m); }
  write(MEALS, am);
  emit('journal'); emit('meals'); scheduleSync();
  return { ...st, mAdded, total: Object.keys(journal).length };
}
