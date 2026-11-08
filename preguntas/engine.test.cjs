const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('./questions.js');
const engine = require('./engine.js');
const config = (count = 4, intruders = 1, category = 'all') => ({ names: Array.from({ length: count }, (_, index) => `Pana ${index + 1}`), intruders, category });

test('base editorial: 160 pares únicos, mismo formato y guía de coincidencia', () => {
  assert.equal(db.pairs.length, 160);
  assert.equal(new Set(db.pairs.map(pair => pair.id)).size, 160);
  for (const category of db.categories) assert.equal(engine.questionPool(db, category.id).length, category.optIn ? 16 : 24);
  for (const pair of db.pairs) {
    assert.ok(pair.proper.startsWith('¿') && pair.intruder.startsWith('¿'));
    assert.notEqual(pair.proper, pair.intruder);
    assert.ok(pair.overlap.length > 5);
    assert.ok(db.categories.some(category => category.id === pair.category));
    assert.equal(pair.type, pair.category === 'numeros' ? 'number' : 'text');
  }
});
test('reparto: de 3 a 20, cantidad exacta de intrusos únicos y mayoría garantizada', () => {
  for (let count = 3; count <= 20; count++) {
    for (let intruders = 1; intruders <= Math.floor((count - 1) / 2); intruders++) {
      for (let trial = 0; trial < 10; trial++) {
        const round = engine.createRound(config(count, intruders), db);
        assert.equal(round.roles.length, intruders);
        assert.equal(new Set(round.roles).size, intruders);
        assert.ok(round.roles.every(index => index >= 0 && index < count));
        assert.equal(round.answers.length, 0);
        assert.equal(round.stage, 'handoff');
      }
    }
  }
});
test('configuración rechaza blancos, duplicados, cantidades inválidas y categorías desconocidas', () => {
  for (const bad of [config(2), config(21), config(4, 2), config(4, 0), config(4, 1.5), config(4, 1, 'missing'), { ...config(), names: ['Ana', ' ana ', 'Luis'] }, { ...config(), names: ['Ana', '', 'Luis'] }, { ...config(), names: ['Ana', 'x'.repeat(25), 'Luis'] }, { ...config(), bullets: 1 }, { ...config(3), bullets: 3 }, { ...config(20), bullets: 6 }]) assert.throws(() => engine.validateConfig(bad, db));
  assert.deepEqual(engine.validateConfig({ ...config(3), names: [' Ana ', 'Luis', 'Caro'] }, db).names, ['Ana', 'Luis', 'Caro']);
});
test('no repite preguntas hasta agotar cada categoría y permite reiniciar el catálogo', () => {
  for (const category of ['all', ...db.categories.map(item => item.id)]) {
    const size = engine.questionPool(db, category).length;
    let used = [];
    const ids = [];
    for (let i = 0; i < size; i++) {
      const round = engine.createRound(config(4, 1, category), db, used);
      used = round.used;
      ids.push(round.pairId);
    }
    assert.equal(new Set(ids).size, size);
    const next = engine.createRound(config(4, 1, category), db, used);
    assert.ok(next.pairId);
    assert.equal(next.used.length, 1);
  }
});
test('cambiar categoría conserva la historia de las otras categorías', () => {
  const first = engine.createRound(config(4, 1, 'comida'), db);
  const round = engine.createRound(config(4, 1, 'numeros'), db, first.used);
  assert.ok(round.used.includes(first.pairId));
});
test('las preguntas picantes solo salen cuando se elige la categoría', () => {
  assert.equal(engine.questionPool(db, 'all').length, 144);
  assert.ok(engine.questionPool(db, 'all').every(pair => pair.category !== 'picantes'));
  const spicy = engine.createRound(config(4, 1, 'picantes'), db);
  assert.match(spicy.pairId, /^picantes-/);
  assert.ok(engine.restoreRound(spicy, db));
  assert.equal(engine.restoreRound({ ...spicy, config: { ...spicy.config, category: 'all' } }, db), null);
});
test('las respuestas vacías o de formato incorrecto no avanzan el turno', () => {
  const round = engine.createRound(config(3, 1, 'numeros'), db);
  round.stage = 'answer';
  for (const bad of ['', ' ', 'seis', '-1', 'NaN', '6 personas', 'x'.repeat(81)]) assert.throws(() => engine.submitAnswer(round, bad, db));
  assert.equal(round.answers.length, 0);
  assert.equal(engine.submitAnswer(round, '6,5', db).answers[0], '6,5');
});
test('recorrido: no acepta respuestas fuera de turno; todos deben contestar antes de ver el tablero', () => {
  let round = engine.createRound(config(3, 1, 'numeros'), db);
  assert.throws(() => engine.submitAnswer(round, '6', db));
  for (let i = 0; i < 3; i++) {
    round.stage = 'answer';
    round = engine.submitAnswer(round, String(i + 4), db);
    assert.equal(round.answers.length, i + 1);
    assert.equal(round.stage, i === 2 ? 'ready' : 'handoff');
    assert.throws(() => engine.submitAnswer(round, '6', db));
  }
  assert.deepEqual(round.answers, ['4', '5', '6']);
});
test('recargar durante una pregunta restaura la pantalla de entrega, con los turnos previos intactos', () => {
  let round = engine.createRound(config(3, 1, 'numeros'), db);
  round.stage = 'answer';
  round = engine.submitAnswer(round, '6', db);
  round.stage = 'answer';
  const restored = engine.restoreRound(JSON.parse(JSON.stringify(round)), db);
  assert.equal(restored.stage, 'handoff');
  assert.deepEqual(restored.answers, ['6']);
  assert.deepEqual(restored.roles, round.roles);
  assert.equal(restored.pairId, round.pairId);
});
test('rechaza guardados incompletos o alterados en lugar de filtrar roles o saltarse turnos', () => {
  const round = engine.createRound(config(3), db);
  for (const bad of [null, {}, { ...round, roles: [20] }, { ...round, stage: 'discussion' }, { ...round, stage: 'reveal' }, { ...round, pairId: 'missing' }, { ...round, number: 0 }, { ...round, answers: ['a', 'b', 'c', 'd'] }, { ...round, answers: [5] }]) assert.equal(engine.restoreRound(bad, db), null);
});
test('un tablero completo restaura sus respuestas y la etapa pública correctamente', () => {
  const round = { ...engine.createRound(config(3, 1, 'comida'), db), answers: ['Pizza', 'Pasta', 'Tacos'], stage: 'discussion' };
  assert.deepEqual(engine.restoreRound(round, db), round);
  assert.equal(engine.restoreRound({ ...round, stage: 'reveal' }, db).stage, 'reveal');
});

function votingRound(players = 4, intruders = 1, bullets = 2) {
  const round = engine.createRound({ ...config(players, intruders, 'comida'), bullets }, db);
  return {
    ...round, roles: Array.from({ length: intruders }, (_, index) => index),
    answers: round.config.names.map(() => 'Pizza'), stage: 'discussion'
  };
}

test('un voto errado deja la ronda abierta y cada acierto conserva la bala', () => {
  const round = votingRound(5, 2);
  const miss = engine.submitVote(round, 2);
  assert.equal(miss.stage, 'discussion');
  assert.deepEqual(engine.voteStatus(miss), { bullets: 1, remaining: 2, winner: null });
  assert.throws(() => engine.submitVote(miss, 2));
  const first = engine.submitVote(miss, 0);
  assert.equal(first.stage, 'discussion');
  assert.deepEqual(engine.voteStatus(first), { bullets: 1, remaining: 1, winner: null });
  const last = engine.submitVote(first, 1);
  assert.equal(last.stage, 'reveal');
  assert.deepEqual(engine.voteStatus(last), { bullets: 1, remaining: 0, winner: 'majority' });
  assert.throws(() => engine.submitVote(last, 3));
  assert.deepEqual(round.votes, []);
});

test('los intrusos ganan cuando la mesa agota las balas', () => {
  const round = votingRound(4, 1, 3);
  const one = engine.submitVote(round, 1);
  const two = engine.submitVote(one, 2);
  assert.equal(two.stage, 'discussion');
  const three = engine.submitVote(two, 3);
  assert.equal(three.stage, 'reveal');
  assert.deepEqual(engine.voteStatus(three), { bullets: 0, remaining: 1, winner: 'intruders' });
});

test('los votos sobreviven a una recarga y los guardados anteriores conservan el tablero', () => {
  const round = votingRound(5, 2);
  const partial = engine.submitVote(engine.submitVote(round, 2), 0);
  assert.deepEqual(engine.restoreRound(JSON.parse(JSON.stringify(partial)), db), partial);
  assert.equal(engine.restoreRound({ ...partial, votes: [2, 2] }, db), null);
  assert.equal(engine.restoreRound({ ...partial, votes: [2, 0, 1] }, db), null);
  assert.equal(engine.restoreRound({ ...partial, stage: 'reveal' }, db), null);
  const { votes, config: { bullets, ...legacyConfig }, ...legacy } = round;
  const restored = engine.restoreRound({ ...legacy, config: legacyConfig }, db);
  assert.deepEqual(restored, round);
  const revealed = engine.restoreRound({ ...legacy, config: legacyConfig, stage: 'reveal' }, db);
  assert.equal(revealed.stage, 'reveal');
  assert.equal(engine.voteStatus(revealed).winner, null);
});
