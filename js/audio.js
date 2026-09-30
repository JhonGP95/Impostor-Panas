/* ================================================================
   WEB AUDIO API - SISTEMA DE SONIDOS
   ================================================================ */
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-toggle');
  btn.textContent = soundEnabled ? '🔊' : '🔇';
  btn.classList.toggle('muted', !soundEnabled);
}

function playTone(frequency, duration, type = 'sine', volume = 0.2) {
  if (!audioCtx || audioCtx.state !== 'running') return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;

  switch(type) {
    case 'tap':
      playTone(800, 0.1, 'sine', 0.15);
      break;
    case 'hold':
      playTone(400, 0.15, 'sine', 0.1);
      break;
    case 'reveal':
      playTone(523, 0.15, 'sine', 0.25);
      setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 100);
      setTimeout(() => playTone(784, 0.25, 'sine', 0.3), 200);
      break;
    case 'victory':
      playTone(523, 0.15, 'sine', 0.3);
      setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
      setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 300);
      setTimeout(() => playTone(1047, 0.4, 'sine', 0.35), 450);
      break;
    case 'eliminate':
      playTone(200, 0.1, 'square', 0.2);
      setTimeout(() => playTone(150, 0.2, 'square', 0.15), 100);
      setTimeout(() => playTone(100, 0.3, 'square', 0.1), 250);
      break;
    case 'whoosh':
      playTone(300, 0.15, 'sine', 0.08);
      setTimeout(() => playTone(400, 0.1, 'sine', 0.05), 50);
      break;
    case 'start':
      playTone(440, 0.1, 'sine', 0.2);
      setTimeout(() => playTone(554, 0.1, 'sine', 0.2), 100);
      setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 200);
      setTimeout(() => playTone(880, 0.2, 'sine', 0.3), 300);
      break;
    case 'impostorWin':
      playTone(150, 0.4, 'sawtooth', 0.15);
      setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.12), 300);
      setTimeout(() => playTone(250, 0.5, 'sawtooth', 0.1), 500);
      break;
    case 'explosion':
      playTone(90, 0.5, 'sawtooth', 0.4);
      playTone(60, 0.7, 'square', 0.3);
      setTimeout(() => playTone(45, 0.6, 'sawtooth', 0.25), 120);
      break;
    case 'sacrifice':
      // Tono oscuro y ritual para el sacrificio
      playTone(220, 0.3, 'sawtooth', 0.2);
      setTimeout(() => playTone(165, 0.35, 'sawtooth', 0.2), 220);
      setTimeout(() => playTone(110, 0.6, 'sine', 0.25), 440);
      break;
    case 'revive':
      // Ascenso cálido y esperanzador
      playTone(440, 0.15, 'sine', 0.2);
      setTimeout(() => playTone(554, 0.15, 'sine', 0.22), 120);
      setTimeout(() => playTone(659, 0.2, 'sine', 0.24), 240);
      setTimeout(() => playTone(880, 0.35, 'sine', 0.28), 360);
      break;
    case 'angel':
      // Destello brillante del Ángel Guardián
      playTone(1175, 0.12, 'sine', 0.16);
      setTimeout(() => playTone(1568, 0.2, 'sine', 0.18), 80);
      setTimeout(() => playTone(2093, 0.3, 'sine', 0.14), 180);
      break;
  }
}
