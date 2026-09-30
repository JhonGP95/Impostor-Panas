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
        <div class="title-md">¿Quién tiene el celular?</div>
        <div class="caption" style="margin-top:4px;">Tocá tu nombre para repetir tu palabra, o marcá quién se fue</div>
      </div>
      <div style="display:flex;flex-direction:column;">
        ${alive.map(pl => `
          <button class="pick-item" onclick="openPlayerMenu(${pl.id})">
            <span class="player-avatar" style="background:${pl.color}22;color:${pl.color};width:34px;height:34px;font-size:16px;">${pl.avatar}</span>
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
        <button class="btn btn-primary" onclick="repeatWord(${playerId})">🔁 Repetir palabra</button>
        <button class="btn btn-red" onclick="confirmDeletePlayer(${playerId})">👋 Confirmar salida</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>
  `);
}

// 🔁 Repetir palabra: cada rol ve solo lo que le corresponde
//   inocente  → su palabra
//   impostor  → "SOS EL IMPOSTOR" (sin pista, sin categoría)
//   undercover → su categoría
function repeatWord(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || !p.alive) return;
  playSound('reveal');

  // 💔 Recordatorio de pareja para los miembros de la pareja
  const mate = partnerOf(p);
  const partnerNote = mate
    ? `<div class="caption" style="margin-top:14px;line-height:1.6;">💕 Tu pareja: <strong style="color:var(--orange)">${mate.avatar} ${esc(mate.name)}</strong> — no se lo digas a nadie</div>`
    : '';

  let emoji, cardClass, inner;
  if (p.isImpostor) {
    emoji = '💀';
    cardClass = 'impostor';
    inner = `
      <div class="badge badge-impostor" style="margin-bottom:12px;">SECRETO</div>
      <div class="title-xl glow-red" style="margin-bottom:8px;">SOS EL<br>IMPOSTOR</div>
      <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:16px;">
        Seguí fingiendo que la sabés.<br>
        (No hay pista ni categoría para repetir… ¡obvio!)
      </div>`;
  } else if (p.isJester) {
    emoji = '🤡';
    cardClass = '';
    inner = `
      <div class="badge badge-bufon" style="margin-bottom:12px;">SECRETO</div>
      <div class="caption" style="text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Tu misión</div>
      <div class="title-md glow-yellow" style="margin-bottom:12px;">Que te eliminen por votación 🗳️</div>
      <div class="caption" style="text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Para fingir, la palabra de los inocentes</div>
      <div class="title-xl glow-yellow" style="margin-bottom:8px;">${esc(g.secretWord)}</div>
      <div class="caption">Categoría: ${esc(g.category)}</div>`;
  } else if (p.isUndercover) {
    emoji = '🎭';
    cardClass = '';
    inner = `
      <div class="badge badge-undercover" style="margin-bottom:12px;">SECRETO</div>
      <div class="caption" style="text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Tu categoría</div>
      <div class="title-xl glow-cyan" style="margin-bottom:8px;">${esc(g.category)}</div>
      <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:16px;">
        Tu palabra sigue siendo secreta: fingí dentro de esta categoría.
      </div>`;
  } else {
    emoji = '✅';
    cardClass = 'human';
    inner = `
      <div class="badge badge-human" style="margin-bottom:12px;">SECRETO</div>
      <div class="caption" style="text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Tu palabra</div>
      <div class="title-xl glow-green" style="margin-bottom:8px;">${esc(g.secretWord)}</div>`;
  }

  openModal(`
    <div style="text-align:center;">
      <div class="anim-scale" style="font-size:56px;margin-bottom:10px;">${emoji}</div>
      <div class="role-card role-card-${cardClass}" style="animation:none;${p.isUndercover ? 'border-color:rgba(0,245,255,0.4);box-shadow:0 0 60px rgba(0,245,255,0.12);' : ''}${p.isJester ? 'border-color:rgba(255,214,0,0.45);box-shadow:0 0 60px rgba(255,214,0,0.12);' : ''}">
        ${inner}
        ${partnerNote}
      </div>
      <div style="height:16px;"></div>
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
