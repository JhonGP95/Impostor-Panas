/* ================================================================
   4. DISCUSIÓN
   ================================================================ */
function renderDiscussionShell() {
  return `<div class="screen" id="screen-discussion"></div>`;
}

function renderDiscussionScreen() {
  const screen = $('screen-discussion');
  if (!screen) return;
  const g = STATE.game;
  if (!g) return;

  const alivePlayers = g.players.filter(pl => pl.alive);
  if (alivePlayers.length === 0) {
    renderVictoryScreen({ winner: 'impostors', reason: 'No quedan jugadores en la partida' });
    navigate('screen-victory');
    return;
  }
  const starter = rand(alivePlayers);
  g.starter = starter;
  saveGameState(); // 💾 rotación completa, discusión lista

  screen.innerHTML = `
    <div class="screen-scroll" style="display:flex;flex-direction:column;align-items:center;padding:12px 20px;text-align:center;">
      <div style="margin:auto 0;width:100%;">
      <div class="anim-fade-up">
        <div style="font-size:56px;margin-bottom:16px;">🗣️</div>
        <div class="title-xl" style="margin-bottom:8px;">Todos Listos</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:32px;">
          Discutan sin revelar información obvia.<br>El impostor está entre ustedes.
        </div>

        <div class="card-glass anim-scale delay-2" style="border-color:rgba(0,245,255,0.3);">
          <div class="caption" style="margin-bottom:8px;letter-spacing:0.1em;text-transform:uppercase;">Empieza hablando</div>
          <div style="font-size:36px;margin-bottom:8px;">${starter.avatar}</div>
          <div class="title-lg" style="color:${starter.color};filter:drop-shadow(0 0 12px ${starter.color});">
            ${esc(starter.name)}
          </div>
        </div>
      </div>
      </div>
    </div>

    <div class="screen-footer">
      <button class="btn btn-primary anim-fade-up delay-3" onclick="goToVoting()">
        <span>🗳️</span> Ir a Votación
      </button>
      <div class="controls-row">
        <button class="btn btn-ghost btn-sm" onclick="openDeletePlayer()">🗑️ Jugador se fue</button>
        <button class="btn btn-danger-ghost btn-sm" onclick="confirmCancelRound()">✖️ Cancelar ronda</button>
      </div>
    </div>
  `;
}

function goToVoting() {
  renderVotingScreen();
  navigate('screen-voting');
}
