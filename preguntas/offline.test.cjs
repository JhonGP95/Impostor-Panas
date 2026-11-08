const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const base = 'https://example.test/Impostor-Panas/';

function worker() {
  const handlers = {};
  const entries = new Map();
  let online = true;
  let writable = true;
  let precache = [];
  const keyFor = key => new URL(typeof key === 'string' ? key : key.url, base).href;
  const cache = {
    async addAll(requests) { precache = requests.map(request => request.url.slice(base.length)); },
    async put(key, response) { if (!writable) throw new Error('Quota'); entries.set(keyFor(key), response); }
  };
  const context = {
    APP_VERSION: 'test', importScripts() {}, URL, Response,
    Request: class extends Request { constructor(url, options) { super(new URL(url, base), options); } },
    self: { location: { origin: new URL(base).origin }, addEventListener(type, handler) { handlers[type] = handler; }, skipWaiting() {}, clients: { claim() {} } },
    caches: { async open() { return cache; }, async match(key) { return entries.get(keyFor(key))?.clone(); }, async keys() { return []; } },
    async fetch(request) {
      if (!online) throw new Error('Offline');
      return new Response(new URL(request.url).pathname.includes('/preguntas') ? 'Entre líneas' : 'El Impostor');
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  return {
    async install() { let result; handlers.install({ waitUntil(promise) { result = promise; } }); await result; return precache; },
    async navigate(relative) {
      let result;
      handlers.fetch({ request: { url: new URL(relative, base).href, method: 'GET', mode: 'navigate' }, respondWith(promise) { result = promise; } });
      return result;
    },
    offline() { online = false; },
    fullStorage() { writable = false; }
  };
}
test('todos los recursos precargados existen, incluyendo los dos juegos', async () => {
  const urls = await worker().install();
  assert.ok(urls.includes('preguntas/index.html'));
  assert.ok(urls.includes('index.html'));
  assert.ok(urls.includes('manifest.webmanifest'));
  for (const url of urls) assert.ok(fs.existsSync(path.join(root, url)), `Recurso faltante: ${url}`);
});
test('las navegaciones online mantienen cada juego en su propia entrada de caché', async () => {
  const sw = worker();
  assert.equal(await (await sw.navigate('./')).text(), 'El Impostor');
  assert.equal(await (await sw.navigate('preguntas/')).text(), 'Entre líneas');
  sw.offline();
  assert.equal(await (await sw.navigate('./')).text(), 'El Impostor');
  assert.equal(await (await sw.navigate('preguntas/')).text(), 'Entre líneas');
  assert.equal(await (await sw.navigate('preguntas/index.html?from=home')).text(), 'Entre líneas');
});
test('el almacenamiento lleno no impide abrir una página que sí responde online', async () => {
  const sw = worker();
  sw.fullStorage();
  assert.equal(await (await sw.navigate('preguntas/')).text(), 'Entre líneas');
});
test('una ruta desconocida offline falla sin mostrar el juego equivocado', async () => {
  const sw = worker();
  await sw.navigate('./');
  sw.offline();
  assert.equal((await sw.navigate('no-existe/')).type, 'error');
});
