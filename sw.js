/* Service Worker — El Impostor · Chazey Panas
   Estrategia:
   - Navegación (index.html): NETWORK-FIRST → si hay internet, siempre la
     versión nueva; sin internet, cae al cache. Así nadie queda pegado a una
     versión vieja.
   - Resto de archivos: CACHE-FIRST con actualización en segundo plano
     (stale-while-revalidate). Los archivos nuevos (ej. una categoría nueva)
     se cachean solos en la primera visita.
   Para publicar una actualización a los jugadores instalados: subí los cambios
   y cambiá APP_VERSION en js/version.js (el cache viejo se borra solo).
*/
importScripts('js/version.js');

const CACHE = 'impostor-panas-' + APP_VERSION;
const CORE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/version.js",
  "./js/balance.js",
  "./js/utils.js",
  "./js/audio.js",
  "./js/state.js",
  "./js/database.js",
  "./data/categorias/deportes.js",
  "./data/categorias/playa-mar-y-vacaciones.js",
  "./data/categorias/paises-y-nacionalidades.js",
  "./data/categorias/historia-y-mitologia.js",
  "./data/categorias/naturaleza-y-ciencia.js",
  "./data/categorias/frutas-y-verduras.js",
  "./data/categorias/gastronomia.js",
  "./data/categorias/festividades.js",
  "./data/categorias/cine-y-cultura-pop.js",
  "./data/categorias/artistas-cantantes-y-famosos.js",
  "./data/categorias/circo-y-espectaculos.js",
  "./data/categorias/videojuegos-clasicos-y-populares.js",
  "./data/categorias/musica-y-artes.js",
  "./data/categorias/lugares-de-la-ciudad.js",
  "./data/categorias/estadios-y-equipos-de-futbol.js",
  "./data/categorias/objetos-del-hogar.js",
  "./data/categorias/salud-enfermedades-y-medicina.js",
  "./data/categorias/mascotas-y-animales-de-granja.js",
  "./data/categorias/profesiones.js",
  "./data/categorias/cuidado-personal-y-belleza.js",
  "./data/categorias/bebidas.js",
  "./data/categorias/dinero-bancos-y-compras.js",
  "./data/categorias/libros-cuentos-y-fabulas.js",
  "./data/categorias/astronomia.js",
  "./data/categorias/lugares-iconicos.js",
  "./data/categorias/emociones-y-sentimientos.js",
  "./data/categorias/transporte.js",
  "./data/categorias/herramientas-y-utensilios.js",
  "./data/categorias/tecnologia.js",
  "./data/categorias/prendas-y-accesorios.js",
  "./data/categorias/juguetes-y-juegos-infantiles.js",
  "./data/categorias/espacio-y-astronautas.js",
  "./data/categorias/chazey-panas.js",
  "./js/ui.js",
  "./js/pwa.js",
  "./js/screens-config.js",
  "./js/game-start.js",
  "./js/game-reveal.js",
  "./js/game-players.js",
  "./js/game-discussion.js",
  "./js/game-voting.js",
  "./js/game-powers.js",
  "./js/game-victory.js",
  "./js/main.js"
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navegación: red primero, cache de respaldo
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const cp = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', cp));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Mismo origen: cache primero, refrescando en segundo plano
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok) {
            const cp = res.clone();
            caches.open(CACHE).then((c) => c.put(req, cp));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
