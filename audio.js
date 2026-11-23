// Moteur audio. Web Audio = catégorie « ambient » sur iOS : se mélange à YouTube Music sans le couper
// (mais muet en mode silencieux). La voix iPhone (speechSynthesis) baisse la musique 1 à 2 s.
const CLIP_NAMES = ['depart', 'reprise', 'pause', 'mitemps', 'dix_dernieres', 'dix_sec', 'fin', 'termine', 'repos', 'effort',
  'repos_fini', 'prepare', 'dernier', 'test', ...Array.from({ length: 30 }, (_, i) => 'tour' + (i + 1))];
const CLIP_TEXT = { depart: 'Départ', reprise: 'Reprise', pause: 'Pause', mitemps: 'Mi-temps', dix_dernieres: 'Dix dernières secondes',
  dix_sec: 'Dix secondes', fin: 'Temps écoulé', termine: 'Terminé, bravo', repos: 'Repos', effort: 'Effort', repos_fini: 'Repos terminé',
  prepare: 'Prépare-toi', dernier: 'Dernier tour', test: 'Test du son. Mi-temps. Dix dernières secondes.' };
for (let i = 1; i <= 30; i++) CLIP_TEXT['tour' + i] = 'Tour ' + i;

let actx = null, clipBuf = {}, clipsLoading = null, chain = Promise.resolve();
function audioCtx() {
  if (!actx) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch {}
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    actx = new C();
  }
  if (actx.state !== 'running') actx.resume().catch(() => {});
  return actx;
}
function unlockAudio() {
  const c = audioCtx();
  if (!c) return;
  const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
  s.buffer = b; s.connect(c.destination); s.start(0);
  if (settings().voice === 'clips') loadClips();
  if (window.speechSynthesis && settings().voice === 'iphone' && !unlockAudio.speech) {
    unlockAudio.speech = true; const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u);
  }
}
['pointerdown', 'touchend'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && actx) actx.resume().catch(() => {}); });

function loadClips() {
  if (clipsLoading) return clipsLoading;
  const c = audioCtx(); if (!c) return Promise.resolve();
  clipsLoading = fetch('voix.json').then(r => r.json()).then(all => Promise.all(Object.entries(all).map(([n, b64]) => {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Promise((ok, ko) => c.decodeAudioData(buf.buffer, ok, ko)).then(b => { clipBuf[n] = b; }).catch(() => {});
  }))).catch(() => { clipsLoading = null; });
  return clipsLoading;
}
function beep(kind = 'short') {
  const c = audioCtx(); if (!c) return;
  const spec = { short: [[880, 0.12]], long: [[660, 0.45]], go: [[990, 0.5]], double: [[880, 0.1], [880, 0.1]] }[kind] || [[880, 0.12]];
  let t = c.currentTime + 0.01;
  for (const [f, d] of spec) {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = f; o.type = 'sine';
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.02);
    t += d + 0.08;
  }
}
function playBuf(b) {
  return new Promise(res => {
    const c = audioCtx(); if (!c || !b) return res();
    const s = c.createBufferSource(), g = c.createGain(); g.gain.value = 1;
    s.buffer = b; s.connect(g); g.connect(c.destination); s.onended = res; s.start();
    setTimeout(res, b.duration * 1000 + 300);
  });
}
// Annonce une suite de clips (ex. ['mitemps','tour5']).
function say(keys) {
  keys = [].concat(keys).filter(Boolean);
  if (!keys.length) return;
  const mode = settings().voice;
  if (mode === 'bips') return;
  if (mode === 'iphone' && window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(keys.map(k => CLIP_TEXT[k] || k).join('. '));
    u.lang = 'fr-FR'; u.rate = 1.05;
    const v = speechSynthesis.getVoices().find(x => x.lang === 'fr-FR');
    if (v) u.voice = v;
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    setTimeout(() => speechSynthesis.speak(u), 60);
    return;
  }
  loadClips();
  chain = chain.then(async () => { await clipsLoading; for (const k of keys) await playBuf(clipBuf[k]); }).catch(() => {});
}
function testSound() { unlockAudio(); beep('short'); setTimeout(() => say(['test']), 350); }
