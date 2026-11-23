// Chrono unique : AMRAP (minuteur), For time (chrono), EMOM, Tabata, Repos.
const TIMER = 'marwin.timer2';
const MODE_NAMES = { minuteur: 'AMRAP', chrono: 'For time', emom: 'EMOM', tabata: 'Tabata', repos: 'Repos' };
const T = Object.assign({ mode: 'minuteur', cfg: { minuteur: { min: 12 }, chrono: { cap: 0 }, emom: { every: 60, rounds: 10 }, tabata: { work: 20, rest: 10, rounds: 8 }, repos: { sec: 90 } }, run: null }, read(TIMER, {}));
const saveT = () => write(TIMER, T);
let marks = [], prevT = null, lastCue = '';

function segmentsOf(mode, c) {
  if (mode === 'minuteur') return [{ k: 'work', d: c.min * 60 }];
  if (mode === 'chrono') return [{ k: 'work', d: c.cap > 0 ? c.cap * 60 : Infinity }];
  if (mode === 'emom') return Array.from({ length: c.rounds }, (_, i) => ({ k: 'work', d: c.every, r: i + 1 }));
  if (mode === 'tabata') { const s = []; for (let i = 1; i <= c.rounds; i++) { s.push({ k: 'work', d: c.work, r: i }); if (i < c.rounds) s.push({ k: 'rest', d: c.rest, r: i }); } return s; }
  return [{ k: 'rest', d: c.sec }];
}
function buildMarks(run) {
  const segs = segmentsOf(run.mode, run.cfg), total = segs.reduce((a, s) => a + s.d, 0), m = [];
  const add = (at, keys, b, pr = 2, end = false) => m.push({ at, keys: [].concat(keys), b, pr, end });
  for (const s of [3, 2, 1]) if (s <= run.prep) add(-s, [], 'short');
  let cum = 0;
  segs.forEach((s, i) => {
    const n = run.cfg.rounds;
    if (run.mode === 'emom' || (run.mode === 'tabata' && s.k === 'work')) add(cum, [s.r === n && n > 1 ? 'dernier' : 'tour' + Math.min(s.r, 30)], 'go');
    else if (run.mode === 'tabata') add(cum, ['repos'], 'long');
    else if (i === 0 && run.mode !== 'repos') add(cum, ['depart'], 'go');
    const end = cum + s.d;
    if (isFinite(end) && s.d >= 6) for (const k of [3, 2, 1]) if (end - k > cum) add(end - k, [], 'short', 3);
    if (((run.mode === 'tabata' && s.k === 'work' && s.d >= 30) || (run.mode === 'emom' && s.d >= 90)) && end !== total) add(end - 10, ['dix_sec'], null, 3);
    cum = end;
  });
  if (isFinite(total)) {
    if (total >= 30 && run.mode !== 'repos') add(total / 2, ['mitemps'], null, 0);
    if (total >= 30) add(total - 10, ['dix_dernieres'], null, 1);
    add(total, [run.mode === 'repos' ? 'repos_fini' : run.mode === 'emom' || run.mode === 'tabata' ? 'termine' : 'fin'], 'long', 0, true);
  }
  return { segs, total, marks: m };
}
function state() {
  const run = T.run;
  if (!run) return null;
  const elapsed = (run.acc + (run.start ? Date.now() - run.start : 0)) / 1000;
  const { segs, total } = buildMarks(run);
  const t = elapsed - run.prep;
  let cum = 0, seg = null, idx = -1;
  for (let i = 0; i < segs.length; i++) { if (t < cum + segs[i].d) { seg = segs[i]; idx = i; break; } cum += segs[i].d; }
  return { run, t, total, segs, seg, idx, segLeft: seg ? cum + seg.d - t : 0, prep: t < 0, done: run.done || (isFinite(total) && t >= total) };
}

function timerStart(mode, cfg, opts = {}) {
  if (mode) T.mode = mode;
  if (cfg) T.cfg[T.mode] = { ...T.cfg[T.mode], ...cfg };
  const prep = T.mode === 'repos' ? 0 : (opts.prep ?? settings().prep);
  T.run = { mode: T.mode, cfg: { ...T.cfg[T.mode] }, prep, acc: 0, start: Date.now(), done: false, laps: [] };
  ({ marks } = buildMarks(T.run)); prevT = -prep - 0.001; lastCue = '';
  saveT(); unlockAudio(); keepAwake(true);
  if (prep > 0) say(['prepare']);
  tick(); renderCfg();
}
function startRest(sec) { timerStart('repos', { sec }); }
function timerToggle() {
  const s = state();
  if (!s || s.done) return timerStart();
  const r = T.run;
  if (r.start) { r.acc += Date.now() - r.start; r.start = 0; keepAwake(false); if (r.mode === 'chrono' && !isFinite(s.total)) say(['termine']); }
  else { r.start = Date.now(); prevT = null; keepAwake(true); say(['reprise']); }
  saveT(); tick();
}
function timerReset() { T.run = null; saveT(); keepAwake(false); lastCue = ''; tick(); renderCfg(); }

function fireCues(s) {
  if (!s.run.start) { prevT = s.t; return; }
  if (prevT === null) { prevT = s.t; return; }
  let hit = marks.filter(x => prevT < x.at && x.at <= s.t);
  if (s.t - prevT > 3) hit = hit.filter(x => x.end);
  prevT = s.t;
  if (!hit.length) return;
  hit.sort((a, b) => a.at - b.at || a.pr - b.pr);
  const b = hit.map(x => x.b).filter(Boolean);
  if (b.length) beep(b.includes('go') ? 'go' : b.includes('long') ? 'long' : 'short');
  const keys = hit.flatMap(x => x.keys);
  if (keys.length) { say(keys); lastCue = keys.map(k => CLIP_TEXT[k]).join(' · '); }
}
function view(s) {
  const mode = s ? s.run.mode : T.mode, c = s ? s.run.cfg : T.cfg[T.mode];
  if (!s) {
    const init = { minuteur: c.min * 60, chrono: 0, emom: c.every, tabata: c.work, repos: c.sec }[mode];
    const sub = { minuteur: c.min + ' min', chrono: c.cap ? 'Cap ' + c.cap + ' min' : 'Sans limite', emom: c.rounds + ' tours toutes les ' + mmss(c.every), tabata: c.work + ' s / ' + c.rest + ' s × ' + c.rounds, repos: '' }[mode];
    return { lab: MODE_NAMES[mode], dig: clock(init), sub, cls: '', btn: 'Démarrer' };
  }
  const btn = s.done ? 'Relancer' : s.run.start ? 'Pause' : 'Reprendre';
  if (s.done) return { lab: 'Terminé', dig: clock(mode === 'chrono' ? Math.min(s.t, s.total) : 0), sub: MODE_NAMES[mode], cls: 'done', btn };
  if (s.prep) return { lab: 'Prépare-toi', dig: clock(-s.t), sub: MODE_NAMES[mode], cls: 'prep', btn };
  const totLeft = isFinite(s.total) ? 'Total restant ' + mmss(s.total - s.t) : '';
  if (mode === 'minuteur') return { lab: 'AMRAP · ' + c.min + ' min', dig: clock(s.total - s.t), sub: '', cls: 'work', btn };
  if (mode === 'chrono') return { lab: 'For time', dig: clock(Math.floor(s.t)), sub: c.cap ? 'Cap ' + c.cap + ' min' : 'Appuie sur Pause à la fin', cls: 'work', btn };
  if (mode === 'repos') return { lab: 'Repos', dig: clock(s.segLeft), sub: '', cls: 'rest', btn };
  const r = s.seg.r, n = c.rounds;
  if (mode === 'emom') return { lab: 'Tour ' + r + ' / ' + n, dig: clock(s.segLeft), sub: totLeft, cls: 'work', btn };
  return { lab: 'Tour ' + r + ' / ' + n + ' · ' + (s.seg.k === 'work' ? 'EFFORT' : 'REPOS'), dig: clock(s.segLeft), sub: totLeft, cls: s.seg.k === 'work' ? 'work' : 'rest', btn };
}
function tick() {
  const s = state();
  if (s) {
    fireCues(s);
    if (s.done && !s.run.done) { s.run.done = true; s.run.acc += s.run.start ? Date.now() - s.run.start : 0; s.run.start = 0; saveT(); keepAwake(false); }
  }
  const v = view(s);
  if (document.body.dataset.tab === 'chrono') {
    $('fLab').textContent = v.lab; $('fDig').textContent = v.dig; $('fSub').textContent = v.sub; $('fCue').textContent = s ? lastCue : '';
    $('face').className = 'face ' + v.cls; $('tGo').textContent = v.btn;
    document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === (s ? s.run.mode : T.mode)));
    const showLap = !!(s && s.run.mode === 'chrono' && s.run.start && !s.done && !s.prep);
    $('tLap').hidden = !showLap;
    const laps = s && s.run.laps || [];
    const sig = laps.length + ':' + (s ? s.run.mode : '');
    if ($('laps').dataset.sig !== sig) { $('laps').dataset.sig = sig; $('laps').innerHTML = laps.map((t, i) => `<div><span>Split ${i + 1}</span><b>${mmss(t - (laps[i - 1] || 0))}</b><span class="muted">${mmss(t)}</span></div>`).reverse().join(''); }
  }
  const active = s && !s.done;
  const mini = !!active && document.body.dataset.tab !== 'chrono';
  $('minibar').classList.toggle('on', mini); document.body.classList.toggle('mini', mini);
  if (active) { $('mbDig').textContent = v.dig; $('mbLab').textContent = v.lab + (s.run.start ? '' : ' (pause)'); }
}

// Configuration (uniquement quand aucun minuteur ne tourne)
const PRESETS = {
  minuteur: [8, 10, 12, 15, 20].map(m => ({ t: m + ' min', c: { min: m } })),
  chrono: [{ t: 'Sans cap', c: { cap: 0 } }, ...[10, 15, 20].map(m => ({ t: 'Cap ' + m, c: { cap: m } }))],
  emom: [10, 12, 16, 20].map(m => ({ t: m + ' min', c: { every: 60, rounds: m } })),
  tabata: [{ t: '20/10 × 8', c: { work: 20, rest: 10, rounds: 8 } }, { t: '40/20 × 6', c: { work: 40, rest: 20, rounds: 6 } }, { t: '30/30 × 10', c: { work: 30, rest: 30, rounds: 10 } }, { t: '45/15 × 8', c: { work: 45, rest: 15, rounds: 8 } }],
  repos: [45, 60, 90, 120, 150, 180].map(s => ({ t: mmss(s), c: { sec: s }, go: true }))
};
const FIELDS = {
  minuteur: [['min', 'Durée (min)', 1, 90]], chrono: [['cap', 'Cap (min, 0 = aucun)', 0, 90]],
  emom: [['every', 'Toutes les (s)', 15, 300], ['rounds', 'Tours', 1, 60]],
  tabata: [['work', 'Effort (s)', 5, 600], ['rest', 'Repos (s)', 5, 600], ['rounds', 'Tours', 1, 50]], repos: [['sec', 'Repos (s)', 10, 600]]
};
function renderCfg() {
  const active = T.run && !T.run.done, mode = T.mode, c = T.cfg[mode];
  $('cfg').innerHTML = FIELDS[mode].map(([k, l, mi, ma]) => `<label>${l}<input type="number" inputmode="numeric" data-k="${k}" min="${mi}" max="${ma}" value="${c[k]}"${active ? ' disabled' : ''}></label>`).join('');
  $('presets').innerHTML = PRESETS[mode].map((p, i) => `<button data-p="${i}"${active && !p.go ? ' disabled' : ''}>${p.t}</button>`).join('');
  $('cfgCard').style.opacity = active ? .6 : 1;
}
$('cfg').addEventListener('change', e => {
  const k = e.target.dataset.k; if (!k) return;
  const v = Number(e.target.value), [, , mi, ma] = FIELDS[T.mode].find(f => f[0] === k);
  if (!(v >= mi && v <= ma)) { e.target.value = T.cfg[T.mode][k]; return; }
  T.cfg[T.mode][k] = v; saveT(); tick();
});
$('presets').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const p = PRESETS[T.mode][b.dataset.p];
  T.cfg[T.mode] = { ...T.cfg[T.mode], ...p.c }; saveT();
  if (p.go) timerStart(); else { renderCfg(); tick(); }
});
$('modes').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.dataset.m === T.mode) return;
  if (T.run && !T.run.done && !confirm('Arrêter le minuteur en cours ?')) return;
  if (T.run) timerReset();
  T.mode = b.dataset.m; saveT(); renderCfg(); tick();
});
$('tGo').onclick = () => { unlockAudio(); timerToggle(); };
$('tReset').onclick = timerReset;
$('tLap').onclick = () => { const s = state(); if (!s || !s.run.start || s.prep) return; (s.run.laps ||= []).push(Math.floor(s.t)); saveT(); beep('short'); tick(); };
$('mbOpen').onclick = () => goTab('chrono');
$('minibar').addEventListener('click', e => { if (e.target.id !== 'mbOpen') goTab('chrono'); });
tabHooks.chrono = () => {
  renderCfg(); tick();
  $('soundHint').textContent = settings().voice === 'iphone' ? 'Annonces : voix de l’iPhone.' : 'Annonces mixées avec ta musique. Désactive le mode silencieux de l’iPhone pour les entendre.';
};
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && T.run && T.run.start) keepAwake(true); });
if (T.run) { ({ marks } = buildMarks(T.run)); if (T.run.start) keepAwake(true); }
setInterval(tick, 100);
