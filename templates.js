// Séances intégrées, utilisées quand le coach IA n’est pas disponible.
// Semaine type : 3 CrossFit full body (A, B, C) + 1 muscu sans cardio.
const ex = (nom, series, reps, charge, repos_s, mp, ms, consigne, video, sup) => ({ nom, series, reps, charge, repos_s, muscles_principaux: mp, muscles_secondaires: ms, consigne, recherche_video: video, ...(sup ? { superset_avec_suivant: true } : {}) });
const mv = (nom, reps, charge, mp, ms, video) => ({ nom, reps, charge, muscles_principaux: mp, muscles_secondaires: ms, recherche_video: video });
const TEMPLATES = {
  muscu: {
    type: 'muscu', titre: 'Muscu · pecs, dos, épaules, bras', objectif: 'Hypertrophie, 2 reps en réserve, sans cardio', duree_min: 70,
    echauffement: '5 min de vélo facile, rotations d’épaules à l’élastique, puis couché : barre vide × 10, 40 kg × 5, 55 kg × 3.',
    exercices: [
      ex('Développé couché barre', 4, '6-8', '70 kg', 150, ['pectoraux'], ['triceps', 'deltoides_anterieurs'], 'Omoplates serrées, pieds ancrés, barre au bas des pecs, coudes à ~45°.', 'développé couché technique'),
      ex('Rowing T-bar', 4, '8-10', '30 kg de disques', 120, ['dorsaux', 'haut_du_dos'], ['biceps', 'deltoides_posterieurs', 'lombaires'], 'Buste à 45°, dos plat, tire les coudes vers l’arrière, descente en 2 s.', 'rowing t bar technique'),
      ex('Développé incliné haltères', 3, '8-12', '22 kg par haltère', 90, ['pectoraux'], ['deltoides_anterieurs', 'triceps'], 'Banc à 30°, haltères au niveau du haut des pecs, remonte en arc.', 'développé incliné haltères technique'),
      ex('Tractions assistées', 3, '8-12', 'assistance pour 10 reps propres', 90, ['dorsaux'], ['biceps', 'haut_du_dos', 'avant_bras'], 'Bras tendus en bas, coudes vers les côtes, menton au-dessus de la barre.', 'traction assistée machine technique'),
      ex('Élévations latérales haltères', 3, '12-15', '10 kg par haltère', 60, ['deltoides_lateraux'], ['trapezes'], 'Coudes légèrement fléchis, monte jusqu’à l’horizontale sans hausser les épaules.', 'élévations latérales technique'),
      ex('Curl barre EZ', 3, '10-12', '30 kg (barre comprise)', 0, ['biceps'], ['avant_bras'], 'Coudes collés, pas d’élan, descente en 2 s.', 'curl barre ez technique', true),
      ex('Extension triceps à la poulie', 3, '10-12', '25 kg', 75, ['triceps'], [], 'Coudes fixes le long du corps, verrouille en bas.', 'extension triceps poulie haute technique')
    ],
    wod: null,
    retour_au_calme: '3 min de marche, étirements pecs contre un montant et dorsaux suspendu.',
    conseils: 'Haut de fourchette atteint avec plus de 2 reps en réserve : +2,5 kg la prochaine fois. Sous le bas de fourchette : −2,5 kg.'
  },
  crossfit: [
    {
      type: 'crossfit', titre: 'CrossFit A · squat + AMRAP 12', objectif: 'Force puis conditionnement, full body', duree_min: 60,
      echauffement: '5 min de rameur facile, mobilité hanches et épaules, squat barre vide × 10, 50 kg × 5, 70 kg × 3.',
      exercices: [
        ex('Back squat', 5, '5', '85 kg', 120, ['quadriceps', 'fessiers'], ['ischios', 'lombaires', 'abdominaux'], 'Pieds largeur d’épaules, gainage avant de descendre, genoux dans l’axe des pieds.', 'back squat technique'),
        ex('Développé militaire haltères', 4, '8', '18 kg par haltère', 90, ['deltoides_anterieurs', 'deltoides_lateraux'], ['triceps', 'trapezes'], 'Debout, abdos serrés, pousse au-dessus de la tête sans cambrer.', 'développé militaire haltères debout technique'),
        ex('Rowing haltère un bras', 3, '10 par bras', '28 kg', 60, ['dorsaux', 'haut_du_dos'], ['biceps', 'deltoides_posterieurs'], 'Main et genou sur le banc, tire l’haltère vers la hanche.', 'rowing haltère un bras technique')
      ],
      wod: { format: 'AMRAP', duree_min: 12, description: 'Le plus de tours possible en 12 min.', mouvements: [
        mv('Kettlebell swings', '12', '24 kg', ['fessiers', 'ischios'], ['lombaires', 'deltoides_anterieurs'], 'kettlebell swing technique'),
        mv('Pompes', '10', 'poids du corps', ['pectoraux'], ['triceps', 'deltoides_anterieurs'], 'pompe technique'),
        mv('Step-ups sur box (sans saut)', '12', '2 × 12 kg', ['quadriceps', 'fessiers'], ['mollets'], 'step up box haltères technique'),
        mv('Rameur', '200 m', 'allure soutenue', ['dorsaux', 'quadriceps'], ['biceps', 'fessiers'], 'rameur technique crossfit')] },
      retour_au_calme: '3 min de marche, étirements quadriceps et fessiers.',
      conseils: 'Note ton nombre de tours : vise +1 tour la prochaine fois.'
    },
    {
      type: 'crossfit', titre: 'CrossFit B · couché + EMOM 12', objectif: 'Force du haut du corps puis EMOM', duree_min: 60,
      echauffement: '5 min de vélo, rotations d’épaules, couché : barre vide × 10, 40 kg × 5, 55 kg × 3.',
      exercices: [
        ex('Développé couché barre', 5, '5', '72,5 kg', 120, ['pectoraux'], ['triceps', 'deltoides_anterieurs'], 'Omoplates serrées, barre au bas des pecs, pousse explosif.', 'développé couché technique'),
        ex('Soulevé de terre roumain', 4, '8', '70 kg', 90, ['ischios', 'fessiers'], ['lombaires', 'avant_bras'], 'Genoux légèrement fléchis, hanches vers l’arrière, dos plat, barre contre les cuisses.', 'soulevé de terre roumain technique'),
        ex('Tractions assistées', 4, '6-8', 'assistance pour 8 reps propres', 90, ['dorsaux'], ['biceps', 'haut_du_dos'], 'Pas d’élan, poitrine vers la barre.', 'traction assistée technique')
      ],
      wod: { format: 'EMOM', duree_min: 12, tours: 12, travail_s: 60, description: 'Chaque minute, une station, en boucle (4 tours de 3 stations).', mouvements: [
        mv('Minute 1 · rameur', '12 cal', 'allure forte', ['dorsaux', 'quadriceps'], ['biceps'], 'rameur technique crossfit'),
        mv('Minute 2 · thrusters haltères', '10', '2 × 12,5 kg', ['quadriceps', 'deltoides_anterieurs'], ['fessiers', 'triceps'], 'thruster haltères technique'),
        mv('Minute 3 · relevés de genoux suspendu', '12', 'poids du corps', ['abdominaux'], ['avant_bras', 'obliques'], 'relevé de genoux suspendu technique')] },
      retour_au_calme: '3 min de marche, étirements pecs et ischios.',
      conseils: 'Si tu ne finis pas une station en 40 s, baisse les reps de 2.'
    },
    {
      type: 'crossfit', titre: 'CrossFit C · soulevé de terre + For time', objectif: 'Chaîne postérieure puis 21-15-9', duree_min: 60,
      echauffement: '5 min de vélo, good mornings à vide × 10, soulevé de terre 60 kg × 5, 80 kg × 3.',
      exercices: [
        ex('Soulevé de terre', 5, '3', '100 kg (à ajuster : 3 reps en réserve)', 150, ['ischios', 'fessiers', 'lombaires'], ['dorsaux', 'trapezes', 'avant_bras'], 'Barre contre les tibias, dos plat, pousse le sol avec les jambes.', 'soulevé de terre technique'),
        ex('Développé incliné haltères', 4, '8', '22 kg par haltère', 90, ['pectoraux'], ['deltoides_anterieurs', 'triceps'], 'Banc à 30°, contrôle la descente.', 'développé incliné haltères technique'),
        ex('Face pull à la poulie', 3, '15', '15 kg', 60, ['deltoides_posterieurs', 'haut_du_dos'], ['trapezes'], 'Corde vers le front, coudes hauts, serre les omoplates.', 'face pull technique')
      ],
      wod: { format: 'FOR_TIME', duree_min: 15, cap_min: 15, description: '21-15-9 répétitions de chaque mouvement, le plus vite possible (cap 15 min).', mouvements: [
        mv('Snatch haltère alterné', '21-15-9', '20 kg', ['fessiers', 'deltoides_anterieurs'], ['ischios', 'trapezes'], 'dumbbell snatch technique'),
        mv('Burpees sans saut', '21-15-9', 'poids du corps', ['pectoraux', 'quadriceps'], ['triceps', 'abdominaux'], 'burpee sans saut'),
        mv('Vélo', '21-15-9 cal', 'à fond', ['quadriceps'], ['fessiers', 'mollets'], 'assault bike technique')] },
      retour_au_calme: '3 min de marche, étirements dos et hanches.',
      conseils: 'Note ton temps : c’est ta référence pour la prochaine fois.'
    }
  ]
};

// ---------- HYROX (standards Open homme) ----------
const HX = {
  run: ['quadriceps', 'mollets'], runS: ['ischios', 'fessiers'],
  ski: ['dorsaux', 'triceps'], skiS: ['abdominaux', 'deltoides_posterieurs'],
  push: ['quadriceps', 'fessiers'], pushS: ['mollets', 'deltoides_anterieurs', 'triceps'],
  pull: ['dorsaux', 'haut_du_dos'], pullS: ['biceps', 'ischios', 'avant_bras'],
  bbj: ['quadriceps', 'fessiers'], bbjS: ['pectoraux', 'abdominaux', 'mollets'],
  row: ['dorsaux', 'quadriceps'], rowS: ['biceps', 'fessiers'],
  farm: ['avant_bras', 'trapezes'], farmS: ['abdominaux', 'fessiers'],
  lunge: ['quadriceps', 'fessiers'], lungeS: ['ischios', 'abdominaux'],
  wb: ['quadriceps', 'deltoides_anterieurs'], wbS: ['fessiers', 'triceps']
};
const hmv = (nom, reps, charge, k, video) => mv(nom, reps, charge, HX[k], HX[k + 'S'], video || ('hyrox ' + nom + ' technique'));
const STATIONS = [
  ['SkiErg', '1000 m', 'damper 5-6', 'ski'], ['Sled push', '4 × 12,5 m', '152 kg traîneau compris', 'push'], ['Sled pull', '4 × 12,5 m', '103 kg traîneau compris', 'pull'],
  ['Burpee broad jumps', '80 m', 'poids du corps (sans saut si la cheville gêne : burpees + fentes)', 'bbj'], ['Rameur', '1000 m', 'damper 5-6', 'row'],
  ['Farmers carry', '200 m', '2 × 24 kg', 'farm'], ['Sandbag lunges', '100 m', '20 kg', 'lunge'], ['Wall balls', '100', '6 kg, cible 2,74 m', 'wb']
];
const runMv = (dist, allure) => hmv('Course', dist, allure || 'allure course HYROX', 'run', 'course à pied technique foulée');
const simu = (idx, scale = 1) => idx.flatMap(i => { const [n, r, c, k] = STATIONS[i]; return [runMv('1 km'), hmv(n, scale === 1 ? r : scaleReps(r, scale), c, k)]; });
function scaleReps(r, s) { return r.replace(/\d+(?:,\d+)?/g, x => String(Math.round(parseFloat(x.replace(',', '.')) * s))); }

TEMPLATES.hyrox = [
  { type: 'hyrox', titre: 'HYROX metcon · Half HYROX (stations 1-4)', objectif: 'Course compromise à allure course', duree_min: 50,
    echauffement: '8 min de footing facile, 2 × 250 m SkiErg progressif, 10 wall balls, 2 allers sled push à vide.', exercices: [],
    wod: { format: 'FOR_TIME', duree_min: 45, cap_min: 45, description: '4 × (1 km de course + station), au chrono. Utilise « Split » à chaque changement.', mouvements: simu([0, 1, 2, 3]) },
    retour_au_calme: '5 min de marche, étirements mollets, quadriceps et dorsaux.', conseils: 'Note ton temps total et tes splits : c’est ta référence.' },
  { type: 'hyrox', titre: 'HYROX metcon · EMOM stations 24 min', objectif: 'Volume de stations à allure régulière', duree_min: 45,
    echauffement: '6 min de rameur facile, mobilité hanches et épaules.', exercices: [],
    wod: { format: 'EMOM', duree_min: 24, tours: 24, travail_s: 60, description: 'Chaque minute, une station, en boucle (6 tours de 4 stations).', mouvements: [
      hmv('Minute 1 · SkiErg', '14 cal', 'damper 5-6', 'ski'), hmv('Minute 2 · Wall balls', '15', '6 kg', 'wb'),
      hmv('Minute 3 · Sandbag lunges', '20 m', '20 kg', 'lunge'), hmv('Minute 4 · Course', '200 m', 'soutenue', 'run')] },
    retour_au_calme: '5 min de marche.', conseils: 'Si une minute dépasse 45 s de travail, baisse le volume de 20 %.' },
  { type: 'hyrox', titre: 'HYROX metcon · Sled & run', objectif: 'Puissance traîneau sous fatigue', duree_min: 45,
    echauffement: '8 min de footing, 3 allers sled push léger, 3 allers sled pull léger.', exercices: [],
    wod: { format: 'FOR_TIME', duree_min: 35, cap_min: 35, description: '6 tours : 400 m de course + 25 m sled push + 25 m sled pull, au chrono.', mouvements: [
      runMv('400 m'), hmv('Sled push', '2 × 12,5 m', '152 kg traîneau compris', 'push'), hmv('Sled pull', '2 × 12,5 m', '103 kg traîneau compris', 'pull')] },
    retour_au_calme: '5 min de marche, étirements mollets et fessiers.', conseils: 'Pousse bras tendus, buste bas ; tire en marchant en arrière, corde contre la hanche.' },
  { type: 'hyrox', titre: 'HYROX metcon · Stations 5-8 (Half HYROX)', objectif: 'Course compromise, fin de course', duree_min: 50,
    echauffement: '8 min de footing, 300 m rameur, 10 wall balls, 20 m fentes sandbag.', exercices: [],
    wod: { format: 'FOR_TIME', duree_min: 45, cap_min: 45, description: '4 × (1 km de course + station 5 à 8), au chrono. « Split » à chaque changement.', mouvements: simu([4, 5, 6, 7]) },
    retour_au_calme: '5 min de marche, étirements quadriceps et épaules.', conseils: 'Wall balls : séries de 15-20 avec 5 respirations entre chaque.' }
];

// Prépa HYROX 12 semaines × 3 séances : course / force + stations / simulation.
const PREPA_PHASE = w => w <= 4 ? 'Base' : w <= 8 ? 'Construction' : w <= 11 ? 'Spécifique' : 'Affûtage';
const PREPA_RUN = [
  ['Footing facile', 1, '30 min', 'facile (tu peux parler)', 0, [['Accélérations', 6, '20 s', 'vite mais relâché', 60]]],
  ['Fractionné 400 m', 8, '400 m', 'allure 5 km (RPE 8)', 75],
  ['Footing + soutenu', 1, '35 min', 'facile', 0, [['Blocs soutenus', 4, '1 min', 'RPE 7-8', 60]]],
  ['Fractionné 800 m', 5, '800 m', 'RPE 8', 90],
  ['1 km allure course', 6, '1 km', 'allure course HYROX (RPE 7)', 75],
  ['Tempo', 3, '2 km', 'RPE 7', 120],
  ['Fractionné 400 m', 10, '400 m', 'RPE 8-9', 60],
  ['Footing facile', 1, '40 min', 'facile', 0, [['Blocs soutenus', 6, '1 min', 'RPE 7-8', 60]]],
  ['1 km allure course', 8, '1 km', 'allure course HYROX', 60],
  ['Tempo', 2, '3 km', 'RPE 7-8', 120],
  ['1 km allure course', 6, '1 km', 'allure course, 200 m récup marchée', 45],
  ['Footing + rappels', 1, '25 min', 'facile', 0, [['1 km allure course', 4, '1 km', 'allure course', 90]]]
];
const PREPA_SQUAT = [[4, '6', 85], [4, '6', 87.5], [4, '6', 90], [3, '6', 80], [5, '5', 90], [5, '5', 92.5], [5, '5', 95], [3, '5', 85], [4, '4', 97.5], [4, '4', 100], [4, '4', 100], [3, '3', 90]];
const PREPA_SLED = w => w <= 4 ? 0.7 : w <= 8 ? 1 : w <= 11 ? 1.1 : 1;
const PREPA_WB = [[5, 20], [5, 20], [4, 25], [3, 20], [4, 25], [4, 25], [3, 30], [3, 20], [3, 35], [3, 35], [2, 50], [2, 25]];
const PREPA_SIM = [
  ['EMOM 20 min · technique stations', { format: 'EMOM', duree_min: 20, tours: 20, travail_s: 60, description: 'Chaque minute une station, 5 tours de 4, allure facile : priorité à la technique.', mouvements: [hmv('SkiErg', '12 cal', 'damper 5', 'ski'), hmv('Wall balls', '12', '6 kg', 'wb'), hmv('Sandbag lunges', '16 m', '20 kg', 'lunge'), hmv('Rameur', '12 cal', 'damper 5', 'row')] }],
  ['4 tours for time', { format: 'FOR_TIME', duree_min: 30, cap_min: 30, description: '4 × (500 m de course + 250 m SkiErg + 20 wall balls).', mouvements: [runMv('500 m'), hmv('SkiErg', '250 m', 'damper 5-6', 'ski'), hmv('Wall balls', '20', '6 kg', 'wb')] }],
  ['AMRAP 20 min', { format: 'AMRAP', duree_min: 20, description: 'Le plus de tours possible.', mouvements: [runMv('400 m'), hmv('Sled push', '25 m', '105 kg traîneau compris', 'push'), hmv('Sled pull', '25 m', '75 kg traîneau compris', 'pull'), hmv('Burpee broad jumps', '10', 'poids du corps', 'bbj')] }],
  ['EMOM 16 min · semaine allégée', { format: 'EMOM', duree_min: 16, tours: 16, travail_s: 60, description: '4 tours de 4 stations, allure confortable.', mouvements: [runMv('200 m', 'facile'), hmv('Wall balls', '12', '6 kg', 'wb'), hmv('Rameur', '12 cal', 'damper 5', 'row'), hmv('Farmers carry', '40 m', '2 × 24 kg', 'farm')] }],
  ['Half HYROX · stations 1-4', { format: 'FOR_TIME', duree_min: 45, cap_min: 45, description: '4 × (1 km + station) aux standards de course. « Split » à chaque changement.', mouvements: simu([0, 1, 2, 3]) }],
  ['Half HYROX · stations 5-8', { format: 'FOR_TIME', duree_min: 45, cap_min: 45, description: '4 × (1 km + station) aux standards de course.', mouvements: simu([4, 5, 6, 7]) }],
  ['Course compromise', { format: 'FOR_TIME', duree_min: 45, cap_min: 45, description: '5 × (1 km à allure course + 20 wall balls + 25 m sandbag lunges).', mouvements: [runMv('1 km'), hmv('Wall balls', '20', '6 kg', 'wb'), hmv('Sandbag lunges', '25 m', '20 kg', 'lunge')] }],
  ['Semaine allégée', { format: 'FOR_TIME', duree_min: 30, cap_min: 30, description: '3 × (800 m de course + 500 m rameur + 40 m farmers carry), allure contrôlée.', mouvements: [runMv('800 m'), hmv('Rameur', '500 m', 'damper 5', 'row'), hmv('Farmers carry', '40 m', '2 × 24 kg', 'farm')] }],
  ['3/4 HYROX · stations 1-6', { format: 'FOR_TIME', duree_min: 70, cap_min: 70, description: '6 × (1 km + station) aux standards de course.', mouvements: simu([0, 1, 2, 3, 4, 5]) }],
  ['3/4 HYROX · stations 3-8', { format: 'FOR_TIME', duree_min: 70, cap_min: 70, description: '6 × (1 km + station) aux standards de course.', mouvements: simu([2, 3, 4, 5, 6, 7]) }],
  ['Simulation complète', { format: 'FOR_TIME', duree_min: 100, cap_min: 100, description: 'La course entière : 8 × (1 km + station) aux standards Open homme. « Split » à chaque changement.', mouvements: simu([0, 1, 2, 3, 4, 5, 6, 7]) }],
  ['Affûtage · rappel allure course', { format: 'FOR_TIME', duree_min: 25, cap_min: 25, description: '4 × (500 m à allure course + demi-station).', mouvements: simu([0, 4, 6, 7], 0.5).map(m => m.nom === 'Course' ? { ...m, reps: '500 m' } : m) }]
];
function prepaSession(i) {
  const w = Math.min(Math.floor(i / 3), 11) + 1, s = i % 3, phase = PREPA_PHASE(w);
  const head = { type: 'prepa', prepa: { semaine: w, seance: s + 1, phase } };
  if (s === 0) {
    const [nom, series, reps, allure, repos, extra = []] = PREPA_RUN[w - 1];
    return { ...head, titre: `Prépa HYROX · S${w}/12 · Course`, objectif: phase + ' · ' + nom, duree_min: 50,
      echauffement: '10 min de footing très facile + 4 éducatifs (montées de genoux, talons-fesses, pas chassés).',
      exercices: [ex(nom, series, reps, allure, repos, HX.run, HX.runS, 'Foulée courte, cadence élevée, relâché des épaules.', 'technique course à pied foulée'),
        ...extra.map(([n, se, re, al, rp]) => ex(n, se, re, al, rp, HX.run, HX.runS, 'Garde la même foulée jusqu’au bout.', 'fractionné course'))],
      wod: null, retour_au_calme: '5 min de marche, étirements mollets, ischios et quadriceps.',
      conseils: 'Allure course HYROX = l’allure que tu pourrais tenir sur 8 × 1 km entre les stations, sans finir à bout de souffle.' };
  }
  if (s === 1) {
    const [sq, sr, sk] = PREPA_SQUAT[w - 1], f = PREPA_SLED(w), [wbS, wbR] = PREPA_WB[w - 1];
    return { ...head, titre: `Prépa HYROX · S${w}/12 · Force + stations`, objectif: phase + ' · force des jambes et technique des stations', duree_min: 70,
      echauffement: '6 min de rameur, squat barre vide × 10, 50 kg × 5, 70 kg × 3.',
      exercices: [
        ex('Back squat', sq, sr, sk + ' kg', 150, ['quadriceps', 'fessiers'], ['ischios', 'lombaires', 'abdominaux'], 'Gainage avant de descendre, genoux dans l’axe.', 'back squat technique'),
        ex('Soulevé de terre roumain', 3, '8', String(w === 12 ? 80 : w === 4 || w === 8 ? 70 + 2.5 * (w - 3) : Math.min(90, 70 + 2.5 * (w - 1))).replace('.', ',') + ' kg', 90, ['ischios', 'fessiers'], ['lombaires', 'avant_bras'], 'Hanches en arrière, dos plat.', 'soulevé de terre roumain technique'),
        ex('Sled push', 4, '12,5 m', Math.round(152 * f) + ' kg traîneau compris', 90, HX.push, HX.pushS, 'Bras tendus, buste bas, petits pas rapides.', 'hyrox sled push technique'),
        ex('Sled pull', 4, '12,5 m', Math.round(103 * f) + ' kg traîneau compris', 90, HX.pull, HX.pullS, 'Recule en tirant main sur main, corde contre la hanche.', 'hyrox sled pull technique'),
        ex('Wall balls', wbS, String(wbR), '6 kg, cible 2,74 m', 60, HX.wb, HX.wbS, 'Squat complet, lance avec les jambes, vise le centre de la cible.', 'wall ball technique hyrox'),
        ex('Farmers carry', 3, '50 m', '2 × 24 kg', 60, HX.farm, HX.farmS, 'Épaules basses, pas rapides, pose rarement.', 'farmers carry technique'),
        ex('Sandbag lunges', 3, '25 m', '20 kg', 60, HX.lunge, HX.lungeS, 'Genou arrière qui frôle le sol, buste droit.', 'hyrox sandbag lunges technique')],
      wod: null, retour_au_calme: '5 min de vélo facile, étirements hanches et quadriceps.',
      conseils: w <= 4 ? 'Traîneau à 70 % du poids de course : soigne la technique.' : w <= 8 ? 'Traîneau au poids de course.' : w <= 11 ? 'Traîneau 10 % au-dessus du poids de course : la course paraîtra légère.' : 'Semaine d’affûtage : qualité, pas de fatigue.' };
  }
  const [nom, wod] = PREPA_SIM[w - 1];
  return { ...head, titre: `Prépa HYROX · S${w}/12 · ${nom}`, objectif: phase + ' · conditionnement spécifique', duree_min: Math.max(40, (wod.duree_min || 30) + 20),
    echauffement: '10 min de footing facile, 250 m SkiErg, 10 wall balls, 2 allers de traîneau léger.', exercices: [], wod,
    retour_au_calme: '5 min de marche, étirements complets.', conseils: 'Note ton temps et tes splits : ils servent à mesurer ta progression.' };
}
