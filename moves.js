const movements = [
 ['ABCD','Vélo','Ajuste la selle pour garder le genou légèrement fléchi en bas. Pédale assis, bassin stable.','Quadriceps et fessiers.'],
 ['AD','Montée sur pointes','Près d’un support, pousse sur l’avant des pieds, marque une pause en haut puis redescends lentement.','Mollets.'],
 ['AD','Équilibre sur un pied','Fixe un point devant toi, fléchis légèrement le genou et garde le bassin horizontal. Effleure un support au besoin.','Muscles du pied et de la cheville, moyen fessier.'],
 ['A','Squat au poids du corps et squat arrière','Pieds environ largeur d’épaules, garde tout le pied au sol. Fléchis hanches et genoux ensemble puis repousse le sol. Avec la barre, pose-la sur les trapèzes et règle les sécurités.','Quadriceps et fessiers. Les abdominaux stabilisent le tronc.'],
 ['A','Traction assistée','Sur la machine, choisis assez d’assistance pour monter sans élan. Tire les coudes vers les côtes, puis redescends lentement.','Grands dorsaux et biceps.'],
 ['A','Pompe','Mains légèrement plus larges que les épaules, aligne tête, bassin et talons. Descends la poitrine entre les mains puis repousse le sol.','Pectoraux, triceps et avant des épaules.'],
 ['A','Goblet squat','Tiens un haltère à deux mains contre la poitrine. Descends entre tes hanches, genoux orientés comme les pieds, puis relève-toi.','Quadriceps et fessiers, avec gainage du tronc.'],
 ['A','Farmer walk','Un haltère dans chaque main, tiens-toi droit et marche à petits pas réguliers. Garde les charges près des cuisses et tourne calmement.','Avant-bras pour la prise, trapèzes et abdominaux pour la posture.'],
 ['A','Dead bug','Sur le dos, bras vers le plafond et genoux pliés à 90°. Expire en éloignant un bras et la jambe opposée. Arrête avant que le bas du dos se creuse, puis alterne.','Abdominaux, notamment transverse et obliques.'],
 ['B','Elliptique','Pose les pieds à plat sur les pédales. Pousse alternativement avec chaque jambe en gardant le buste droit.','Quadriceps et fessiers.'],
 ['B','Tirage élastique ou à la poulie','Élastique fixé devant toi ou assis à la poulie, garde le buste stable. Ramène les coudes près des côtes, puis laisse les bras se tendre doucement.','Grands dorsaux, milieu du dos et biceps.'],
 ['B','Flexion de hanches et soulevé de terre roumain','Genoux légèrement fléchis, recule les fesses comme pour fermer une porte. Avec les haltères, longe les cuisses. Dès que l’arrière des cuisses se tend, redresse-toi en poussant les pieds au sol.','Ischio-jambiers et fessiers. Les muscles du dos stabilisent la colonne.'],
 ['B','Développé couché','Pieds au sol, omoplates rapprochées, poignets au-dessus des coudes. Descends la barre vers le bas des pectoraux puis repousse-la. Seul, utilise un rack avec sécurités réglées.','Pectoraux, triceps et deltoïdes antérieurs.'],
 ['B','Presse à pectoraux','Règle le siège pour placer les poignées à hauteur de poitrine. Dos au dossier, pousse vers l’avant puis contrôle le retour.','Pectoraux, triceps et avant des épaules.'],
 ['B','Burpee sur banc sans saut','Cale le banc, pose les mains dessus, puis recule un pied après l’autre en planche. Ramène les pieds sous le bassin et redresse-toi.','Quadriceps et fessiers au redressement. Abdominaux, épaules et triceps en appui.'],
 ['B','Montée sur step','Pose tout le pied sur le step bas. Pousse avec cette jambe pour monter, puis redescends doucement. Alterne la jambe de départ.','Quadriceps et fessiers.'],
 ['B','Planche latérale','Coude sous l’épaule, sur le côté, soulève le bassin pour aligner épaules, hanches et pieds. Pose les genoux au sol pour faciliter.','Obliques et moyen fessier.'],
 ['C','Mobilité des épaules','Debout, fais de petits cercles de bras lents dans chaque sens, puis agrandis le cercle dans une amplitude confortable.','Mobilise les épaules, avec les deltoïdes et les muscles des omoplates.'],
 ['C','Squat avant','Pose la barre sur l’avant des épaules, coudes vers l’avant. Descends en gardant le buste haut et les pieds ancrés, puis repousse le sol.','Quadriceps, fessiers et abdominaux.'],
 ['C','Suspension active','Suspends-toi à la barre, bras tendus. Éloigne légèrement les épaules des oreilles pour soulever le corps de quelques centimètres, sans balancement.','Avant-bras, grands dorsaux et trapèzes inférieurs.'],
 ['C','Curl haltères','Paumes vers l’avant, coudes près des flancs. Plie les coudes sans balancer le buste puis redescends lentement.','Biceps et brachial.'],
 ['C','Extension triceps à la corde','Face à la poulie haute, garde les coudes contre les flancs. Pousse la corde vers les cuisses puis remonte les mains en contrôlant.','Triceps, à l’arrière des bras.'],
 ['C','Planche','Avant-bras au sol, coudes sous les épaules, serre légèrement les fessiers. Aligne le bassin avec le tronc et respire régulièrement.','Abdominaux et fessiers.'],
 ['D','Jogging facile','Sur tapis plat, commence après la marche. Fais des foulées courtes et détendues, à une allure qui te permet de parler. Repasse à la marche si la cheville gêne.','Mollets, quadriceps, ischio-jambiers et fessiers.'],
 ['ACD','Marche','Déroule le pied et laisse les bras accompagner tes pas. Accélère progressivement à l’échauffement et ralentis au retour au calme.','Mollets, quadriceps et fessiers.'],
 ['A','Étirements des jambes','Mollet : mains au mur, recule un pied et garde le talon au sol. Quadriceps : debout avec appui, rapproche le talon de la fesse, genoux côte à côte.','Étire les mollets et l’avant des cuisses.'],
 ['B','Étirement des pectoraux','Pose un avant-bras contre un montant puis tourne doucement le buste à l’opposé jusqu’à une tension légère. Change de côté.','Étire les pectoraux.'],
];
function renderMoves(session) {
 const guide = document.getElementById('moves');
 guide.replaceChildren();
 for (const [sessions, name, technique, muscles] of movements) {
  if (!sessions.includes(session)) continue;
  const panel = document.createElement('details');
  const label = document.createElement('summary');
  label.textContent = name;
  const steps = document.createElement('p');
  steps.textContent = technique;
  const focus = document.createElement('p');
  focus.textContent = 'Muscles · ' + muscles;
  panel.append(label, steps, focus);
  guide.append(panel);
 }
}
