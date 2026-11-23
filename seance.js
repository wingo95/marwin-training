// Séance du jour : semaine type (1 muscu + 3 CrossFit), demande, proposition (coach IA ou modèle), affichage.
const COACH = 'marwin.coach', COACH_PROFILE = 'marwin.coachProfile';
const DEFAULT_PROFILE = { refs: 'Développé couché : 3 × 8 à 70 kg\nSquat : 3 × 8 à 87,5 kg\nTractions : assistées', notes: 'Salle complète (barres, haltères, kettlebells, poulies, rameur, vélo).' };
const coachProfile = () => ({ ...DEFAULT_PROFILE, ...read(COACH_PROFILE, {}) });
let coachReady = null, pick = { type: null, focus: new Set() };

function weekDone() {
  const mon = isoDay(mondayOf(new Date())), out = { muscu: 0, crossfit: 0, autres: 0 };
  for (const k of Object.keys(logs())) {
    if (k.slice(0, 10) < mon) continue;
    if (/muscu/i.test(k)) out.muscu++; else if (/crossfit|séance [a-d]/i.test(k)) out.crossfit++; else out.autres++;
  }
  return out;
}
function renderWeek() {
  const w = weekDone(), slots = [['Muscu', w.muscu >= 1], ['CrossFit 1', w.crossfit >= 1], ['CrossFit 2', w.crossfit >= 2], ['CrossFit 3', w.crossfit >= 3]];
  $('week').innerHTML = slots.map(([l, d]) => `<div class="slot${d ? ' done' : ''}">${d ? '✓ ' : ''}${l}</div>`).join('');
  $('weekCount').textContent = Math.min(w.muscu, 1) + Math.min(w.crossfit, 3) + ' / 4' + (w.autres ? ' · ' + w.autres + ' autre' + (w.autres > 1 ? 's' : '') : '');
  if (!pick.type) setType(w.crossfit < 3 ? 'crossfit' : 'muscu');
}
function setType(t) {
  pick.type = t;
  document.querySelectorAll('.type').forEach(b => b.classList.toggle('on', b.dataset.type === t));
}
document.querySelectorAll('.type').forEach(b => b.onclick = () => setType(b.dataset.type));
$('focus').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  pick.focus.has(b.dataset.f) ? pick.focus.delete(b.dataset.f) : pick.focus.add(b.dataset.f);
  b.classList.toggle('on');
});

async function checkCoach() {
  if (!cloud()) { coachReady = false; return false; }
  try { const r = await callScript({ action: 'coachStatus' }); coachReady = !!(r.ok && r.hasKey === true); }
  catch { coachReady = null; }
  return coachReady;
}
function templateFor(type) {
  if (type === 'muscu') return TEMPLATES.muscu;
  return TEMPLATES.crossfit[weekDone().crossfit % 3];
}
$('propose').onclick = async () => {
  const type = pick.type || 'crossfit', btn = $('propose');
  btn.disabled = true; $('seanceMsg').className = 'status'; $('seanceMsg').textContent = 'Préparation de ta séance…';
  let seance = null, source = 'modele', note = '';
  try {
    if (coachReady === null || coachReady === undefined) await checkCoach();
    if (coachReady) {
      $('seanceMsg').textContent = 'Claude prépare ta séance… (20 à 40 s)';
      const p = coachProfile();
      const r = await callScript({ action: 'coach', type, focus: [...pick.focus], ask: $('ask').value.trim(), duration: Number($('dur').value), refs: p.refs, notes: p.notes, week: weekDone(), today: isoDay() });
      if (r.ok && r.seance) { seance = { ...r.seance, type }; source = 'coach'; }
      else note = r.error === 'need_key' ? 'Coach IA sans clé : séance type proposée.' : 'Coach IA indisponible (' + (r.error || 'erreur') + ') : séance type proposée.';
    } else note = cloud() ? 'Coach IA pas encore activé : séance type proposée.' : 'Cloud non connecté : séance type proposée.';
  } catch (err) { note = 'Coach IA injoignable (' + err.message + ') : séance type proposée.'; }
  if (!seance) seance = JSON.parse(JSON.stringify(templateFor(type)));
  write(COACH, { seance, source, created: Date.now(), day: isoDay(), done: {} });
  renderSeance();
  $('seanceMsg').className = 'status ' + (source === 'coach' ? 'ok' : 'warn');
  $('seanceMsg').textContent = source === 'coach' ? 'Séance prête. Elle reste disponible hors connexion.' : note;
  btn.disabled = false;
  $('seanceOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const WOD_LABEL = { AMRAP: 'AMRAP', EMOM: 'EMOM', FOR_TIME: 'For time', TABATA: 'Tabata', INTERVALLES: 'Intervalles' };
function wodTimer(w) {
  const f = (w.format || '').toUpperCase();
  if (f === 'AMRAP') return ['minuteur', { min: Number(w.duree_min) || 12 }];
  if (f === 'EMOM') return ['emom', { every: Number(w.travail_s) || 60, rounds: Number(w.tours) || Number(w.duree_min) || 10 }];
  if (f === 'TABATA' || f === 'INTERVALLES') return ['tabata', { work: Number(w.travail_s) || 20, rest: Number(w.repos_s) || 10, rounds: Number(w.tours) || 8 }];
  return ['chrono', { cap: Number(w.cap_min) || Number(w.duree_min) || 0 }];
}
function exCard(x, i, done, prevSup) {
  const video = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(x.recherche_video || x.nom + ' technique');
  return `<article class="ex${x.superset_avec_suivant || prevSup ? ' superset' : ''}${done ? ' done' : ''}">
    <div class="exhead"><span class="num">${i + 1}</span><div><b>${esc(x.nom)}</b>${x.superset_avec_suivant ? '<span class="tag">enchaîné avec le suivant</span>' : ''}
    <div class="dose"><span>${esc(x.series)} × ${esc(x.reps)}</span><span class="load">${esc(x.charge)}</span>${x.repos_s ? '<span>repos ' + mmss(x.repos_s) + '</span>' : ''}</div></div></div>
    <div class="exbody">${muscleMap(x.muscles_principaux || [], x.muscles_secondaires || [])}<div>${muscleLegend(x.muscles_principaux || [], x.muscles_secondaires || [])}<p class="tipx">${esc(x.consigne || '')}</p></div></div>
    <div class="exact">${x.repos_s ? `<button data-rest="${x.repos_s}">⏱ Repos ${mmss(x.repos_s)}</button>` : ''}<a class="demo" href="${video}" target="_blank" rel="noopener">▶ Démo</a>
    <label class="check"><input type="checkbox" data-done="${i}"${done ? ' checked' : ''}> Fait</label></div></article>`;
}
function renderSeance() {
  const saved = read(COACH, null);
  if (!saved || !saved.seance) { $('seanceOut').innerHTML = ''; return; }
  const s = saved.seance, done = saved.done || {};
  let h = `<div class="card"><h2 style="margin:0">${esc(s.titre)}</h2><p class="small muted" style="margin:4px 0 0">${esc(s.objectif || '')}${s.duree_min ? ' · ' + s.duree_min + ' min' : ''} · ${saved.source === 'coach' ? 'proposée par Claude' : 'séance type'}${saved.day && saved.day !== isoDay() ? ' · du ' + dayLabel(saved.day).toLowerCase() : ''}</p>`;
  if (s.echauffement) h += `<div class="warm"><b>Échauffement.</b> ${esc(s.echauffement)}</div>`;
  h += '</div>';
  (s.exercices || []).forEach((x, i) => { h += exCard(x, i, done[i], i > 0 && s.exercices[i - 1].superset_avec_suivant); });
  if (s.wod && s.wod.mouvements && s.wod.mouvements.length) {
    const [m, c] = wodTimer(s.wod), w = s.wod;
    const lab = (WOD_LABEL[(w.format || '').toUpperCase()] || w.format || 'WOD') + (w.duree_min ? ' ' + w.duree_min + ' min' : '');
    h += `<div class="wod"><h3>WOD · ${esc(lab)}</h3><p class="small" style="margin:0 0 6px;color:#cfe0d6">${esc(w.description || '')}</p><ul style="padding-left:18px;margin:6px 0">` +
      w.mouvements.map(mv => `<li><b>${esc(mv.reps)}</b> ${esc(mv.nom)} — <span style="color:var(--lime)">${esc(mv.charge || '')}</span> <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(mv.recherche_video || mv.nom)}" target="_blank" rel="noopener" style="color:#fff">▶</a></li>`).join('') +
      `</ul><div style="background:#fff;border-radius:12px;padding:8px;margin-top:8px">${muscleMap([...new Set(w.mouvements.flatMap(x => x.muscles_principaux || []))], [...new Set(w.mouvements.flatMap(x => x.muscles_secondaires || []))])}</div>
      <button class="go" data-wod='${esc(JSON.stringify([m, c]))}'>⏱ Lancer le chrono ${esc(MODE_NAMES[m])}</button></div>`;
  }
  if (s.retour_au_calme) h += `<div class="warm"><b>Retour au calme.</b> ${esc(s.retour_au_calme)}</div>`;
  if (s.conseils) h += `<p class="small muted">${esc(s.conseils)}</p>`;
  h += '<button class="dark" id="finish" style="width:100%;padding:14px;margin-top:6px">Séance terminée → noter</button>';
  $('seanceOut').innerHTML = h;
}
$('seanceOut').addEventListener('click', e => {
  const r = e.target.closest('[data-rest]');
  if (r) { unlockAudio(); startRest(Number(r.dataset.rest)); return; }
  const w = e.target.closest('[data-wod]');
  if (w) { const [m, c] = JSON.parse(w.dataset.wod); timerReset(); T.mode = m; T.cfg[m] = { ...T.cfg[m], ...c }; saveT(); goTab('chrono'); return; }
  if (e.target.id === 'finish') {
    const saved = read(COACH, null), s = saved.seance, done = saved.done || {};
    const lines = (s.exercices || []).map((x, i) => (done[i] ? '✓ ' : '') + x.nom + ' : ' + x.series + ' × ' + x.reps + ' à ' + x.charge);
    if (s.wod) lines.push('WOD ' + (WOD_LABEL[(s.wod.format || '').toUpperCase()] || '') + ' : score = ');
    openLog({ type: s.type === 'muscu' ? 'Muscu' : 'CrossFit', text: s.titre + '\n' + lines.join('\n') });
  }
});
$('seanceOut').addEventListener('change', e => {
  const i = e.target.dataset.done; if (i === undefined) return;
  const saved = read(COACH, null); saved.done = { ...(saved.done || {}), [i]: e.target.checked }; write(COACH, saved);
  e.target.closest('.ex').classList.toggle('done', e.target.checked);
});
tabHooks.seance = () => { renderWeek(); };
syncHooks.journal.push(renderWeek);
renderSeance();
