// Fondations : stockage, dates, onglets, appel au script Google, écran allumé.
const $ = id => document.getElementById(id);
const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = n => String(n).padStart(2, '0');
const isoDay = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad(s % 60); };
const clock = s => { s = Math.max(0, Math.ceil(s)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
function mondayOf(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; }
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number), dt = new Date(y, m - 1, d), today = isoDay();
  if (iso === today) return 'Aujourd’hui';
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  if (iso === isoDay(yest)) return 'Hier';
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Réglages
const SETTINGS = 'marwin.settings';
const settings = () => ({ voice: 'clips', prep: 10, kcal: 2100, prot: 170, ...read(SETTINGS, {}) });
const setSetting = (k, v) => write(SETTINGS, { ...read(SETTINGS, {}), [k]: v });

// Onglets
const TITLES = { seance: 'Séance du jour', chrono: 'Chrono', repas: 'Repas', suivi: 'Suivi' };
const tabHooks = {};
function showTab(t) {
  if (!TITLES[t]) t = 'seance';
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('on', s.id === 't-' + t));
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === t));
  $('hTitle').textContent = TITLES[t];
  document.body.dataset.tab = t;
  if (tabHooks[t]) tabHooks[t]();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', () => showTab(location.hash.slice(1)));
function goTab(t) { if (location.hash !== '#' + t) location.hash = t; else showTab(t); }

// Script Google (cloud + coach + repas)
const CLOUD = 'marwin.cloud';
const cloud = () => read(CLOUD, null);
async function callScript(payload) {
  const c = cloud();
  if (!c) throw new Error('Connecte d’abord le cloud (Suivi → Réglages → Cloud Google Sheets).');
  if (!navigator.onLine) throw new Error('Pas de connexion internet.');
  const r = await fetch(c.url, { method: 'POST', body: JSON.stringify(payload) });
  return r.json();
}

// Écran allumé tant qu’un minuteur tourne (iOS 18.4+ en mode app).
let wakeLock = null;
async function keepAwake(on) {
  if (!('wakeLock' in navigator)) return;
  try {
    if (on && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { wakeLock = null; }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./offline.js').catch(() => {});
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
