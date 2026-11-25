// Séance du jour : semaine type (1 muscu + 3 CrossFit), demande, proposition (coach IA ou modèle), affichage.
const COACH = 'marwin.coach', COACH_PROFILE = 'marwin.coachProfile';
const DEFAULT_PROFILE = { refs: 'Développé couché : 3 × 8 à 70 kg\nSquat : 3 × 8 à 87,5 kg\nTractions : assistées', notes: 'Salle complète (barres, haltères, kettlebells, poulies, rameur, vélo).' };
const coachProfile = () => ({ ...DEFAULT_PROFILE, ...read(COACH_PROFILE, {}) });
let coachReady = null, pick = { type: null, focus: new Set() };

const TYPE_LOG = { crossfit: 'CrossFit', muscu: 'Muscu', hyrox: 'HYROX', prepa: 'Prépa HYROX' };
function kindOf(k) {
  const a = k.slice(13);
  if (/prépa hyrox/i.test(a)) return 'prepa';
  if (/hyrox/i.test(a)) return 'hyrox';
  if (/muscu/i.test(a)) return 'muscu';
  if (/crossfit|séance [a-d]/i.test(a)) return 'crossfit';
  if (/padel/i.test(a)) return 'padel';
  if (/course/i.test(a)) return 'course';
  return 'autre';
}
const KIND_ABBR = { crossfit: 'CF', muscu: 'MU', hyrox: 'HX', prepa: 'PH', padel: 'PA', course: 'CO', autre: '✓' };
function weekDone() {
  const mon = isoDay(mondayOf(new Date())), out = { muscu: 0, crossfit: 0, hyrox: 0, prepa: 0, autres: 0 };
  for (const k of Object.keys(logs())) {
    if (k.slice(0, 10) < mon) continue;
    const t = kindOf(k); if (t in out) out[t]++; else out.autres++;
  }
  return out;
}
function prepaStart() { return settings().prepaStart || ''; }
function prepaIndex() { return Object.keys(logs()).filter(k => kindOf(k) === 'prepa' && k.slice(0, 10) >= prepaStart()).length; }
function renderPrepaInfo() {
  const el = $('prepaInfo'); el.hidden = pick.type !== 'prepa';
  const i = prepaIndex(), done = i >= 36, s = prepaSession(Math.min(i, 35));
  const kinds = ['Course', 'Force + stations', 'Simulation / metcon'];
  el.innerHTML = done ? '<b>Programme terminé (36/36).</b> Recommence-le dans Suivi → Réglages, ou continue avec des HYROX metcon.'
    : `<b>Semaine ${s.prepa.semaine}/12 · phase ${s.prepa.phase}</b><br>Prochaine séance : ${s.prepa.seance}/3 · ${kinds[s.prepa.seance - 1]} (${i} séance${i > 1 ? 's' : ''} faite${i > 1 ? 's' : ''} sur 36)<div class="prog"><i style="width:${i / 36 * 100}%"></i></div>`;
  if ($('prepaState')) $('prepaState').textContent = done ? 'Programme terminé.' : `Semaine ${s.prepa.semaine}/12, séance ${s.prepa.seance}/3 · ${i}/36 séances faites` + (prepaStart() ? ' depuis le ' + prepaStart().split('-').reverse().join('/') : '') + '.';
}
function renderWeek() {
  const mon = mondayOf(new Date()), all = Object.keys(logs()), names = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  let n = 0;
  $('week').innerHTML = names.map((nm, d) => {
    const day = new Date(mon); day.setDate(mon.getDate() + d);
    const iso = isoDay(day), ks = all.filter(k => k.slice(0, 10) === iso); n += ks.length;
    return `<div class="day${ks.length ? ' done' : ''}${iso === isoDay() ? ' today' : ''}"><b>${nm}</b>${ks.map(k => KIND_ABBR[kindOf(k)]).join(' ')}</div>`;
  }).join('');
  $('weekCount').textContent = n + ' séance' + (n > 1 ? 's' : '');
  if (!pick.type) setType(settings().lastType || 'crossfit');
  renderPrepaInfo();
}
function setType(t) {
  pick.type = t; setSetting('lastType', t);
  document.querySelectorAll('.type').forEach(b => b.classList.toggle('on', b.dataset.type === t));
  renderPrepaInfo();
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
  if (type === 'prepa') return prepaSession(Math.min(prepaIndex(), 35));
  if (type === 'hyrox') return TEMPLATES.hyrox[Object.keys(logs()).filter(k => kindOf(k) === 'hyrox').length % TEMPLATES.hyrox.length];
  return TEMPLATES.crossfit[weekDone().crossfit % 3];
}
function planSummary(p) {
  return p.titre + ' — ' + (p.objectif || '') + '\n' + (p.exercices || []).map(x => '- ' + x.nom + ' : ' + x.series + ' × ' + x.reps + ' à ' + x.charge + (x.repos_s ? ', repos ' + x.repos_s + ' s' : '')).join('\n') +
    (p.wod ? '\nWOD ' + p.wod.format + ' ' + (p.wod.duree_min || '') + ' min : ' + p.wod.description + ' ' + p.wod.mouvements.map(m => m.reps + ' ' + m.nom + ' (' + m.charge + ')').join(', ') : '');
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
      const plan = type === 'prepa' ? templateFor('prepa') : null;
      const r = await callScript({ action: 'coach', type, focus: [...pick.focus], ask: $('ask').value.trim(), duration: Number($('dur').value), refs: p.refs, notes: p.notes, week: weekDone(), today: isoDay(), ...(plan ? { prepa: plan.prepa, plan: planSummary(plan) } : {}) });
      if (r.ok && r.seance) { seance = { ...r.seance, type, ...(plan ? { prepa: plan.prepa } : {}) }; source = 'coach'; }
      else note = r.error === 'need_key' ? 'Coach IA sans clé : séance type proposée.' : 'Coach IA indisponible (' + (r.error || 'erreur') + ') : séance type proposée.';
    } else note = cloud() ? 'Coach IA pas encore activé : séance type proposée.' : 'Cloud non connecté : séance type proposée.';
  } catch (err) { note = 'Coach IA injoignable (' + err.message + ') : séance type proposée.'; }
  if (!seance) seance = JSON.parse(JSON.stringify(templateFor(type)));
  if (type === 'prepa' && !prepaStart()) setSetting('prepaStart', isoDay());
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
const ALT_REASONS = ['Machine prise', 'Douleur ou gêne', 'Pas le matériel', 'Trop dur', 'Trop facile'];
const ALT_LOCAL = {
  pectoraux: ['Développé couché haltères', 'Développé incliné haltères', 'Pompes lestées', 'Écarté à la poulie vis-à-vis', 'Chest press machine'],
  dorsaux: ['Tirage vertical prise neutre', 'Tractions assistées', 'Rowing haltère un bras', 'Pull-over à la poulie', 'Rowing machine assis'],
  haut_du_dos: ['Rowing poitrine appuyée haltères', 'Face pull à la poulie', 'Rowing câble assis prise large', 'Oiseau haltères'],
  deltoides_anterieurs: ['Développé militaire haltères assis', 'Développé Arnold', 'Shoulder press machine', 'Landmine press'],
  deltoides_lateraux: ['Élévations latérales à la poulie', 'Élévations latérales haltères', 'Tirage menton prise large à la poulie'],
  deltoides_posterieurs: ['Face pull à la poulie', 'Oiseau haltères', 'Reverse fly machine'],
  biceps: ['Curl haltères incliné', 'Curl marteau', 'Curl poulie basse', 'Curl pupitre machine'],
  triceps: ['Extension triceps poulie corde', 'Barre au front EZ', 'Dips sur banc', 'Extension nuque haltère'],
  quadriceps: ['Presse à cuisses', 'Goblet squat', 'Fentes bulgares haltères', 'Hack squat machine', 'Leg extension'],
  ischios: ['Soulevé de terre roumain haltères', 'Leg curl allongé', 'Hip thrust', 'Good morning barre légère'],
  fessiers: ['Hip thrust', 'Fentes marchées haltères', 'Step-up sur box', 'Kickback poulie'],
  trapezes: ['Shrugs haltères', 'Shrugs à la machine', 'Farmer walk'],
  abdominaux: ['Relevés de genoux suspendu', 'Crunch poulie haute', 'Planche lestée', 'Dead bug'],
  obliques: ['Pallof press', 'Woodchop poulie', 'Planche latérale'],
  lombaires: ['Extension lombaire au banc', 'Bird dog', 'Good morning poids du corps'],
  mollets: ['Mollets debout à la machine', 'Mollets assis', 'Mollets à la presse'],
  adducteurs: ['Machine adducteurs', 'Squat sumo goblet', 'Copenhagen plank'],
  avant_bras: ['Farmer walk', 'Curl poignets haltère', 'Suspension à la barre']
};
function localAlt(x, refused) {
  const pool = ALT_LOCAL[(x.muscles_principaux || [])[0]] || [], bad = new Set([x.nom, ...refused].map(n => n.toLowerCase()));
  const nom = pool.find(n => !bad.has(n.toLowerCase()));
  if (!nom) return null;
  return { ...x, nom, charge: 'à ajuster (2 reps en réserve)', consigne: 'Alternative hors ligne : mêmes séries et répétitions, choisis une charge qui laisse 2 reps en réserve.', recherche_video: nom + ' technique', pourquoi: 'Même groupe musculaire, proposé sans IA.' };
}
function exCard(x, i, done, prevSup, saved) {
  const video = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(x.recherche_video || x.nom + ' technique');
  const note = (saved.notes || {})[i], orig = (saved.orig || {})[i];
  return `<article class="ex${x.superset_avec_suivant || prevSup ? ' superset' : ''}${done ? ' done' : ''}" data-i="${i}">
    <div class="exhead"><span class="num">${i + 1}</span><div><b>${esc(x.nom)}</b>${x.superset_avec_suivant ? '<span class="tag">enchaîné avec le suivant</span>' : ''}
    <div class="dose"><span>${esc(x.series)} × ${esc(x.reps)}</span><span class="load">${esc(x.charge)}</span>${x.repos_s ? '<span>repos ' + mmss(x.repos_s) + '</span>' : ''}</div>
    ${orig ? `<div class="was">Remplace « ${esc(orig.nom)} »${x.pourquoi ? ' : ' + esc(x.pourquoi) : ''} · <a href="#" data-undo="${i}">revenir</a></div>` : ''}</div></div>
    <div class="exbody">${muscleMap(x.muscles_principaux || [], x.muscles_secondaires || [])}<div>${muscleLegend(x.muscles_principaux || [], x.muscles_secondaires || [])}<p class="tipx">${esc(x.consigne || '')}</p></div></div>
    ${note ? `<div class="exnote">✎ ${esc(note)}</div>` : ''}
    <div class="exact">${x.repos_s ? `<button data-rest="${x.repos_s}">⏱ Repos ${mmss(x.repos_s)}</button>` : ''}<a class="demo" href="${video}" target="_blank" rel="noopener">▶ Démo</a>
    <button data-note="${i}">✎ Note</button><button data-alt="${i}">⇄ Alternative</button>
    <label class="check"><input type="checkbox" data-done="${i}"${done ? ' checked' : ''}> Fait</label></div>
    <div class="slot"></div></article>`;
}
function renderSeance() {
  const saved = read(COACH, null);
  if (!saved || !saved.seance) { $('seanceOut').innerHTML = ''; return; }
  const s = saved.seance, done = saved.done || {};
  let h = `<div class="card"><h2 style="margin:0">${esc(s.titre)}</h2><p class="small muted" style="margin:4px 0 0">${esc(s.objectif || '')}${s.duree_min ? ' · ' + s.duree_min + ' min' : ''} · ${saved.source === 'coach' ? 'proposée par Claude' : 'séance type'}${saved.day && saved.day !== isoDay() ? ' · du ' + dayLabel(saved.day).toLowerCase() : ''}</p>`;
  if (s.echauffement) h += `<div class="warm"><b>Échauffement.</b> ${esc(s.echauffement)}</div>`;
  h += '</div>';
  (s.exercices || []).forEach((x, i) => { h += exCard(x, i, done[i], i > 0 && s.exercices[i - 1].superset_avec_suivant, saved); });
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
  h += `<div class="card"><label class="small muted" for="sessNote"><b>Note de séance</b> (ressenti, douleur, matériel…)</label><textarea id="sessNote" rows="2" style="margin-top:6px" placeholder="Ex. épaule gauche raide sur le développé, salle bondée">${esc(saved.note || '')}</textarea></div>`;
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
    const notes = saved.notes || {}, orig = saved.orig || {};
    const lines = (s.exercices || []).map((x, i) => (done[i] ? '✓ ' : '') + x.nom + ' : ' + x.series + ' × ' + x.reps + ' à ' + x.charge + (orig[i] ? ' (au lieu de ' + orig[i].nom + ')' : '') + (notes[i] ? ' — note : ' + notes[i] : ''));
    if (s.wod) lines.push('WOD ' + (WOD_LABEL[(s.wod.format || '').toUpperCase()] || '') + ' : score = ');
    const laps = T.run && T.run.mode === 'chrono' && T.run.laps && T.run.laps.length ? T.run.laps : null;
    if (laps) lines.push('Splits : ' + laps.map((t, i) => (i + 1) + ') ' + mmss(t - (laps[i - 1] || 0))).join(', ') + ' · total ' + mmss(laps[laps.length - 1]));
    if (saved.note) lines.push('Note : ' + saved.note);
    openLog({ type: TYPE_LOG[s.type] || 'CrossFit', text: s.titre + '\n' + lines.join('\n') });
  }
});
function slotOf(i) { return document.querySelector(`.ex[data-i="${i}"] .slot`); }
function updateCoach(fn) { const saved = read(COACH, null); if (!saved) return; fn(saved); write(COACH, saved); }
$('seanceOut').addEventListener('click', async e => {
  const n = e.target.closest('[data-note]'), a = e.target.closest('[data-alt]'), u = e.target.closest('[data-undo]');
  if (n) {
    const i = n.dataset.note, slot = slotOf(i), cur = (read(COACH, {}).notes || {})[i] || '';
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    slot.innerHTML = `<div class="altbox"><textarea rows="2" placeholder="Ex. 3e série à 65 kg, coude qui tire">${esc(cur)}</textarea><div class="row" style="margin-top:6px"><button class="go" data-notesave="${i}">Enregistrer</button>${cur ? `<button class="danger" data-notedel="${i}">Effacer</button>` : ''}</div></div>`;
    slot.querySelector('textarea').focus(); return;
  }
  const ns = e.target.closest('[data-notesave]'), nd = e.target.closest('[data-notedel]');
  if (ns || nd) {
    const i = (ns || nd).dataset[ns ? 'notesave' : 'notedel'], v = ns ? slotOf(i).querySelector('textarea').value.trim().slice(0, 400) : '';
    updateCoach(sv => { sv.notes = { ...(sv.notes || {}) }; if (v) sv.notes[i] = v; else delete sv.notes[i]; });
    renderSeance(); return;
  }
  if (a) {
    const i = a.dataset.alt, slot = slotOf(i);
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    slot.innerHTML = `<div class="altbox"><b class="small">Pourquoi changer ?</b><div class="chips" style="margin-top:6px">${ALT_REASONS.map((r, k) => `<button class="chip${k ? '' : ' on'}" data-reason="${esc(r)}">${esc(r)}</button>`).join('')}</div>
      <textarea rows="1" placeholder="Précision facultative : ex. pas de banc libre"></textarea><button class="go" data-altgo="${i}" style="width:100%;margin-top:8px">Trouver une alternative</button><p class="status small"></p></div>`;
    return;
  }
  const rb = e.target.closest('[data-reason]');
  if (rb) { rb.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === rb)); return; }
  const go = e.target.closest('[data-altgo]');
  if (go) {
    const i = +go.dataset.altgo, slot = slotOf(i), msg = slot.querySelector('.status');
    const saved = read(COACH, null), x = saved.seance.exercices[i];
    const reason = (slot.querySelector('.chip.on') || {}).dataset?.reason || '', ask = slot.querySelector('textarea').value.trim();
    const refused = [...((saved.refused || {})[i] || []), x.nom];
    go.disabled = true; msg.className = 'status small'; msg.textContent = 'Recherche d’une alternative… (5 à 15 s)';
    let alt = null, note = '';
    try {
      if (coachReady === null || coachReady === undefined) await checkCoach();
      if (coachReady) {
        const p = coachProfile();
        const r = await callScript({ action: 'alt', exercise: x, reason, ask, others: saved.seance.exercices.map(e => e.nom), refused, notes: p.notes + '\n' + p.refs });
        if (r.ok && r.exercice) alt = { ...r.exercice, superset_avec_suivant: !!x.superset_avec_suivant }; else note = r.error || 'erreur';
      } else note = 'coach IA non disponible';
    } catch (err) { note = err.message; }
    if (!alt) alt = localAlt(x, refused);
    if (!alt) { msg.className = 'status small warn'; msg.textContent = 'Aucune alternative trouvée (' + note + ').'; go.disabled = false; return; }
    updateCoach(sv => {
      sv.orig = { ...(sv.orig || {}) }; if (!sv.orig[i]) sv.orig[i] = x;
      sv.refused = { ...(sv.refused || {}) }; sv.refused[i] = refused;
      sv.seance.exercices[i] = alt;
      if (sv.done) delete sv.done[i];
    });
    renderSeance();
    const card = document.querySelector(`.ex[data-i="${i}"]`); if (card) { card.classList.add('flash'); card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return;
  }
  if (u) {
    e.preventDefault(); const i = u.dataset.undo;
    updateCoach(sv => { if (sv.orig && sv.orig[i]) { sv.seance.exercices[i] = sv.orig[i]; delete sv.orig[i]; if (sv.refused) delete sv.refused[i]; } });
    renderSeance();
  }
});
$('seanceOut').addEventListener('input', e => { if (e.target.id === 'sessNote') updateCoach(sv => { sv.note = e.target.value.slice(0, 600); }); });
$('seanceOut').addEventListener('change', e => {
  const i = e.target.dataset.done; if (i === undefined) return;
  const saved = read(COACH, null); saved.done = { ...(saved.done || {}), [i]: e.target.checked }; write(COACH, saved);
  e.target.closest('.ex').classList.toggle('done', e.target.checked);
});
tabHooks.seance = () => { renderWeek(); };
syncHooks.journal.push(renderWeek);
renderSeance();
