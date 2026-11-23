// Intervalles et Tabata : effort / repos, préparation, plein écran et annonces vocales.
const intFields = ['eff', 'off', 'rounds', 'prep'];
const clock2 = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
function intOptions() { return intFields.map(id => Number($(id).value)); }
if (extra.interval) intFields.forEach((id, i) => { if (extra.interval.config[i] !== undefined) $(id).value = extra.interval.config[i]; });

let intPrev, intMarks = [], intMarksFor = '';

document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
  const [e, o, r] = b.dataset.preset.split(',');
  $('eff').value = e; $('off').value = o; $('rounds').value = r;
  extra.interval = null; persist(); intRefresh();
});

function intClock(a) {
  const [eff, off, n, prep = 0] = a.config, cycle = eff + off, total = cycle * n - off;
  const t = (a.elapsed + (a.start ? Date.now() - a.start : 0)) / 1000 - prep;
  return { eff, off, n, prep, cycle, total, t };
}
function intPhase(c) {
  if (c.t < 0) return { kind: 'prep', left: Math.ceil(-c.t) };
  if (c.t >= c.total) return { kind: 'done', left: 0 };
  const round = Math.floor(c.t / c.cycle), pos = c.t - round * c.cycle, work = pos < c.eff;
  return { kind: work ? 'work' : 'rest', round, left: Math.ceil(work ? c.eff - pos : c.cycle - pos) };
}

// Moments à annoncer : décompte de préparation, chaque phase, mi-temps, 10 dernières secondes, fin.
function marks(c) {
  const id = [c.eff, c.off, c.n, c.prep].join('/');
  if (id === intMarksFor) return intMarks;
  const m = [];
  for (const s of [3, 2, 1]) if (s <= c.prep) m.push({ at: -s, msg: String(s), prio: 2, beep: true });
  const last10 = c.total > 20 ? c.total - 10 : null;
  for (let k = 0; k < c.n; k++) {
    const start = k * c.cycle;
    m.push({ at: start, msg: (k === 0 ? 'Tour 1' : k === c.n - 1 ? 'Dernier tour' : 'Tour ' + (k + 1)) + '. Effort', prio: 2, beep: true });
    if (c.eff >= 30 && start + c.eff - 10 !== last10) m.push({ at: start + c.eff - 10, msg: 'Dix secondes', prio: 3 });
    if (k < c.n - 1) m.push({ at: start + c.eff, msg: 'Repos', prio: 2, beep: true });
  }
  if (c.total >= 20) m.push({ at: c.total / 2, msg: 'Mi-temps', prio: 0 });
  if (last10 !== null) m.push({ at: last10, msg: 'Dix dernières secondes', prio: 1 });
  m.push({ at: c.total, msg: 'Terminé', prio: 0, beep: true, end: true });
  intMarksFor = id; intMarks = m;
  return m;
}
function intCues(c) {
  if (intPrev === undefined) { intPrev = c.t; return; }
  let hit = marks(c).filter(x => intPrev < x.at && x.at <= c.t);
  // Retour après une mise en veille : on ne rattrape pas les annonces passées, sauf la fin.
  if (c.t - intPrev > 3) hit = hit.filter(x => x.end);
  intPrev = c.t;
  if (!hit.length) return;
  hit.sort((x, y) => x.at - y.at || x.prio - y.prio);
  if (hit.some(x => x.beep)) beep();
  showCue(hit.map(x => x.msg).join('. '), 'int');
}

$('intGo').onclick = () => {
  unlock();
  let a = extra.interval;
  if (!a || a.done) {
    for (const id of intFields) if (!$(id).value || !$(id).reportValidity()) return;
    a = extra.interval = { config: intOptions(), elapsed: 0, start: Date.now(), done: false };
    intPrev = -a.config[3] - 0.001;
    if (focusDialog.open) $('cue').textContent = '';
    if (a.config[3] > 0) speakCue('Prépare-toi');
  } else if (a.start) { a.elapsed += Date.now() - a.start; a.start = 0; }
  else { a.start = Date.now(); intPrev = undefined; speakCue('Reprise'); }
  persist(); intRefresh();
};
$('intReset').onclick = () => { extra.interval = null; persist(); intRefresh(); };

function intRefresh() {
  const a = extra.interval; let label = '';
  if (a) {
    const c = intClock(a), p = intPhase(c);
    if (a.start) intCues(c);
    if (a.done || p.kind === 'done') { if (!a.done) { a.elapsed += Date.now() - a.start; a.done = true; a.start = 0; persist(); } label = 'Intervalles terminés.'; }
    else label = p.kind === 'prep' ? 'Préparation ' + fmt(p.left)
      : 'Tour ' + (p.round + 1) + ' / ' + c.n + ' · ' + (p.kind === 'work' ? 'Effort ' : 'Repos ') + fmt(p.left);
  }
  $('phase').textContent = label;
  $('intGo').textContent = !a || a.done ? 'Démarrer' : a.start ? 'Pause' : 'Reprendre';
  const locked = !!a && !a.done;
  for (const id of intFields) $(id).disabled = locked;
  document.querySelectorAll('[data-preset]').forEach(b => b.disabled = locked);
}

// Données affichées en plein écran.
function intView() {
  const a = extra.interval;
  if (!a) {
    const [eff, off, n, prep] = intOptions();
    return { label: 'Intervalles · ' + eff + ' s / ' + off + ' s × ' + n, digits: clock2(prep || eff), sub: 'Total ' + fmt((eff + off) * n - off), btn: 'Démarrer', cls: '' };
  }
  const c = intClock(a), p = intPhase(c);
  if (a.done || p.kind === 'done') return { label: 'Terminé', digits: '00:00', sub: c.n + ' tours · ' + fmt(c.total), btn: 'Relancer', cls: 'done' };
  return {
    label: p.kind === 'prep' ? 'Préparation' : 'Tour ' + (p.round + 1) + ' / ' + c.n + ' · ' + (p.kind === 'work' ? 'EFFORT' : 'REPOS'),
    digits: clock2(p.left),
    sub: 'Total restant ' + fmt(Math.ceil(c.total - Math.max(c.t, 0))),
    btn: a.start ? 'Pause' : 'Reprendre',
    cls: p.kind
  };
}
intRefresh(); setInterval(intRefresh, 200);
