# Entre líneas · Chazey Panas

Juego de preguntas en español para compartir un celular. No necesita cuentas, servidor de datos ni dependencias. Usa la misma publicación estática que El Impostor, en la ruta `preguntas/`. También hay un acceso desde la configuración del juego original.

## Jugar

1. Escriban de 3 a 20 nombres distintos. Elijan cantidad de intrusos y categoría.
2. Pasen el celular en el orden indicado. Cada jugador abre su pregunta en privado y escribe su respuesta. Los intrusos reciben la pregunta alternativa; nadie ve su rol.
3. Cuando todos hayan respondido, pongan el celular al centro. El tablero muestra la pregunta de la mayoría y las respuestas, sin roles.
4. Conversen, señalen a sus sospechosos y toquen «Descubrir» para revelar ambos tipos de pregunta y los intrusos.
5. Pueden repetir con el mismo grupo o cambiar la configuración. No hay poderes, eliminación, cronómetro ni puntuación.

Siempre hay más jugadores de la mayoría que intrusos. Las preguntas y el reparto cambian en cada ronda. Los pares no se repiten hasta agotar la selección; al cambiar de categoría se conserva la historia de las otras.

## Probar localmente

Desde la carpeta principal del proyecto:

```powershell
python -m http.server 8000
```

Abrir `http://localhost:8000/preguntas/`. Para ejecutar las pruebas de reglas y datos:

```powershell
node --test preguntas/engine.test.cjs preguntas/offline.test.cjs
```

## Base de preguntas

`questions.js` contiene 96 pares, repartidos en 6 categorías con 16 pares cada una. Cada fila tiene tres campos:

```js
['¿Pregunta de la mayoría?', '¿Pregunta alternativa del intruso?', 'Respuestas plausibles que comparten']
```

El tercer campo es una nota editorial, oculta durante el juego. Ambas preguntas deben admitir el mismo formato de respuesta y un conjunto razonable de respuestas compartidas. Se trata de coincidencia plausible, no de que todos contesten igual. La categoría `numeros` exige una respuesta numérica; las otras admiten texto de hasta 80 caracteres. Los identificadores se generan a partir de la categoría y posición: agrega pares al final para conservar los existentes.

Para agregar una categoría, añade su descripción a `categories` y su lista a `rows`. La interfaz y los contadores se generan automáticamente. Actualiza las expectativas del test editorial si cambia el tamaño del catálogo.

## Privacidad y guardado

La configuración, el historial de pares usados y la ronda se guardan solo en el navegador, con claves propias. Al recargar se ofrece continuar. Si se recarga, se cambia de aplicación o se oculta una pregunta, ese turno vuelve a la pantalla de entrega: la respuesta sin enviar se descarta. Las respuestas ya enviadas se conservan. Si el navegador impide el guardado, se avisa y se puede seguir jugando con la pestaña abierta.

Es un juego local de confianza: las pantallas evitan mostrar información antes de tiempo, pero los archivos y datos locales pueden inspeccionarse con herramientas del navegador. No se envían nombres ni respuestas a ningún servicio.

El service worker principal incluye este juego para uso sin conexión después de la primera carga completa por HTTP local o HTTPS. Cada juego almacena su propia página para que sus rutas no se mezclen sin conexión. Al publicar, sube `APP_VERSION` en `js/version.js`.
