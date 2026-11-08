/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderApp();
  tryRegisterServiceWorker();
});

function offerContinueGame(snap) {
  const vivos = snap.players.filter(p => p.alive).length;
  const fuera = (snap.eliminatedIds || []).length;
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
  `, false);
}

function continueGame() {
  const snap = loadGameState();
  if (!snap) { closeModal(); return; }
  closeModal();
  const game = restoreGame(snap);
  playSound('start');
  if (game.phase === 'reveal') {
    navigate('screen-reveal');
    renderRevealScreen();
  } else if (game.phase === 'discussion') {
    renderDiscussionScreen();
    navigate('screen-discussion');
  } else {
    renderVotingScreen();
    navigate('screen-voting');
    const pending = game.players.find(pl => pl.id === game.pendingKamikazeId);
    if (pending) openKamikazeModal(pending);
    else finishPowerAction();
  }
}

function discardGame() {
  clearGameState();
  closeModal();
  playSound('tap');
}

window.addEventListener('blur', resetHoldState);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  resetHoldState();
  if ($('modal-content').querySelector('.private-card')) closeModal();
  if (STATE.currentScreen === 'screen-reveal' && !$('reveal-card')?.hidden) renderRevealScreen();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && modalDismissible && $('modal').classList.contains('open')) closeModal();
});

document.addEventListener('touchstart', () => initAudio(), { once: true });
document.addEventListener('click', () => initAudio(), { once: true });
