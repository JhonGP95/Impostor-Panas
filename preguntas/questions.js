/* Base editorial local. Cada par comparte formato y un campo de respuestas plausible.
 * overlap es una guía para editar y revisar; nunca se muestra durante la partida.
 * Evitar preguntas de cultura general: aquí importan las respuestas personales.
 */
(function (root) {
  'use strict';
  const categories = [
    { id: 'numeros', name: 'En números', icon: '01', description: 'Cifras pequeñas, sospechas grandes.' },
    { id: 'comida', name: 'Antojos', icon: '✳', description: 'Gustos que dan de qué hablar.' },
    { id: 'vida', name: 'Vida de panas', icon: '☺', description: 'Lo cotidiano tiene sus secretos.' },
    { id: 'fiesta', name: 'De parche', icon: '♫', description: 'Planes, música y malas decisiones.' },
    { id: 'dilemas', name: 'Y si…', icon: '↗', description: 'Situaciones muy poco normales.' },
    { id: 'confesiones', name: 'Sin filtro', icon: '♡', description: 'Confesiones ligeras para reírse.' }
  ];
  // [pregunta de la mayoría, pregunta del intruso, zona de coincidencia]
  const rows = {
    numeros: [
      ['¿Qué edad tenías cuando entraste a primaria?', '¿Cuántos días a la semana te bañas?', 'Números de 5 a 7'],
      ['¿Cuántas alarmas pones para despertarte?', '¿Cuántas veces revisas la nevera sin sacar nada en una tarde?', 'De 1 a 5'],
      ['¿Cuántas porciones de pizza te comes en una sentada?', '¿Cuántos episodios de una serie ves de corrido?', 'De 2 a 6'],
      ['¿Cuántos minutos te demoras bañándote?', '¿Cuántos minutos dices que te faltan cuando todavía no has salido de casa?', 'De 5 a 20'],
      ['¿Cuántas horas duermes una noche normal?', '¿Cuántas horas aguantarías en una fiesta si la música está buena?', 'De 4 a 9'],
      ['¿Cuántos días puedes repetir un pantalón antes de lavarlo?', '¿Cuántos días a la semana pides comida o comes fuera?', 'De 1 a 5'],
      ['¿Cuántas fotos te tomas antes de elegir una para subir?', '¿Cuántos minutos tardas en escoger qué ver en una plataforma?', 'De 5 a 20'],
      ['¿Cuántos cafés podrías tomarte en un día?', '¿Cuántas veces pospones la alarma antes de levantarte?', 'De 0 a 4'],
      ['¿Cuántas personas caben cómodas en tu sofá?', '¿Cuántas personas de este grupo te llevarías a una isla desierta?', 'De 2 a 5'],
      ['¿Cuántos minutos llegas tarde normalmente?', '¿Cuántos minutos aguantas un audio antes de pedir un resumen?', 'De 0 a 10'],
      ['¿Cuántas canciones te sabes completas de memoria?', '¿Cuántas pestañas tienes abiertas en el navegador del celular?', 'De 5 a 50'],
      ['¿Cuántas veces al mes dices «el lunes empiezo»?', '¿Cuántas veces al mes haces ejercicio de verdad?', 'De 0 a 10'],
      ['¿Cuántos pares de zapatos usas de verdad?', '¿Cuántos grupos de chat tienes silenciados?', 'De 2 a 10'],
      ['¿Cuántos días aguantarías sin redes sociales?', '¿Cuántos días durarías acampando sin una ducha?', 'De 1 a 7'],
      ['¿Cuántas veces relees un mensaje importante antes de enviarlo?', '¿Cuántas veces miras si cerraste bien la puerta?', 'De 1 a 4'],
      ['¿Cuántos minutos puedes pasar viendo videos sin darte cuenta?', '¿Cuántos minutos dura tu siesta ideal?', 'De 15 a 60']
    ],
    comida: [
      ['¿Qué comida pedirías después de una fiesta?', '¿Qué comida te haría romper una dieta el primer día?', 'Pizza, hamburguesa, tacos…'],
      ['¿Qué ingrediente le quitarías a una hamburguesa?', '¿Qué ingrediente te arruinaría una pizza?', 'Cebolla, tomate, pepinillos…'],
      ['¿Qué bebida pedirías en un día de muchísimo calor?', '¿Qué bebida llevarías para un picnic?', 'Agua, limonada, gaseosa…'],
      ['¿Qué comida podrías comer tres días seguidos?', '¿Qué comida pedirías para una noche de películas?', 'Pizza, pasta, hamburguesa…'],
      ['¿Qué fruta elegirías para un jugo?', '¿Qué fruta te gustaría en un helado?', 'Mango, fresa, maracuyá…'],
      ['¿Qué postre te cuesta compartir?', '¿Qué postre elegirías para tu cumpleaños?', 'Torta, helado, brownie…'],
      ['¿Qué comida sabes preparar sin mirar una receta?', '¿Qué comida prepararías para impresionar a una cita?', 'Pasta, arroz, huevos…'],
      ['¿Qué snack comprarías para un viaje largo?', '¿Qué snack esconderías para no tener que compartirlo?', 'Papas, chocolate, galletas…'],
      ['¿Qué salsa le pondrías a casi todo?', '¿Qué salsa no puede faltar con unas papas fritas?', 'Mayonesa, kétchup, picante…'],
      ['¿Qué comida te recuerda a tu infancia?', '¿Qué comida pedirías si hoy pudieras comer en casa de tu abuela?', 'Sopa, arroz, arepas…'],
      ['¿Qué comprarías en una panadería para desayunar?', '¿Qué comprarías en una panadería para llevar de visita?', 'Pan, croissant, pastel…'],
      ['¿Qué comida huele mejor de lo que sabe?', '¿Qué comida te da hambre con solo olerla?', 'Pan, pizza, café…'],
      ['¿Qué bebida te ayuda a empezar el día?', '¿Qué bebida pedirías en una cafetería durante una cita?', 'Café, té, chocolate…'],
      ['¿Qué sabor de helado pides casi siempre?', '¿Qué sabor elegirías para un pastel?', 'Chocolate, vainilla, fresa…'],
      ['¿Qué plato pedirías en un restaurante italiano?', '¿Qué plato cocinarías para una cena romántica?', 'Pasta, pizza, lasaña…'],
      ['¿Qué comida no llevarías a una primera cita porque ensucia mucho?', '¿Qué comida comerías feliz usando las manos?', 'Alitas, hamburguesa, tacos…']
    ],
    vida: [
      ['¿Qué objeto pierdes más seguido en tu casa?', '¿Qué objeto revisarías primero antes de salir de viaje?', 'Llaves, celular, billetera…'],
      ['¿Qué aplicación abres apenas te despiertas?', '¿Qué aplicación borrarías para dejar de perder tanto tiempo?', 'Instagram, WhatsApp, TikTok…'],
      ['¿Qué tarea de la casa dejas siempre para después?', '¿Qué tarea de la casa pagarías para que alguien hiciera por ti?', 'Lavar, barrer, cocinar…'],
      ['¿Qué prenda usas para estar cómodo en casa?', '¿Qué prenda llevarías en un vuelo de diez horas?', 'Sudadera, camiseta, pijama…'],
      ['¿Qué objeto salvarías primero si tu casa se inundara? Sin contar seres vivos.', '¿Qué objeto de tu casa es el más caro de reemplazar?', 'Computador, celular, televisor…'],
      ['¿Qué te hace levantarte del sofá aunque estés muy cómodo?', '¿Qué suele interrumpirte justo cuando vas a dormir?', 'Hambre, baño, celular…'],
      ['¿Qué lugar de la casa eliges para estar a solas?', '¿Qué lugar de la casa ordenarías primero si llega una visita?', 'Cuarto, sala, baño…'],
      ['¿Qué sonido te despierta de mal humor?', '¿Qué sonido te desconcentra cuando estás trabajando?', 'Alarma, obras, gritos…'],
      ['¿Qué compras aunque todavía tengas en casa?', '¿Qué producto se te acaba justo cuando lo necesitas?', 'Café, papel, champú…'],
      ['¿Qué haces primero cuando se va la luz?', '¿Qué haces primero cuando te quedas sin internet?', 'Mirar el celular, dormir, salir…'],
      ['¿Qué animal tendrías de mascota si tuvieras espacio?', '¿Qué animal crees que se parece a tu personalidad?', 'Perro, gato, conejo…'],
      ['¿Qué llevas en el bolsillo casi siempre?', '¿Qué objeto te daría pánico dejar en un taxi?', 'Celular, llaves, billetera…'],
      ['¿Qué excusa das cuando llegas tarde?', '¿Qué excusa darías para irte temprano de una reunión?', 'Tráfico, trabajo, cansancio…'],
      ['¿Qué cosa de tu cuarto necesita una limpieza urgente?', '¿Qué cosa esconderías antes de una videollamada?', 'Ropa, escritorio, cama…'],
      ['¿Qué haces cuando tienes cinco minutos libres?', '¿Qué haces para evitar una conversación incómoda?', 'Mirar el celular, ir al baño…'],
      ['¿Qué olor te hace sentir en casa?', '¿Qué olor te hace pensar que ya es fin de semana?', 'Café, comida, ropa limpia…']
    ],
    fiesta: [
      ['¿Qué canción pondrías para animar una fiesta? Escribe el título.', '¿Qué canción cantarías a todo pulmón en un karaoke? Escribe el título.', 'Éxitos conocidos y bailables'],
      ['¿Qué plan propones un viernes en la noche?', '¿Qué plan propondrías para celebrar que te subieron el sueldo?', 'Cena, bar, bailar, cine…'],
      ['¿Qué bebida pedirías en una fiesta?', '¿Qué bebida pedirías para brindar por una buena noticia?', 'Cerveza, cóctel, gaseosa…'],
      ['¿Qué objeto nunca falta en tu bolso al salir de noche?', '¿Qué objeto le pedirías prestado a un amigo en una fiesta?', 'Cargador, perfume, dinero…'],
      ['¿Qué género musical te hace bailar aunque no quieras?', '¿Qué género musical pondrías para limpiar la casa con energía?', 'Salsa, reguetón, pop…'],
      ['¿Qué famoso te gustaría invitar a una fiesta? Escribe su nombre.', '¿Qué famoso crees que sería el alma de una boda? Escribe su nombre.', 'Artistas y figuras carismáticas'],
      ['¿A qué lugar irías después de que cierre la fiesta?', '¿A qué lugar irías si te da hambre a medianoche?', 'Casa, puesto de comida, restaurante…'],
      ['¿Qué juego propondrías en una reunión de amigos?', '¿Qué juego crees que puede terminar en una discusión familiar?', 'UNO, Monopoly, cartas…'],
      ['¿Qué llevarías a una reunión donde cada quien pone algo?', '¿Qué comprarías para ver la final de un partido en casa?', 'Papas, bebidas, pizza…'],
      ['¿Qué te hace irte temprano de una fiesta?', '¿Qué te hace cancelar un plan a última hora?', 'Sueño, cansancio, dolor de cabeza…'],
      ['¿Qué ciudad elegirías para un viaje con amigos?', '¿Qué ciudad elegirías para celebrar tu próximo cumpleaños?', 'Destinos con ambiente y planes'],
      ['¿Qué canción te da pena admitir que te sabes? Escribe el título.', '¿Qué canción no puede faltar en una fiesta familiar? Escribe el título.', 'Clásicos populares y canciones pegajosas'],
      ['¿Qué comida servirías en una fiesta en tu casa?', '¿Qué comida pedirías para compartir con tus amigos un domingo?', 'Pizza, tacos, empanadas…'],
      ['¿Qué prenda te pondrías para bailar toda la noche?', '¿Qué prenda no debería faltar en una maleta para la playa?', 'Camiseta, short, vestido…'],
      ['¿Qué frase dices cuando ya te quieres ir de una reunión?', '¿Qué frase dices cuando vas a cancelar un plan por mensaje?', 'Estoy cansado, mañana madrugo…'],
      ['¿Qué actividad harías en un paseo con tus amigos?', '¿Qué actividad propondrías para romper el hielo con un grupo nuevo?', 'Juegos, bailar, cantar…']
    ],
    dilemas: [
      ['¿Qué superpoder te serviría para llegar a tiempo?', '¿Qué superpoder te serviría para escapar de una cita aburrida?', 'Teletransporte, volar, velocidad…'],
      ['¿Qué objeto llevarías a una isla desierta?', '¿Qué objeto llevarías para sobrevivir un apagón de tres días?', 'Linterna, navaja, agua…'],
      ['¿Qué famoso elegirías para que fuera tu compañero de apartamento? Escribe su nombre.', '¿Qué famoso elegirías para acompañarte en un viaje? Escribe su nombre.', 'Personas admiradas o divertidas'],
      ['¿Qué animal serías por un día?', '¿Qué animal sería el peor jefe de oficina?', 'Gato, león, mono…'],
      ['¿Qué lugar visitarías si pudieras teletransportarte ahora?', '¿Qué lugar elegirías para desaparecer una semana?', 'Playa, París, Japón…'],
      ['¿Qué comprarías primero si ganaras la lotería?', '¿Qué comprarías para presumir un poquito si tuvieras dinero de sobra?', 'Casa, carro, viaje…'],
      ['¿Qué profesión probarías si no pudieras fracasar?', '¿Qué profesión crees que serías terrible ejerciendo?', 'Cantante, actor, chef…'],
      ['¿Qué personaje de ficción te gustaría tener como amigo?', '¿Qué personaje de ficción elegirías como guardaespaldas?', 'Héroes y personajes poderosos'],
      ['¿Qué comida extrañarías más si te fueras a vivir a otro planeta?', '¿Qué comida llevarías en la maleta si emigraras mañana?', 'Arepas, chocolate, café…'],
      ['¿Qué habilidad aprenderías en un segundo si pudieras?', '¿Qué habilidad te ayudaría a impresionar en una primera cita?', 'Cantar, bailar, cocinar…'],
      ['¿Qué tienda elegirías para tener todo gratis durante un año?', '¿En qué tienda podrías gastar una fortuna sin darte cuenta?', 'Ropa, tecnología, supermercado…'],
      ['¿Qué harías primero si fueras invisible por una hora?', '¿Qué harías si te quedaras solo en un centro comercial cerrado?', 'Explorar, mirar, comer…'],
      ['¿Qué persona de este grupo elegirías para sobrevivir a un apocalipsis? Escribe su nombre.', '¿Qué persona de este grupo elegirías para organizar un viaje? Escribe su nombre.', 'Personas resolutivas del grupo'],
      ['¿Qué objeto de tu casa usarías para espantar a un zombi?', '¿Qué objeto de tu casa hace más ruido cuando se cae?', 'Sartén, silla, escoba…'],
      ['¿Qué harías con un día libre inesperado?', '¿Qué harías si pudieras pausar el mundo por un día?', 'Dormir, viajar, descansar…'],
      ['¿Qué palabra le enseñarías primero a un extraterrestre?', '¿Qué palabra le enseñarías primero a un loro?', 'Hola, comida, nombres…']
    ],
    confesiones: [
      ['¿Qué cosa te da miedo aunque sabes que es inofensiva?', '¿Qué cosa te haría gritar si apareciera de repente en tu cuarto?', 'Arañas, oscuridad, muñecos…'],
      ['¿Qué excusa has usado para no contestar un mensaje?', '¿Qué excusa usarías para salir de un grupo de chat?', 'Trabajo, batería, poco tiempo…'],
      ['¿Qué búsqueda te daría pena que apareciera en tu historial?', '¿Qué buscarías en internet a las tres de la mañana sin poder dormir?', 'Dudas raras, síntomas, exparejas…'],
      ['¿Qué cosa compras para sentirte mejor después de un mal día?', '¿Qué cosa compras y después dices «no lo necesitaba»?', 'Ropa, comida, dulces…'],
      ['¿Qué programa te da pena admitir que ves?', '¿Qué programa verías para desconectar el cerebro un rato?', 'Reality, telenovela, concurso…'],
      ['¿Qué frase dices cuando no entendiste nada?', '¿Qué frase dices cuando alguien cuenta un chiste malísimo?', 'Ah bueno, claro, jajaja…'],
      ['¿Qué hábito tuyo desesperaría a un compañero de apartamento?', '¿Qué hábito de otra persona te sacaría de quicio en un viaje?', 'Roncar, desorden, tardanza…'],
      ['¿Qué cosa finges entender cuando alguien habla de ella?', '¿Sobre qué tema evitarías que te hicieran una pregunta en público?', 'Finanzas, política, deportes…'],
      ['¿Qué objeto has guardado por años «por si acaso»?', '¿Qué objeto regalarías en un intercambio si no pudieras comprar nada?', 'Taza, libro, cables…'],
      ['¿Qué haces en secreto cuando estás solo en casa?', '¿Qué harías para entretener a un bebé sin usar juguetes?', 'Cantar, bailar, hacer caras…'],
      ['¿Qué palabra o frase usas demasiado?', '¿Qué palabra o frase te hace sonar igual que tus papás?', 'Literal, o sea, en mis tiempos…'],
      ['¿Qué cosa te hace perder la paciencia en una fila?', '¿Qué cosa te hace perder la paciencia en un grupo de chat?', 'Lentitud, ruido, gente que se cuela…'],
      ['¿Qué canción has repetido hasta cansarte? Escribe el título.', '¿Qué canción dedicarías con un poquito de drama? Escribe el título.', 'Éxitos románticos y despecho'],
      ['¿Qué cosa te distrae aunque tengas algo urgente que hacer?', '¿Qué cosa revisas cuando no quieres saludar a alguien?', 'Celular, redes, reloj…'],
      ['¿Qué cumplido te gusta que te hagan?', '¿Qué cumplido usarías para caerle bien a alguien?', 'Buen gusto, humor, inteligencia…'],
      ['¿Qué cosa pequeña puede arruinarte la mañana?', '¿Qué cosa pequeña te haría cancelar una videollamada?', 'Mal internet, sueño, café derramado…']
    ]
  };
  const pairs = categories.flatMap(category => rows[category.id].map((row, index) => ({
    id: `${category.id}-${String(index + 1).padStart(2, '0')}`,
    category: category.id,
    type: category.id === 'numeros' ? 'number' : 'text',
    proper: row[0], intruder: row[1], overlap: row[2]
  })));
  const database = { version: 1, categories, pairs };
  if (typeof module !== 'undefined' && module.exports) module.exports = database;
  else root.QuestionsDB = database;
})(typeof globalThis !== 'undefined' ? globalThis : this);
