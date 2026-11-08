(function (root) {
  'use strict';
  const MAX_PLAYERS = 20;
  const DEFAULT_BULLETS = 2;
  const maxBullets = (players, intruders) => Math.min(5, players - intruders);

  function questionPool(db, category) {
    if (category !== 'all') return db.pairs.filter(pair => pair.category === category);
    const manualCategories = new Set(db.categories.filter(item => item.optIn).map(item => item.id));
    return db.pairs.filter(pair => !manualCategories.has(pair.category));
  }

  function validateConfig(config, db) {
    if (!Array.isArray(config.names) || config.names.length < 3 || config.names.length > MAX_PLAYERS) throw new Error('Reúne entre 3 y 20 jugadores.');
    const names = config.names.map(name => String(name).trim());
    if (names.some(name => !name || name.length > 24)) throw new Error('Escribe un nombre de hasta 24 caracteres para cada jugador.');
    if (new Set(names.map(name => name.toLocaleLowerCase('es'))).size !== names.length) throw new Error('Usa nombres distintos para reconocer las respuestas.');
    if (!Number.isInteger(config.intruders) || config.intruders < 1 || config.intruders > Math.floor((names.length - 1) / 2)) throw new Error('Los intrusos deben ser menos que los demás jugadores.');
    if (config.category !== 'all' && !db.categories.some(category => category.id === config.category)) throw new Error('Elige una categoría disponible.');
    const bullets = config.bullets ?? DEFAULT_BULLETS;
    if (!Number.isInteger(bullets) || bullets < DEFAULT_BULLETS || bullets > maxBullets(names.length, config.intruders)) throw new Error('Elige una cantidad de balas válida para el grupo.');
    return { names, intruders: config.intruders, category: config.category, bullets };
  }
  function shuffle(items, rng = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function createRound(config, db, used = [], number = 1, rng = Math.random) {
    const checked = validateConfig(config, db);
    const pool = questionPool(db, checked.category);
    if (!pool.length) throw new Error('Esta categoría todavía no tiene preguntas.');
    let history = used.filter(id => db.pairs.some(pair => pair.id === id));
    let available = pool.filter(pair => !history.includes(pair.id));
    if (!available.length) {
      history = history.filter(id => !pool.some(pair => pair.id === id));
      available = pool;
    }
    const pair = available[Math.floor(rng() * available.length)];
    const roles = new Set(shuffle(checked.names.map((_, index) => index), rng).slice(0, checked.intruders));
    return { config: checked, pairId: pair.id, roles: [...roles], answers: [], votes: [], stage: 'handoff', number, used: [...history, pair.id] };
  }
  function validateAnswer(value, type) {
    const answer = String(value).trim().replace(/\s+/g, ' ');
    if (!answer) throw new Error('Escribe tu respuesta antes de continuar.');
    if (answer.length > 80) throw new Error('Una respuesta corta: máximo 80 caracteres.');
    if (type === 'number' && (!/^\d+(?:[.,]\d+)?$/.test(answer) || !Number.isFinite(Number(answer.replace(',', '.'))))) throw new Error('Responde solo con un número, sin palabras.');
    return answer;
  }
  function submitAnswer(round, value, db) {
    if (round.stage !== 'answer' || round.answers.length >= round.config.names.length) throw new Error('Este turno ya terminó.');
    const pair = db.pairs.find(item => item.id === round.pairId);
    const answer = validateAnswer(value, pair.type);
    const answers = [...round.answers, answer];
    return { ...round, answers, stage: answers.length === round.config.names.length ? 'ready' : 'handoff' };
  }

  function voteStatus(round) {
    const found = round.votes.filter(index => round.roles.includes(index)).length;
    const bullets = round.config.bullets - (round.votes.length - found);
    const remaining = round.roles.length - found;
    const winner = remaining === 0 ? 'majority' : bullets === 0 ? 'intruders' : null;
    return { bullets, remaining, winner };
  }

  function submitVote(round, index) {
    if (round.stage !== 'discussion' || !Number.isInteger(index) || index < 0 || index >= round.config.names.length || round.votes.includes(index)) {
      throw new Error('Ese voto ya no está disponible.');
    }
    const next = { ...round, votes: [...round.votes, index] };
    if (voteStatus(next).winner) next.stage = 'reveal';
    return next;
  }

  function restoreRound(raw, db) {
    try {
      if (!raw || !['handoff', 'answer', 'ready', 'discussion', 'reveal'].includes(raw.stage)) return null;
      const config = validateConfig(raw.config, db);
      const pair = questionPool(db, config.category).find(item => item.id === raw.pairId);
      if (!pair || !Number.isInteger(raw.number) || raw.number < 1) return null;
      if (!Array.isArray(raw.roles) || raw.roles.length !== config.intruders || new Set(raw.roles).size !== raw.roles.length || raw.roles.some(index => !Number.isInteger(index) || index < 0 || index >= config.names.length)) return null;
      if (!Array.isArray(raw.answers) || raw.answers.length > config.names.length || raw.answers.some(answer => typeof answer !== 'string' || validateAnswer(answer, pair.type) !== answer)) return null;
      const complete = raw.answers.length === config.names.length;
      if (complete !== ['ready', 'discussion', 'reveal'].includes(raw.stage)) return null;
      const votes = raw.votes === undefined ? [] : raw.votes;
      if (!Array.isArray(votes) || (votes.length && !['discussion', 'reveal'].includes(raw.stage))) return null;
      const round = { config, pairId: pair.id, roles: [...raw.roles], answers: [...raw.answers], votes: [], stage: raw.stage === 'answer' ? 'handoff' : raw.stage, number: raw.number, used: Array.isArray(raw.used) ? raw.used.filter(id => typeof id === 'string' && db.pairs.some(item => item.id === id)) : [pair.id] };
      // Las rondas anteriores a la votación pueden estar reveladas sin votos.
      if (!votes.length) return round;
      const voted = votes.reduce(submitVote, { ...round, stage: 'discussion' });
      return voted.stage === raw.stage ? voted : null;
    } catch (_) { return null; }
  }
  const engine = { MAX_PLAYERS, DEFAULT_BULLETS, maxBullets, questionPool, validateConfig, shuffle, createRound, validateAnswer, submitAnswer, voteStatus, submitVote, restoreRound };
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  else root.QuestionsEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
