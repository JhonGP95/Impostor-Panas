/* ================================================================
   UTILIDADES
   ================================================================ */
const $ = id => document.getElementById(id);
const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = n => Math.floor(Math.random() * n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, k) {
  return shuffle(arr).slice(0, Math.max(0, Math.min(k, arr.length)));
}

function wordPool() {
  const selected = STATE.config.selectedCategories || [];
  let cats = selected.length > 0
    ? DB.all().filter(c => selected.includes(c.categoria))
    : DB.all();
  if (cats.length === 0) cats = DB.all();
  return cats.flatMap(c => c.palabras);
}

function saveToStorage() {
  try {
    localStorage.setItem('chazey_config_v3', JSON.stringify({
      numPlayers:       STATE.config.numPlayers,
      numImpostors:     STATE.config.numImpostors,
      randomImpostors:  STATE.config.randomImpostors,
      numUndercovers:   STATE.config.numUndercovers,
      numBullets:       STATE.config.numBullets,
      infiniteBullets:  STATE.config.infiniteBullets,
      withHints:        STATE.config.withHints,
      selectedCategories: STATE.config.selectedCategories,
      playerNames:      STATE.config.playerNames,
      powers:           STATE.config.powers,
      roles:            STATE.config.roles,
      revealRoles:      STATE.config.revealRoles
    }));
  } catch(e) {}
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('chazey_config_v3');
    if (saved) {
      const d = JSON.parse(saved);
      const powers = d.powers;
      delete d.powers;
      const roles = d.roles;
      delete d.roles;
      Object.assign(STATE.config, d);
      // Solo aceptar claves de poderes conocidas (ignora poderes eliminados)
      if (powers && typeof powers === 'object') {
        Object.keys(STATE.config.powers).forEach(k => {
          if (typeof powers[k] === 'boolean') STATE.config.powers[k] = powers[k];
        });
      }
      // Igual con los roles especiales
      if (roles && typeof roles === 'object') {
        Object.keys(STATE.config.roles).forEach(k => {
          if (typeof roles[k] === 'boolean') STATE.config.roles[k] = roles[k];
        });
      }
      if (typeof STATE.config.revealRoles !== 'boolean') STATE.config.revealRoles = true;
      if (!STATE.config.roles || typeof STATE.config.roles !== 'object') {
        STATE.config.roles = { bufon: true, pareja: true };
      }
      if (!Array.isArray(STATE.config.selectedCategories)) STATE.config.selectedCategories = [];
      if (!Array.isArray(STATE.config.playerNames)) STATE.config.playerNames = [];
    }
  } catch(e) {}
}

/* ================================================================
   💾 PARTIDA EN CURSO — persistencia para "¿Continuar partida?"
   ================================================================ */
const GAME_SAVE_KEY = 'chazey_game_v1';

function saveGameState() {
  const g = STATE.game;
  if (!g) return;
  try {
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify({
      players: g.players.map(p => ({
        id: p.id, name: p.name, isImpostor: p.isImpostor, isUndercover: p.isUndercover,
        isJester: !!p.isJester, partnerId: ('partnerId' in p) ? p.partnerId : null,
        alive: p.alive, leftEarly: p.leftEarly, kamikaze: !!p.kamikaze, angel: !!p.angel,
        diedOf: p.diedOf || null, color: p.color, avatar: p.avatar
      })),
      secretWord: g.secretWord,
      category: g.category,
      allHints: g.allHints,
      currentHint: g.currentHint,
      usedHints: g.usedHints,
      revealOrder: g.revealOrder,
      revealCount: g.revealCount,
      bullets: g.bullets === Infinity ? -1 : g.bullets,
      eliminatedIds: g.eliminated.map(p => p.id),
      pendingUcGuesses: g.pendingUcGuesses || [],
      pendingHeartbreaks: g.pendingHeartbreaks || [],
      powersEnabled: g.powersEnabled,
      powersUsed: g.powersUsed,
      couple: g.couple,
      randomImpostors: g.randomImpostors,
      withHints: g.withHints,
      revealRoles: g.revealRoles,
      starterId: g.starter ? g.starter.id : null
    }));
  } catch(e) {}
}

function clearGameState() {
  try { localStorage.removeItem(GAME_SAVE_KEY); } catch(e) {}
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(GAME_SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.players) || s.players.length < MIN_PLAYERS) return null;
    return s;
  } catch(e) { return null; }
}

function restoreGame(snap) {
  const players = snap.players.map(p => ({ ...p }));
  const byId = id => players.find(pl => pl.id === id) || null;
  STATE.game = {
    players,
    secretWord: snap.secretWord,
    category: snap.category,
    allHints: snap.allHints || [],
    currentHint: snap.currentHint,
    usedHints: snap.usedHints || [],
    revealOrder: snap.revealOrder || players.map(p => p.id),
    revealCount: snap.revealCount || 0,
    bullets: snap.bullets === -1 ? Infinity : snap.bullets,
    eliminated: (snap.eliminatedIds || []).map(byId).filter(Boolean),
    pendingUcGuesses: snap.pendingUcGuesses || [],
    pendingHeartbreaks: snap.pendingHeartbreaks || [],
    powersEnabled: snap.powersEnabled || {},
    powersUsed: snap.powersUsed || { grenade: false, sacrificio: false, revivir: false },
    couple: snap.couple || null,
    randomImpostors: !!snap.randomImpostors,
    withHints: snap.withHints !== undefined ? !!snap.withHints : true,
    revealRoles: snap.revealRoles !== undefined ? !!snap.revealRoles : true,
    starter: snap.starterId !== null && snap.starterId !== undefined ? byId(snap.starterId) : null
  };
  return STATE.game;
}

// 💔 Devuelve la pareja de un jugador (o null si no tiene pareja en esta partida)
function partnerOf(pl) {
  const g = STATE.game;
  if (!g || !g.couple || pl.partnerId === null || pl.partnerId === undefined) return null;
  return g.players.find(x => x.id === pl.partnerId) || null;
}
