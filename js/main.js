/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderApp();
  setupPwaManifest();
  tryRegisterServiceWorker();

  // 💾 Si quedó una partida en curso, ofrecer continuarla
  setTimeout(() => {
    const snap = loadGameState();
    if (snap) offerContinueGame(snap);
  }, 2300);
});

function offerContinueGame(snap) {
  const vivos = snap.players.filter(p => p.alive).length;
  const fuera = snap.eliminatedIds.length;
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:10px;">💾</div>
      <div class="title-md" style="margin-bottom:8px;">¿Continuar la partida?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Hay una partida en curso: <strong style="color:var(--text)">${vivos} jugadores vivos</strong>
        y ${fuera} fuera de la partida.<br>¿Retomamos donde estaba?
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="continueGame()">▶️ Continuar partida</button>
        <button class="btn btn-ghost" onclick="discardGame()">🗑️ Empezar de nuevo</button>
      </div>
    </div>
  `);
}

function continueGame() {
  const snap = loadGameState();
  if (!snap) { closeModal(); return; }
  restoreGame(snap);
  playSound('start');
  if (STATE.game.revealCount < STATE.game.players.length) {
    renderRevealScreen();
    navigate('screen-reveal');
  } else {
    renderVotingScreen();
    navigate('screen-voting');
  }
}

function discardGame() {
  clearGameState();
  closeModal();
  playSound('tap');
}

let lastTouch = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouch < 300) e.preventDefault();
  lastTouch = now;
}, { passive: false });

document.addEventListener('touchmove', e => {
  // Permitir scroll táctil dentro del modal (lista de jugadores, etc.)
  if (!e.target.closest('.scroll-area') && !e.target.closest('.modal-card')) {
    e.preventDefault();
  }
}, { passive: false });

// En Android, el long-press abre el menú contextual y cancela el gesto de
// "mantener para revelar". Es un juego: nunca queremos ese menú.
document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('touchstart', () => initAudio(), { once: true });
document.addEventListener('click', () => initAudio(), { once: true });
