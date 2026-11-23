// Planche anatomique simplifiée (face + dos) : muscles principaux en couleur vive, secondaires en clair.
const MUSCLE_NAMES = {
  pectoraux: 'Pectoraux', deltoides_anterieurs: 'Épaules (avant)', deltoides_lateraux: 'Épaules (côté)',
  deltoides_posterieurs: 'Épaules (arrière)', biceps: 'Biceps', triceps: 'Triceps', avant_bras: 'Avant-bras',
  abdominaux: 'Abdominaux', obliques: 'Obliques', trapezes: 'Trapèzes', dorsaux: 'Grands dorsaux',
  haut_du_dos: 'Haut du dos (rhomboïdes)', lombaires: 'Lombaires', fessiers: 'Fessiers', quadriceps: 'Quadriceps',
  ischios: 'Ischio-jambiers', adducteurs: 'Adducteurs', mollets: 'Mollets'
};
const MUSCLE_SHAPES = {
  // Face (centre x = 50)
  trapezes: ['M41 25 L47 23 L47 30 L38 31 Z', 'M59 25 L53 23 L53 30 L62 31 Z',
    'M150 22 L138 31 L150 58 L162 31 Z'],
  deltoides_anterieurs: ['E31 37 6 7', 'E69 37 6 7'],
  deltoides_lateraux: ['E25.5 39 3 6', 'E74.5 39 3 6', 'E125.5 39 3 6', 'E174.5 39 3 6'],
  pectoraux: ['M50 34 Q42 32 37 37 Q35 46 40 52 Q46 54 50 51 Z', 'M50 34 Q58 32 63 37 Q65 46 60 52 Q54 54 50 51 Z'],
  biceps: ['E26 53 4 10', 'E74 53 4 10'],
  avant_bras: ['E21.5 80 3.5 11', 'E78.5 80 3.5 11', 'E121.5 80 3.5 11', 'E178.5 80 3.5 11'],
  abdominaux: ['R44.5 54 11 34 4'],
  obliques: ['E39 72 3.5 12', 'E61 72 3.5 12'],
  quadriceps: ['E42.5 126 7 20', 'E57.5 126 7 20'],
  adducteurs: ['E47.8 117 2.2 10', 'E52.2 117 2.2 10'],
  // Dos (centre x = 150)
  deltoides_posterieurs: ['E132 37 6 7', 'E168 37 6 7'],
  haut_du_dos: ['E142.5 45 5 6', 'E157.5 45 5 6'],
  dorsaux: ['M147 52 Q138 52 135 60 Q137 74 146 82 Z', 'M153 52 Q162 52 165 60 Q163 74 154 82 Z'],
  triceps: ['E126 54 4 10', 'E174 54 4 10'],
  lombaires: ['R145.5 78 9 16 3'],
  fessiers: ['E143 110 8 9', 'E157 110 8 9'],
  ischios: ['E142.5 136 6.5 16', 'E157.5 136 6.5 16'],
  mollets: ['E142 171 5 12', 'E158 171 5 12']
};
function shapeSvg(spec, fill) {
  const [kind, ...n] = [spec[0], ...spec.slice(1).split(/[ ,]/).map(Number)];
  if (kind === 'E') return `<ellipse cx="${n[0]}" cy="${n[1]}" rx="${n[2]}" ry="${n[3]}" fill="${fill}"/>`;
  if (kind === 'R') return `<rect x="${n[0]}" y="${n[1]}" width="${n[2]}" height="${n[3]}" rx="${n[4]}" fill="${fill}"/>`;
  return `<path d="${spec}" fill="${fill}"/>`;
}
function silhouette(cx) {
  const s = '#e2e8e4';
  return `<circle cx="${cx}" cy="13" r="9" fill="${s}"/>
  <rect x="${cx - 4}" y="20" width="8" height="8" fill="${s}"/>
  <path d="M${cx - 20} 30 Q${cx} 25 ${cx + 20} 30 L${cx + 17} 62 L${cx + 14} 96 L${cx + 17} 106 L${cx - 17} 106 L${cx - 14} 96 L${cx - 17} 62 Z" fill="${s}"/>
  <rect x="${cx - 29}" y="32" width="10" height="34" rx="5" fill="${s}" transform="rotate(8 ${cx - 24} 32)"/>
  <rect x="${cx + 19}" y="32" width="10" height="34" rx="5" fill="${s}" transform="rotate(-8 ${cx + 24} 32)"/>
  <rect x="${cx - 33}" y="64" width="8.5" height="34" rx="4.2" fill="${s}" transform="rotate(5 ${cx - 29} 64)"/>
  <rect x="${cx + 24.5}" y="64" width="8.5" height="34" rx="4.2" fill="${s}" transform="rotate(-5 ${cx + 29} 64)"/>
  <rect x="${cx - 16}" y="102" width="15" height="48" rx="7" fill="${s}"/>
  <rect x="${cx + 1}" y="102" width="15" height="48" rx="7" fill="${s}"/>
  <rect x="${cx - 14}" y="148" width="11" height="46" rx="5.5" fill="${s}"/>
  <rect x="${cx + 3}" y="148" width="11" height="46" rx="5.5" fill="${s}"/>`;
}
function muscleMap(primary = [], secondary = []) {
  const p = new Set(primary), s = new Set(secondary.filter(m => !p.has(m)));
  let shapes = '';
  for (const [id, specs] of Object.entries(MUSCLE_SHAPES)) {
    const fill = p.has(id) ? '#e4572e' : s.has(id) ? '#f5b49c' : '#cfd9d3';
    shapes += specs.map(spec => shapeSvg(spec, fill)).join('');
  }
  return `<svg class="musclemap" viewBox="0 0 200 212" role="img" aria-label="Muscles travaillés : ${[...p].map(m => MUSCLE_NAMES[m] || m).join(', ')}">
  ${silhouette(50)}${silhouette(150)}${shapes}
  <text x="50" y="209" text-anchor="middle" font-size="9" fill="#5c6f66">Face</text>
  <text x="150" y="209" text-anchor="middle" font-size="9" fill="#5c6f66">Dos</text></svg>`;
}
function muscleLegend(primary = [], secondary = []) {
  const name = m => MUSCLE_NAMES[m] || m;
  const sec = secondary.filter(m => !primary.includes(m));
  return `<p class="legend"><span class="dot p"></span>${primary.map(name).join(', ') || '—'}` +
    (sec.length ? `<br><span class="dot s"></span>${sec.map(name).join(', ')}` : '') + '</p>';
}
