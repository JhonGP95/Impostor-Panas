# El Impostor · Chazey Panas

También incluye **Entre líneas**, el juego de preguntas para pasar el celular: 96 pares de preguntas en español, respuestas privadas y revelación de intrusos al final. Abre `preguntas/` o el acceso «Nuevo · Entre líneas» en la configuración. Instrucciones y edición de la base en [preguntas/README.md](preguntas/README.md).

Juego de fiesta para jugar con un solo celular que se va pasando de mano en mano.
Cada jugador ve su rol en secreto, después todos discuten dando pistas sobre la
palabra, y la mesa vota a quién sacar. Básicamente un Undercover de frente, pero
con poderes, roles extra y varias sorpresas.

Lo hice para jugar con amigos. GitHub Pages sirve los archivos HTML, CSS y
JavaScript. Las palabras viven en archivos locales y la partida se guarda en
el celular. El service worker permite volver a abrir ambos juegos sin internet
después de una primera visita en línea.

---

## Probarlo en tu compu

Necesitas un servidor local por el service worker (si abres el archivo con doble
clic el juego funciona, pero no carga el modo offline):

```
cd v5.0
python -m http.server 8000
```

Abres `http://localhost:8000` y listo. Para ver errores usa F12.

Para ejecutar las pruebas de ambos juegos con Node.js:

```
node --test tests/*.test.cjs preguntas/*.test.cjs
```

## Subir cambios a producción

El juego vive en `https://jhongp95.github.io/Impostor-Panas/`. Para publicar:

1. Haz tus cambios.
2. **Sube la versión** en `js/version.js` (por ejemplo de `v5.4.2` a `v5.4.3`).
   Esto es importante: el service worker cachea los archivos, y cambiar la
   versión es lo que hace que los celulares con la app instalada reciban la
   actualización.
3. Commit y push del contenido de esta carpeta a la raíz del repo.

Si después de publicar sigues viendo la versión vieja, cierra y abre la PWA dos
veces: el service worker actualiza en segundo plano y el segundo abierto ya
carga lo nuevo.

---

## Cómo está armado

Antes todo esto era un solo `index.html` de 250 KB y era insostenible. Ahora:

```
v5.0/
├── index.html          el cascarón: casi no tiene lógica, solo carga módulos
├── sw.js               service worker (offline + actualizaciones)
├── css/styles.css      todos los estilos
├── js/
│   ├── version.js      la versión, en un solo lugar
│   ├── balance.js      ⭐ todos los números del juego (ver más abajo)
│   ├── database.js     cargador que valida la base de palabras
│   ├── state.js        estado global, íconos, descripciones de poderes
│   ├── utils.js        utilidades + guardado de partida en curso
│   ├── audio.js        sonidos generados con Web Audio (no hay mp3)
│   ├── ui.js           navegación entre pantallas y modales
│   ├── pwa.js          instalación y registro del service worker
│   ├── screens-config.js   splash y pantalla de configuración
│   ├── game-start.js   reparto de roles, palabra, poderes
│   ├── game-reveal.js  la rotación de "mantén para ver tu rol"
│   ├── game-players.js menú por jugador (repetir palabra / salirse)
│   ├── game-discussion.js / game-voting.js / game-powers.js / game-victory.js
│   └── main.js         arranque + listeners globales de touch
└── data/categorias/    ⭐ la base de palabras: un archivo por categoría
```

El `index.html` carga los módulos en orden. Los archivos de categorías llaman a
`DB.add(...)` y `database.js` los valida y normaliza.

## Editar palabras (lo que más vas a usar)

Abre `data/categorias/` y edita el archivo de la categoría. Cada palabra es una
línea:

```js
{ "palabra": "Fútbol", "pistas": ["Cancha", "Once", "Tiempo añadido"] },
```

- Copia una línea para agregar, bórrala para quitar.
- Escribe entre dos y tres pistas que funcionen por separado. Piensa en
  contextos, acciones o características que puedan encajar con varias respuestas.
- Evita apodos, iniciales, traducciones directas y partes reconocibles del
  nombre. El cargador descarta pistas repetidas o que contienen la respuesta
  completa. La elección de pistas indirectas queda a cargo de quien edite la base.
- Un error de sintaxis puede impedir que se cargue toda la categoría. Revisa la
  consola del navegador si una categoría desaparece.

### Agregar una categoría nueva

Crea un archivo en `data/categorias/`:

```js
DB.add({
  "categoria": "🎯 Mi Categoría",
  "palabras": [
    { "palabra": "Ejemplo", "pistas": ["Uno", "Dos"] }
  ]
});
```

Y agrégale su línea en `index.html` junto a las otras categorías:

```html
<script src="data/categorias/mi-categoria.js"></script>
```

Quitar una categoría es lo mismo al revés: borra el archivo y su línea.

## Ajustar el balance

Todo está en `js/balance.js`. Probabilidad del kamikaze, del ángel, los
porcentajes de la granada, cuántas víctimas hace, el tamaño del grupo del
sacrificio, el costo del revivir, la fórmula de reparto de impostores. Las
descripciones que ve el jugador en la configuración salen de esas constantes,
así que si cambias un número la UI se actualiza sola.

## Los equipos

Son 4 equipos + la pareja:

- **Inocentes**: conocen la palabra. Ganan eliminando a todos los impostores y
  undercovers (la pareja también cuenta como "eliminar").
- **Bufón**: conoce la palabra, pero gana solo si la mesa lo elimina por
  votación. Si muere de otra forma, pierde. Es neutral: su vida o muerte no
  afecta a los demás.
- **Impostores**: solo conocen una pista. Ganan si las balas llegan a cero o si
  mueren todos los inocentes y undercovers.
- **Undercovers**: no conocen la palabra, solo la categoría de la partida. Ganan
  si al eliminarlos adivinan la palabra secreta, o si quedan como último equipo
  en pie.
- **Pareja** recibe una pista compartida y conoce la identidad de su compañero
  en privado. La pista sigue disponible aunque se desactive la del impostor.
  Mueren juntos y ganan si sobreviven hasta que no queden impostores ni
  inocentes vivos. Requiere 6+ jugadores.

Las balas solo se gastan cuando la mesa elimina a un inocente puro. Votar a un
impostor, undercover, bufón o pareja no cuesta balas.

## Poderes

Opcionales, se activan en la configuración:

- **Granada**: explota y mata jugadores al azar. 10% ni explota (fumata), 40%
  solo inocentes, 35% mezcla con al menos un impostor, 15% solo impostores. La
  cantidad de víctimas escala con la mesa. Si la opción "revelar roles" está
  apagada, el resumen de bajas no delata los roles de los caídos.
- **Kamikaze**: en ~15% de las partidas un impostor lo recibe en secreto.
  Cuando lo votan puede explotar y llevarse a sus vecinos de ronda.
- **Sacrificio**: mata a un no-impostor al azar y a cambio revela un grupo de
  3-4 jugadores entre los que hay al menos un impostor garantizado.
- **Revivir**: devuelve a un inocente eliminado. Cuesta 1 bala y revela una
  pista extra que ayuda también al impostor.
- **Ángel Guardián**: ~10% de los no-impostores tienen uno por partida. Si la
  granada o el kamikaze los alcanza, se salvan.

## Detalles que conviene saber

- **El impostor no ve la categoría ni la palabra**, solo una pista (si está
  activada). Esto es a propósito.
- **La pareja muere junta siempre**, sin excepciones. El ángel de cada uno los
  protege por separado de granada y kamikaze, pero el corazón roto no tiene
  salvación.
- **"Jugador se fue"** saca a alguien de la partida sin revelar su rol y sin
  gastar balas. Es para cuando alguien se tiene que ir de verdad.
- Si apagan "revelar roles al eliminar" en opciones, los eliminados aparecen
  como "❓" y los contadores de la mesa pasan a modo secreto.
- El reparto de impostores usa una distribución pseudo-aleatoria con lástima:
  a quien le tocó impostor le cuesta más repetir, y a los que llevan varias
  rondas sin tocarles les sube la probabilidad. Funciona por nombre, así que
  conviene que los jugadores usen nombres reales.
- La partida en curso se guarda: si alguien cierra la app por una llamada, al
  abrirla ofrece continuar.
- En el modal de "jugador se fue" hay scroll: no es un bug si tienes muchos
  jugadores.

## Service worker (léelo si vas a tocar el SW)

`sw.js` busca las páginas HTML primero en la red y guarda un respaldo para
cada juego. El resto de los archivos se sirve desde el caché de la versión
activa. Al subir `APP_VERSION`, el service worker descarga los archivos nuevos
y borra las versiones anteriores del caché del juego.

Si estás probando cambios locales y no los ves, es casi seguro el cache: haz
un hard refresh o desregistra el service worker desde F12 → Application.
