/* ================================================================
   5. VOTACIÓN
   ================================================================ */
function renderVotingShell() {
  return `<div class="screen" id="screen-voting"></div>`;
}

function aliveCount(g, filterFn) {
  return g.players.filter(pl => pl.alive && (!filterFn || filterFn(pl))).length;
}

function renderVotingScreen() {
  const screen = $('screen-voting');
  if (!screen) return;
  const g = STATE.game;
  if (!g) return;
  saveGameState(); // 💾 partida en curso al día

  const alivePlayers = g.players.filter(pl => pl.alive);

  const bulletsDisplay = g.bullets === Infinity
    ? '<span style="color:var(--cyan)">∞</span>'
    : `<span style="${g.bullets <= 1 ? 'color:var(--red)' : 'color:var(--yellow)'}">${g.bullets}</span>`;

  // 🎲 Modo impostores aleatorios: el número es sorpresa. Se ocultan los chips
  // que lo delatan (impostores vivos e inocentes vivos: con el total a la vista,
  // vivos − inocentes − UC = impostores) y también el de pista.
  // 👁️ Modo "sin revelar roles": pasar de las cuentas también (delatan muertes).
  const randomMode = !!g.randomImpostors;
  const hideNumbers = randomMode || !g.revealRoles;

  const ucAlive = aliveCount(g, pl => pl.isUndercover);
  const ucChip = (ucAlive > 0 && !hideNumbers)
    ? `<div class="stat-chip stat-chip-cyan">🎭 ${ucAlive} ${ucAlive === 1 ? 'undercover' : 'undercovers'}</div>`
    : (ucAlive > 0 ? `<div class="stat-chip stat-chip-cyan">🎭 ¿?</div>` : '');

  const impAlive = aliveCount(g, pl => pl.isImpostor);
  const impChip = randomMode
    ? `<div class="stat-chip stat-chip-blue">🎲 Impostores: ¿?</div>`
    : hideNumbers
      ? `<div class="stat-chip stat-chip-blue">🕵️ Impostores: ❓</div>`
      : `<div class="stat-chip stat-chip-blue">🕵️ ${impAlive} ${impAlive === 1 ? 'impostor' : 'impostores'}</div>`;
  const innoChip = hideNumbers
    ? ''
    : `<div class="stat-chip stat-chip-green">✅ ${aliveCount(g, pl => !pl.isImpostor && !pl.isUndercover && !pl.isJester)} inocentes</div>`;
  // Contra qué tipo de impostor se enfrenta la mesa (solo si el número es conocido)
  const hintChip = randomMode
    ? ''
    : `<div class="stat-chip stat-chip-violet">${g.withHints ? '💡 Con pista' : '🚫 Sin pista'}</div>`;

  // 📱 Modo compacto automático en mesas grandes
  const compactClass = alivePlayers.length > BALANCE.VOTING_COMPACT_THRESHOLD ? 'compact' : '';

  const playerRows = alivePlayers.map(pl => `
    <div class="vote-item anim-fade-up" id="vote-row-${pl.id}">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
        <div style="min-width:0;">
          <div class="body-md" style="font-weight:600;">${esc(pl.name)}</div>
          <div class="caption">En juego</div>
        </div>
      </div>
      <button class="btn btn-red btn-sm" style="width:auto;padding:10px 18px;flex-shrink:0;" onclick="confirmVote(${pl.id})">
        Votar
      </button>
    </div>
  `).join('');

  const elimRows = g.eliminated.map(pl => {
    let badge;
    if (pl.leftEarly) badge = `<span class="badge badge-left">👋 Se fue</span>`;
    else if (!g.revealRoles) badge = `<span class="badge badge-left">❓ Sin revelar</span>`;
    else if (pl.isImpostor) badge = `<span class="badge badge-impostor">Impostor</span>`;
    else if (pl.isUndercover) badge = `<span class="badge badge-undercover">Undercover</span>`;
    else if (pl.isJester) badge = `<span class="badge badge-bufon">Bufón</span>`;
    else badge = `<span class="badge badge-human">Inocente</span>`;
    if (pl.diedOf === 'heartbreak') badge += ` <span class="badge badge-left">💔</span>`;
    return `
    <div class="vote-item" style="opacity:0.45;">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;filter:grayscale(0.7);">${pl.avatar}</div>
        <div style="min-width:0;">
          <div class="body-md" style="font-weight:600;text-decoration:line-through;">${esc(pl.name)}</div>
        </div>
      </div>
      ${badge}
    </div>`;
  }).join('');

  const grenadeBtn = (g.powersEnabled.grenade && !g.powersUsed.grenade)
    ? `<button class="btn btn-power" onclick="useGrenade()">💥 Granada</button>`
    : '';
  const sacrificioBtn = (g.powersEnabled.sacrificio && !g.powersUsed.sacrificio)
    ? `<button class="btn btn-power btn-sacrificio" onclick="useSacrificio()">⚔️ Sacrificio</button>`
    : '';
  // Revivir aparece bloqueado (con explicación al tocarlo) si no hay balas suficientes
  const revivirLocked = revivirBlocked();
  const revivirBtn = (g.powersEnabled.revivir && !g.powersUsed.revivir)
    ? `<button class="btn btn-power btn-revive ${revivirLocked ? 'btn-power-locked' : ''}" onclick="useRevivir()">🕊️ Revivir${revivirLocked ? ' 🔒' : ''}</button>`
    : '';
  const hasPowers = grenadeBtn || sacrificioBtn || revivirBtn;

  screen.innerHTML = `
    <div class="screen-header">
      <div style="flex:1;">
        <div class="title-lg">Votación</div>
        <div class="caption">Elijan a quién sacar de la partida</div>
      </div>
    </div>

    <div class="stat-chips">
      <div class="stat-chip stat-chip-red">🔫 ${bulletsDisplay} balas</div>
      ${impChip}
      ${innoChip}
      ${ucChip}
      ${hintChip}
    </div>

    <div class="scroll-area">
      <div class="section-label" style="margin-top:0;">Jugadores vivos</div>
      <div id="alive-list" class="${compactClass}">${playerRows}</div>

      ${g.eliminated.length > 0 ? `
        <div class="divider"></div>
        <div class="section-label">Fuera de la partida</div>
        <div id="elim-list">${elimRows}</div>
      ` : ''}

      <div style="height:16px;"></div>
    </div>

    <div class="screen-footer">
      ${hasPowers ? `<div class="controls-row">${grenadeBtn}${sacrificioBtn}${revivirBtn}</div>` : ''}
      <div class="controls-row">
        <button class="btn btn-ghost btn-sm" onclick="openDeletePlayer()">🗑️ Jugador se fue</button>
        <button class="btn btn-danger-ghost btn-sm" onclick="confirmCancelRound()">✖️ Cancelar ronda</button>
      </div>
    </div>
  `;
}

function confirmVote(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || !p.alive) return;

  playSound('tap');

  openModal(`
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">${p.avatar}</div>
      <div class="title-md" style="margin-bottom:8px;">¿Eliminar a</div>
      <div class="title-lg" style="color:${p.color};filter:drop-shadow(0 0 12px ${p.color});margin-bottom:24px;">${esc(p.name)}?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:24px;">Esta acción no se puede deshacer.</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-red" onclick="executeVote(${playerId})">⚡ Confirmar Eliminación</button>
        <button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
      </div>
    </div>
  `);
}

function executeVote(playerId) {
  closeModal();
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || !p.alive) return;

  p.alive = false;
  g.eliminated.push(p);
  playSound('eliminate');
  vibrate(120);

  if (p.isUndercover) {
    if (g.bullets !== Infinity) g.bullets--;
    // Última oportunidad del undercover: adivinar la palabra real.
    // Sin categoría en pantalla: el undercover ya la conoce y mostrarla
    // públicamente le filtraría información al impostor.
    openUcGuessModal(p.id);
    return;
  }

  if (!p.isImpostor) {
    // Inocente o bufón eliminado por votación: se gasta una bala
    if (g.bullets !== Infinity) g.bullets--;
  }

  // 🤡 Bufón: su misión era que lo eliminaran por votación. ¡Lo logró!
  if (p.isJester) {
    playSound('victory');
    renderVictoryScreen({ winner: 'jester', jester: p, reason: 'Lo eliminaron por votación — misión cumplida 🤡' });
    navigate('screen-victory');
    return;
  }

  // 💔 Corazón roto: si el eliminado tenía pareja, muere de tristeza al instante
  // (sin opción de salvación: esa existe solo contra granada y kamikaze)
  const broken = applyHeartbreak(p);
  if (broken) queueHeartbreak(p, broken);

  // 💣 Kamikaze: si el impostor eliminado lo tenía, decide si activarlo
  if (p.isImpostor && p.kamikaze && g.powersEnabled.kamikaze) {
    openKamikazeModal(p);
    return;
  }

  processHeartbreakQueue(() => {
    const v = checkVictory();
    if (v) {
      renderVictoryScreen(v);
      navigate('screen-victory');
      return;
    }
    renderVotingScreen();
  });
}

/* ================================================================
   💔 TRAGEDIA ROMÁNTICA — cola de corazones rotos con su teatrito
   ================================================================ */
let hbThen = null;

function queueHeartbreak(eliminated, broken) {
  const g = STATE.game;
  if (!broken) return;
  if (!Array.isArray(g.pendingHeartbreaks)) g.pendingHeartbreaks = [];
  g.pendingHeartbreaks.push({ loverId: eliminated.id, sadId: broken.id });
}

// Muestra los corazones rotos encolados, uno por uno, y al final ejecuta then()
function processHeartbreakQueue(then) {
  const g = STATE.game;
  if (!Array.isArray(g.pendingHeartbreaks)) g.pendingHeartbreaks = [];
  const hb = g.pendingHeartbreaks.shift();
  if (!hb) { then(); return; }
  const lover = g.players.find(pl => pl.id === hb.loverId);
  const sad = g.players.find(pl => pl.id === hb.sadId);
  if (!lover || !sad || sad.alive) { processHeartbreakQueue(then); return; }
  showHeartbreakModal(lover, sad, then);
}

function showHeartbreakModal(lover, sad, then) {
  hbThen = then;
  playSound('eliminate');
  vibrate([60, 30, 60, 30, 120]);
  const epitafios = [
    '"El amor es más fuerte que el miedo… pero no que una votación." — El Destino',
    '"Prometieron no decirlo. El destino tenía otros planes." — La mesa',
    '"Y colorín colorado, este amor ha terminado." — El cuento de la noche',
    '"Rosa, romántica… y letal." — Crónica de la partida',
    '"Ni los impostores matan tan rápido como la tristeza." — Sabiduría popular'
  ];
  openModal(`
    <div style="text-align:center;">
      <div class="anim-scale" style="font-size:60px;margin-bottom:10px;">💔</div>
      <div class="title-xl" style="color:var(--orange);text-shadow:0 0 24px rgba(255,107,53,0.45);margin-bottom:4px;">TRAGEDIA ROMÁNTICA</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:16px;">El corazón de <strong style="color:var(--text)">${esc(sad.name)}</strong> se rompió en mil pedazos…</div>
      <div class="vote-item" style="border-color:rgba(255,107,53,0.4);">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <div class="player-avatar anim-halo" style="background:${sad.color}22;color:${sad.color};font-size:20px;filter:grayscale(0.7);">${sad.avatar}</div>
          <div style="min-width:0;">
            <div class="body-md" style="font-weight:700;">${esc(sad.name)} ha muerto de tristeza</div>
            <div class="caption">Su pareja secreta era <strong style="color:var(--orange)">${lover.avatar} ${esc(lover.name)}</strong>, eliminada hace un momento 💐</div>
          </div>
        </div>
      </div>
      <div class="info-note" style="margin:16px 0;font-style:italic;">${epitafios[randInt(epitafios.length)]}</div>
      <button class="btn btn-primary" onclick="heartbreakContinue()">💔 Momento de silencio</button>
    </div>
  `);
}

function heartbreakContinue() {
  closeModal();
  const t = hbThen;
  hbThen = null;
  if (t) t();
}

// 💔 Muerte de tristeza: cuando muere un miembro de la pareja, el otro lo sigue.
// Devuelve la pareja muerta (o null). NO aplica si el otro ya está muerto.
function applyHeartbreak(p) {
  const g = STATE.game;
  const mate = partnerOf(p);
  if (!mate || !mate.alive) return null;
  mate.alive = false;
  mate.diedOf = 'heartbreak';
  g.eliminated.push(mate);
  playSound('eliminate');
  vibrate([60, 40, 120]);
  return mate;
}

function undercoverGuessResult(guessed, playerId) {
  closeModal();
  const g = STATE.game;
  const guesser = g.players.find(pl => pl.id === playerId);

  if (guessed) {
    playSound('victory');
    g.pendingUcGuesses = []; // la partida terminó: limpiar pendientes
    renderVictoryScreen({
      winner: 'undercover',
      reason: '¡Adivinó la palabra secreta al ser eliminado!',
      guesser
    });
    navigate('screen-victory');
    return;
  }

  playSound('eliminate');

  // 💔 Si el UC eliminado tenía pareja, muere de tristeza (con su teatrito)
  const guesserRef = guesser || g.players.find(pl => pl.id === playerId);
  if (guesserRef) {
    const broken = applyHeartbreak(guesserRef);
    if (broken) queueHeartbreak(guesserRef, broken);
  }

  processHeartbreakQueue(() => {
    // ¿Quedan más UCs muertos por poderes con su adivinanza pendiente?
    if (Array.isArray(g.pendingUcGuesses) && g.pendingUcGuesses.length > 0) {
      openUcGuessModal(g.pendingUcGuesses.shift());
      return;
    }

    const v = checkVictory();
    if (v) {
      renderVictoryScreen(v);
      navigate('screen-victory');
      return;
    }
    renderVotingScreen();
  });
}
