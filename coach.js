// Coach IA : séance du jour générée par Claude via ton script Google (la clé API reste dans le script).
const COACH = 'marwin.coach', COACH_PROFILE = 'marwin.coachProfile';
const DEFAULT_PROFILE = {
  refs: 'Développé couché : 3 × 8 à 70 kg\nSquat : 3 × 8 à 87,5 kg\nTractions : assistées\nPoids de corps : ? kg',
  notes: 'Prépa CrossFit + padel (plusieurs matchs par semaine). Cheville à ménager : pas de sauts ni d’appuis instables si elle gêne. Salle complète (barres, haltères, poulies, machines).'
};
// Séance du 23/11/2026 préparée dans la conversation, affichée tant qu'aucune séance n'a été générée.
const COACH_SAMPLE = {
  titre: 'Prise de masse · pecs, dos, biceps, triceps', objectif: 'Hypertrophie, 1-2 reps en réserve', duree_min: 70,
  echauffement: '5 min de vélo, rotations d’épaules, puis couché : barre vide × 10, 40 kg × 5, 55 kg × 3.',
  exercices: [
    { nom: 'Développé couché barre', series: 4, reps: '6-8', charge: '70 kg (72,5 kg si facile)', repos_s: 150, consigne: 'Omoplates serrées, pieds ancrés, barre au bas des pecs, coudes à ~45°.', muscles_principaux: ['pectoraux'], muscles_secondaires: ['triceps', 'deltoides_anterieurs'], recherche_video: 'développé couché technique' },
    { nom: 'Rowing barre', series: 4, reps: '8-10', charge: '55 kg', repos_s: 120, consigne: 'Buste penché à ~45°, dos neutre, tire la barre vers le nombril sans élan.', muscles_principaux: ['dorsaux', 'haut_du_dos'], muscles_secondaires: ['biceps', 'deltoides_posterieurs', 'lombaires'], recherche_video: 'rowing barre technique' },
    { nom: 'Développé incliné haltères', series: 3, reps: '8-12', charge: '22 kg par haltère', repos_s: 90, consigne: 'Banc à 30°, descends les haltères au niveau du haut des pecs, remonte en arc.', muscles_principaux: ['pectoraux'], muscles_secondaires: ['deltoides_anterieurs', 'triceps'], recherche_video: 'développé incliné haltères technique' },
    { nom: 'Tractions (assistées si besoin)', series: 3, reps: '8-12', charge: 'assistance pour 10 reps propres', repos_s: 90, consigne: 'Pars bras tendus, tire les coudes vers les côtes, menton au-dessus de la barre.', muscles_principaux: ['dorsaux'], muscles_secondaires: ['biceps', 'haut_du_dos', 'avant_bras'], recherche_video: 'traction assistée machine technique' },
    { nom: 'Écarté à la poulie', series: 3, reps: '12-15', charge: '10 kg par côté', repos_s: 60, consigne: 'Coudes légèrement fléchis et fixes, ramène les mains devant la poitrine, contrôle le retour.', muscles_principaux: ['pectoraux'], muscles_secondaires: ['deltoides_anterieurs'], recherche_video: 'écarté poulie vis à vis technique' },
    { nom: 'Curl barre EZ', series: 3, reps: '10-12', charge: '30 kg (barre comprise)', repos_s: 0, superset_avec_suivant: true, consigne: 'Coudes collés au corps, monte sans balancer le buste, descente en 2 s.', muscles_principaux: ['biceps'], muscles_secondaires: ['avant_bras'], recherche_video: 'curl barre ez technique' },
    { nom: 'Extension triceps à la poulie', series: 3, reps: '10-12', charge: '25 kg', repos_s: 75, consigne: 'Coudes fixes le long du corps, verrouille en bas, remonte jusqu’à 90°.', muscles_principaux: ['triceps'], muscles_secondaires: [], recherche_video: 'extension triceps poulie haute technique' },
    { nom: 'Curl marteau', series: 2, reps: '12-15', charge: '12 kg par haltère', repos_s: 0, superset_avec_suivant: true, consigne: 'Pouces vers le haut, coudes fixes, monte jusqu’à l’épaule.', muscles_principaux: ['biceps', 'avant_bras'], muscles_secondaires: [], recherche_video: 'curl marteau technique' },
    { nom: 'Extension corde au-dessus de la tête', series: 2, reps: '12-15', charge: '15 kg', repos_s: 60, consigne: 'Dos à la poulie, coudes près de la tête, étire bien en bas avant de pousser.', muscles_principaux: ['triceps'], muscles_secondaires: [], recherche_video: 'extension triceps corde au dessus de la tête' }
  ],
  retour_au_calme: '3 min de marche puis étirements pecs (contre un montant) et dorsaux (suspendu).',
  conseils: 'Si tu dépasses le haut de la fourchette avec plus de 2 reps en réserve : +2,5 kg. Sous le bas de la fourchette : −2,5 kg.'
};

const coachProfile = () => ({ ...DEFAULT_PROFILE, ...read(COACH_PROFILE, {}) });
let coachRest = null; // { idx, end }
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

function coachCall(payload) {
  const c = cloud();
  if (!c) return Promise.reject(new Error('Connecte d’abord le cloud (Journal → Cloud, sauvegarde et transfert).'));
  return fetch(c.url, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json());
}
async function coachStatus() {
  const el = $('coachState');
  if (!cloud()) { el.textContent = 'Connecte d’abord le cloud dans Journal → « Cloud, sauvegarde et transfert ».'; el.className = 'cloud warn'; return; }
  try {
    const r = await coachCall({ action: 'coachStatus' });
    if (r.ok && r.hasKey === undefined) { el.textContent = 'Coach en cours d’activation : le script Google doit être mis à jour.'; el.className = 'cloud warn'; return; }
    const ready = r.ok && r.hasKey;
    el.textContent = ready ? '✓ Coach prêt (Claude)' : 'Clé API Anthropic manquante : ajoute-la dans « Réglages du coach » ci-dessous.';
    el.className = 'cloud ' + (ready ? 'ok' : 'warn');
    $('coachKeyBox').hidden = ready && !$('coachKeyBox').dataset.force;
  } catch { el.textContent = 'Coach injoignable (pas de réseau ?). La dernière séance reste disponible.'; el.className = 'cloud warn'; }
}

function renderSeance(s, meta) {
  if (!s || !Array.isArray(s.exercices)) { $('coachOut').replaceChildren(); return; }
  const done = meta && meta.done || {};
  let html = `<div class="seance-head"><h3>${esc(s.titre)}</h3><p class="meta">${esc(s.objectif || '')}${s.duree_min ? ' · ' + s.duree_min + ' min' : ''}${meta && meta.sample ? ' · préparée par Claude' : ''}</p></div>`;
  if (s.echauffement) html += `<p class="warm"><b>Échauffement.</b> ${esc(s.echauffement)}</p>`;
  s.exercices.forEach((x, i) => {
    const prev = s.exercices[i - 1], inSuper = x.superset_avec_suivant || (prev && prev.superset_avec_suivant);
    const video = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(x.recherche_video || (x.nom + ' technique'));
    html += `<article class="ex${inSuper ? ' superset' : ''}${done[i] ? ' done' : ''}" data-i="${i}">
      <div class="exhead"><span class="num">${i + 1}</span><div><b>${esc(x.nom)}</b>${x.superset_avec_suivant ? '<span class="tag">enchaîné avec le suivant</span>' : ''}
      <div class="dose"><span>${esc(x.series)} × ${esc(x.reps)}</span><span class="load">${esc(x.charge)}</span>${x.repos_s ? '<span>repos ' + mmss(x.repos_s) + '</span>' : ''}</div></div></div>
      <div class="exbody">${muscleMap(x.muscles_principaux, x.muscles_secondaires || [])}<div>${muscleLegend(x.muscles_principaux || [], x.muscles_secondaires || [])}<p class="tipx">${esc(x.consigne || '')}</p></div></div>
      <div class="exact">${x.repos_s ? `<button type="button" class="restbtn" data-rest="${x.repos_s}" data-i="${i}">Repos ${mmss(x.repos_s)}</button>` : ''}
      <a class="demo" href="${video}" target="_blank" rel="noopener">▶ Démo vidéo</a>
      <label class="check"><input type="checkbox" data-done="${i}"${done[i] ? ' checked' : ''}> Fait</label></div></article>`;
  });
  if (s.retour_au_calme) html += `<p class="warm"><b>Retour au calme.</b> ${esc(s.retour_au_calme)}</p>`;
  if (s.conseils) html += `<p class="tip">${esc(s.conseils)}</p>`;
  html += '<button type="button" class="go" id="coachLog">Enregistrer cette séance dans le journal</button>';
  $('coachOut').innerHTML = html;
}
function coachSaved() { return read(COACH, null); }
function showSaved() {
  const saved = coachSaved();
  renderSeance(saved ? saved.seance : COACH_SAMPLE, saved || { sample: true, done: read('marwin.coachSampleDone', {}) });
}

$('coachOut').addEventListener('click', e => {
  const rb = e.target.closest('.restbtn');
  if (rb) {
    unlock(); if (typeof unlockSpeech === 'function') unlockSpeech();
    const i = Number(rb.dataset.i), sec = Number(rb.dataset.rest);
    if (coachRest && coachRest.idx === i) { coachRest = null; extra.end = 0; }
    else { coachRest = { idx: i }; extra.restSec = sec; extra.end = Date.now() + sec * 1000; }
    persist(); coachTick();
    return;
  }
  if (e.target.id === 'coachLog') coachLog();
});
$('coachOut').addEventListener('change', e => {
  const i = e.target.dataset.done;
  if (i === undefined) return;
  const saved = coachSaved();
  if (saved) { saved.done = { ...(saved.done || {}), [i]: e.target.checked }; write(COACH, saved); }
  else write('marwin.coachSampleDone', { ...read('marwin.coachSampleDone', {}), [i]: e.target.checked });
  e.target.closest('.ex').classList.toggle('done', e.target.checked);
});
function coachTick() {
  const left = extra.end ? Math.ceil((extra.end - Date.now()) / 1000) : 0;
  if (coachRest && left <= 0) coachRest = null;
  document.querySelectorAll('.restbtn').forEach(b => {
    const active = coachRest && coachRest.idx === Number(b.dataset.i);
    b.classList.toggle('running', !!active);
    b.textContent = active ? 'Repos ' + mmss(Math.max(left, 0)) + ' · Arrêter' : 'Repos ' + mmss(Number(b.dataset.rest));
  });
}
setInterval(coachTick, 250);

function coachLog() {
  const saved = coachSaved(), s = saved ? saved.seance : COACH_SAMPLE, done = saved ? saved.done || {} : read('marwin.coachSampleDone', {});
  const lines = s.exercices.map((x, i) => (done[i] ? '✓ ' : '') + x.nom + ' : ' + x.series + ' × ' + x.reps + ' à ' + x.charge);
  const name = 'Muscu (coach)';
  if (![...$('activity').options].some(o => o.value === name)) $('activity').add(new Option(name));
  const d = new Date();
  $('day').value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  $('activity').value = name; loadEntry();
  if (!$('result').value) $('result').value = s.titre + '\n' + lines.join('\n');
  $('logForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('feedback').textContent = 'Corrige les charges réellement faites, choisis la difficulté, puis Enregistrer.';
}

document.querySelectorAll('[data-ask]').forEach(b => b.onclick = () => { $('coachAsk').value = b.dataset.ask; $('coachAsk').focus(); });
$('coachGo').onclick = async () => {
  const ask = $('coachAsk').value.trim();
  if (!ask) { $('coachMsg').textContent = 'Dis au coach ce que tu veux travailler aujourd’hui.'; return; }
  const btn = $('coachGo'); btn.disabled = true;
  $('coachMsg').textContent = 'Claude prépare ta séance… (20 à 40 s)';
  try {
    const p = coachProfile();
    const r = await coachCall({ action: 'coach', ask, duration: Number($('coachDur').value), refs: p.refs, notes: p.notes, today: new Date().toISOString().slice(0, 10) });
    if (!r.ok) throw new Error(r.error === 'need_key' ? 'Clé API manquante : ajoute-la dans « Réglages du coach ».' : r.error || 'réponse invalide');
    write(COACH, { seance: r.seance, ask, created: Date.now(), done: {} });
    showSaved();
    $('coachMsg').textContent = 'Séance prête. Elle reste disponible hors connexion.';
    $('coachOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) { $('coachMsg').textContent = 'Échec : ' + err.message; }
  finally { btn.disabled = false; }
};

// Réglages : profil + clé API (envoyée une seule fois au script Google, jamais stockée sur le téléphone).
(function initProfile() {
  const p = coachProfile();
  $('coachRefs').value = p.refs; $('coachNotes').value = p.notes;
  const save = () => write(COACH_PROFILE, { refs: $('coachRefs').value, notes: $('coachNotes').value });
  $('coachRefs').onchange = save; $('coachNotes').onchange = save;
})();
$('coachKeyShow').onclick = () => { $('coachKeyBox').dataset.force = '1'; $('coachKeyBox').hidden = false; };
$('coachKeySave').onclick = async () => {
  const key = $('coachKey').value.trim();
  if (!/^sk-ant-[\w-]{20,}$/.test(key)) { $('coachKeyMsg').textContent = 'Clé invalide : elle commence par « sk-ant- ».'; return; }
  $('coachKeyMsg').textContent = 'Envoi au script…';
  try {
    const r = await coachCall({ action: 'setKey', key });
    if (!r.ok || r.hasKey !== true) throw new Error(r.error || 'script Google pas encore mis à jour pour le coach');
    $('coachKey').value = ''; delete $('coachKeyBox').dataset.force;
    $('coachKeyMsg').textContent = 'Clé enregistrée dans ton script Google.';
    coachStatus();
  } catch (err) { $('coachKeyMsg').textContent = 'Échec : ' + err.message; }
};

showSaved(); coachStatus();
$('coachReset').onclick = () => { localStorage.removeItem(COACH); showSaved(); };
