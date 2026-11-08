/* ================================================================
   ELIMINAR JUGADOR (se fue de la partida)
   ================================================================ */
function openDeletePlayer() {
  const g = STATE.game;
  const alive = g.players.filter(pl => pl.alive);
  if (alive.length === 0) return;

  openModal(`
    <div>
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:36px;margin-bottom:8px;">👋</div>
        <div class="title-md">Gestionar jugadores</div>
        <div class="caption" style="margin-top:4px;">Consulta tu tarjeta en privado o marca quién se fue.</div>
      </div>
      <div style="display:flex;flex-direction:column;">
        ${alive.map(pl => `
          <button class="pick-item" onclick="openPlayerMenu(${pl.id})">
            <span class="player-avatar" aria-hidden="true" style="background:${pl.color}22;color:${pl.color};width:34px;height:34px;font-size:16px;">${pl.avatar}</span>
            <span style="flex:1;">${esc(pl.name)}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="closeModal()">Volver</button>
    </div>
  `);
}

// Menú por jugador: repetir palabra / marcar salida / cancelar
function openPlayerMenu(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || !p.alive) return;
  playSound('tap');

  openModal(`
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">${p.avatar}</div>
      <div class="title-md" style="margin-bottom:24px;color:${p.color};filter:drop-shadow(0 0 12px ${p.color});">${esc(p.name)}</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="repeatWord(${playerId})">🔁 Volver a ver mi tarjeta</button>
        <button class="btn btn-red" onclick="confirmDeletePlayer(${playerId})">👋 Confirmar salida</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>
  `);
}

// El recordatorio usa la misma tarjeta privada que la revelación.
function repeatWord(playerId) {
  const player = STATE.game.players.find(pl => pl.id === playerId);
  if (!player?.alive) return;
  playSound('reveal');
  openModal(`
    <div class="dialog-stack">
      ${renderPrivateRole(player, true)}
      <button class="btn btn-primary" onclick="closeModal()">Ya lo vi · Pasar celular 👉</button>
    </div>
  `);
}

function confirmDeletePlayer(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || !p.alive) return;

  openModal(`
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">${p.avatar}</div>
      <div class="title-md" style="margin-bottom:8px;">¿${esc(p.name)} se va de la partida?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
        Se lo marca como <strong>"se fue"</strong>. Su rol no se revela durante la partida.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-red" onclick="executeDeletePlayer(${playerId})">👋 Confirmar salida</button>
        <button class="btn btn-ghost" onclick="closeModal()">Volver</button>
      </div>
    </div>
  `);
}

function executeDeletePlayer(playerId) {
  closeModal();
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || !p.alive) return;

  p.alive = false;
  p.leftEarly = true;
  g.eliminated.push(p);
  const mate = applyHeartbreak(p);
  if (mate) mate.diedOf = 'partner-left';
  playSound('eliminate');

  afterPlayerRemoval();
}

function afterPlayerRemoval() {
  const v = checkVictory();
  if (v) {
    renderVictoryScreen(v);
    navigate('screen-victory');
    return;
  }
  const s = STATE.currentScreen;
  if (s === 'screen-reveal') renderRevealScreen();
  else if (s === 'screen-discussion') renderDiscussionScreen();
  else if (s === 'screen-voting') renderVotingScreen();
}
