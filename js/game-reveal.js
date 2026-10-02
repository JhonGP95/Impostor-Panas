/* ================================================================
   3. REVELAR ROLES (pasamanos)
   ================================================================ */
function renderRevealShell() {
  return `<div class="screen" id="screen-reveal"></div>`;
}

function renderRevealScreen() {
  const screen = $('screen-reveal');
  if (!screen) return;
  const g = STATE.game;
  if (!g) return;

  // Limpiar cualquier intento de revelación pendiente de la pantalla anterior
  resetHoldState();
  saveGameState(); // 💾 progreso de la rotación

  // Saltear jugadores que se fueron antes de ver su rol
  while (g.revealCount < g.players.length && !g.players[g.revealOrder[g.revealCount]].alive) {
    g.revealCount++;
  }

  if (g.revealCount >= g.players.length) {
    renderDiscussionScreen();
    navigate('screen-discussion');
    return;
  }

  const player = g.players[g.revealOrder[g.revealCount]];
  const turn = `${g.revealCount + 1} / ${g.players.filter(pl => pl.alive).length}`;

  screen.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 20px;text-align:center;">
      <div class="anim-fade-up" style="margin-bottom:8px;">
        <div class="caption">Turno de ${turn}</div>
        <div class="title-xl" style="color:${player.color};filter:drop-shadow(0 0 12px ${player.color});">
          ${player.avatar} ${esc(player.name)}
        </div>
      </div>

      <div class="anim-fade-up delay-2" style="width:100%;margin-top:28px;">
        <div id="reveal-pre" style="width:100%;">
          <div class="card-glass" style="padding:28px;border-color:rgba(168,85,247,0.3);">
            <div class="lock-breathe" style="font-size:40px;margin-bottom:12px;">🔒</div>
            <div class="title-md" style="color:var(--muted);margin-bottom:8px;">Pantalla protegida</div>
            <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
              Solo <strong style="color:${player.color}">${esc(player.name)}</strong> debe ver esto
            </div>
            <div class="hold-container" id="hold-container">
              <button class="btn btn-hold" id="btn-hold"
                      onpointerdown="startHold(event)"
                      onpointerup="endHold(event)"
                      onpointerleave="endHold(event)"
                      ontouchstart="startHold(event)"
                      ontouchend="endHold(event)"
                      onmousedown="startHold(event)"
                      onmouseup="endHold(event)"
                      onmouseleave="endHold(event)">
                Mantener para revelar
              </button>
              <div class="hold-progress"><div class="hold-fill" id="hold-fill"></div></div>
            </div>
            <div class="caption" style="margin-top:10px;">¿No funciona? Tocá 5 veces seguidas el botón</div>
          </div>
        </div>

        <div id="reveal-card" style="display:none;width:100%;perspective:900px;"></div>
      </div>
    </div>

    <div class="screen-footer">
      <div id="reveal-footer" style="display:none;">
        <button class="btn btn-primary" onclick="nextReveal()">
          Ya lo vi · Pasar celular 👉
        </button>
      </div>
      <div class="controls-row">
        <button class="btn btn-ghost btn-sm" onclick="confirmNewWord()">🔄 Nueva palabra</button>
        <button class="btn btn-ghost btn-sm" onclick="openDeletePlayer()">🗑️ Jugador se fue</button>
        <button class="btn btn-danger-ghost btn-sm" onclick="confirmCancelRound()">✖️ Cancelar ronda</button>
      </div>
    </div>
  `;
}

let holdInterval = null;
let holdProgress = 0;
let holdActive = false;
let holdTaps = 0;
let holdTapsTimer = null;
const HOLD_DURATION = 800;

function startHold(e) {
  if (e) e.preventDefault();
  if (holdActive) return; // ignora eventos duplicados (pointer + touch + mouse)
  const fill = $('hold-fill');
  if (!fill) return;
  holdActive = true;
  holdProgress = 0;
  playSound('hold');
  const btn = $('btn-hold');
  if (btn) btn.style.transform = 'scale(0.98)';
  clearInterval(holdInterval);
  holdInterval = setInterval(() => {
    holdProgress += (50 / HOLD_DURATION) * 100;
    fill.style.width = Math.min(holdProgress, 100) + '%';
    if (holdProgress >= 100) {
      clearInterval(holdInterval);
      revealRole();
    }
  }, 50);
}

function endHold(e) {
  if (e) e.preventDefault();
  if (!holdActive) return; // ignora eventos duplicados o tardíos
  holdActive = false;
  clearInterval(holdInterval);
  const completed = holdProgress >= 100;
  holdProgress = 0;
  const fill = $('hold-fill');
  if (fill) fill.style.width = '0%';
  const btn = $('btn-hold');
  if (btn) btn.style.transform = '';
  if (completed) return;

  // Plan B anti-bloqueo: si en algún dispositivo mantener no llega a completar,
  // 5 toques cortos seguidos también revelan.
  clearTimeout(holdTapsTimer);
  holdTaps++;
  if (holdTaps >= 5) {
    holdTaps = 0;
    revealRole();
  } else {
    holdTapsTimer = setTimeout(() => { holdTaps = 0; }, 1600);
  }
}

function resetHoldState() {
  holdActive = false;
  holdProgress = 0;
  holdTaps = 0;
  clearInterval(holdInterval);
  clearTimeout(holdTapsTimer);
}

function revealRole() {
  const g = STATE.game;
  const player = g.players[g.revealOrder[g.revealCount]];

  const pre = $('reveal-pre');
  const card = $('reveal-card');
  const footer = $('reveal-footer');
  if (!pre || !card || !footer) return;

  playSound('reveal');
  vibrate(50);

  const turnAtStart = g.revealCount;
  const isImp = player.isImpostor;
  const isUC = player.isUndercover;
  const isJester = !!player.isJester;

  // Secuencia: 1) el bloqueo se desvanece  2) entra la carta con destello
  pre.classList.add('leaving');
  setTimeout(() => {
    // Si mientras tanto la pantalla pasó a otro turno, no tocar nada
    if (!STATE.game || STATE.game.revealCount !== turnAtStart) return;

    const preNow = $('reveal-pre');
    const cardNow = $('reveal-card');
    const footerNow = $('reveal-footer');
    if (!cardNow) return;

    if (preNow) preNow.style.display = 'none';
    cardNow.style.display = '';
    if (footerNow) {
      footerNow.style.display = '';
      footerNow.classList.add('anim-fade-up', 'delay-3');
    }

    // Destello del color del rol detrás de la carta
    const flashColor = isImp ? 'rgba(255,49,49,0.4)'
      : isUC ? 'rgba(0,245,255,0.35)'
      : isJester ? 'rgba(255,214,0,0.35)'
      : 'rgba(57,255,20,0.3)';
    const screen = $('screen-reveal');
    if (screen) {
      const f = document.createElement('div');
      f.className = 'reveal-flash';
      f.style.background = `radial-gradient(circle at 50% 42%, ${flashColor} 0%, transparent 65%)`;
      screen.appendChild(f);
      setTimeout(() => f.remove(), 850);
    }
  }, 180);

  // Animaciones combinadas: entrada + pulso de color (los delays escalonan el contenido)
  const A_CARD = isImp
    ? 'animation: cardRevealIn .5s cubic-bezier(.34,1.56,.64,1) both, cardShake .4s .55s ease, pulse-red 2.4s .9s infinite;'
    : isUC
      ? 'animation: cardRevealIn .5s cubic-bezier(.34,1.56,.64,1) both, pulse-cyan 2.4s .9s infinite;'
      : isJester
        ? 'animation: cardRevealIn .5s cubic-bezier(.34,1.56,.64,1) both, pulse-yellow 2.4s .9s infinite;'
        : 'animation: cardRevealIn .5s cubic-bezier(.34,1.56,.64,1) both, pulse-glow-green 2.4s .9s infinite;';
  const A_POP  = 'animation: popIn .45s .28s cubic-bezier(.34,1.56,.64,1) both;';
  const A_UP1  = 'animation: fadeSlideUp .4s .4s ease both;';
  const A_UP2  = 'animation: fadeSlideUp .4s .52s ease both;';
  const A_UP3  = 'animation: fadeSlideUp .45s .64s ease both;';
  const A_UP4  = 'animation: fadeSlideUp .45s .74s ease both;';
  const A_WORD = 'animation: wordIn .65s .5s ease both;';

  // 💔 Panel de pareja secreta (solo para los miembros de la pareja)
  const mate = partnerOf(player);
  const coupleHtml = mate ? `
      <div style="margin-top:20px;padding:14px 16px;background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.35);border-radius:var(--radius-sm);${A_UP4}">
        <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--orange);margin-bottom:6px;">💕 Pareja secreta</div>
        <div class="body-md" style="margin-bottom:8px;">Tu pareja es <strong style="color:var(--orange)">${mate.avatar} ${esc(mate.name)}</strong>.</div>
        <div class="caption" style="line-height:1.6;">
          🤐 <strong style="color:var(--text)">PROHIBIDO decirlo</strong>: si la mesa se entera, los elimina.<br>
          💔 Si tu pareja muere, morís de tristeza… salvo que la salves con el poder Revivir (si muere por granada o kamikaze).
        </div>
      </div>` : '';

  if (isJester) {
    card.innerHTML = `
      <div class="role-card" style="border-color:rgba(255,214,0,0.45);box-shadow:0 0 60px rgba(255,214,0,0.12);${A_CARD}">
        <div style="font-size:52px;margin-bottom:16px;${A_POP}">🤡</div>
        <div class="badge badge-bufon" style="margin-bottom:12px;${A_UP1}">BUFÓN</div>
        <div class="title-xl glow-yellow" style="margin-bottom:8px;${A_WORD}">SOS EL<br>BUFÓN</div>
        <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:16px;${A_UP2}">
          Tu misión: que la mesa te <strong style="color:var(--yellow)">elimine por votación</strong>.<br>
          Fingí, meté sospechas sobre vos, sé obvio… pero no tanto.
        </div>
        <div style="margin-top:20px;padding:14px 16px;background:rgba(255,214,0,0.06);border:1px solid rgba(255,214,0,0.25);border-radius:var(--radius-sm);${A_UP3}">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--yellow);margin-bottom:6px;">🗝️ Para fingir, la palabra de los inocentes es</div>
          <div class="title-md glow-yellow">${esc(g.secretWord)}</div>
          <div class="caption" style="margin-top:6px;">Categoría: ${esc(g.category)}</div>
        </div>
        <div style="margin-top:12px;${A_UP3}">
          <div class="caption" style="line-height:1.6;">⚠️ Solo cuenta el <strong style="color:var(--yellow)">voto</strong>: si morís por granada, kamikaze, sacrificio o te vas, no ganás nada.</div>
        </div>
        ${coupleHtml}
      </div>`;
  } else if (isUC) {
    card.innerHTML = `
      <div class="role-card" style="border-color:rgba(0,245,255,0.4);box-shadow:0 0 60px rgba(0,245,255,0.15);${A_CARD}">
        <div style="font-size:52px;margin-bottom:16px;${A_POP}">🎭</div>
        <div class="badge badge-undercover" style="margin-bottom:12px;${A_UP1}">UNDERCOVER</div>
        <div style="margin:4px 0 16px;${A_UP1}">
          <div class="caption" style="text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">📂 Tu única pista: la categoría</div>
          <div class="title-xl glow-cyan">${esc(g.category)}</div>
        </div>
        <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:8px;${A_UP2}">
          No tenés palabra: la de ellos es un <strong style="color:var(--cyan)">misterio para vos</strong>.<br>
          Mezclate, inventá pistas que encajen en la categoría…<br>
          y tu momento llegará: <strong style="color:var(--cyan)">te van a eliminar</strong>.
        </div>
        <div style="margin-top:20px;padding:14px 16px;background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.2);border-radius:var(--radius-sm);${A_UP3}">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan);margin-bottom:6px;">🎯 Tu deber para ganar</div>
          <div class="body-md" style="color:var(--muted);font-size:13px;">Cuando te eliminen, vas a tener una oportunidad de <strong style="color:var(--cyan)">adivinar la palabra secreta</strong>. Si aciertas, ¡ganás todo!</div>
        </div>
        ${coupleHtml}
      </div>`;
  } else if (isImp) {
    card.innerHTML = `
      <div class="role-card role-card-impostor" style="${A_CARD}">
        <div style="font-size:52px;margin-bottom:16px;animation: popIn .45s .28s cubic-bezier(.34,1.56,.64,1) both, glitch 3s 1.4s infinite;">💀</div>
        <div class="badge badge-impostor" style="margin-bottom:12px;${A_UP1}">IMPOSTOR</div>
        <div class="title-xl glow-red" style="margin-bottom:8px;${A_WORD}">SOS EL<br>IMPOSTOR</div>
        <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:16px;${A_UP2}">
          Nadie conoce tu secreto.<br>Fingí que la sabés.
        </div>
        ${g.currentHint ? `
        <div style="margin-top:20px;padding:14px 16px;background:rgba(255,49,49,0.08);border:1px solid rgba(255,49,49,0.2);border-radius:var(--radius-sm);${A_UP3}">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--red);margin-bottom:6px;">Pista para vos</div>
          <div class="title-md glow-red">${esc(g.currentHint)}</div>
        </div>` : ''}
        ${coupleHtml}
      </div>`;
  } else {
    const isCoupleMember = player.partnerId !== null && player.partnerId !== undefined;
    const headHtml = isCoupleMember ? `
        <div style="font-size:52px;margin-bottom:16px;${A_POP}">💕</div>
        <div class="badge" style="margin-bottom:12px;${A_UP1}background:rgba(255,107,53,0.15);border:1px solid rgba(255,107,53,0.45);color:var(--orange);">PAREJA SECRETA</div>
        <div class="title-xl" style="margin-bottom:8px;${A_WORD}color:var(--orange);text-shadow:0 0 24px rgba(255,107,53,0.45);">Ustedes Dos<br>Contra Todos</div>
        <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:16px;${A_UP2}">
          Son su <strong style="color:var(--orange)">propio equipo</strong>: no son inocentes para el juego.<br>
          Su misión: que caigan <strong style="color:var(--text)">todos los impostores y todos los inocentes</strong>.<br>
          Ganarán solo ustedes dos. 💕
        </div>` : `
        <div style="font-size:52px;margin-bottom:16px;${A_POP}">✅</div>
        <div class="badge badge-human" style="margin-bottom:12px;${A_UP1}">INOCENTE</div>
        <div class="title-xl glow-green" style="margin-bottom:8px;${A_WORD}">${esc(g.secretWord)}</div>
        <div style="color:var(--muted);font-size:15px;line-height:1.5;margin-top:16px;${A_UP2}">
          Esta es la palabra secreta.<br>¡No dejes que el impostor la adivine!
        </div>
        <div style="margin-top:12px;${A_UP3}">
          <div class="caption" style="text-transform:uppercase;letter-spacing:0.08em;">Categoría</div>
          <div class="body-md" style="color:var(--green);">${esc(g.category)}</div>
        </div>`;
    card.innerHTML = `
      <div class="role-card ${isCoupleMember ? '' : 'role-card-human'}" style="${A_CARD};${isCoupleMember ? 'border-color:rgba(255,107,53,0.45);box-shadow:0 0 60px rgba(255,107,53,0.12);' : ''}">
        ${headHtml}
        ${coupleHtml}
      </div>`;
  }
}

function nextReveal() {
  const g = STATE.game;
  g.revealCount++;
  renderRevealScreen(); // si era el último, deriva a la discusión
}

function confirmNewWord() {
  playSound('tap');
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🔄</div>
      <div class="title-md" style="margin-bottom:8px;">¿Palabra repetida?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
        Se sortea una <strong>nueva palabra</strong> para la misma partida (mismos roles) y la rotación empieza de nuevo.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="redrawWord()">🎲 Nueva Palabra</button>
        <button class="btn btn-ghost" onclick="closeModal()">Seguir con esta</button>
      </div>
    </div>
  `);
}

function redrawWord() {
  closeModal();
  const g = STATE.game;
  const pool = wordPool();
  const chosen = rand(pool);
  const catName = (DB.all().find(c => c.palabras.includes(chosen)) || {}).categoria || '?';

  g.secretWord = chosen.palabra;
  g.category = catName;
  g.allHints = [chosen.pista1, chosen.pista2].filter(Boolean);
  g.currentHint = (STATE.config.withHints && g.allHints.length > 0) ? rand(g.allHints) : null;
  g.usedHints = g.currentHint ? [g.currentHint] : [];

  // Los undercovers no tienen palabra propia: solo conocen la nueva categoría.
  // (Su misión sigue igual: adivinar la palabra secreta al ser eliminados.)

  g.revealCount = 0;
  playSound('start');
  renderRevealScreen();
}

function confirmCancelRound() {
  playSound('tap');
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">✖️</div>
      <div class="title-md" style="margin-bottom:8px;">¿Cancelar ronda?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
        Se corta la partida al instante y volvés a la pantalla de configuración.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-red" onclick="cancelRound()">Sí, cancelar ronda</button>
        <button class="btn btn-ghost" onclick="closeModal()">Seguir jugando</button>
      </div>
    </div>
  `);
}

function cancelRound() {
  closeModal();
  clearGameState(); // ronda cancelada: sin partida en curso
  navigate('screen-config');
  syncConfigUI();
}
