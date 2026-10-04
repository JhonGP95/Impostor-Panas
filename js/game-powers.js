/* ================================================================
   PODERES (una vez por partida)
   ================================================================ */
function useGrenade() {
  const g = STATE.game;
  if (!g.powersEnabled.grenade || g.powersUsed.grenade) return;
  playSound('tap');

  const GB = BALANCE.GRENADE;
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">💥</div>
      <div class="title-md" style="margin-bottom:8px;">¿Lanzar la Granada?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Resultado totalmente aleatorio. Solo se puede usar <strong>una vez</strong> en toda la partida.
      </div>
      <div class="info-note" style="text-align:left;margin-bottom:24px;">
        😬 ${Math.round(GB.P_ONLY_INNOCENTS * 100)}% · solo inocentes<br>
        💥 ${Math.round(GB.P_MIXED * 100)}% · mezcla, con al menos 1 impostor<br>
        🍀 ${Math.round(GB.P_ONLY_IMPOSTORS * 100)}% · solo impostores
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-red" onclick="launchGrenade()">💥 Lanzar</button>
        <button class="btn btn-ghost" onclick="closeModal()">Mejor no</button>
      </div>
    </div>
  `);
}

function launchGrenade() {
  const g = STATE.game;
  if (g.powersUsed.grenade) return; // guard anti doble tap
  g.powersUsed.grenade = true;

  const GB = BALANCE.GRENADE;
  const alive = g.players.filter(pl => pl.alive);
  const innocents = alive.filter(pl => !pl.isImpostor); // incluye undercover
  const impostors = alive.filter(pl => pl.isImpostor);

  // Víctimas escaladas a los jugadores vivos
  const wanted = Math.max(GB.MIN_VICTIMS, Math.floor(alive.length / GB.VICTIM_DIVISOR));
  const victimCount = Math.min(wanted, alive.length);

  const roll = Math.random() * 100;
  let targets = [];

  if (roll < GB.P_ONLY_IMPOSTORS * 100) {
    // 🍀 Apunta solo impostores; si no alcanzan, completa con inocentes
    const imps = pickRandom(impostors, victimCount);
    targets = imps.concat(pickRandom(innocents, victimCount - imps.length));
  } else if (roll < (GB.P_ONLY_IMPOSTORS + GB.P_MIXED) * 100) {
    // 💥 Mixto: garantiza al menos 1 impostor si hay alguno vivo
    const imps = impostors.length > 0 ? pickRandom(impostors, 1) : [];
    targets = imps.concat(pickRandom(innocents, victimCount - imps.length));
    if (targets.length < victimCount) {
      // Muy pocos vivos: completar con impostores restantes
      targets = targets.concat(pickRandom(
        impostors.filter(x => !targets.includes(x)),
        victimCount - targets.length
      ));
    }
  } else {
    // 😬 Apunta solo inocentes; si no alcanzan, completa con impostores
    const innos = pickRandom(innocents, victimCount);
    targets = innos.concat(pickRandom(impostors, victimCount - innos.length));
  }

  const { dead, saved } = applyChaosDeaths(targets);

  // Título y subtítulo HONESTOS: describen lo que realmente pasó
  const { emoji, title, subtitle } = grenadeHeadline(dead);
  showCasualtiesModal({ emoji, title, subtitle, dead, saved });
}

// Encabezado del modal de granada calculado desde las bajas reales
function grenadeHeadline(dead) {
  const dImp = dead.filter(pl => pl.isImpostor).length;
  const dInno = dead.filter(pl => !pl.isImpostor).length;

  const plural = (n, word) => n === 1 ? word : (word === 'inocente' ? 'inocentes' : 'impostores');

  if (dImp > 0 && dInno > 0) {
    return {
      emoji: '💥',
      title: 'KA-BOOM',
      subtitle: `La explosión alcanzó a ${dInno} ${plural(dInno, 'inocente')} y ${dImp} ${plural(dImp, 'impostor')}.`
    };
  }
  if (dImp > 0) {
    return {
      emoji: '🍀',
      title: '¡GOLPE DE SUERTE!',
      subtitle: 'La explosión alcanzó solo al lado impostor.'
    };
  }
  if (dInno > 0) {
    return {
      emoji: '😬',
      title: 'KA-BOOM',
      subtitle: `La explosión alcanzó solo a ${dInno} ${plural(dInno, 'inocente')}…`
    };
  }
  return {
    emoji: '🤔',
    title: '¡FUMATA!',
    subtitle: 'La explosión no alcanzó a nadie…'
  };
}

// Aplica muertes de poderes caóticos (granada / kamikaze). El Ángel Guardián
// salva a los alcanzados que lo tengan; devuelve quién murió y quién fue salvado.
// 💔 Pareja: la muerte de un miembro arrastra al otro (su propio ángel los cubre
// por separado; el corazón roto no tiene salvación). Encola UCs con adivinanza
// pendiente y las tragedias románticas para el teatrito.
function applyChaosDeaths(targets) {
  const g = STATE.game;
  const dead = [];
  const saved = [];
  const seen = new Set();
  if (!Array.isArray(g.pendingUcGuesses)) g.pendingUcGuesses = [];
  if (!Array.isArray(g.pendingHeartbreaks)) g.pendingHeartbreaks = [];

  const kill = (pl) => {
    pl.alive = false;
    g.eliminated.push(pl);
    dead.push(pl);
    if (pl.isUndercover) g.pendingUcGuesses.push(pl.id);
    const mate = partnerOf(pl);
    if (mate && mate.alive && !seen.has(mate.id)) {
      seen.add(mate.id);
      applyHeartbreak(pl); // 💔 corazón roto inmediato, sin salvación
      dead.push(mate);
      queueHeartbreak(pl, mate); // teatrito al cerrar el resumen de bajas
      if (mate.isUndercover) g.pendingUcGuesses.push(mate.id);
    }
  };

  targets.forEach(pl => {
    if (seen.has(pl.id)) return;
    seen.add(pl.id);
    if (!pl.alive) return;
    if (pl.angel) {
      pl.angel = false; // el ángel se consumió al salvarlo
      saved.push(pl);
    } else {
      kill(pl);
    }
  });
  return { dead, saved };
}

function roleBadgeFor(pl) {
  if (pl.isImpostor) return `<span class="badge badge-impostor">Impostor</span>`;
  if (pl.isUndercover) return `<span class="badge badge-undercover">Undercover</span>`;
  if (pl.isJester) return `<span class="badge badge-bufon">Bufón</span>`;
  return `<span class="badge badge-human">Inocente</span>`;
}

function casualtyRows(dead) {
  if (dead.length === 0) return `<div class="body-md" style="color:var(--muted);padding:8px;">Nadie murió…</div>`;
  return dead.map(pl => `
    <div class="vote-item" style="opacity:0.85;">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div class="player-avatar" style="background:${pl.color}22;color:${pl.color};font-size:20px;filter:grayscale(0.7);">${pl.avatar}</div>
        <div class="body-md" style="font-weight:600;">${esc(pl.name)}</div>
      </div>
      ${roleBadgeFor(pl)}
    </div>`).join('');
}

function savedRows(saved) {
  if (saved.length === 0) return '';
  return `
    <div class="section-label" style="margin-top:16px;">😇 Salvados por su Ángel Guardián</div>
    ${saved.map(pl => `
    <div class="vote-item" style="border-color:rgba(255,214,0,0.35);">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        <div class="player-avatar anim-halo" style="background:${pl.color}22;color:${pl.color};font-size:20px;">${pl.avatar}</div>
        <div class="body-md" style="font-weight:600;">${esc(pl.name)}</div>
      </div>
      <span class="badge" style="background:rgba(255,214,0,0.15);border-color:rgba(255,214,0,0.4);color:var(--yellow);">😇 SALVADO</span>
    </div>`).join('')}`;
}

function showPowerFlash(color) {
  const screen = $('screen-voting');
  if (!screen) return;
  const f = document.createElement('div');
  f.className = 'reveal-flash';
  f.style.background = `radial-gradient(circle at 50% 42%, ${color} 0%, transparent 65%)`;
  screen.appendChild(f);
  setTimeout(() => f.remove(), 850);
}

// Cierre común de todos los poderes. Orden de resolución:
// Cierre común de todos los poderes:
// 1) 💔 tragedias románticas pendientes (corazones rotos con teatrito)
// 2) 🎭 adivinanzas de UC pendientes
// 3) reevaluar victoria y volver a la votación
function finishPowerAction() {
  closeModal();
  processHeartbreakQueue(finishPowerActionRest);
}

function finishPowerActionRest() {
  const g = STATE.game;
  if (!Array.isArray(g.pendingUcGuesses)) g.pendingUcGuesses = [];

  // Adivinanzas de UC pendientes
  if (g.pendingUcGuesses.length > 0) {
    openUcGuessModal(g.pendingUcGuesses.shift());
    return;
  }

  // Victoria + votación
  const v = checkVictory();
  if (v) {
    renderVictoryScreen(v);
    navigate('screen-victory');
    return;
  }
  renderVotingScreen();
}





// Modal de última oportunidad del Undercover (compartido por votación y poderes)
function openUcGuessModal(ucId) {
  const g = STATE.game;
  const uc = g.players.find(pl => pl.id === ucId);
  if (!uc) { finishPowerAction(); return; }
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎭</div>
      <div class="title-md" style="color:var(--cyan);margin-bottom:8px;">${esc(uc.name)} era el Undercover</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Solo conocía la categoría…<br>
        ¿Habrá deducido la palabra secreta?
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="undercoverGuessResult(true, ${uc.id})" style="background:linear-gradient(135deg,var(--cyan),var(--blue));">✅ ¡Adivinó la palabra!</button>
        <button class="btn btn-red" onclick="undercoverGuessResult(false, ${uc.id})">❌ No adivinó</button>
      </div>
    </div>
  `);
}

function showCasualtiesModal({ emoji, title, subtitle, dead, saved, accent }) {
  if (saved.length > 0) playSound('angel');
  openModal(`
    <div style="text-align:center;">
      <div class="anim-scale" style="font-size:64px;margin-bottom:12px;">${emoji}</div>
      <div class="title-xl glow-red" style="margin-bottom:8px;${accent ? `color:${accent};text-shadow:0 0 24px ${accent}80;` : ''}">${title}</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">${subtitle}</div>
      <div style="text-align:left;margin-bottom:8px;">${casualtyRows(dead)}</div>
      ${savedRows(saved)}
      <div style="height:16px;"></div>
      <button class="btn btn-primary" onclick="finishPowerAction()">Continuar</button>
    </div>
  `);
}

/* ================================================================
   💣 KAMIKAZE (poder exclusivo de impostores)
   ================================================================ */
function openKamikazeModal(p) {
  playSound('tap');
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">💣</div>
      <div class="title-md glow-red" style="margin-bottom:8px;">${esc(p.name)}, tienes Kamikaze</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Te eliminaron por votación. ¿Querés activarlo?<br>
        Explotarás y te llevarás a tus <strong style="color:var(--text)">vecinos de la ronda</strong>…
        inocentes, Undercover o tu propio compañero. Es tu decisión.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-red" onclick="kamikazeActivate(${p.id})">💥 ¡Sí, activar Kamikaze!</button>
        <button class="btn btn-ghost" onclick="kamikazeDecline()">🙅 No, me retiro en paz</button>
      </div>
    </div>
  `);
}

// Vecinos vivos más cercanos en el orden de la ronda (circular, izquierda y derecha)
function kamikazeNeighbors(p) {
  const g = STATE.game;
  const order = g.revealOrder;
  const n = order.length;
  const idx = order.indexOf(p.id);
  const targets = [];
  for (const dir of [-1, 1]) {
    for (let step = 1; step <= n; step++) {
      const cand = g.players[order[((idx + dir * step) % n + n) % n]];
      if (cand.alive && cand.id !== p.id) { targets.push(cand); break; }
    }
  }
  return targets.filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
}

function kamikazeActivate(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p) { renderVotingScreen(); return; }
  if (!p.kamikaze) { renderVotingScreen(); return; } // guard anti doble tap
  p.kamikaze = false; // se consume al primer toque
  closeModal();

  const targets = kamikazeNeighbors(p);
  const { dead, saved } = applyChaosDeaths(targets);

  playSound('explosion');
  vibrate([120, 60, 220]);
  showPowerFlash('rgba(255,49,49,0.5)');
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 600);

  showCasualtiesModal({
    emoji: '💣',
    title: '¡KAMIKAZE!',
    subtitle: `${esc(p.name)} explotó y se llevó a sus vecinos.`,
    dead,
    saved
  });
}

function kamikazeDecline() {
  closeModal();
  playSound('eliminate');
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
   ⚔️ SACRIFICIO (poder de inocentes)
   ================================================================ */
function useSacrificio() {
  const g = STATE.game;
  if (!g.powersEnabled.sacrificio || g.powersUsed.sacrificio) return;
  playSound('tap');

  // Sin inocentes vivos no hay a quién sacrificar (ej.: impostores vs undercover)
  const innosAlive = g.players.filter(pl => pl.alive && !pl.isImpostor);
  if (innosAlive.length === 0) {
    openModal(`
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🤷</div>
        <div class="title-md" style="margin-bottom:8px;">No hay inocentes a quién sacrificar</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
          El sacrificio necesita un inocente… y en la mesa solo quedan impostores y Undercover.
          ¡Se les pasó la mano!
        </div>
        <button class="btn btn-ghost" onclick="closeModal()">Volver</button>
      </div>
    `);
    return;
  }

  const SB = BALANCE.SACRIFICIO;
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">⚔️</div>
      <div class="title-md" style="margin-bottom:8px;">¿Ofrecer un Sacrificio?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Un <strong style="color:var(--text)">jugador al azar</strong> (inocente, bufón, undercover
        o miembro de la pareja) será eliminado y, a cambio, se revelará un grupo de
        ${SB.GROUP_MIN}-${SB.GROUP_MAX} jugadores vivos entre los que hay
        <strong style="color:var(--violet)">al menos 1 impostor asegurado</strong>.
        Solo se puede usar <strong>una vez</strong>.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-primary" onclick="executeSacrificio()">⚔️ Sacrificar</button>
        <button class="btn btn-ghost" onclick="closeModal()">Mejor no</button>
      </div>
    </div>
  `);
}

function executeSacrificio() {
  const g = STATE.game;
  if (g.powersUsed.sacrificio) { renderVotingScreen(); return; }
  closeModal();

  const SB = BALANCE.SACRIFICIO;
  const alive = g.players.filter(pl => pl.alive);
  const innocents = alive.filter(pl => !pl.isImpostor);
  const impostors = alive.filter(pl => pl.isImpostor);

  // Guard: sin inocentes vivos no hay sacrificio posible (no consume el poder)
  if (innocents.length === 0) {
    openModal(`
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🤷</div>
        <div class="title-md" style="margin-bottom:8px;">No hay inocentes a quién sacrificar</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
          En la mesa solo quedan impostores y Undercover. ¡Se les pasó la mano!
        </div>
        <button class="btn btn-ghost" onclick="closeModal()">Volver</button>
      </div>
    `);
    return;
  }
  g.powersUsed.sacrificio = true;

  // 1) Víctima inocente al azar (el ángel no protege del sacrificio)
  const victim = rand(innocents);
  victim.alive = false;
  g.eliminated.push(victim);
  if (SB.CONSUMES_BULLET && g.bullets !== Infinity) g.bullets--;

  // El UC sacrificado conserva su última oportunidad de adivinar
  if (victim.isUndercover) {
    if (!Array.isArray(g.pendingUcGuesses)) g.pendingUcGuesses = [];
    g.pendingUcGuesses.push(victim.id);
  }

  // 💔 Sacrificio y pareja: muerte por sacrificio NO tiene salvación con Revivir,
  // así que el corazón roto es inmediato (el teatrito sale al tocar "Continuar")
  const broken = applyHeartbreak(victim);
  if (broken) queueHeartbreak(victim, broken);

  // 2) Grupo de sospechosos con al menos 1 impostor vivo garantizado,
  //    sin incluir a la víctima
  const pool = alive.filter(pl => pl.id !== victim.id);
  const groupSize = Math.min(pool.length, SB.GROUP_MIN + randInt(SB.GROUP_MAX - SB.GROUP_MIN + 1));
  const group = [];
  if (impostors.length > 0) group.push(rand(impostors));
  pickRandom(pool.filter(pl => !group.includes(pl)), groupSize - group.length)
    .forEach(pl => group.push(pl));
  const groupShown = shuffle(group); // el orden no delata al impostor

  playSound('sacrifice');
  vibrate([80, 40, 160]);
  showPowerFlash('rgba(168,85,247,0.45)');

  openModal(`
    <div style="text-align:center;">
      <div class="anim-soul" style="font-size:56px;margin-bottom:10px;">⚔️</div>
      <div class="title-xl glow-violet" style="margin-bottom:4px;">SACRIFICIO</div>
      <div class="vote-item" style="margin:16px 0;">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          <div class="player-avatar" style="background:${victim.color}22;color:${victim.color};font-size:20px;filter:grayscale(0.7);">${victim.avatar}</div>
          <div class="body-md" style="font-weight:700;">${esc(victim.name)} ha caído</div>
        </div>
        ${roleBadgeFor(victim)}
      </div>
      <div class="card-glass" style="border-color:rgba(168,85,247,0.45);margin-bottom:8px;padding:18px;">
        <div class="caption" style="margin-bottom:12px;letter-spacing:0.1em;text-transform:uppercase;">Entre estos jugadores hay por lo menos 1 impostor</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
          ${groupShown.map(pl => `
            <div class="anim-scale" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 12px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:var(--radius-sm);min-width:72px;">
              <div style="font-size:24px;">${pl.avatar}</div>
              <div style="font-size:12px;font-weight:700;">${esc(pl.name)}</div>
            </div>`).join('')}
        </div>
        <div class="caption" style="margin-top:12px;">Puede haber más de uno… o ninguno de los demás. Ustedes averiguan.</div>
      </div>
      <div style="height:8px;"></div>
      <button class="btn btn-primary" onclick="finishPowerAction()">Continuar</button>
    </div>
  `);
}

/* ================================================================
   🕊️ REVIVIR (poder de inocentes)
   ================================================================ */
function revivirBlocked() {
  const g = STATE.game;
  return g.bullets !== Infinity && g.bullets < BALANCE.REVIVIR.MIN_BULLETS_REQUIRED;
}

function useRevivir() {
  const g = STATE.game;
  if (!g.powersEnabled.revivir || g.powersUsed.revivir) return;
  playSound('tap');

  // Bloqueado: quedarse con 0 balas es derrota
  if (revivirBlocked()) {
    openModal(`
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🔒</div>
        <div class="title-md" style="margin-bottom:8px;">Revivir bloqueado</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
          Revivir consume <strong style="color:var(--red)">1 bala</strong> y solo quedan
          <strong style="color:var(--red)">${g.bullets}</strong>.
          Quedarse sin balas es derrota de los inocentes.
        </div>
        <button class="btn btn-ghost" onclick="closeModal()">Entendido</button>
      </div>
    `);
    return;
  }

  // Lista de eliminados: los inocentes se pueden revivir; intentar con un
  // impostor o undercover muestra un mensaje gracioso (sin gastar el poder)
  const list = g.eliminated.filter(pl => !pl.leftEarly);
  if (list.length === 0) {
    openModal(`
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🕊️</div>
        <div class="title-md" style="margin-bottom:8px;">Nadie para revivir</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:24px;">Todavía no cayó ningún jugador.</div>
        <button class="btn btn-ghost" onclick="closeModal()">Volver</button>
      </div>
    `);
    return;
  }

  openModal(`
    <div>
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:36px;margin-bottom:8px;">🕊️</div>
        <div class="title-md">¿A quién revivir?</div>
        <div class="caption" style="margin-top:4px;">Cuesta 1 bala y el grupo leerá una pista extra en voz alta</div>
      </div>
      <div style="display:flex;flex-direction:column;">
        ${list.map(pl => `
          <button class="pick-item" onclick="attemptRevive(${pl.id})" style="${(pl.isImpostor || pl.isUndercover) ? 'opacity:0.7;' : ''}">
            <span class="player-avatar" style="background:${pl.color}22;color:${pl.color};width:34px;height:34px;font-size:16px;filter:grayscale(0.7);">${pl.avatar}</span>
            <span style="flex:1;">${esc(pl.name)}</span>
            ${roleBadgeFor(pl)}
          </button>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px;" onclick="closeModal()">Volver</button>
    </div>
  `);
}

function attemptRevive(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  if (!p || p.alive || p.leftEarly) return;

  // Revivir solo sirve para inocentes puros. Cualquier otra cosa: burla.
  const esInocentePuro = !p.isImpostor && !p.isUndercover && !p.isJester && p.partnerId === null;
  if (!esInocentePuro) {
    playSound('error');
    vibrate(80);
    let joke;
    if (p.isImpostor) {
      joke = rand([
        '🤨 ¿En serio? ¿Revivir a un impostor?',
        '😅 ¿Revivir al impostor? Ni lo pienses…',
        '🤡 Buenísimo: revivir problemas. Pasamos.',
        '👻 Ya cumplió su misión. Que descanse en paz.',
        '💰 No hay suficiente plata para el rescate de un criminal.'
      ]);
    } else if (p.isUndercover) {
      joke = rand([
        '🤨 ¿En serio? ¿Revivir al undercover?',
        '🎭 El Undercover ya gastó su última oportunidad…',
        '🎤 No hay encore para el undercover. Despidanlo.',
        '😅 Revivir al undercover… ¿para que adivine otra vez? No.'
      ]);
    } else if (p.isJester) {
      joke = rand([
        '🤨 ¿Revivir al bufón? Él quería que lo eliminen, no que lo resuciten…',
        '🤡 ¡No arruinen su obra maestra! Murió como soñaba.',
        '🎭 El show ya terminó. Aplausos y a casa.'
      ]);
    } else {
      joke = rand([
        '💔 ¿Revivir a la pareja? Ellos ya cumplieron su destino juntos…',
        '🥀 Un amor así no se revive: se recuerda.',
        '😅 Revivir a uno de la pareja… ¿para que mueran de nuevo? No.'
      ]);
    }
    openModal(`
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:12px;">🚫</div>
        <div class="title-md" style="margin-bottom:8px;">${joke}</div>
        <div class="body-md" style="color:var(--muted);margin-bottom:24px;">
          Solo se puede revivir a <strong style="color:var(--green)">inocentes</strong>.
        </div>
        <button class="btn btn-ghost" onclick="useRevivir()">Volver a la lista</button>
      </div>
    `);
    return;
  }

  openModal(`
    <div style="text-align:center;">
      <div style="font-size:44px;margin-bottom:10px;">${p.avatar}</div>
      <div class="title-md" style="margin-bottom:8px;">¿Revivir a ${esc(p.name)}?</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Costo: <strong style="color:var(--red)">1 bala</strong>
        ${g.bullets !== Infinity ? `(quedarán ${g.bullets - 1})` : ''} y el grupo deberá leer en voz
        alta una pista extra de la palabra… que el impostor también escucha.
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-green" onclick="executeRevivir(${p.id})">🕊️ Revivir</button>
        <button class="btn btn-ghost" onclick="useRevivir()">Volver</button>
      </div>
    </div>
  `);
}

function executeRevivir(playerId) {
  const g = STATE.game;
  const p = g.players.find(pl => pl.id === playerId);
  // Guardia completa: solo inocentes puros presentes pueden volver
  if (!p || p.alive || p.leftEarly || p.isImpostor || p.isUndercover || p.isJester || p.partnerId !== null || g.powersUsed.revivir || revivirBlocked()) { renderVotingScreen(); return; }
  g.powersUsed.revivir = true;

  if (BALANCE.REVIVIR.CONSUMES_BULLET && g.bullets !== Infinity) g.bullets--;
  p.alive = true;
  g.eliminated = g.eliminated.filter(pl => pl.id !== p.id);

  // Pista extra pública: NUNCA la pista original del impostor ni una ya dicha.
  // Si está libre, se prefiere la segunda pista de la palabra.
  const used = new Set(g.usedHints);
  const remaining = g.allHints.filter(h => !used.has(h));
  const extraHint = remaining.includes(g.allHints[1]) ? g.allHints[1]
    : (remaining.length > 0 ? rand(remaining) : null);
  if (extraHint) g.usedHints.push(extraHint);

  playSound('revive');
  vibrate([60, 40, 120]);
  showPowerFlash('rgba(57,255,20,0.3)');

  openModal(`
    <div style="text-align:center;">
      <div class="anim-rise" style="font-size:64px;margin-bottom:10px;">${p.avatar}</div>
      <div class="title-xl glow-green" style="margin-bottom:4px;">¡HA VUELTO!</div>
      <div class="title-md" style="color:var(--green);margin-bottom:16px;">${esc(p.name)} vuelve al juego</div>
      ${extraHint ? `
      <div class="card-glass" style="border-color:rgba(57,255,20,0.4);margin-bottom:12px;">
        <div class="caption" style="margin-bottom:8px;letter-spacing:0.1em;text-transform:uppercase;">📢 Lean en voz alta para toda la sala</div>
        <div class="title-lg glow-green">"${esc(extraHint)}"</div>
      </div>
      <div class="info-note" style="margin-bottom:12px;">
        Ojo: esta pista ayuda al impostor a encontrar la palabra. Es el precio del milagro.
      </div>` : `
      <div class="info-note" style="margin-bottom:12px;">No quedan pistas extra disponibles para revelar.</div>`}
      <div class="caption" style="margin-bottom:16px;">${g.bullets !== Infinity ? `Costo: 1 bala · quedan ${g.bullets}` : 'Modo sin balas'}</div>
      <button class="btn btn-primary" onclick="finishPowerAction()">Continuar</button>
    </div>
  `);
}
