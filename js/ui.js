/* ================================================================
   NAVEGACIÓN SPA
   ================================================================ */
function navigate(toId) {
  const next = $(toId);
  if (!next) return;

  // Salir siempre desde la pantalla que la SPA considera actual (no un querySelector,
  // que puede devolver una pantalla equivocada si dos quedaron activas)
  const prevId = STATE.currentScreen;
  const current = (prevId && prevId !== toId) ? $(prevId) : null;

  if (current) {
    current.inert = true;
    current.classList.add('exit-left');
    current.classList.remove('active');
    setTimeout(() => {
      // Solo si sigue en salida (no fue reactivada por otra navegación)
      if (current.classList.contains('exit-left')) {
        current.classList.remove('active', 'exit-left');
      }
    }, 230);
  }

  // Higiene: ninguna otra pantalla debe quedar activa
  document.querySelectorAll('.screen.active').forEach(sc => {
    if (sc !== next && sc !== current) sc.classList.remove('active', 'exit-left');
  });

  next.classList.remove('exit-left');
  next.classList.add('active');
  next.inert = false;

  STATE.currentScreen = toId;
  playSound('whoosh');
}

/* ================================================================
   MODALES
   ================================================================ */
let modalTrigger = null;
let modalDismissible = true;

function openModal(html, dismissible = true) {
  resetHoldState();
  const modal = $('modal');
  const content = $('modal-content');
  if (!modal.classList.contains('open')) modalTrigger = document.activeElement;
  modalDismissible = dismissible;
  content.innerHTML = html;
  content.scrollTop = 0;
  modal.inert = false;
  modal.classList.add('open');
  content.focus({ preventScroll: true });
  $('app').inert = true;
  $('sound-toggle').inert = true;
}

function closeModal() {
  const modal = $('modal');
  modal.classList.remove('open');
  modal.inert = true;
  $('app').inert = false;
  $('sound-toggle').inert = false;
  $('modal-content').replaceChildren();
  modalTrigger?.focus({ preventScroll: true });
  modalTrigger = null;
}

function closeModalOnBg(e) {
  if (modalDismissible && e.target === $('modal')) closeModal();
}
