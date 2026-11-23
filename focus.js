// Voix, écran allumé et plein écran, partagés par le minuteur principal et les intervalles / Tabata.
const focusDialog = $('big');
let focusSrc = 'main';
let frVoice = null;
function pickVoice() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  frVoice = voices.find(v => v.lang === 'fr-FR' && v.localService) || voices.find(v => v.lang && v.lang.startsWith('fr')) || null;
}
if (window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}
function utter(text, volume = 1) {
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'fr-FR';
  if (frVoice) voice.voice = frVoice;
  voice.volume = volume;
  voice.rate = 1.05;
  window.speechSynthesis.speak(voice);
}
function speakCue(text) {
  if (!window.speechSynthesis) return;
  // Sur iOS, cancel() suivi immédiatement de speak() peut faire sauter l'annonce.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
    setTimeout(() => utter(text), 80);
  } else utter(text);
}
// Affiche l'annonce en plein écran (si la source correspond) et la prononce.
function showCue(text, src) {
  if (focusDialog.open && focusSrc === src) $('cue').textContent = text;
  speakCue(text);
}
// iOS n'autorise la voix qu'après un premier appel déclenché par un toucher.
let speechUnlocked = false;
function unlockSpeech() {
  if (speechUnlocked || !window.speechSynthesis) return;
  speechUnlocked = true;
  utter(' ', 0);
}
for (const id of ['start', 'enlarge', 'restGo', 'intGo', 'intBig']) $(id).addEventListener('click', unlockSpeech);

// Garde l'écran allumé pendant le plein écran (iOS 18.4+ en mode app).
let wakeLock = null;
async function keepAwake(on) {
  if (!('wakeLock' in navigator)) return;
  try {
    if (on && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && focusDialog.open) keepAwake(true);
});

// Annonces du minuteur principal : actives même hors plein écran.
let prevDown;
function downCues() {
  const running = !!clocks.down.since;
  const seconds = Math.ceil(value('down') / 1000);
  if (prevDown !== undefined && prevDown > seconds && (running || seconds === 0) && (prevDown - seconds < 4 || seconds === 0)) {
    const half = Math.floor(duration * 30);
    let msg = '';
    if (seconds === 0) msg = 'Temps écoulé';
    else if (seconds <= 10 && prevDown > 10) msg = 'Dix dernières secondes';
    else if (half > 10 && seconds <= half && prevDown > half) msg = 'Mi-temps';
    if (msg) showCue(msg, 'main');
  }
  prevDown = seconds;
}
$('start').addEventListener('click', () => {
  // Le gestionnaire principal (app.js) a déjà démarré ou mis en pause.
  if (mode === 'down' && clocks.down.since) {
    if (focusDialog.open) $('cue').textContent = '';
    speakCue(Math.abs(value('down') - duration * 60000) < 1000 ? 'Départ' : 'Reprise');
  }
});

function showFocus() {
  downCues();
  if (!focusDialog.open) return;
  if (focusSrc === 'int' && typeof intView === 'function') {
    const v = intView();
    $('bigLabel').textContent = v.label;
    $('digits').textContent = v.digits;
    $('bigSub').textContent = v.sub;
    $('bigGo').textContent = v.btn;
    focusDialog.className = v.cls;
    return;
  }
  focusDialog.className = '';
  $('bigSub').textContent = '';
  $('bigLabel').textContent = mode === 'down' ? 'Temps restant' : 'Temps écoulé';
  $('digits').textContent = $('display').textContent;
  $('bigGo').textContent = $('start').textContent;
}
function openFocus(src) {
  focusSrc = src;
  $('cue').textContent = '';
  focusDialog.showModal();
  keepAwake(true);
  showFocus();
  if (focusDialog.requestFullscreen) focusDialog.requestFullscreen().catch(()=>{});
}
$('enlarge').onclick = () => openFocus('main');
$('intBig').onclick = () => openFocus('int');
$('bigGo').onclick = () => {
  $(focusSrc === 'int' ? 'intGo' : 'start').click();
  showFocus();
};
$('closeBig').onclick = () => focusDialog.close();
focusDialog.onclose = () => {
  keepAwake(false);
  focusDialog.className = '';
  if (document.fullscreenElement === focusDialog) document.exitFullscreen().catch(()=>{});
};
setInterval(showFocus,100);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./offline.js').catch(()=>{});
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});
