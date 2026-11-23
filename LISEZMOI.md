# Marwin Training — mise en ligne et installation sur iPhone

L'app est un site statique : aucun serveur, aucun compte requis pour l'utiliser.
Le journal reste stocké sur l'iPhone. Seul le programme (ces fichiers) est en ligne.

## 1. Mettre en ligne (GitHub Pages, gratuit, ~5 min depuis le Mac)

1. Va sur github.com et connecte-toi (crée un compte gratuit si besoin).
2. « New repository » → nom : `marwin-training` → **Public** → Create.
3. Clique « uploading an existing file » → glisse les fichiers de ce dossier
   (les fichiers eux-mêmes, pas le dossier) → « Commit changes ».
4. Settings → Pages → Source : « Deploy from a branch » → Branch `main`, dossier `/ (root)` → Save.
5. Attends 1 à 2 minutes. L'adresse s'affiche en haut de la page Pages :
   `https://TON-PSEUDO.github.io/marwin-training/`

Note : un dépôt public rend visible le contenu du programme (exercices, charges).
Le journal, lui, n'est jamais envoyé en ligne.

## 2. Installer sur l'iPhone

1. Ouvre l'adresse dans **Safari**.
2. Partager → « Sur l'écran d'accueil » → active « Ouvrir comme app web » → Ajouter.
3. Utilise toujours l'icône. Sur iPhone, l'icône a son propre stockage, séparé de Safari.

## 3. Récupérer le journal de la version ChatGPT

1. Dans l'ancienne app, sélectionne tout l'historique affiché sous le formulaire du journal, puis copie.
2. Ouvre la nouvelle app **depuis l'icône** → Journal → « Sauvegarder ou transférer mon journal ».
3. Colle dans « Récupérer l'ancien journal » → « Importer le texte collé ».
4. Vérifie le nombre d'entrées affiché, puis touche « Exporter un fichier » pour une première sauvegarde.

## 4. Cloud (Google Sheets)

Chaque séance enregistrée est envoyée dans le Google Sheet « Marwin Training – Journal »
(onglet Journal = toutes les séances, onglet Suivi = séances et difficulté moyenne par semaine).
Sans réseau, les séances attendent sur l'appareil et partent dès le retour de la connexion.
Sur chaque appareil : Journal → « Cloud, sauvegarde et transfert » → colle le lien de connexion → Connecter.
Le lien de connexion contient une clé secrète : ne le partage pas.

## 5. Sauvegarder ou changer d'appareil

- « Exporter un fichier » : crée `journal-marwin-AAAA-MM-JJ.json` (Fichiers, iCloud Drive, AirDrop, mail).
- « Choisir un fichier » sur l'autre appareil : importe et fusionne sans doublon.
  En cas de conflit sur une même date et activité, la version modifiée le plus récemment est gardée.
- L'app signale en rouge si la dernière sauvegarde date de plus de 14 jours.

## 6. Mettre à jour l'app

Remplace les fichiers sur GitHub (Add file → Upload files). L'app fonctionne hors ligne
et charge la nouvelle version en arrière-plan : elle apparaît à la deuxième ouverture.

## Limites iOS à connaître

- Écran allumé pendant le minuteur plein écran : nécessite iOS 18.4 ou plus récent.
- Si l'app passe en arrière-plan ou si l'écran se verrouille, iOS suspend le minuteur :
  les annonces sont décalées jusqu'au retour dans l'app. Le temps affiché reste juste.
- Les bips peuvent être coupés par le mode silencieux. Les annonces vocales suivent le volume média.
