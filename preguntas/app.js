(function () {
  'use strict';
  const db = window.QuestionsDB;
  const engine = window.QuestionsEngine;
  const app = document.getElementById('app');
  const modal = document.getElementById('modal');
  const keys = { config: 'entre-lineas-config-v1', round: 'entre-lineas-round-v1', history: 'entre-lineas-history-v1' };
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let storageWarning = false;
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) {
      if (!storageWarning) { notify('El navegador no permite guardar. Mantén esta pestaña abierta durante la ronda.'); storageWarning = true; }
    }
  }
  const storedConfig = read(keys.config, null);
  let config = { names: ['', '', '', ''], intruders: 1, category: 'all' };
  if (storedConfig && Array.isArray(storedConfig.names) && storedConfig.names.length >= 3 && storedConfig.names.length <= 20 && storedConfig.names.every(name => typeof name === 'string')) {
    config.names = storedConfig.names.map(name => name.slice(0, 24));
    config.intruders = Number.isInteger(storedConfig.intruders) ? Math.min(Math.max(1, storedConfig.intruders), Math.floor((config.names.length - 1) / 2)) : 1;
    config.category = db.categories.some(item => item.id === storedConfig.category) ? storedConfig.category : 'all';
  }
  let round = engine.restoreRound(read(keys.round, null), db);
  let history = read(keys.history, []);
  if (!Array.isArray(history)) history = [];
  let view = 'setup';
  let noticeTimer;
  function notify(message) {
    const notice = document.getElementById('notice');
    notice.textContent = message;
    notice.classList.add('visible');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.classList.remove('visible'), 6500);
  }
  function saveRound() { write(keys.round, round); }
  function saveConfig() { write(keys.config, config); }
  function pairForRound() { return db.pairs.find(pair => pair.id === round.pairId); }
  function avatar(name, index, small = false) {
    return `<span class="avatar color-${index % 6}${small ? ' small' : ''}" aria-hidden="true">${esc(name.trim().slice(0, 1).toLocaleUpperCase('es') || String(index + 1).padStart(2, '0'))}</span>`;
  }
  function render(focus = true) {
    app.innerHTML = view === 'setup' ? renderSetup() : renderRound();
    document.body.dataset.view = view;
    if (focus) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      app.focus({ preventScroll: true });
    }
  }
  function renderSetup() {
    const selectedCount = db.pairs.filter(pair => config.category === 'all' || pair.category === config.category).length;
    return `<div class="setup-layout">
      <section class="intro" aria-labelledby="intro-title">
        <div class="eyebrow"><span class="live-dot"></span> EL JUEGO DE LAS PREGUNTAS</div>
        <h1 id="intro-title">Alguien<br> no <em>encaja.</em><span class="title-star" aria-hidden="true">✳</span></h1>
        <p class="intro-copy">Todos tienen una respuesta.<br> Pero no todos tienen la misma pregunta.</p>
        <div class="card-scene" aria-hidden="true">
          <span class="scene-note">Todo parece normal… <svg viewBox="0 0 60 45"><path d="M2 3Q50 0 41 35m-10-7 10 10 13-11"/></svg></span>
          <div class="play-card back-card"><span>MI RESPUESTA</span><strong>7<span>✦</span></strong><i>Todo bajo control.</i></div>
          <div class="play-card front-card"><span>MI RESPUESTA</span><strong>6<span>?</span></strong><i>¿O eso crees?</i><div class="card-eyes"><b></b><b></b></div></div>
          <span class="scene-spark">✷</span><span class="scene-caption">La duda está en los detalles.</span>
        </div>
        <div class="quick-facts"><div><strong>${db.pairs.length}</strong><span>pares de preguntas</span></div><div><strong>3–20</strong><span>jugadores</span></div><div><strong>1</strong><span>solo celular</span></div></div>
      </section>
      <section class="setup-panel panel" aria-labelledby="setup-title">
        ${round ? `<div class="resume-banner"><div><strong>Hay una ronda guardada</strong><span>${round.answers.length} de ${round.config.names.length} respuestas · Ronda ${round.number}</span></div><button type="button" class="text-button" data-action="resume">Continuar ↗</button></div>` : ''}
        <div class="panel-heading"><div><span class="eyebrow muted">PRIMERO, REÚNANSE</span><h2 id="setup-title">Arma el parche<span class="accent-dot">.</span></h2></div><span class="round-stamp" aria-hidden="true">☺</span></div>
        <form id="setup-form" novalidate>
          <div class="section-label"><h3>¿Quiénes juegan?</h3><span id="player-count">${config.names.length} / 20</span></div>
          <div class="player-list">${config.names.map((name, index) => `<div class="player-row">${avatar(name, index)}<label class="sr-only" for="name-${index}">Nombre del jugador ${index + 1}</label><input id="name-${index}" class="name-input" data-player="${index}" value="${esc(name)}" placeholder="Nombre del pana ${index + 1}" maxlength="24" autocomplete="off" enterkeyhint="next" required><button type="button" class="remove-player" data-action="remove-player" data-index="${index}" aria-label="Quitar jugador ${index + 1}" ${config.names.length <= 3 ? 'disabled' : ''}>×</button></div>`).join('')}</div>
          <button type="button" class="add-player" data-action="add-player" ${config.names.length >= 20 ? 'disabled' : ''}><span aria-hidden="true">＋</span> Agregar jugador</button>
          <div class="intruder-setting"><div><h3>Intrusos</h3><p>Reciben otra pregunta. No lo saben.</p></div><div class="stepper"><button type="button" data-action="less-intruders" aria-label="Menos intrusos" ${config.intruders <= 1 ? 'disabled' : ''}>−</button><output aria-live="polite">${config.intruders}</output><button type="button" data-action="more-intruders" aria-label="Más intrusos" ${config.intruders >= Math.floor((config.names.length - 1) / 2) ? 'disabled' : ''}>＋</button></div></div>
          <div class="section-label category-label"><h3>El sabor de la ronda</h3><span>${selectedCount} pares</span></div>
          <div class="category-pills" role="group" aria-label="Categoría de preguntas">${[{ id: 'all', name: 'Un poco de todo', icon: '✦' }, ...db.categories].map(category => `<button type="button" class="category-pill ${config.category === category.id ? 'selected' : ''}" data-action="category" data-category="${category.id}" aria-pressed="${config.category === category.id}"><span aria-hidden="true">${category.icon}</span> ${category.name}</button>`).join('')}</div>
          <div class="setup-note"><span aria-hidden="true">↻</span><p>Pasen el celular. Respondan en secreto.<br><strong>Al final, descubran quién recibió otra pregunta.</strong></p></div>
          <p id="setup-error" class="form-error" role="alert"></p>
          <button class="primary-button start-button" type="submit">Empezar la ronda <span aria-hidden="true">↗</span></button>
          <p class="under-button">Sin descargas. Sin cuentas. Solo ustedes.</p>
        </form>
      </section>
    </div>`;
  }
  function roundHeader(label) {
    return `<div class="round-top"><button class="text-button muted" data-action="exit">← Configuración</button><span class="eyebrow">RONDA ${round.number} <span class="header-dot">·</span> ${label}</span></div>`;
  }
  function progress() {
    return `<div class="progress-track" role="progressbar" aria-label="Respuestas guardadas" aria-valuenow="${round.answers.length}" aria-valuemin="0" aria-valuemax="${round.config.names.length}"><span style="width:${round.answers.length / round.config.names.length * 100}%"></span></div><div class="progress-caption">${round.answers.length} de ${round.config.names.length} respuestas guardadas</div>`;
  }
  function renderRound() {
    if (round.stage === 'handoff' || round.stage === 'answer') {
      const index = round.answers.length;
      const name = round.config.names[index];
      const isAnswer = round.stage === 'answer';
      const pair = pairForRound();
      return `<div class="round-layout">${roundHeader(`TURNO ${index + 1} DE ${round.config.names.length}`)}<section class="private-panel panel ${isAnswer ? 'answer-panel' : ''}">
        <span class="eyebrow muted">${isAnswer ? 'SOLO TÚ PUEDES VER ESTO' : index === 0 ? 'QUE EMPIECE LA DUDA' : 'RESPUESTA GUARDADA. SIGUIENTE PANA.'}</span>
        ${isAnswer ? `<div class="private-player">${avatar(name, index, true)}<span>${esc(name)}</span><button class="text-button" data-action="hide">Ocultar <span aria-hidden="true">◉</span></button></div><h1 class="question-title">${esc(round.roles.includes(index) ? pair.intruder : pair.proper)}</h1><form id="answer-form" novalidate><label class="answer-label" for="answer">Tu respuesta <span>${pair.type === 'number' ? 'Solo un número' : 'Corta y espontánea'}</span></label><input id="answer" class="answer-input" name="answer" placeholder="${pair.type === 'number' ? 'Escribe un número…' : 'Lo primero que se te ocurra…'}" ${pair.type === 'number' ? 'inputmode="decimal"' : ''} maxlength="80" autocomplete="off" autocapitalize="sentences" enterkeyhint="done" required aria-describedby="answer-hint answer-error"><p id="answer-hint" class="answer-hint">Responde con sinceridad. No leas tu pregunta en voz alta.</p><p id="answer-error" class="form-error" role="alert"></p><button type="submit" class="primary-button">Guardar y ocultar <span aria-hidden="true">→</span></button></form>` : `<div class="handoff-art" aria-hidden="true"><div class="phone-outline"><span>≋</span><i></i></div><span class="handoff-spark">✳</span></div><h1 class="handoff-title">Pásale el celular a<br><span>${esc(name)}.</span></h1><p class="center-copy">Solo ${esc(name)} debe mirar la siguiente pantalla.<br>Los demás, ojos fuera.</p><button class="primary-button" data-action="show">Soy ${esc(name)}, ver mi pregunta <span aria-hidden="true">→</span></button><p class="under-button">Tu rol también es un secreto para ti.</p>`}
        <div class="private-progress">${progress()}</div>
      </section><p class="round-footnote">${isAnswer ? 'La pregunta se oculta al guardar tu respuesta.' : 'Una pregunta. Una respuesta. Cero pistas en voz alta.'}</p></div>`;
    }
    if (round.stage === 'ready') {
      return `<div class="round-layout">${roundHeader('TODOS RESPONDIERON')}<section class="private-panel panel ready-panel"><div class="ready-symbol" aria-hidden="true">✳</div><span class="eyebrow">${round.config.names.length} RESPUESTAS. UNA GRAN DUDA.</span><h1 class="handoff-title">Celular al centro<span class="accent-dot">.</span></h1><p class="center-copy">Ya nadie tiene que mirar en secreto.<br>Ahora vean las respuestas y busquen quién no encaja.</p><button class="primary-button" data-action="answers">Ver las respuestas <span aria-hidden="true">↗</span></button><p class="under-button">Los intrusos todavía no se revelan.</p></section></div>`;
    }
    const pair = pairForRound();
    const revealed = round.stage === 'reveal';
    const intruderNames = round.roles.map(index => round.config.names[index]);
    return `<div class="board-layout">${roundHeader(revealed ? 'MISTERIO RESUELTO' : 'HORA DE SOSPECHAR')}<section class="board-heading"><span class="eyebrow"><span class="live-dot"></span> ${revealed ? 'AHORA TODO TIENE SENTIDO' : 'ESTA ERA LA PREGUNTA DE LA MAYORÍA'}</span><h1>${revealed ? `${round.roles.length === 1 ? 'El intruso era' : 'Los intrusos eran'}<br><em>${intruderNames.map(esc).join(' y ')}.</em>` : esc(pair.proper)}</h1><p>${revealed ? 'Miren sus respuestas otra vez. ¿Ya encajan las piezas?' : 'Lean las respuestas. Comenten sus sospechas antes de descubrir los roles.'}</p></section>
      ${revealed ? `<div class="question-comparison"><div><span class="eyebrow">LA MAYORÍA</span><h2>${esc(pair.proper)}</h2></div><div class="intruder-question"><span class="eyebrow">${round.roles.length === 1 ? 'EL INTRUSO' : 'LOS INTRUSOS'}</span><h2>${esc(pair.intruder)}</h2></div></div>` : ''}
      <div class="answer-grid">${round.config.names.map((name, index) => `<article class="answer-card ${revealed && round.roles.includes(index) ? 'is-intruder' : ''}"><div class="answer-card-top">${avatar(name, index, true)}<h2>${esc(name)}</h2>${revealed ? `<span class="role-tag">${round.roles.includes(index) ? 'Intruso' : 'Mayoría'}</span>` : '<span class="answer-mark" aria-hidden="true">”</span>'}</div><p>${esc(round.answers[index])}</p></article>`).join('')}</div>
      <div class="board-actions">${revealed ? `<button class="primary-button" data-action="again">Otra ronda, mismos panas <span aria-hidden="true">↻</span></button><button class="secondary-button" data-action="settings">Cambiar jugadores o categoría</button><p class="under-button">Nuevas preguntas. Nuevos intrusos.</p>` : `<div class="discussion-note"><span aria-hidden="true">☝</span><p><strong>Que cada quien defienda su respuesta.</strong><br>Señalen a sus sospechosos y, cuando estén listos, revelen.</p></div><button class="primary-button" data-action="reveal">Descubrir ${round.roles.length === 1 ? 'al intruso' : 'a los intrusos'} <span aria-hidden="true">↗</span></button>`}</div></div>`;
  }
  function showDialog(content) {
    document.getElementById('modal-content').innerHTML = content;
    modal.showModal();
  }
  function showHelp() {
    showDialog(`<button class="dialog-close" data-action="close" aria-label="Cerrar instrucciones">×</button><span class="eyebrow muted">UN MINUTO Y A JUGAR</span><h2 id="modal-title">Todo parece normal<span class="accent-dot">.</span></h2><ol class="rules-list"><li><strong>Armen el parche.</strong><p>De 3 a 20 jugadores. Elijan cuántos intrusos habrá y una categoría.</p></li><li><strong>Pasen el celular.</strong><p>Cada persona ve una pregunta y escribe su respuesta en secreto. La mayoría recibe la misma; los intrusos reciben otra parecida. Nadie ve su rol.</p></li><li><strong>Busquen al que no encaja.</strong><p>Cuando todos respondan, aparece la pregunta de la mayoría con todas las respuestas. Hablen y señalen a sus sospechosos.</p></li><li><strong>Revelen la sorpresa.</strong><p>Toquen «Descubrir» para ver los intrusos y las dos preguntas. ¡Hasta ellos se van a enterar!</p></li></ol><div class="example-note"><strong>Por ejemplo…</strong><p>«¿Qué edad tenías al entrar a primaria?» y «¿Cuántos días a la semana te bañas?». Un 6 o un 7 podría encajar en ambas.</p></div><button class="primary-button" data-action="close">Entendido, a jugar <span aria-hidden="true">→</span></button>`);
  }
  function beginRound(number) {
    try {
      round = engine.createRound(config, db, history, number);
      config = { ...round.config, names: [...round.config.names] };
      history = round.used;
      write(keys.history, history);
      saveConfig(); saveRound();
      view = 'round'; render();
    } catch (error) {
      const target = document.getElementById('setup-error');
      if (target) { target.textContent = error.message; document.querySelector('.name-input:placeholder-shown')?.focus(); }
      else notify(error.message);
    }
  }
  function changeConfig() { saveConfig(); render(false); }
  document.addEventListener('input', event => {
    if (!event.target.matches('[data-player]')) return;
    const index = Number(event.target.dataset.player);
    config.names[index] = event.target.value;
    event.target.closest('.player-row').querySelector('.avatar').textContent = event.target.value.trim().slice(0, 1).toLocaleUpperCase('es') || String(index + 1).padStart(2, '0');
    document.getElementById('setup-error').textContent = '';
    saveConfig();
  });
  document.addEventListener('submit', event => {
    if (!['setup-form', 'answer-form'].includes(event.target.id)) return;
    event.preventDefault();
    if (event.target.id === 'setup-form') {
      try { engine.validateConfig(config, db); }
      catch (error) { document.getElementById('setup-error').textContent = error.message; document.querySelector('.name-input:placeholder-shown')?.focus(); return; }
      if (round && round.stage !== 'reveal') {
        showDialog(`<button class="dialog-close" data-action="close" aria-label="Cerrar">×</button><h2 id="modal-title">¿Empezar de nuevo?</h2><p class="center-copy">Hay una ronda guardada. Al comenzar otra, sus respuestas se reemplazan.</p><button class="primary-button" data-action="replace">Empezar nueva ronda →</button><button class="secondary-button" data-action="close">Volver</button>`);
      } else beginRound(1);
    } else {
      try { round = engine.submitAnswer(round, document.getElementById('answer').value, db); saveRound(); render(); }
      catch (error) { document.getElementById('answer-error').textContent = error.message; document.getElementById('answer').focus(); }
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'help') { showHelp(); return; }
    if (action === 'close') { modal.close(); return; }
    if (action === 'add-player' && config.names.length < 20) { config.names.push(''); changeConfig(); document.getElementById(`name-${config.names.length - 1}`).focus(); }
    if (action === 'remove-player' && config.names.length > 3) { const index = Number(button.dataset.index); config.names.splice(index, 1); config.intruders = Math.min(config.intruders, Math.floor((config.names.length - 1) / 2)); changeConfig(); document.getElementById(`name-${Math.min(index, config.names.length - 1)}`).focus(); }
    if (action === 'less-intruders' && config.intruders > 1) { config.intruders--; changeConfig(); document.querySelector('[data-action="less-intruders"]').focus(); }
    if (action === 'more-intruders' && config.intruders < Math.floor((config.names.length - 1) / 2)) { config.intruders++; changeConfig(); document.querySelector('[data-action="more-intruders"]').focus(); }
    if (action === 'category') { config.category = button.dataset.category; changeConfig(); document.querySelector(`[data-category="${config.category}"]`).focus(); }
    if (action === 'resume' && round) { config = { ...round.config, names: [...round.config.names] }; view = 'round'; render(); }
    if (action === 'replace') { modal.close(); beginRound(1); }
    if (!round) return;
    if (action === 'show' && round.stage === 'handoff') { round.stage = 'answer'; saveRound(); render(); }
    if (action === 'hide' && round.stage === 'answer') { round.stage = 'handoff'; saveRound(); render(); }
    if (action === 'answers' && round.stage === 'ready') { round.stage = 'discussion'; saveRound(); render(); }
    if (action === 'reveal' && round.stage === 'discussion') { round.stage = 'reveal'; saveRound(); render(); }
    if (action === 'again' && round.stage === 'reveal') beginRound(round.number + 1);
    if (action === 'exit') {
      if (round.stage === 'answer') { round.stage = 'handoff'; saveRound(); }
      view = 'setup'; render();
    }
    if (action === 'settings' && round.stage === 'reveal') { round = null; saveRound(); view = 'setup'; render(); }
  });
  modal.addEventListener('click', event => { if (event.target === modal) { const bounds = modal.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close(); } });
  document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    if (round?.stage === 'answer') { round.stage = 'handoff'; saveRound(); }
    view = 'setup'; render();
  });
  function shieldQuestion() {
    if (round?.stage === 'answer') { round.stage = 'handoff'; saveRound(); if (view === 'round') render(false); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) shieldQuestion(); });
  window.addEventListener('pagehide', shieldQuestion);
  window.addEventListener('pageshow', event => { if (event.persisted) shieldQuestion(); });
  render(false);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('../sw.js', { updateViaCache: 'none' }).catch(() => {});
})();
