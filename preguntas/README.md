# Entre líneas

Juego de preguntas en español para compartir un celular. No necesita cuentas, servidor de datos ni dependencias. Usa la misma publicación estática que El Impostor, en la ruta `preguntas/`. Cada pantalla de configuración incluye un botón para abrir el otro juego. Los dos comparten estilos en `css/theme.css`.

## Jugar

1. Escriban de 3 a 20 nombres distintos. Elijan los intrusos, la categoría y entre 2 y 5 balas, según el tamaño del grupo.
2. Pasen el celular en el orden indicado. Cada jugador abre su pregunta en privado y escribe su respuesta. Los intrusos reciben la pregunta alternativa; nadie ve su rol.
3. Cuando todos hayan respondido, pongan el celular al centro. El tablero muestra la pregunta de la mayoría y las respuestas, sin roles.
4. Discutan y confirmen un voto a la vez. El tablero revela el rol de la persona votada y conserva su respuesta. Si era de la mayoría, gastan una bala. Si era intruso, la conservan.
5. La mayoría gana al encontrar a todos los intrusos. Los intrusos ganan al agotarse las balas. Al terminar se revelan las dos preguntas y todos los roles.

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

`questions.js` contiene 160 pares. Seis categorías tienen 24 pares cada una y Picante tiene 16. Picante se elige por separado de «Un poco de todo». Cada fila tiene tres campos:

```js
['¿Pregunta de la mayoría?', '¿Pregunta alternativa del intruso?', 'Respuestas plausibles que comparten']
```

El tercer campo es una nota editorial, oculta durante el juego. Ambas preguntas deben admitir el mismo formato de respuesta y un conjunto razonable de respuestas compartidas. Se trata de coincidencia plausible, no de que todos contesten igual. La categoría `numeros` exige una respuesta numérica; las otras admiten texto de hasta 80 caracteres. Los identificadores se generan a partir de la categoría y posición: agrega pares al final para conservar los existentes.

Para agregar una categoría, añade su descripción a `categories` y su lista a `rows`. La interfaz y los contadores se generan automáticamente. Actualiza las expectativas del test editorial si cambia el tamaño del catálogo.

## Privacidad y guardado

La configuración, el historial de pares usados, las respuestas y los votos se guardan en el navegador. Al recargar se ofrece continuar. Si se recarga, se cambia de aplicación o se oculta una pregunta, ese turno vuelve a la pantalla de entrega y descarta la respuesta sin enviar. Si el navegador impide el guardado, se avisa y se puede seguir jugando con la pestaña abierta.

Es un juego local de confianza: las pantallas evitan mostrar información antes de tiempo, pero los archivos y datos locales pueden inspeccionarse con herramientas del navegador. No se envían nombres ni respuestas a ningún servicio.

El service worker principal incluye este juego para uso sin conexión después de la primera carga completa por HTTP local o HTTPS. Cada juego almacena su propia página para que sus rutas no se mezclen sin conexión. Al publicar, sube `APP_VERSION` en `js/version.js`.
