/* ================================================================
   BASE DE DATOS — cargador
   Las palabras viven en data/categorias/*.js (un archivo por categoría).
   Cada archivo llama a DB.add({...}); este objeto normaliza y valida.
   Formato de cada palabra: { "palabra": "...", "pistas": ["...", "..."] }
   (también se acepta el formato viejo pista1/pista2/pista3).
   ================================================================ */
function clueKey(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function cleanHints(word, hints) {
  const answer = clueKey(word);
  const seen = new Set();
  return hints.filter(hint => {
    if (typeof hint !== 'string') return false;
    const key = clueKey(hint);
    if (!key || seen.has(key) || ` ${key} `.includes(` ${answer} `)) return false;
    seen.add(key);
    return true;
  }).map(hint => hint.trim());
}

const DB = {
  categories: [],

  add(cat) {
    if (!cat || !cat.categoria) { console.warn('[DB] categoría sin nombre, ignorada'); return; }
    if (!Array.isArray(cat.palabras)) { console.warn('[DB] categoría sin lista de palabras, ignorada'); return; }
    const palabras = [];
    cat.palabras.forEach(w => {
      if (!w || !w.palabra || !String(w.palabra).trim()) {
        console.warn('[DB] entrada sin palabra en "' + cat.categoria + '"'); return;
      }
      const palabra = String(w.palabra).trim();
      const pistas = cleanHints(palabra, Array.isArray(w.pistas)
        ? w.pistas : [w.pista1, w.pista2, w.pista3]);
      if (pistas.length === 0) {
        console.warn('[DB] "' + w.palabra + '" (' + cat.categoria + ') no tiene pistas');
      }
      palabras.push({ palabra, pistas });
    });
    if (palabras.length) this.categories.push({ categoria: cat.categoria, palabras });
  },

  all() { return this.categories; },

  find(nombre) { return this.categories.find(c => c.categoria === nombre) || null; }
};
