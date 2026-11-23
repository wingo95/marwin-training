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
