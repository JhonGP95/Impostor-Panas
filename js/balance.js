/* ================================================================
   ⚖️ BALANCE — TODOS los parámetros de balance del juego en UN lugar.
   Ajustá acá los porcentajes y cantidades; la UI se adapta sola.
   ================================================================ */
const BALANCE = {
  // 🎲 Selección de impostores — Pseudo-Random Distribution (PRD):
  // el peso de cada jugador arranca en BASE justo después de ser impostor y
  // crece GROWTH por ronda sin serlo (con techo MAX_WEIGHT). Difícil repetir
  // dos veces seguidas, imposible caer en sequías largas, y el azar sigue siendo
  // azar (no hay turnos fijos). A largo plazo el reparto queda igualado.
  IMPOSTOR_PRD: {
    BASE: 1.0,             // peso justo después de ser impostor
    GROWTH: 0.3,           // cuánto sube el peso por ronda sin ser impostor
    MAX_WEIGHT: 3.0,       // techo del peso
    DEFAULT_PITY: 2        // "rondas sin ser impostor" para jugadores sin historial
  },

  // 💣 Kamikaze (poder de impostores): probabilidad de que UN impostor lo tenga
  KAMIKAZE_CHANCE: 0.15,                 // rango deseado 0.10 – 0.20
  KAMIKAZE_COLLATERAL_CONSUMES_BULLETS: false, // las muertes colaterales gastan bala

  // 😇 Ángel Guardián (poder de inocentes): probabilidad por inocente, por ronda
  ANGEL_GUARDIAN_CHANCE: 0.10,

  // 💥 Granada: resultados y cantidad de víctimas
  GRENADE: {
    P_ONLY_INNOCENTS: 0.50,              // mata solo inocentes
    P_MIXED: 0.35,                       // mata mezcla (garantiza 1 impostor si hay)
    P_ONLY_IMPOSTORS: 0.15,              // mata solo impostores
    VICTIM_DIVISOR: 3,                   // víctimas = max(1, floor(vivos / 3))
    MIN_VICTIMS: 1
  },

  // ⚔️ Sacrificio: grupo de sospechosos revelado
  SACRIFICIO: {
    GROUP_MIN: 3,                        // tamaño del grupo (entre 3 y 4)
    GROUP_MAX: 4,
    CONSUMES_BULLET: false               // la víctima del sacrificio gasta bala
  },

  // 🕊️ Revivir: costos y límites
  REVIVIR: {
    MIN_BULLETS_REQUIRED: 2,             // consume 1; con menos de 2 queda bloqueado
    CONSUMES_BULLET: true
  },

  // 🤡 Bufón (rol especial): máximo 1 por partida. Gana SOLO si lo eliminan
  // por votación (granada, kamikaze, sacrificio o irse no cuentan).
  BUFON: {
    MAX_PER_GAME: 1
  },

  // 💔 Pareja / Cupido (equipo propio): una sola pareja por partida, solo
  // entre inocentes puros. Ganan SOLO ellos dos: cuando no queden impostores
  // NI inocentes. Si uno muere, el otro muere de tristeza (sin excepciones:
  // su propio ángel los cubre a cada uno de granada y kamikaze).
  PAREJA: {
    MIN_PLAYERS: 6                       // se necesita una mesa de 6 o más
  },

  // 📱 Compacto: a partir de esta cantidad de vivos, la lista de votación
  // cambia a filas compactas (si no, es un scroll infinito)
  VOTING_COMPACT_THRESHOLD: 12
};
