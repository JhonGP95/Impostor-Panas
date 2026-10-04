/* ================================================================
   PWA - MANIFEST DINÁMICO + ÍCONOS + INSTALACIÓN + SERVICE WORKER
   ================================================================ */
const SW_SOURCE =
  "const CACHE='el-impostor-v0-4';" +
  "const ASSETS=['./','./index.html'];" +
  "self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});" +
  "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});" +
  "self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&res.type==='basic'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}return res;}).catch(()=>caches.match('./index.html'))))});";

function generatePwaIcon(size, maskable) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  const g = ctx.createRadialGradient(size/2, size*0.42, size*0.05, size/2, size/2, size*0.8);
  g.addColorStop(0, '#26043c');
  g.addColorStop(0.55, '#0a0014');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const ringR = size * (maskable ? 0.34 : 0.40);
  ctx.strokeStyle = 'rgba(168,85,247,0.95)';
  ctx.lineWidth = size * 0.035;
  ctx.beginPath();
  ctx.arc(size/2, size/2, ringR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,245,255,0.55)';
  ctx.lineWidth = size * 0.016;
  ctx.beginPath();
  ctx.arc(size/2, size/2, ringR * 1.13, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = Math.round(size * (maskable ? 0.38 : 0.44)) + 'px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👁️', size/2, size/2 + size*0.01);

  try { return c.toDataURL('image/png'); } catch(e) { return null; }
}

function setupPwaManifest() {
  try {
    const startUrl = location.href.split('#')[0];
    const scope = startUrl.replace(/[^/]*$/, '');
    const icon192 = generatePwaIcon(192, false);
    const icon512 = generatePwaIcon(512, false);
    const iconMask = generatePwaIcon(512, true);

    const manifest = {
      name: 'El Impostor · Chazey Panas',
      short_name: 'Impostor',
      description: 'Juego de fiesta: encontrá al impostor con la palabra secreta.',
      start_url: startUrl,
      scope: scope,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#000000',
      theme_color: '#000000',
      icons: []
    };
    if (icon192) manifest.icons.push({ src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' });
    if (icon512) manifest.icons.push({ src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' });
    if (iconMask) manifest.icons.push({ src: iconMask, sizes: '512x512', type: 'image/png', purpose: 'maskable' });

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const link = document.getElementById('manifest-link');
    if (link) link.href = URL.createObjectURL(blob);
  } catch(e) {}
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.querySelectorAll('.install-btn').forEach(b => b.style.display = 'flex');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  document.querySelectorAll('.install-btn').forEach(b => b.style.display = 'none');
});

async function handleInstallClick() {
  playSound('tap');
  if (deferredPrompt) {
    deferredPrompt.prompt();
    try {
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') deferredPrompt = null;
    } catch(e) {}
  } else {
    openPwaInfo();
  }
}

function openPwaInfo() {
  openModal(`
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">📲</div>
      <div class="title-md" style="margin-bottom:8px;">Instalar como App</div>
      <div class="body-md" style="color:var(--muted);margin-bottom:20px;">
        Juega a pantalla completa, sin la barra del navegador.
      </div>
      <div style="text-align:left;margin-bottom:20px;display:flex;flex-direction:column;gap:10px;">
        <div class="info-note"><strong style="color:var(--cyan);">📱 Android (Chrome):</strong><br>Menú ⋮ → <em>Instalar aplicación</em> / <em>Agregar a pantalla de inicio</em>.</div>
        <div class="info-note"><strong style="color:var(--violet);">🍎 iPhone (Safari):</strong><br>Botón Compartir ⬆️ → <em>Agregar a pantalla de inicio</em>.</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="btn btn-ghost btn-sm" onclick="downloadSw()">⬇️ Descargar sw.js (modo offline)</button>
        <button class="btn btn-primary btn-sm" onclick="closeModal()">Entendido</button>
      </div>
      <div class="caption" style="margin-top:14px;">
        El sw.js es opcional: cópialo junto a index.html en tu repositorio para poder jugar sin internet.
      </div>
    </div>
  `);
}

function downloadSw() {
  try {
    const blob = new Blob([SW_SOURCE], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sw.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch(e) {}
}

function tryRegisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e) {}
}

