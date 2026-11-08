const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function gameContext() {
  const storage = new Map();
  const context = vm.createContext({
    console, playSound() {}, vibrate() {},
    localStorage: {
      getItem: key => storage.get(key),
      setItem: (key, value) => storage.set(key, value)
    }
  });
  const run = code => vm.runInContext(code, context);
  const scripts = ['balance', 'utils', 'state', 'database', 'game-reveal', 'game-voting', 'game-powers'];
  for (const file of scripts) run(fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8'));
  for (const file of fs.readdirSync(path.join(root, 'data', 'categorias'))) {
    run(fs.readFileSync(path.join(root, 'data', 'categorias', file), 'utf8'));
  }
  return run;
}

test('la pareja recibe una pista en ambas tarjetas con la pista del impostor desactivada', () => {
  const run = gameContext();
  const cards = run(`
    STATE.game = {
      secretWord: 'PALABRA PRIVADA', category: 'CATEGORÍA PRIVADA', withHints: false,
      allHints: ['Pista compartida'], couple: { a: 0, b: 1 },
      players: [{ id: 0, name: 'A', partnerId: 1 }, { id: 1, name: 'B', partnerId: 0 }]
    };
    [renderPrivateRole(STATE.game.players[0]), renderPrivateRole(STATE.game.players[1], true)]
  `);
  for (const card of cards) {
    assert.match(card, /Pista compartida/);
    assert.doesNotMatch(card, /PALABRA PRIVADA|CATEGORÍA PRIVADA/);
  }
});

test('las palabras tienen pistas válidas y únicas dentro de cada categoría', () => {
  const run = gameContext();
  const problem = run(`
    DB.all().find(cat => {
      const keys = cat.palabras.map(word => clueKey(word.palabra));
      return new Set(keys).size !== keys.length || cat.palabras.some(word => word.pistas.length < 2);
    })
  `);
  assert.equal(problem, undefined);
  assert.equal(run(`
    cleanHints('Camión', [' camión ', 'Un camión', 'Carga', 'cárga', 'Ruta']).join('|')
  `), 'Carga|Ruta');
});

test('una partida guardada antes de la actualización usa las pistas corregidas', () => {
  const run = gameContext();
  const game = run(`
    const category = DB.all().find(cat => cat.categoria.includes('Famosos')).categoria;
    restoreGame({
      players: [{ id: 0 }, { id: 1 }, { id: 2 }],
      secretWord: 'Jennifer López', category, allHints: ['JLo', 'Bailarina'],
      currentHint: 'JLo', usedHints: ['JLo']
    })
  `);
  assert.equal(game.allHints.length, 3);
  assert.ok(!game.allHints.includes('JLo'));
  assert.ok(game.allHints.includes(game.currentHint));
  assert.equal(game.players[0].partnerId, null);
});

test('la pareja cae junta aunque uno hubiera sobrevivido al poder gracias a su ángel', () => {
  const run = gameContext();
  assert.equal(run(`
    const a = { id: 0, partnerId: 1, alive: true, angel: true };
    const b = { id: 1, partnerId: 0, alive: true, angel: false };
    STATE.game = { couple: { a: 0, b: 1 }, players: [a, b], eliminated: [], revealRoles: true };
    const { dead, saved } = applyChaosDeaths([a, b]);
    [a.alive, b.alive, dead.length, saved.length].join('|')
  `), 'false|false|2|0');
});
