# 🎮 El Impostor · Chazey Panas — v5.1

Juego de fiesta pasamanos: un solo celular para todo el grupo. Sin backend, sin
base de datos externa — todo funciona estático en GitHub Pages.

**Los 4 equipos + la Pareja (desde v5.3):**
- ✅ **Inocentes** — saben la palabra. Pueden tener 😇 Ángel Guardián. Ganan eliminando a *todos* los impostores y undercovers.
- 🤡 **Bufón** — sabe la palabra. Solo gana si la mesa lo elimina por votación. Puede tener 😇 Ángel Guardián.
- 🕵️ **Impostores** — no saben la palabra. Ganan si se acaban las balas o si mueren todos los inocentes y undercovers. Pueden tener 💣 Kamikaze.
- 🎭 **Undercovers** — no saben la palabra (solo su categoría). Ganan si adivinan la palabra al ser eliminados *o* si quedan últimos en pie. Pueden tener 😇 Ángel Guardián.
- 💔 **Pareja** — equipo propio de a dos (ambos saben la palabra). Mueren juntos y ganan *solo ellos dos*: cuando no queden impostores NI inocentes. Requiere mesas de 6+. Su propio ángel cubre a cada uno de granada y kamikaze; el corazón roto no tiene salvación.

**Balas:** solo se gastan cuando la mesa elimina a un INOCENTE por votación. Los demás equipos no gastan balas.

**Roles especiales (v5.1):**
- 🤡 **Bufón** — conoce la palabra de los inocentes y gana SOLO si la mesa lo
  elimina por votación (granada, kamikaze, sacrificio o irse no cuentan).
- 💔 **Pareja (Cupido)** — dos jugadores se conocen en la revelación. Prohibido
  decirlo. Si uno muere, el otro muere de tristeza… salvo que lo salve con el
  poder Revivir (solo si la muerte fue por granada o kamikaze; cuesta 1 bala).
  Requiere mesas de 6+ jugadores. Máximo una pareja por partida.
- 👁️ **Opción "revelar roles al eliminar"** — apagable en ⚙️ Opciones: los
  eliminados muestran "❓" y los contadores de la mesa quedan en secreto.
- 📱 **Modo compacto automático** — la lista de votación se compacta sola en
  mesas de más de 12 jugadores, y la configuración tiene secciones colapsables.
- 💾 **Continuar partida** — si la app se cierra a mitad de partida, al abrirla
  ofrece "¿Continuar la partida?".

Esta versión reorganiza el proyecto en archivos separados para que sea fácil de
mantener, sobre todo la **base de palabras**, que ahora vive en sus propios archivos.

---

## 📂 Estructura del proyecto

```
/
├── index.html              ← página principal (solo el cascarón + el orden de módulos)
├── sw.js                   ← service worker (jugar sin internet)
├── .nojekyll               ← le dice a GitHub Pages que sirva todo tal cual
├── css/
│   └── styles.css          ← todos los estilos
├── js/
│   ├── version.js          ← ⭐ VERSIÓN del juego (subila al publicar cambios)
│   ├── balance.js          ← ⭐ BALANCE: todos los números ajustables (porcentajes, etc.)
│   ├── database.js         ← cargador de la base de palabras (valida y normaliza)
│   ├── utils.js            ← funciones comunes
│   ├── audio.js            ← sonidos (Web Audio)
│   ├── state.js            ← estado del juego + íconos/colores + info de poderes
│   ├── ui.js               ← navegación entre pantallas y modales
│   ├── pwa.js              ← instalación como app + íconos generados
│   ├── screens-config.js   ← pantallas: splash y configuración
│   ├── game-start.js       ← inicio de partida (roles PRD, palabras, poderes)
│   ├── game-reveal.js      ← rotación de revelación (mantener para revelar)
│   ├── game-players.js     ← menú por jugador (repetir palabra / se fue)
│   ├── game-discussion.js  ← pantalla de discusión
│   ├── game-voting.js      ← votación
│   ├── game-powers.js      ← granada, kamikaze, sacrificio, revivir, ángel
│   ├── game-victory.js     ← condiciones de victoria y pantalla final
│   └── main.js             ← arranque
└── data/
    └── categorias/
        ├── deportes.js          ← ⚽ un archivo por categoría
        ├── chazey-panas.js      ← 🫂 la categoría del grupo
        └── ... (33 en total)
```

---

## ✏️ Cómo editar palabras y pistas

Abrí `data/categorias/<categoría>.js`. Cada palabra es **una línea**:

```js
DB.add({
  "categoria": "⚽ Deportes",
  "palabras": [
    { "palabra": "Fútbol", "pistas": ["Esférica", "Once"] },
    { "palabra": "Tenis",  "pistas": ["Arcilla", "Red"] },
    ...
  ]
});
```

- **Agregar una palabra:** copiá una línea, cambiá palabra y pistas.
- **Quitar una palabra:** borrá la línea.
- **Pistas:** de 1 a 3 entre corchetes. La primera es la que mejor define.
- Si te equivocás en la sintaxis (coma faltante, comilla sin cerrar), el juego lo
  avisa en la consola del navegador (F12) y saltea esa palabra, no se rompe.

### Agregar una categoría nueva

1. Creá `data/categorias/mi-categoria.js`:
   ```js
   DB.add({
     "categoria": "🎯 Mi Categoría",
     "palabras": [
       { "palabra": "Ejemplo", "pistas": ["Pista 1", "Pista 2"] }
     ]
   });
   ```
2. Agregá en `index.html` una línea junto a las otras categorías:
   ```html
   <script src="data/categorias/mi-categoria.js"></script>
   ```

### Quitar una categoría

Borrá su archivo de `data/categorias/` y su línea en `index.html`.

> 💡 Para probar cambios rápido en la compu: desde esta carpeta corré
> `python -m http.server 8000` y abrí `http://localhost:8000`.
> (Directo con doble click también funciona el juego, pero sin service worker.)

---

## ⚖️ Ajustar el balance

Todo vive en `js/balance.js`: probabilidades de Granada, Kamikaze, Ángel,
tamaño del grupo del Sacrificio, costos de Revivir y la fórmula PRD de
selección de impostores. Las descripciones de la UI se generan desde ahí.

---

## 🚀 Publicar en GitHub Pages

1. Hacé los cambios (palabras, balance, código).
2. Si cambiaste algo del juego, **subí `APP_VERSION`** en `js/version.js`
   (ej.: `v5.0.0` → `v5.0.1`). Eso hace que los jugadores con la app instalada
   reciban la actualización (el service worker borra el cache viejo solo).
3. Subí **todo el contenido de esta carpeta** a la raíz del repositorio
   (reemplazando el `index.html` viejo).
4. GitHub Pages sirve `index.html` automáticamente.

---

## 🛠️ Desarrollo

- **Servidor local:** `python -m http.server 8000` → `http://localhost:8000`
- **Consola:** F12 muestra errores y avisos de la base de datos.
- **Ver tu versión:** se muestra en el splash ("v5.0.0").
- El service worker se registra solo en `https://` o `localhost`.
