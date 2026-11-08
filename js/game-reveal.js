/* ================================================================
   REVELACIÓN PRIVADA · PASAR EL CELULAR
   ================================================================ */
function renderRevealShell() {
  return '<div class="screen" id="screen-reveal"></div>';
}

function renderRevealScreen() {
  const screen = $('screen-reveal');
  const g = STATE.game;
  if (!screen || !g) return;

  resetHoldState();
  while (g.revealCount < g.revealOrder.length && !g.players[g.revealOrder[g.revealCount]].alive) {
    g.revealCount++;
  }
  if (g.revealCount >= g.revealOrder.length) {
    screen.replaceChildren();
    renderDiscussionScreen();
    navigate('screen-discussion');
    return;
  }

  g.phase = 'reveal';
  saveGameState();

  const player = g.players[g.revealOrder[g.revealCount]];
  const total = g.players.filter(pl => pl.alive).length;
  const turn = g.revealOrder.slice(0, g.revealCount + 1).filter(id => g.players[id].alive).length;
  screen.innerHTML = `
    <div class="screen-scroll reveal-scroll">
      <div class="scroll-center">
        <div class="reveal-turn anim-fade-up">
          <div class="caption">Turno ${turn} de ${total}</div>
          <h1 class="title-xl" style="color:${player.color}">${player.avatar} ${esc(player.name)}</h1>
        </div>

        <div id="reveal-pre" class="reveal-lock anim-fade-up delay-1">
          <div class="private-icon" aria-hidden="true">🔒</div>
          <h2 class="title-md">Pantalla protegida</h2>
          <p class="body-md">Solo <strong>${esc(player.name)}</strong> debe mirar.</p>
          <button class="btn btn-hold" id="btn-hold" type="button" aria-describedby="hold-help"
                  onpointerdown="startHold(event)" onpointerup="endHold(event)"
                  onpointermove="moveHold(event)" onpointerleave="endHold(event)"
                  onpointercancel="endHold(event)" oncontextmenu="event.preventDefault()"
                  onclick="tapToReveal(event)">
            <span>Mantén para revelar</span>
          </button>
          <p class="caption" id="hold-help">También puedes tocar 5 veces seguidas.</p>
        </div>

        <div id="reveal-card" hidden></div>
      </div>
    </div>

    <div class="screen-footer">
      <div id="reveal-footer" class="anim-fade-up" hidden>
        <button class="btn btn-primary" id="reveal-next" onclick="nextReveal()">Ya lo vi · Pasar celular 👉</button>
      </div>
      <div class="controls-row">
        <button class="btn btn-ghost btn-sm" onclick="confirmNewWord()">🔄 Nueva palabra</button>
        <button class="btn btn-ghost btn-sm" onclick="openDeletePlayer()">🗑️ Jugador se fue</button>
        <button class="btn btn-danger-ghost btn-sm" onclick="confirmCancelRound()">✖️ Cancelar ronda</button>
      </div>
    </div>
  `;
}

const HOLD_DURATION = 800;
let holdTimer;
let holdPointer = null;
let holdTaps = 0;
let holdTapsTimer;

function startHold(event) {
  if (holdPointer !== null || !event.isPrimary || event.button !== 0) return;
  const button = event.currentTarget;
  holdPointer = event.pointerId;
  button.classList.add('holding');
  playSound('hold');
  holdTimer = setTimeout(revealRole, HOLD_DURATION);
}

function endHold(event) {
  if (event.pointerId !== holdPointer) return;
  cancelHold();
}

function moveHold(event) {
  if (event.pointerId !== holdPointer) return;
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
    cancelHold();
  }
}

function cancelHold() {
  clearTimeout(holdTimer);
  holdPointer = null;
  $('btn-hold')?.classList.remove('holding');
}

function tapToReveal(event) {
  if (event.detail === 0 || ++holdTaps >= 5) {
    revealRole();
    return;
  }
  clearTimeout(holdTapsTimer);
  holdTapsTimer = setTimeout(() => { holdTaps = 0; }, 1600);
}

function resetHoldState() {
  cancelHold();
  clearTimeout(holdTapsTimer);
  holdTaps = 0;
}

function renderPrivateRole(player, reminder = false) {
  const g = STATE.game;
  const mate = partnerOf(player);
  let role, label, emoji, prompt, detail, note;

  if (mate) {
    role = 'couple';
    label = 'Pareja secreta';
    emoji = '💕';
    prompt = 'Tu pista';
    detail = g.allHints[0] || 'Sin pista disponible';
    note = `<strong>Tu pareja es ${mate.avatar} ${esc(mate.name)}.</strong><br>Guarden el secreto. Si cae uno, caen los dos.`;
  } else if (player.isImpostor) {
    role = 'impostor';
    label = 'Impostor';
    emoji = '💀';
    prompt = !reminder && g.currentHint ? 'Tu pista' : '';
    detail = !reminder && g.currentHint ? g.currentHint : 'Finge que la sabes';
    note = 'Da una pista que encaje con lo que dice la mesa.';
  } else if (player.isUndercover) {
    role = 'undercover';
    label = 'Undercover';
    emoji = '🎭';
    prompt = 'Tu categoría';
    detail = g.category;
    note = 'Si te eliminan, puedes ganar adivinando la palabra secreta.';
  } else {
    role = player.isJester ? 'jester' : 'human';
    label = player.isJester ? 'Bufón' : 'Inocente';
    emoji = player.isJester ? '🤡' : '✅';
    prompt = 'Tu palabra';
    detail = g.secretWord;
    note = `${player.isJester ? 'Tu misión es que la mesa te elimine por votación.' : 'Da pistas sin decir la palabra.'}<br><span class="caption">Categoría · ${esc(g.category)}</span>`;
  }

  return `
    <div class="role-card role-card-${role} private-card">
      <div class="private-icon" aria-hidden="true">${emoji}</div>
      <div class="badge">${label}</div>
      <div class="private-detail">
        ${prompt ? `<div class="caption">${prompt}</div>` : ''}
        <h2 class="title-xl">${esc(detail)}</h2>
      </div>
      <p class="body-md">${note}</p>
    </div>
  `;
}

function revealRole() {
  const g = STATE.game;
  const locked = $('reveal-pre');
  if (!g || !locked || locked.hidden || STATE.currentScreen !== 'screen-reveal' || $('modal').classList.contains('open')) return;

  const player = g.players[g.revealOrder[g.revealCount]];
  const card = $('reveal-card');
  resetHoldState();
  playSound('reveal');
  vibrate(50);
  locked.hidden = true;
  card.innerHTML = renderPrivateRole(player);
  card.hidden = false;
  $('reveal-footer').hidden = false;
  $('reveal-next').focus({ preventScroll: true });
}

function nextReveal() {
  const g = STATE.game;
  if (!g || $('reveal-footer')?.hidden) return;
  g.revealCount++;
  renderRevealScreen();
  $('btn-hold')?.focus({ preventScroll: true });
}

function confirmNewWord() {
  playSound('tap');
  openModal(`
    <div class="dialog-stack">
      <div class="private-icon" aria-hidden="true">🔄</div>
      <h2 class="title-md">¿Cambiar la palabra?</h2>
      <p class="body-md">Conservan sus roles y vuelven a pasar el celular para ver la nueva palabra o pista.</p>
      <button class="btn btn-primary" onclick="redrawWord()">🎲 Nueva palabra</button>
      <button class="btn btn-ghost" onclick="closeModal()">Seguir con esta</button>
    </div>
  `);
}

function redrawWord() {
  const g = STATE.game;
  const word = drawRoundWord(g.withHints, g.secretWord);
  closeModal();
  if (!word) return;
  Object.assign(g, word, { revealCount: 0 });
  playSound('start');
  renderRevealScreen();
}

function confirmCancelRound() {
  playSound('tap');
  openModal(`
    <div class="dialog-stack">
      <div class="private-icon" aria-hidden="true">✖️</div>
      <h2 class="title-md">¿Cancelar ronda?</h2>
      <p class="body-md">La partida termina y vuelves a la configuración.</p>
      <button class="btn btn-red" onclick="cancelRound()">Sí, cancelar ronda</button>
      <button class="btn btn-ghost" onclick="closeModal()">Seguir jugando</button>
    </div>
  `);
}

function cancelRound() {
  closeModal();
  resetHoldState();
  $('screen-reveal').replaceChildren();
  clearGameState();
  STATE.game = null;
  navigate('screen-config');
  syncConfigUI();
}
