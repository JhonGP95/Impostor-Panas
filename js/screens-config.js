/* ================================================================
   RENDER DEL APP
   ================================================================ */
function renderApp() {
  $('app').innerHTML = `
    ${renderSplash()}
    ${renderConfig()}
    ${renderRevealShell()}
    ${renderDiscussionShell()}
    ${renderVotingShell()}
    ${renderVictoryShell()}
  `;
  $('screen-splash').classList.add('active');
  syncConfigUI();
  setTimeout(() => {
    if (STATE.currentScreen === 'splash') navigate('screen-config');
  }, 1800);
}

/* ================================================================
   1. SPLASH
   ================================================================ */
function renderSplash() {
  return `
  <div class="screen" id="screen-splash" style="align-items:center;justify-content:center;text-align:center;background:var(--bg);">
    <div class="anim-scale" style="margin-bottom:24px;">
      <div style="font-size:72px;filter:drop-shadow(0 0 30px var(--violet));line-height:1;">👁️</div>
    </div>
    <div class="anim-fade-up delay-1">
      <div class="title-xl" style="letter-spacing:-0.04em;">
        El <span class="glow-violet">Impostor</span>
      </div>
      <div style="color:var(--muted);font-size:15px;margin-top:8px;letter-spacing:0.06em;text-transform:uppercase;">
        Chazey Panas Edition <span style="color:var(--cyan);">${window.APP_VERSION}</span>
      </div>
    </div>
    <button class="btn btn-ghost btn-sm install-btn anim-fade-up delay-3" style="display:none;width:auto;margin-top:36px;" onclick="handleInstallClick()">📲 Instalar App</button>
    <div class="anim-fade delay-4" style="position:absolute;bottom:60px;display:flex;gap:6px;">
      <div style="width:6px;height:6px;border-radius:50%;background:var(--violet);animation:pulse-green 1.2s infinite;"></div>
      <div style="width:6px;height:6px;border-radius:50%;background:var(--blue);animation:pulse-green 1.2s 0.2s infinite;"></div>
      <div style="width:6px;height:6px;border-radius:50%;background:var(--cyan);animation:pulse-green 1.2s 0.4s infinite;"></div>
    </div>
  </div>`;
}

/* ================================================================
   2. CONFIGURACIÓN
   ================================================================ */
function maxImpostorsFor(n) {
  return Math.max(1, n - 1); // caos permitido: hasta n-1 impostores
}

function maxUndercoversFor(n) {
  const imp = STATE.config.randomImpostors ? 1 : STATE.config.numImpostors;
  return Math.max(0, n - imp - 1); // siempre queda al menos 1 inocente puro
}

function renderConfig() {
  const p = STATE.config;

  const catRows = DB.all().map(c => `
    <div class="switch-row" onclick="toggleCategory('${c.categoria.replace(/'/g, "\\'")}')">
      <span class="body-md">${c.categoria}</span>
      <label class="switch" onclick="event.stopPropagation()">
        <input type="checkbox" value="${esc(c.categoria)}"
          ${(p.selectedCategories || []).includes(c.categoria) ? 'checked' : ''}
          onchange="toggleCategory('${c.categoria.replace(/'/g, "\\'")}')">
        <div class="switch-track"></div>
      </label>
    </div>
  `).join('');

  const powerCards = Object.keys(POWERS_INFO).map(key => {
    const info = POWERS_INFO[key];
    const on = p.powers[key];
    const tag = info.alwaysOn
      ? `<span class="badge" style="font-size:9.5px;padding:2px 8px;background:rgba(255,255,255,0.06);">SIEMPRE ACTIVO</span>`
      : `<span class="badge" style="font-size:9.5px;padding:2px 8px;background:rgba(255,214,0,0.08);border-color:rgba(255,214,0,0.3);color:var(--yellow);">1 USO</span>`;
    return `
    <div class="power-card">
      <div class="power-card-head">
        <div class="power-name"><span style="font-size:22px;">${info.emoji}</span> ${info.name}</div>
        <label class="switch" style="margin:0;">
          <input type="checkbox" id="power-${key}" ${on ? 'checked' : ''} onchange="setPower('${key}', this.checked)">
          <div class="switch-track"></div>
        </label>
      </div>
      <div class="power-desc">${info.desc}</div>
      <div style="margin-top:8px;">${tag}</div>
    </div>`;
  }).join('');

  const ucDesc = `
    <div class="info-note" id="uc-desc" style="margin-top:10px;${p.numUndercovers > 0 ? '' : 'display:none;'}">
      <strong style="color:var(--cyan);">🎭 Undercover:</strong> no conocen la palabra — solo su categoría. Deben fingir que saben y, si los eliminan, tendrán una última oportunidad de adivinar la palabra secreta para ganar.
    </div>`;

  // Secciones colapsables (el estado abierto/cerrado se guarda por sección)
  const secJugadores = `
        <div class="stepper">
          <button class="stepper-btn" onclick="stepPlayers(-1)">−</button>
          <div class="stepper-val" id="display-players">${p.numPlayers}</div>
          <button class="stepper-btn" onclick="stepPlayers(1)">+</button>
        </div>
        <div class="caption" style="margin-top:8px;">De ${MIN_PLAYERS} a ${MAX_PLAYERS} · íconos ilimitados</div>`;

  const secImpostores = `
        <div class="stepper" id="stepper-impostors">
          <button class="stepper-btn" onclick="stepImpostors(-1)">−</button>
          <div class="stepper-val" id="display-impostors">${p.randomImpostors ? '🎲' : p.numImpostors}</div>
          <button class="stepper-btn" onclick="stepImpostors(1)">+</button>
        </div>
        <div class="switch-row">
          <span class="body-md">🎲 Cantidad aleatoria cada ronda</span>
          <label class="switch" style="margin:0;">
            <input type="checkbox" id="toggle-random-imp" ${p.randomImpostors ? 'checked' : ''} onchange="toggleRandomImpostors(this)">
            <div class="switch-track"></div>
          </label>
        </div>
        <div class="caption">⚖️ Reparto PRD: a quien fue impostor le cuesta repetir, y las sequías largas aumentan sus chances. Nadie queda afuera (usá nombres reales)</div>`;

  const secUndercovers = `
        <div class="stepper">
          <button class="stepper-btn" onclick="stepUndercovers(-1)">−</button>
          <div class="stepper-val" id="display-undercovers">${p.numUndercovers}</div>
          <button class="stepper-btn" onclick="stepUndercovers(1)">+</button>
        </div>
        <div class="caption" style="margin-top:8px;">0 = modo clásico · solo inocentes e impostores
        </div>
        ${ucDesc}`;

  const secBalas = `
        <div class="stepper" id="stepper-bullets" style="${p.infiniteBullets ? 'opacity:0.4;pointer-events:none;' : ''}">
          <button class="stepper-btn" onclick="stepBullets(-1)">−</button>
          <div class="stepper-val" id="display-bullets">${p.infiniteBullets ? '∞' : p.numBullets}</div>
          <button class="stepper-btn" onclick="stepBullets(1)">+</button>
        </div>
        <div class="switch-row">
          <span class="body-md">Sin límite de balas</span>
          <label class="switch" style="margin:0;">
            <input type="checkbox" id="toggle-infinite" ${p.infiniteBullets ? 'checked' : ''} onchange="toggleInfinite(this)">
            <div class="switch-track"></div>
          </label>
        </div>
        <div class="caption">Solo la muerte de un INOCENTE por votación gasta 1 bala (los demás equipos no gastan)</div>`;

  const secPoderes = `
        <div class="caption" style="margin-bottom:10px;">Opcionales · cada poder se usa una vez por partida</div>
        ${powerCards}`;

  const secRoles = `
        <div class="power-card">
          <div class="power-card-head">
            <div class="power-name"><span style="font-size:22px;">🤡</span> Bufón</div>
            <label class="switch" style="margin:0;">
              <input type="checkbox" id="toggle-roles-bufon" ${p.roles.bufon ? 'checked' : ''} onchange="setRole('bufon', this.checked)">
              <div class="switch-track"></div>
            </label>
          </div>
          <div class="power-desc">Máximo 1 por partida. Un "inocente" que conoce la palabra pero gana SOLO si la mesa lo elimina por votación. Si muere de otra forma, no gana nada.</div>
        </div>
        <div class="power-card">
          <div class="power-card-head">
            <div class="power-name"><span style="font-size:22px;">💕</span> Pareja (Cupido)</div>
            <label class="switch" style="margin:0;">
              <input type="checkbox" id="toggle-roles-pareja" ${p.roles.pareja ? 'checked' : ''} onchange="setRole('pareja', this.checked)">
              <div class="switch-track"></div>
            </label>
          </div>
          <div class="power-desc">Su propio equipo de a dos: se conocen en la revelación (prohibido decirlo), mueren juntos y ganan SOLO ellos dos, cuando no queden impostores NI inocentes. Su propio ángel cubre a cada uno. Requiere ${BALANCE.PAREJA.MIN_PLAYERS}+ jugadores.</div>
        </div>`;

  const secOpciones = `
        <div class="switch-row">
          <span class="body-md">👁️ Revelar roles al eliminar</span>
          <label class="switch" style="margin:0;">
            <input type="checkbox" id="toggle-reveal-roles" ${p.revealRoles ? 'checked' : ''} onchange="setRevealRoles(this.checked)">
            <div class="switch-track"></div>
          </label>
        </div>
        <div class="caption" style="margin-top:4px;">Si lo apagás: los eliminados muestran "❓" y los contadores de la mesa quedan en secreto. Duda máxima.</div>`;

  const secPistas = `
        <div class="toggle-group">
          <button class="toggle-option ${p.withHints ? 'active' : ''}" id="mode-hints" onclick="setHints(true)">Con Pista</button>
          <button class="toggle-option ${!p.withHints ? 'active' : ''}" id="mode-nohints" onclick="setHints(false)">Sin Pista</button>
        </div>
        <div class="caption" style="margin-top:8px;">La pista ayuda al impostor a fingir que conoce la palabra</div>`;

  const secCategorias = `
        <div class="caption" style="margin-bottom:8px;">Si no elegís ninguna, se usan todas</div>
        <div style="display:flex;flex-direction:column;" id="cat-checkboxes">${catRows}</div>
        <div class="switch-row">
          <span class="body-md" style="color:var(--violet);">🎲 Todas</span>
          <label class="switch" style="margin:0;">
            <input type="checkbox" id="toggle-all-cats"
              ${(p.selectedCategories || []).length === DB.all().length ? 'checked' : ''}
              onchange="toggleAllCategories()">
            <div class="switch-track"></div>
          </label>
        </div>`;

  const secNombres = `
        <div class="caption" style="margin-bottom:8px;">Usá las flechas ↕ para ordenar el pasamanos</div>
        <div id="player-names-list"></div>`;

  const secReglas = `
        <div class="info-note" style="display:flex;flex-direction:column;gap:8px;">
          <span><strong style="color:var(--green);">✅ Inocentes:</strong> saben la palabra. Pueden tener 😇 Ángel Guardián. Ganan eliminando a <em>todos</em> los impostores y undercovers.</span>
          <span><strong style="color:var(--yellow);">🤡 Bufón:</strong> sabe la palabra. Solo gana si la mesa lo elimina por votación. Puede tener 😇 Ángel Guardián.</span>
          <span><strong style="color:var(--red);">🕵️ Impostores:</strong> no saben la palabra. Ganan si se acaban las balas <em>o</em> si mueren todos los inocentes y undercovers. Pueden tener 💣 Kamikaze.</span>
          <span><strong style="color:var(--cyan);">🎭 Undercovers:</strong> no saben la palabra (solo su categoría). Ganan si adivinan la palabra al ser eliminados <em>o</em> si quedan últimos en pie. Pueden tener 😇 Ángel Guardián.</span>
          <span><strong style="color:var(--orange);">💕 Pareja:</strong> equipo propio de a dos (ambos saben la palabra). Mueren juntos y ganan <em>solo ellos dos</em>: cuando no queden impostores ni inocentes.</span>
        </div>`;

  return `
  <div class="screen" id="screen-config">
    <div class="screen-header">
      <div style="flex:1;">
        <div class="title-lg">Configurar <span class="glow-violet">Partida</span></div>
        <div class="caption">Personalizá tu experiencia · tocá una sección para abrirla</div>
      </div>
      <button class="icon-btn install-btn" style="display:none;" onclick="handleInstallClick()" title="Instalar app">📲</button>
    </div>

    <div class="scroll-area" id="config-scroll">
      ${configSection('jugadores', '👥', 'Jugadores', secJugadores)}
      ${configSection('impostores', '🕵️', 'Impostores', secImpostores)}
      ${configSection('undercovers', '🎭', 'Undercovers', secUndercovers)}
      ${configSection('balas', '🔫', 'Balas / Intentos', secBalas)}
      ${configSection('poderes', '⚡', 'Poderes', secPoderes)}
      ${configSection('roles', '🎭', 'Roles especiales', secRoles)}
      ${configSection('opciones', '⚙️', 'Opciones', secOpciones)}
      ${configSection('pistas', '💡', 'Pista del impostor', secPistas)}
      ${configSection('categorias', '📦', 'Categorías', secCategorias)}
      ${configSection('nombres', '✏️', 'Nombres de jugadores', secNombres)}
      ${configSection('reglas', '🏆', 'Cómo se gana', secReglas)}

      <div style="height:16px;"></div>
    </div>

    <div class="screen-footer">
      <button class="btn btn-primary" onclick="startGame()">
        <span>⚡</span> Iniciar Partida
      </button>
    </div>
  </div>`;
}

// Secciones colapsables de la configuración (estado persistente por sección)
function configSection(key, emoji, title, contentHtml) {
  let open = true;
  try {
    const stored = localStorage.getItem('chazey_cfg_sec_' + key);
    if (stored !== null) open = stored === '1';
  } catch(e) {}
  return `
  <div class="config-section ${open ? '' : 'collapsed'}" data-section="${key}">
    <button class="config-section-head" onclick="toggleConfigSection('${key}')">
      <span class="cfg-title">${emoji} ${title}</span>
      <span class="cfg-caret">▾</span>
    </button>
    <div class="config-section-body">
      ${contentHtml}
    </div>
  </div>`;
}

function toggleConfigSection(key) {
  const el = document.querySelector(`.config-section[data-section="${key}"]`);
  if (!el) return;
  el.classList.toggle('collapsed');
  try { localStorage.setItem('chazey_cfg_sec_' + key, el.classList.contains('collapsed') ? '0' : '1'); } catch(e) {}
  playSound('tap');
}

function updateConfigDisplays() {
  const p = STATE.config;
  const dp = $('display-players');
  const di = $('display-impostors');
  const du = $('display-undercovers');
  const db = $('display-bullets');
  if (dp) dp.textContent = p.numPlayers;
  if (di) di.textContent = p.randomImpostors ? '🎲' : p.numImpostors;
  if (du) du.textContent = p.numUndercovers;
  if (db) db.textContent = p.infiniteBullets ? '∞' : p.numBullets;

  const si = $('stepper-impostors');
  if (si) si.classList.toggle('disabled', p.randomImpostors);

  const sd = $('uc-desc');
  if (sd) sd.style.display = p.numUndercovers > 0 ? '' : 'none';
}

function rebuildPlayerList() {
  const list = $('player-names-list');
  if (!list) return;
  const n = STATE.config.numPlayers;
  let html = '';
  for (let i = 0; i < n; i++) {
    const name = STATE.config.playerNames[i] || `Jugador ${i + 1}`;
    const canUp = i > 0;
    const canDown = i < n - 1;
    html += `
    <div class="player-item" data-index="${i}">
      <div class="player-avatar" style="background:${colorOf(i)}22;color:${colorOf(i)};font-size:20px;">${avatarOf(i)}</div>
      <input class="player-input" type="text" value="${esc(name)}" maxlength="18" placeholder="Jugador ${i + 1}"
        oninput="updatePlayerName(${i}, this.value)">
      <div class="player-move-btns">
        <button class="player-move-btn ${canUp ? '' : 'disabled'}" onclick="movePlayer(${i}, -1)" ${canUp ? '' : 'disabled'}>↑</button>
        <button class="player-move-btn ${canDown ? '' : 'disabled'}" onclick="movePlayer(${i}, 1)" ${canDown ? '' : 'disabled'}>↓</button>
      </div>
    </div>`;
  }
  list.innerHTML = html;
}

function syncConfigUI() {
  updateConfigDisplays();
  rebuildPlayerList();

  const h = $('mode-hints');
  const nh = $('mode-nohints');
  if (h) h.classList.toggle('active', STATE.config.withHints);
  if (nh) nh.classList.toggle('active', !STATE.config.withHints);

  const inf = $('toggle-infinite');
  if (inf) inf.checked = STATE.config.infiniteBullets;
  const sb = $('stepper-bullets');
  if (sb) {
    sb.style.opacity = STATE.config.infiniteBullets ? '0.4' : '1';
    sb.style.pointerEvents = STATE.config.infiniteBullets ? 'none' : '';
  }

  const rimp = $('toggle-random-imp');
  if (rimp) rimp.checked = STATE.config.randomImpostors;

  document.querySelectorAll('#cat-checkboxes input[type="checkbox"]').forEach(input => {
    input.checked = (STATE.config.selectedCategories || []).includes(input.value);
  });
  const allBtn = $('toggle-all-cats');
  if (allBtn) allBtn.checked = (STATE.config.selectedCategories || []).length === DB.all().length;

  Object.keys(POWERS_INFO).forEach(key => {
    const cb = $('power-' + key);
    if (cb) cb.checked = !!STATE.config.powers[key];
  });

  const rb = $('toggle-roles-bufon');
  if (rb) rb.checked = !!STATE.config.roles.bufon;
  const rp = $('toggle-roles-pareja');
  if (rp) rp.checked = !!STATE.config.roles.pareja;
  const rr = $('toggle-reveal-roles');
  if (rr) rr.checked = !!STATE.config.revealRoles;
}

/* ---- Handlers de configuración ---- */

function setRole(key, checked) {
  STATE.config.roles[key] = checked;
  playSound('tap');
}

function setRevealRoles(checked) {
  STATE.config.revealRoles = checked;
  playSound('tap');
}

function stepPlayers(d) {
  const n = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, STATE.config.numPlayers + d));
  STATE.config.numPlayers = n;
  if (!STATE.config.randomImpostors) {
    STATE.config.numImpostors = Math.min(STATE.config.numImpostors, maxImpostorsFor(n));
  }
  STATE.config.numUndercovers = Math.min(STATE.config.numUndercovers, maxUndercoversFor(n));
  updateConfigDisplays();
  rebuildPlayerList();
  playSound('tap');
}

function stepImpostors(d) {
  if (STATE.config.randomImpostors) return;
  STATE.config.numImpostors = Math.min(maxImpostorsFor(STATE.config.numPlayers), Math.max(1, STATE.config.numImpostors + d));
  STATE.config.numUndercovers = Math.min(STATE.config.numUndercovers, maxUndercoversFor(STATE.config.numPlayers));
  updateConfigDisplays();
  playSound('tap');
}

function toggleRandomImpostors(cb) {
  STATE.config.randomImpostors = cb.checked;
  updateConfigDisplays();
  playSound('tap');
}

function stepUndercovers(d) {
  STATE.config.numUndercovers = Math.min(maxUndercoversFor(STATE.config.numPlayers), Math.max(0, STATE.config.numUndercovers + d));
  updateConfigDisplays();
  playSound('tap');
}

function stepBullets(d) {
  STATE.config.numBullets = Math.min(20, Math.max(1, STATE.config.numBullets + d));
  updateConfigDisplays();
  playSound('tap');
}

function toggleInfinite(cb) {
  STATE.config.infiniteBullets = cb.checked;
  const stepper = $('stepper-bullets');
  if (stepper) {
    stepper.style.opacity = cb.checked ? '0.4' : '1';
    stepper.style.pointerEvents = cb.checked ? 'none' : '';
  }
  updateConfigDisplays();
  playSound('tap');
}

function setPower(key, checked) {
  STATE.config.powers[key] = checked;
  playSound('tap');
}

function setHints(withHints) {
  STATE.config.withHints = withHints;
  const h = $('mode-hints');
  const nh = $('mode-nohints');
  if (h) h.classList.toggle('active', withHints);
  if (nh) nh.classList.toggle('active', !withHints);
  playSound('tap');
}

function movePlayer(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= STATE.config.numPlayers) return;
  const names = STATE.config.playerNames;
  const temp = names[index];
  names[index] = names[newIndex];
  names[newIndex] = temp;
  playSound('tap');
  rebuildPlayerList();
}

function updatePlayerName(i, val) {
  STATE.config.playerNames[i] = val;
}

function toggleCategory(cat) {
  let sel = STATE.config.selectedCategories || [];
  const idx = sel.indexOf(cat);
  if (idx === -1) sel.push(cat);
  else sel.splice(idx, 1);
  STATE.config.selectedCategories = sel;

  document.querySelectorAll('#cat-checkboxes input[type="checkbox"]').forEach(input => {
    input.checked = STATE.config.selectedCategories.includes(input.value);
  });
  const allBtn = $('toggle-all-cats');
  if (allBtn) allBtn.checked = sel.length === DB.all().length;
  playSound('tap');
}

function toggleAllCategories() {
  const allChecked = (STATE.config.selectedCategories || []).length === DB.all().length;
  STATE.config.selectedCategories = allChecked ? [] : DB.all().map(c => c.categoria);

  document.querySelectorAll('#cat-checkboxes input[type="checkbox"]').forEach(input => {
    input.checked = STATE.config.selectedCategories.includes(input.value);
  });
  const allBtn = $('toggle-all-cats');
  if (allBtn) allBtn.checked = !allChecked;
  playSound('tap');
}
