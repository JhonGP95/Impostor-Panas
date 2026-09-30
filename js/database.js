/* ================================================================
   BASE DE DATOS — cargador
   Las palabras viven en data/categorias/*.js (un archivo por categoría).
   Cada archivo llama a DB.add({...}); este objeto normaliza y valida.
   Formato de cada palabra: { "palabra": "...", "pistas": ["...", "..."] }
   (también se acepta el formato viejo pista1/pista2/pista3).
   ================================================================ */
const DB = {
  categories: [],

  add(cat) {
    if (!cat || !cat.categoria) { console.warn('[DB] categoría sin nombre, ignorada'); return; }
    const palabras = [];
    (cat.palabras || []).forEach(w => {
      if (!w || !w.palabra || !String(w.palabra).trim()) {
        console.warn('[DB] entrada sin palabra en "' + cat.categoria + '"'); return;
      }
      const pistas = Array.isArray(w.pistas)
        ? w.pistas.filter(Boolean)
        : [w.pista1, w.pista2, w.pista3].filter(Boolean);
      if (pistas.length === 0) {
        console.warn('[DB] "' + w.palabra + '" (' + cat.categoria + ') no tiene pistas');
      }
      palabras.push({
        palabra: String(w.palabra).trim(),
        pista1: pistas[0],
        pista2: pistas[1],
        pistas
      });
    });
    this.categories.push({ categoria: cat.categoria, palabras });
  },

  all() { return this.categories; },

  find(nombre) { return this.categories.find(c => c.categoria === nombre) || null; }
};
