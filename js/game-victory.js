/* ================================================================
   CONDICIONES DE VICTORIA — 5 formas de ganar (4 equipos + pareja)
   ✅ Inocentes   · saben la palabra · ganan eliminando a impostores Y undercovers
   🤡 Bufón       · sabe la palabra  · solo gana si lo eliminan por votación (neutral)
   🕵️ Impostores · no saben la palabra · ganan por balas o mesa sin inocentes/UCs
   🎭 Undercovers · no saben la palabra · ganan adivinando o últimos en pie
   💔 Pareja      · saben la palabra · equipo de a dos · ganan SOLO ellos dos:
                    cuando no queden impostores NI inocentes
   ================================================================ */
function checkVictory() {
  const g = STATE.game;
  if (!g) return null;

  const alive = g.players.filter(pl => pl.alive);
  const impAlive = alive.filter(pl => pl.isImpostor).length;
  const ucAlive = alive.filter(pl => pl.isUndercover).length;
  // Inocentes puros: ni impostores, ni UCs, ni bufón, ni miembros de la pareja
  const innoAlive = alive.filter(pl => !pl.isImpostor && !pl.isUndercover && !pl.isJester && pl.partnerId === null).length;

  // 💔 Pareja: su misión es solo de ellos dos. Se evalúa ANTES que las balas:
  // el último inocente puede gastar la bala final en el mismo voto, y eso no
  // les roba la victoria a los que cumplieron su misión.
  if (g.couple) {
    const members = g.players.filter(pl => pl.partnerId !== null && pl.partnerId !== undefined);
    const coupleAlive = members.length === 2 && members.every(pl => pl.alive);
    if (coupleAlive && impAlive === 0 && innoAlive === 0) {
      return { winner: 'couple', reason: 'Juntos hasta el final: no quedó ningún impostor ni inocente 💕' };
    }
  }

  // 1) Sin balas: ganan los impostores
  if (g.bullets !== Infinity && g.bullets <= 0) {
    return { winner: 'impostors', reason: 'Se agotaron todas las balas 🔫' };
  }

  // 2) 🎭 Undercover(s) último(s) en pie: eliminó a inocentes E impostores
  if (ucAlive > 0 && impAlive === 0 && innoAlive === 0) {
    return { winner: 'undercover', reason: ucAlive === 1
      ? 'Quedó último en pie: eliminó a inocentes e impostores 🎭'
      : 'Los undercovers quedaron últimos en pie 🎭' };
  }

  // 3) Sin impostores NI undercovers: ganan los inocentes
  //    (la pareja y el bufón no bloquean esta victoria)
  if (impAlive === 0 && ucAlive === 0) {
    return { winner: 'humans', reason: 'Eliminaron a todos los impostores y undercovers 🎯' };
  }

  // 4) Sin inocentes NI undercovers (con impostores aún vivos): ganan los impostores
  if (innoAlive === 0 && ucAlive === 0) {
    return { winner: 'impostors', reason: 'No queda ningún inocente ni undercover 😈' };
  }

  return null;
}

/* ================================================================
   6. VICTORIA
   ================================================================ */
function renderVictoryShell() {
  return `<div class="screen" id="screen-victory"></div>`;
}

function renderVictoryScreen(result) {
  const screen = $('screen-victory');
  if (!screen) return;
  const g = STATE.game;
  clearGameState(); // la partida terminó: ya no hay nada que continuar

  const undercoverWin = result.winner === 'undercover';
  const humansWin = result.winner === 'humans';
  const jesterWin = result.winner === 'jester';
  const coupleWin = result.winner === 'couple';

  let color, glow, emoji, title, btnClass;
  if (coupleWin) {
    color = 'var(--orange)'; glow = ''; emoji = '💕'; title = '¡LA PAREJA GANA!';
    btnClass = '';
  } else if (jesterWin) {
    color = 'var(--yellow)'; glow = 'glow-yellow'; emoji = '🤡'; title = '¡EL BUFÓN GANA!';
    btnClass = '';
  } else if (undercoverWin) {
    color = 'var(--cyan)'; glow = 'glow-cyan'; emoji = '🎭'; title = '¡UNDERCOVER GANA!';
    btnClass = '';
  } else if (humansWin) {
    color = 'var(--green)'; glow = 'glow-green'; emoji = '🏆'; title = '¡INOCENTES GANAN!';
    btnClass = 'btn-green';
  } else {
    color = 'var(--red)'; glow = 'glow-red'; emoji = '👿'; title = '¡IMPOSTORES GANAN!';
    btnClass = 'btn-red';
  }

  if (coupleWin) { playSound('revive'); }
  else if (jesterWin) { playSound('reveal'); setTimeout(() => playSound('impostorWin'), 300); }
  else if (humansWin) playSound('victory');
  else if (undercoverWin) { playSound('reveal'); setTimeout(() => playSound('victory'), 300); }
  else playSound('impostorWin');

  const impostors = g.players.filter(pl => pl.isImpostor);
  const undercovers = g.players.filter(pl => pl.isUndercover);
  const jesters = g.players.filter(pl => pl.isJester);
  const parejaMembers = g.players.filter(pl => pl.partnerId !== null && pl.partnerId !== undefined);
  const leftEarly = g.players.filter(pl => pl.leftEarly);

  const impostorList = impostors.map(pl => `
    <div class="player-item" style="border-color:${humansWin ? 'rgba(57,255,20,0.2)' : 'rgba(255,49,49,0.2)'};">
      <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
      <div style="flex:1;min-width:0;">
        <div class="body-md" style="font-weight:700;">${esc(pl.name)}</div>
        <div class="caption">${pl.alive ? 'Sobrevivió' : 'Fue eliminado'}</div>
      </div>
      <span class="badge badge-impostor">IMPOSTOR</span>
    </div>
  `).join('');

  const undercoverList = undercovers.map(pl => `
    <div class="player-item" style="border-color:rgba(0,245,255,0.2);">
      <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
      <div style="flex:1;min-width:0;">
        <div class="body-md" style="font-weight:700;">${esc(pl.name)}</div>
        <div class="caption">Solo sabía la categoría: <strong style="color:var(--cyan)">${esc(g.category)}</strong></div>
      </div>
      <span class="badge badge-undercover">UNDERCOVER</span>
    </div>
  `).join('');

  const leftList = leftEarly.map(pl => `
    <div class="player-item" style="border-color:var(--border);opacity:0.6;">
      <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
      <div style="flex:1;min-width:0;">
        <div class="body-md" style="font-weight:700;">${esc(pl.name)}</div>
      </div>
      <span class="badge badge-left">👋 ${pl.isImpostor ? 'Impostor' : pl.isUndercover ? 'Undercover' : 'Inocente'}</span>
    </div>
  `).join('');

  const guesserNote = result.guesser
    ? `<div class="caption" style="margin-top:8px;">🎉 Lo logró: <strong style="color:${result.guesser.color}">${esc(result.guesser.name)}</strong></div>`
    : '';

  const jesterNote = jesterWin && result.jester
    ? `<div class="caption" style="margin-top:8px;">🤡 Se hizo pasar por inocente con la palabra <strong style="color:var(--yellow)">${esc(g.secretWord)}</strong></div>`
    : '';

  const particleColor = coupleWin ? 'var(--orange)' : jesterWin ? 'var(--yellow)' : undercoverWin ? 'var(--cyan)' : humansWin ? 'var(--green)' : 'var(--red)';
  const particles = Array.from({ length: 20 }, () => `
    <div class="victory-particle" style="
      left:${Math.random() * 100}%;
      background:${particleColor};
      animation-duration:${2 + Math.random() * 3}s;
      animation-delay:${Math.random() * 2}s;
      width:${2 + Math.random() * 4}px;
      height:${2 + Math.random() * 4}px;
    "></div>
  `).join('');

  screen.innerHTML = `
    <div class="victory-bg">${particles}</div>

    <div class="scroll-area" style="display:flex;flex-direction:column;justify-content:center;padding-top:24px;">
      <div class="anim-scale" style="text-align:center;">
        <div style="font-size:72px;margin-bottom:16px;filter:drop-shadow(0 0 30px ${color});">${emoji}</div>
      </div>
      <div class="anim-fade-up delay-1" style="text-align:center;">
        <div class="title-xl ${glow}" style="margin-bottom:8px;">${title}</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:4px;">${esc(result.reason)}</div>
        <div class="caption">Palabra secreta: <strong style="color:${color}">${esc(g.secretWord)}</strong></div>
        ${guesserNote}
        ${jesterNote}
      </div>

      <div class="anim-fade-up delay-2" style="width:100%;margin-top:28px;">
        ${parejaMembers.length > 0 ? `
          <div class="section-label" style="color:var(--orange);">La Pareja era</div>
          <div>${parejaMembers.map(pl => `
            <div class="player-item" style="border-color:rgba(255,107,53,0.3);">
              <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
              <div style="flex:1;min-width:0;">
                <div class="body-md" style="font-weight:700;">${esc(pl.name)}</div>
                <div class="caption">${coupleWin ? '💕 Su plan funcionó a la perfección' : (pl.alive ? 'Sobrevivió, pero no ganaron' : 'Fue eliminado 💔')}</div>
              </div>
              <span class="badge" style="background:rgba(255,107,53,0.15);border-color:rgba(255,107,53,0.4);color:var(--orange);">💕 PAREJA</span>
            </div>`).join('')}</div>
        ` : ''}
        ${jesters.length > 0 ? `
          <div class="section-label">El Bufón era</div>
          <div>${jesters.map(pl => `
            <div class="player-item" style="border-color:rgba(255,214,0,0.25);">
              <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
              <div style="flex:1;min-width:0;">
                <div class="body-md" style="font-weight:700;">${esc(pl.name)}</div>
                <div class="caption">${pl.alive ? 'Sobrevivió (no lo votaron…)' : 'Misión cumplida 🤡'}</div>
              </div>
              <span class="badge badge-bufon">BUFÓN</span>
            </div>`).join('')}</div>
        ` : ''}
        ${impostors.length > 0 ? `
          <div class="section-label">Los Impostores eran</div>
          <div>${impostorList}</div>
        ` : ''}
        ${undercovers.length > 0 ? `
          <div class="section-label">Los Undercovers eran</div>
          <div>${undercoverList}</div>
        ` : ''}
        ${leftEarly.length > 0 ? `
          <div class="section-label">Se fueron de la partida</div>
          <div>${leftList}</div>
        ` : ''}
      </div>
      <div style="height:16px;"></div>
    </div>

    <div class="screen-footer">
      <button class="btn ${btnClass} anim-fade-up delay-3" onclick="playAgain()">
        🔄 Otra Partida
      </button>
      <button class="btn btn-ghost btn-sm" onclick="backToConfig()">⚙️ Configuración</button>
    </div>
  `;
}

function playAgain() {
  startGame();
}

function backToConfig() {
  navigate('screen-config');
  syncConfigUI();
}
