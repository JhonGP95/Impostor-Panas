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
  let config = { names: ['', '', '', ''], intruders: 1, category: 'all', bullets: engine.DEFAULT_BULLETS };
  if (storedConfig && Array.isArray(storedConfig.names) && storedConfig.names.length >= 3 && storedConfig.names.length <= 20 && storedConfig.names.every(name => typeof name === 'string')) {
    config.names = storedConfig.names.map(name => name.slice(0, 24));
    config.intruders = Number.isInteger(storedConfig.intruders) ? Math.min(Math.max(1, storedConfig.intruders), Math.floor((config.names.length - 1) / 2)) : 1;
    config.category = db.categories.some(item => item.id === storedConfig.category) ? storedConfig.category : 'all';
    if (Number.isInteger(storedConfig.bullets)) {
      config.bullets = Math.max(engine.DEFAULT_BULLETS, Math.min(storedConfig.bullets, engine.maxBullets(config.names.length, config.intruders)));
    }
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
  function renderStepper(key, label, min, max) {
    const value = config[key];
    return `<div class="stepper">
      <button type="button" data-action="step-config" data-setting="${key}" data-step="-1" aria-label="Menos ${label}" ${value <= min ? 'disabled' : ''}>−</button>
      <output aria-live="polite" aria-label="${label}">${value}</output>
      <button type="button" data-action="step-config" data-setting="${key}" data-step="1" aria-label="Más ${label}" ${value >= max ? 'disabled' : ''}>＋</button>
    </div>`;
  }
  function renderSetup() {
    const selectedCount = engine.questionPool(db, config.category).length;
    const category = db.categories.find(item => item.id === config.category);
    return `<div class="setup-layout">
      <div class="setup-content">
        <div class="setup-heading">
          <p class="eyebrow"><span aria-hidden="true">≋</span> Entre líneas</p>
          <h1>Configura la partida</h1>
          <p>Elige quién juega, los intrusos y las balas.</p>
        </div>
        <a href="../index.html" class="btn game-link">
          <span class="game-link-icon" aria-hidden="true">👁️</span>
          <span class="game-link-copy"><strong>Jugar El Impostor</strong><small>Palabras secretas, pistas y sospechas.</small></span>
          <span aria-hidden="true">↗</span>
        </a>
        <section class="setup-panel panel" aria-labelledby="setup-title">
        ${round ? `<div class="resume-banner"><div><strong>Hay una ronda guardada</strong><span>${round.answers.length} de ${round.config.names.length} respuestas · Ronda ${round.number}</span></div><button type="button" class="text-button" data-action="resume">Continuar ↗</button></div>` : ''}
        <div class="panel-heading"><div><span class="eyebrow muted">PRIMERO, REÚNANSE</span><h2 id="setup-title">Arma el parche<span class="accent-dot">.</span></h2></div><span class="round-stamp" aria-hidden="true">☺</span></div>
        <form id="setup-form" novalidate>
          <div class="section-label"><h3>¿Quiénes juegan?</h3><span id="player-count">${config.names.length} / 20</span></div>
          <div class="player-list">${config.names.map((name, index) => `<div class="player-row">${avatar(name, index)}<label class="sr-only" for="name-${index}">Nombre del jugador ${index + 1}</label><input id="name-${index}" class="name-input" data-player="${index}" value="${esc(name)}" placeholder="Nombre del pana ${index + 1}" maxlength="24" autocomplete="off" enterkeyhint="next" required><button type="button" class="remove-player" data-action="remove-player" data-index="${index}" aria-label="Quitar jugador ${index + 1}" ${config.names.length <= 3 ? 'disabled' : ''}>×</button></div>`).join('')}</div>
          <button type="button" class="add-player" data-action="add-player" ${config.names.length >= 20 ? 'disabled' : ''}><span aria-hidden="true">＋</span> Agregar jugador</button>
          <div class="round-settings">
            <div class="round-setting"><div><h3>Intrusos</h3><p>Reciben otra pregunta.</p></div>${renderStepper('intruders', 'intrusos', 1, Math.floor((config.names.length - 1) / 2))}</div>
            <div class="round-setting"><div><h3>Balas</h3><p>Cada voto errado gasta una.</p></div>${renderStepper('bullets', 'balas', engine.DEFAULT_BULLETS, engine.maxBullets(config.names.length, config.intruders))}</div>
          </div>
          <div class="section-label category-label"><h3>El sabor de la ronda</h3><span>${selectedCount} pares</span></div>
          <div class="category-pills" role="group" aria-label="Categoría de preguntas">${[{ id: 'all', name: 'Un poco de todo', icon: '✦' }, ...db.categories].map(category => `<button type="button" class="category-pill ${config.category === category.id ? 'selected' : ''}" data-action="category" data-category="${category.id}" aria-pressed="${config.category === category.id}"><span aria-hidden="true">${category.icon}</span> ${category.name}</button>`).join('')}</div>
          ${category?.optIn ? `<p class="category-note">${esc(category.description)}</p>` : ''}
          <div class="setup-note"><span aria-hidden="true">↻</span><p>Pasen el celular y respondan en secreto.<br><strong>Luego discutan y voten por los sospechosos.</strong></p></div>
        </form>
        </section>
      </div>
      <div class="setup-footer">
        <p id="setup-error" class="form-error" role="alert"></p>
        <button class="btn btn-primary" type="submit" form="setup-form"><span aria-hidden="true">⚡</span> Iniciar partida</button>
      </div>
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
        ${isAnswer ? `<div class="private-player">${avatar(name, index, true)}<span>${esc(name)}</span><button class="text-button" data-action="hide">Ocultar <span aria-hidden="true">◉</span></button></div><h1 class="question-title">${esc(round.roles.includes(index) ? pair.intruder : pair.proper)}</h1><form id="answer-form" novalidate><label class="answer-label" for="answer">Tu respuesta <span>${pair.type === 'number' ? 'Solo un número' : 'Corta y espontánea'}</span></label><input id="answer" class="answer-input" name="answer" placeholder="${pair.type === 'number' ? 'Escribe un número…' : 'Lo primero que se te ocurra…'}" ${pair.type === 'number' ? 'inputmode="decimal"' : ''} maxlength="80" autocomplete="off" autocapitalize="sentences" enterkeyhint="done" required aria-describedby="answer-hint answer-error"><p id="answer-hint" class="answer-hint">Responde con sinceridad. No leas tu pregunta en voz alta.</p><p id="answer-error" class="form-error" role="alert"></p><button type="submit" class="btn btn-primary">Guardar y ocultar <span aria-hidden="true">→</span></button></form>` : `<div class="private-icon" aria-hidden="true">🔒</div><h1 class="handoff-title">Pásale el celular a<br><span>${esc(name)}.</span></h1><p class="center-copy">Solo ${esc(name)} debe mirar la siguiente pantalla.</p><button class="btn btn-primary" data-action="show">Soy ${esc(name)}, ver mi pregunta <span aria-hidden="true">→</span></button><p class="under-button">Tu rol también es un secreto para ti.</p>`}
        <div class="private-progress">${progress()}</div>
      </section><p class="round-footnote">${isAnswer ? 'La pregunta se oculta al guardar tu respuesta.' : 'Una pregunta. Una respuesta. Cero pistas en voz alta.'}</p></div>`;
    }
    if (round.stage === 'ready') {
      return `<div class="round-layout">${roundHeader('TODOS RESPONDIERON')}<section class="private-panel panel"><div class="private-icon" aria-hidden="true">🗣️</div><span class="eyebrow">${round.config.names.length} RESPUESTAS. UNA GRAN DUDA.</span><h1 class="handoff-title">Celular al centro<span class="accent-dot">.</span></h1><p class="center-copy">Vean las respuestas y discutan antes de votar.</p><button class="btn btn-primary" data-action="answers">Ver las respuestas <span aria-hidden="true">↗</span></button></section></div>`;
    }
    return renderBoard();
  }

  function renderAnswerCard(name, index, revealed) {
    const known = revealed || round.votes.includes(index);
    const intruder = known && round.roles.includes(index);
    return `<article class="answer-card ${intruder ? 'is-intruder' : ''}">
      <div class="answer-card-top">
        ${avatar(name, index, true)}
        <h2>${esc(name)}</h2>
        ${known ? `<span class="role-tag">${intruder ? 'Intruso' : 'Mayoría'}</span>` : '<span class="answer-mark" aria-hidden="true">”</span>'}
      </div>
      <p>${esc(round.answers[index])}</p>
      ${known ? '' : `<button class="btn btn-ghost btn-sm vote-button" data-action="vote" data-index="${index}" aria-label="Votar por ${esc(name)}">Votar</button>`}
    </article>`;
  }

  function renderBoard() {
    const pair = pairForRound();
    const revealed = round.stage === 'reveal';
    const { bullets, remaining, winner } = engine.voteStatus(round);
    const last = round.votes.at(-1);
    const hit = round.roles.includes(last);
    const resultTitle = winner === 'majority' ? '¡La mayoría gana!' : winner === 'intruders' ? '¡Ganan los intrusos!' : 'Misterio resuelto';
    const resultCopy = winner === 'majority' ? 'La mesa encontró a todos los intrusos.' : winner === 'intruders' ? 'La mesa se quedó sin balas.' : 'Ya pueden comparar las dos preguntas.';
    return `<div class="board-layout">${roundHeader(revealed ? 'RESULTADO' : 'VOTACIÓN')}
      <section class="board-heading">
        <p class="eyebrow"><span class="live-dot"></span> ${revealed ? 'FIN DE LA RONDA' : 'PREGUNTA DE LA MAYORÍA'}</p>
        <h1>${revealed ? resultTitle : esc(pair.proper)}</h1>
        <p>${revealed ? resultCopy : 'Defiendan sus respuestas, pónganse de acuerdo y voten por un sospechoso.'}</p>
      </section>
      ${!revealed || winner ? `<div class="board-stats" aria-label="Estado de la ronda">
        <span class="round-stat">🔫 ${bullets} ${bullets === 1 ? 'bala' : 'balas'}</span>
        <span class="round-stat">🎭 ${remaining} ${remaining === 1 ? 'intruso por encontrar' : 'intrusos por encontrar'}</span>
      </div>` : ''}
      ${last !== undefined ? `<p class="vote-result ${hit ? 'vote-hit' : 'vote-miss'}" role="status">
        <strong>${esc(round.config.names[last])}</strong> ${hit ? 'era intruso. Conservan la bala.' : 'era de la mayoría. Pierden una bala.'}
      </p>` : ''}
      ${revealed ? `<div class="question-comparison"><div><span class="eyebrow">LA MAYORÍA</span><h2>${esc(pair.proper)}</h2></div><div class="intruder-question"><span class="eyebrow">${round.roles.length === 1 ? 'EL INTRUSO' : 'LOS INTRUSOS'}</span><h2>${esc(pair.intruder)}</h2></div></div>` : ''}
      <div class="answer-grid">${round.config.names.map((name, index) => renderAnswerCard(name, index, revealed)).join('')}</div>
      ${revealed ? `<div class="board-actions"><button class="btn btn-primary" data-action="again">Otra ronda, mismos panas <span aria-hidden="true">↻</span></button><button class="btn btn-ghost" data-action="settings">Cambiar configuración</button></div>` : ''}
    </div>`;
  }
  function showDialog(content) {
    document.getElementById('modal-content').innerHTML = content;
    modal.showModal();
  }
  function showHelp() {
    showDialog(`<button class="dialog-close" data-action="close" aria-label="Cerrar instrucciones">×</button><span class="eyebrow muted">ENTRE LÍNEAS</span><h2 id="modal-title">Cómo se juega</h2><ol class="rules-list">
      <li><strong>Configuren la ronda.</strong><p>De 3 a 20 jugadores. Elijan los intrusos, las balas y una categoría.</p></li>
      <li><strong>Pasen el celular.</strong><p>Cada persona responde en secreto. La mayoría recibe una pregunta y los intrusos reciben otra parecida.</p></li>
      <li><strong>Discutan y voten.</strong><p>Lean la pregunta de la mayoría y todas las respuestas. Voten por un sospechoso a la vez. Acertar conserva la bala; votar por alguien de la mayoría gasta una.</p></li>
      <li><strong>Descubran las dos preguntas.</strong><p>La mayoría gana si encuentra a todos los intrusos. Los intrusos ganan si se agotan las balas.</p></li>
    </ol><div class="example-note"><strong>Por ejemplo…</strong><p>«¿Qué edad tenías al entrar a primaria?» y «¿Cuántos días a la semana te bañas?». Un 6 o un 7 podría encajar en ambas.</p></div><button class="btn btn-primary" data-action="close">Entendido, a jugar <span aria-hidden="true">→</span></button>`);
  }

  function confirmVote(index) {
    showDialog(`<h2 id="modal-title">¿Votar por ${esc(round.config.names[index])}?</h2>
      <p class="center-copy">Si era de la mayoría, pierden una bala.</p>
      <button class="btn btn-primary" data-action="confirm-vote" data-index="${index}">Confirmar voto</button>
      <button class="btn btn-ghost" data-action="close">Seguir discutiendo</button>`);
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
  function changeConfig() {
    config.bullets = Math.min(config.bullets, engine.maxBullets(config.names.length, config.intruders));
    saveConfig();
    render(false);
  }
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
        showDialog(`<button class="dialog-close" data-action="close" aria-label="Cerrar">×</button><h2 id="modal-title">¿Empezar de nuevo?</h2><p class="center-copy">Hay una ronda guardada. Al comenzar otra, sus respuestas se reemplazan.</p><button class="btn btn-primary" data-action="replace">Empezar nueva ronda →</button><button class="btn btn-ghost" data-action="close">Volver</button>`);
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
    if (action === 'step-config') {
      const { setting, step } = button.dataset;
      config[setting] += Number(step);
      changeConfig();
      const enabled = [...document.querySelectorAll(`[data-setting="${setting}"]:enabled`)];
      (enabled.find(control => control.dataset.step === step) || enabled[0])?.focus();
    }
    if (action === 'category') { config.category = button.dataset.category; changeConfig(); document.querySelector(`[data-category="${config.category}"]`).focus(); }
    if (action === 'resume' && round) { config = { ...round.config, names: [...round.config.names] }; view = 'round'; render(); }
    if (action === 'replace') { modal.close(); beginRound(1); }
    if (!round) return;
    if (action === 'show' && round.stage === 'handoff') { round.stage = 'answer'; saveRound(); render(); }
    if (action === 'hide' && round.stage === 'answer') { round.stage = 'handoff'; saveRound(); render(); }
    if (action === 'answers' && round.stage === 'ready') { round.stage = 'discussion'; saveRound(); render(); }
    if (action === 'vote' && round.stage === 'discussion') confirmVote(Number(button.dataset.index));
    if (action === 'confirm-vote') {
      modal.close();
      try {
        round = engine.submitVote(round, Number(button.dataset.index));
        saveRound();
        render();
      } catch (error) { notify(error.message); }
    }
    if (action === 'again' && round.stage === 'reveal') beginRound(round.number + 1);
    if (action === 'exit') {
      if (round.stage === 'answer') { round.stage = 'handoff'; saveRound(); }
      view = 'setup'; render();
    }
    if (action === 'settings' && round.stage === 'reveal') { round = null; saveRound(); view = 'setup'; render(); }
  });
  modal.addEventListener('click', event => { if (event.target === modal) { const bounds = modal.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close(); } });
  function shieldQuestion() {
    if (round?.stage === 'answer') { round.stage = 'handoff'; saveRound(); if (view === 'round') render(false); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) shieldQuestion(); });
  window.addEventListener('pagehide', shieldQuestion);
  window.addEventListener('pageshow', event => { if (event.persisted) shieldQuestion(); });
  render(false);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('../sw.js', { updateViaCache: 'none' }).catch(() => {});
})();
