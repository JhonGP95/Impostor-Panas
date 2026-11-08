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
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try {
      await prompt.prompt();
    } catch(e) { openPwaInfo(); }
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
        <button class="btn btn-primary btn-sm" onclick="closeModal()">Entendido</button>
      </div>
    </div>
  `);
}

function tryRegisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e) {}
}

