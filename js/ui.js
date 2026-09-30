/* ================================================================
   NAVEGACIÓN SPA
   ================================================================ */
function navigate(toId, back = false) {
  const next = $(toId);
  if (!next) return;

  // Salir siempre desde la pantalla que la SPA considera actual (no un querySelector,
  // que puede devolver una pantalla equivocada si dos quedaron activas)
  const prevId = STATE.currentScreen;
  const current = (prevId && prevId !== toId) ? $(prevId) : null;

  if (current) {
    current.classList.add('exit-left');
    setTimeout(() => {
      // Solo si sigue en salida (no fue reactivada por otra navegación)
      if (current.classList.contains('exit-left')) {
        current.classList.remove('active', 'exit-left');
      }
    }, 350);
  }

  // Higiene: ninguna otra pantalla debe quedar activa
  document.querySelectorAll('.screen.active').forEach(sc => {
    if (sc !== next && sc !== current) sc.classList.remove('active', 'exit-left');
  });

  // Entrada 100% sincrónica (sin rAF): en pestañas en segundo plano o con
  // throttling, requestAnimationFrame puede retrasarse indefinidamente o
  // ejecutarse tarde y reactivar una pantalla equivocada. El reflow forzado
  // registra el punto de partida de la transición de forma determinista.
  next.style.transform = back ? 'translateX(-100%)' : '';
  void next.offsetWidth; // fuerza reflow
  next.classList.remove('exit-left');
  next.classList.add('active');
  if (back) next.style.transform = '';

  STATE.currentScreen = toId;
  playSound('whoosh');
}

/* ================================================================
   MODALES
   ================================================================ */
function openModal(html) {
  $('modal-content').innerHTML = html;
  $('modal').classList.add('open');
}

function closeModal() {
  $('modal').classList.remove('open');
}

function closeModalOnBg(e) {
  if (e.target === $('modal')) closeModal();
}
