/* ================================================================
   INICIO DE PARTIDA
   ================================================================ */

// 🎲 PRD (Pseudo-Random Distribution) con lástima por jugador:
// cada jugador acumula "pity" (rondas sin ser impostor). Su peso de sorteo es
// BASE + GROWTH × pity (con techo). Ser impostor resetea el pity a 0.
// Resultado: repetir es raro (peso mínimo) pero las sequías largas se
// auto-compensan, y a largo plazo el reparto queda igualado para todos.
function loadPity() {
  try {
    const d = JSON.parse(localStorage.getItem('chazey_impostor_pity') || '{}');
    return (d && typeof d === 'object' && !Array.isArray(d)) ? d : {};
  } catch(e) { return {}; }
}

function savePity(players) {
  try {
    const pity = loadPity();
    players.forEach(pl => {
      const key = pl.name.trim().toLowerCase();
      const prev = (typeof pity[key] === 'number') ? pity[key] : BALANCE.IMPOSTOR_PRD.DEFAULT_PITY;
      pity[key] = pl.isImpostor ? 0 : Math.min(prev + 1, 99);
    });
    localStorage.setItem('chazey_impostor_pity', JSON.stringify(pity));
  } catch(e) {}
}

// Sorteo con peso y sin reemplazo usando los pesos PRD de cada jugador.
function pickImpostorsBalanced(n, numImp, pity, names) {
  const P = BALANCE.IMPOSTOR_PRD;
  let pool = [...Array(n).keys()].map(i => {
    const nm = String(names[i] || '').trim().toLowerCase();
    const p = (pity && typeof pity[nm] === 'number') ? pity[nm] : P.DEFAULT_PITY;
    return { i, w: Math.min(P.BASE + P.GROWTH * p, P.MAX_WEIGHT) };
  });
  const picked = [];
  while (picked.length < numImp && pool.length > 0) {
    const total = pool.reduce((a, e) => a + e.w, 0);
    let r = Math.random() * total;
    let chosen = pool[pool.length - 1];
    for (const e of pool) { r -= e.w; if (r <= 0) { chosen = e; break; } }
    picked.push(chosen.i);
    pool = pool.filter(e => e !== chosen);
  }
  return picked;
}

function startGame() {
  const cfg = STATE.config;

  for (let i = 0; i < cfg.numPlayers; i++) {
    const input = $(`player-name-${i}`);
    if (input && input.value) cfg.playerNames[i] = input.value;
  }

  const n = cfg.numPlayers;

  // Cantidad de impostores: fija o aleatoria (siempre dejando lugar a los undercovers)
  const ucWanted = Math.min(cfg.numUndercovers, n - 2);
  let numImp;
  if (cfg.randomImpostors) {
    const R = Math.max(1, Math.min(n - 1, n - ucWanted - 1));
    numImp = 1 + randInt(R);
  } else {
    numImp = Math.min(cfg.numImpostors, n - ucWanted - 1);
    numImp = Math.max(1, numImp);
  }
  const numUC = Math.min(ucWanted, n - numImp - 1);

  // Palabra secreta
  const pool = wordPool();
  const chosen = rand(pool);
  const catName = (DB.all().find(c => c.palabras.includes(chosen)) || {}).categoria || '?';

  const allHints = [chosen.pista1, chosen.pista2].filter(Boolean);
  let hint = null;
  if (cfg.withHints && allHints.length > 0) hint = rand(allHints);

  // Roles: PRD con lástima — repetir como impostor es raro (peso mínimo recién
  // salido del rol) pero las sequías largas aumentan el peso, así que nadie
  // queda condenado a nunca serlo. Siempre salen exactamente numImp.
  const pity = loadPity();
  const impostorIdx = pickImpostorsBalanced(n, numImp, pity, cfg.playerNames);
  const impostorSet = new Set(impostorIdx);
  const restOrder = shuffle([...Array(n).keys()].filter(i => !impostorSet.has(i)));
  const ucSet = new Set(restOrder.slice(0, numUC));

  const players = Array.from({ length: n }, (_, i) => ({
    id: i,
    name: (cfg.playerNames[i] || `Jugador ${i + 1}`).trim() || `Jugador ${i + 1}`,
    role: impostorSet.has(i) ? 'impostor' : (ucSet.has(i) ? 'undercover' : 'human'),
    isImpostor: impostorSet.has(i),
    isUndercover: ucSet.has(i),
    isJester: false,
    partnerId: null,
    alive: true,
    leftEarly: false,
    kamikaze: false,
    angel: false,
    color: colorOf(i),
    avatar: avatarOf(i)
  }));

  savePity(players);

  // 🤡 Bufón: máximo 1 por partida, entre los inocentes puros restantes.
  // Gana SOLO si lo eliminan por votación (poderes e irse no cuentan).
  let jesterIdx = -1;
  if (cfg.roles.bufon) {
    const candidates = [...Array(n).keys()].filter(i => !impostorSet.has(i) && !ucSet.has(i));
    if (candidates.length > 0) {
      jesterIdx = rand(candidates);
      players[jesterIdx].isJester = true;
      players[jesterIdx].role = 'jester';
    }
  }

  // 😇 Ángel Guardián: todos pueden tenerlo MENOS los impostores
  // (inocentes, undercovers y bufón)
  if (cfg.powers.angel) {
    players.forEach(pl => {
      if (!pl.isImpostor && Math.random() < BALANCE.ANGEL_GUARDIAN_CHANCE) pl.angel = true;
    });
  }

  // 💣 Kamikaze: como mucho UN impostor por ronda lo recibe (probabilidad configurable)
  const aliveImpostors = players.filter(pl => pl.isImpostor);
  if (cfg.powers.kamikaze && aliveImpostors.length > 0 && Math.random() < BALANCE.KAMIKAZE_CHANCE) {
    rand(aliveImpostors).kamikaze = true;
  }

  // 💔 Pareja: una sola por partida, SOLO entre inocentes puros. Requiere
  // mesa de BALANCE.PAREJA.MIN_PLAYERS o más.
  let couple = null;
  if (cfg.roles.pareja && n >= BALANCE.PAREJA.MIN_PLAYERS) {
    const pool = [...Array(n).keys()].filter(i => !impostorSet.has(i) && !ucSet.has(i) && i !== jesterIdx);
    if (pool.length >= 2) {
      const pair = pickRandom(pool, 2);
      couple = { a: pair[0], b: pair[1] };
      players[couple.a].partnerId = couple.b;
      players[couple.b].partnerId = couple.a;
    }
  }

  STATE.game = {
    players,
    secretWord: chosen.palabra,
    category: catName,
    allHints,
    currentHint: hint,
    usedHints: hint ? [hint] : [],
    revealOrder: [...Array(n).keys()], // respeta el orden configurado
    revealCount: 0,
    bullets: cfg.infiniteBullets ? Infinity : cfg.numBullets,
    eliminated: [],
    pendingUcGuesses: [], // UCs muertos por poderes que aún tienen su adivinanza
    powersEnabled: {
      grenade: !!cfg.powers.grenade,
      sacrificio: !!cfg.powers.sacrificio,
      revivir: !!cfg.powers.revivir,
      kamikaze: !!cfg.powers.kamikaze,
      angel: !!cfg.powers.angel
    },
    powersUsed: { grenade: false, sacrificio: false, revivir: false },
    couple,                                  // 💔 { a, b } o null
    // Snapshot de configuración que afecta la info mostrada en partida
    randomImpostors: !!cfg.randomImpostors, // 🎲 oculta cuántos impostores hay
    withHints: !!cfg.withHints,             // 💡 pista del impostor (para los chips)
    revealRoles: !!cfg.revealRoles,         // 👁️ roles visibles al eliminar
    starter: null
  };

  saveToStorage();
  playSound('start');
  renderRevealScreen();
  navigate('screen-reveal');
}
