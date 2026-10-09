/* ================================================================
   ESTADO & CONSTANTES
   ================================================================ */

const STATE = {
  config: {
    numPlayers: 5,
    numImpostors: 1,
    randomImpostors: false,
    numUndercovers: 0,
    numBullets: 3,
    infiniteBullets: false,
    withHints: true,
    selectedCategories: [],
    playerNames: [],
    powers: { grenade: false, sacrificio: false, revivir: false, kamikaze: true, angel: true },
    roles: { bufon: true, pareja: true },
    revealRoles: true
  },
  game: null,
  currentScreen: 'splash'
};

// Pool grande de íconos y colores: se ciclan con módulo, así nunca se
// agotan sin importar la cantidad de jugadores.
const AVATARS = ['👾','🤖','👽','🦾','🧠','💀','🎭','🔮','⚡','🌀','🐉','🦄','🐸','🐙','🦈','🐺','🦊','🦁','🐯','🐼','🐨','🐷','🐵','🦉','🐝','🦋','🐢','🐍','🦖','🐬','🐳','🦩','🐧','🦚','🌵','🌴','🍕','🍔','🌮','🍩','🍪','🎂','🍿','🍺','🎳','🎯','🎲','🚀','🛸','🚗','🚲','⚽','🏀','🎾','🎱','🎮','🎸','🥁','🎤','🎧','🏰','🏝️','🌋','🎡','🎠','🧨','💣','🗡️','🛡️','🏆','👑','🎩','👻','🎃','🧙'];
const PLAYER_COLORS = ['#A855F7','#4D9FFF','#39FF14','#FF3131','#FFD600','#00F5FF','#FF6B35','#FF85A1','#5EFF8B','#B8C0FF','#E879F9','#FCA5A5','#86EFAC','#93C5FD','#FDE68A','#67E8F9','#D8B4FE','#FDBA74','#A7F3D0','#F9A8D4','#C4B5FD','#A3E635','#FB7185','#38BDF8'];

const MAX_PLAYERS = 40;
const MIN_PLAYERS = 3;

const avatarOf = i => AVATARS[i % AVATARS.length];
const colorOf  = i => PLAYER_COLORS[i % PLAYER_COLORS.length];

const POWERS_INFO = {
  grenade: {
    emoji: '💥',
    name: 'Granada',
    desc: `Alto riesgo, pura suerte: ${Math.round(BALANCE.GRENADE.P_NOBODY * 100)}% ni explota · ${Math.round(BALANCE.GRENADE.P_ONLY_INNOCENTS * 100)}% mata solo no-impostores · ${Math.round(BALANCE.GRENADE.P_MIXED * 100)}% mezcla (garantiza 1 impostor) · ${Math.round(BALANCE.GRENADE.P_ONLY_IMPOSTORS * 100)}% solo impostores. Víctimas según jugadores vivos.`
  },
  sacrificio: {
    emoji: '⚔️',
    name: 'Sacrificio',
    desc: `Elimina a 1 jugador al azar (inocente, bufón o undercover; nunca impostor) y a cambio revela un grupo de ${BALANCE.SACRIFICIO.GROUP_MIN}-${BALANCE.SACRIFICIO.GROUP_MAX} jugadores vivos entre los que hay al menos 1 impostor asegurado. Sin decir quién.`
  },
  revivir: {
    emoji: '🕊️',
    name: 'Revivir',
    desc: `Trae de vuelta a un inocente eliminado. Cuesta 1 bala (bloqueado si queda solo 1) y el grupo debe leer en voz alta una pista extra de la palabra… que el impostor también escucha.`
  },
  kamikaze: {
    emoji: '💣',
    name: 'Kamikaze (impostores)',
    desc: `Siempre activo: ${Math.round(BALANCE.KAMIKAZE_CHANCE * 100)}% de las rondas UN impostor lo recibe en secreto. Cuando lo votan, puede decidir eliminar a sus vecinos de la ronda… inocentes o no.`,
    alwaysOn: true
  },
  angel: {
    emoji: '😇',
    name: 'Ángel Guardián (inocentes)',
    desc: `Siempre activo: todos (menos los impostores) tienen un ${Math.round(BALANCE.ANGEL_GUARDIAN_CHANCE * 100)}% de tener un ángel esta partida. Si la granada o el kamikaze los alcanza, el ángel los salva.`,
    alwaysOn: true
  }
};
