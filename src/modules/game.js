import createAi from "./ai.js";
import { coordinatesFor, FLEET } from "./fleet.js";
import createGameboard from "./gameboard.js";
import { placeFleetRandomly } from "./placement.js";
import createPlayer from "./player.js";
import createShip from "./ship.js";

// The two seats, and the one you fire at. Exported so the renderer pairs them up
// the same way the controller does instead of keeping a second copy.
export const SEATS = ["player", "computer"];
export const OTHER_SEAT = { player: "computer", computer: "player" };

const createGame = ({
  mode = "computer",
  hitAgain = true,
  random = Math.random,
  fleet = FLEET,
} = {}) => {
  const local = mode === "local";

  const seats = {
    player: createPlayer("player", local ? "Player 1" : "You"),
    computer: createPlayer("computer", local ? "Player 2" : "Computer"),
  };

  // In two-player mode both fleets are placed by hand; otherwise the computer
  // fleet is random and already done.
  const placed = { player: 0, computer: local ? 0 : fleet.length };
  const ai = createAi(random);

  let phase = "placing";
  let placingSeat = "player";
  let turn = "player";
  let winner = null;
  let handoff = null;
  let repeatOnHit = hitAgain;

  const boardOf = (seat) => seats[seat].board;
  const pendingShip = (seat = placingSeat) => fleet[placed[seat]] ?? null;
  const fleetReady = (seat = placingSeat) => placed[seat] >= fleet.length;

  // The seat defaults to whoever is acting, so the caller only names one when it
  // is asking about the other seat (a pass-and-play handover, mostly).
  const canPlaceNextShip = (
    start,
    orientation = "horizontal",
    seat = placingSeat,
  ) => {
    const spec = pendingShip(seat);

    if (!spec) return false;

    return boardOf(seat).canPlaceShip(
      { name: spec.name, length: spec.length },
      start,
      orientation,
    );
  };

  const placeNextShip = (
    start,
    orientation = "horizontal",
    seat = placingSeat,
  ) => {
    const spec = pendingShip(seat);

    if (!spec) return null;

    const coordinates = boardOf(seat).placeShip(
      createShip(spec.name, spec.length),
      start,
      orientation,
    );

    placed[seat] += 1;

    return coordinates;
  };

  const previewNextShip = (
    start,
    orientation = "horizontal",
    seat = placingSeat,
  ) => {
    const spec = pendingShip(seat);

    return spec ? coordinatesFor(spec.length, start, orientation) : [];
  };

  const resetFleet = (seat = placingSeat) => {
    seats[seat].board = createGameboard();
    placed[seat] = 0;
  };

  const randomizeFleet = (seat = placingSeat) => {
    seats[seat].board = createGameboard();
    placeFleetRandomly(seats[seat].board, fleet, random);
    placed[seat] = fleet.length;
  };

  const isOver = () => winner !== null;

  // A pending handover trumps everything: while the device changes hands neither
  // fleet is painted, or the incoming player's layout is readable straight off.
  const isFleetVisible = (seat) => {
    if (isOver()) return true;
    if (handoff) return false;
    if (phase === "placing") return seat === placingSeat;

    return seat === (local ? turn : "player");
  };

  // The board you aim at: only ever the enemy's, and only while it is your move.
  // Otherwise a click on your own waters is read as the computer's shot.
  const aimingSeat = () => {
    if (isOver() || handoff || phase !== "playing") return null;
    if (!local && turn !== "player") return null;

    return OTHER_SEAT[turn];
  };

  const resolve = (attacker, coordinate) => {
    const defender = OTHER_SEAT[attacker];
    const defenderBoard = boardOf(defender);
    const result = defenderBoard.receiveAttack(coordinate);

    if (defenderBoard.allSunk()) {
      winner = attacker;
      phase = "over";
    } else if (!repeatOnHit || result.outcome !== "hit") {
      turn = defender;
      if (local) handoff = defender;
    }

    return result;
  };

  const fire = (coordinate, seat = turn) => {
    if (phase !== "playing" || isOver() || handoff || turn !== seat)
      return null;
    if (boardOf(OTHER_SEAT[seat]).hasBeenAttacked(coordinate)) return null;

    return resolve(seat, coordinate);
  };

  const start = () => {
    if (phase !== "placing" || !fleetReady(placingSeat)) return false;

    if (local && placingSeat === "player") {
      placingSeat = "computer";
      handoff = "computer";

      return true;
    }

    phase = "playing";
    placingSeat = null;
    turn = "player";
    if (local) handoff = "player";

    return true;
  };

  const acknowledge = () => {
    if (!handoff) return false;

    handoff = null;

    return true;
  };

  const returnFire = () => {
    if (local || phase !== "playing" || isOver() || handoff) return null;
    if (turn !== "computer") return null;

    const playerBoard = boardOf("player");
    const coordinate = ai.nextTarget(playerBoard);

    if (!coordinate) return null;

    const result = resolve("computer", coordinate);

    ai.digest(coordinate, result, playerBoard);

    return { coordinate, ...result };
  };

  const restart = () => {
    resetFleet("player");
    resetFleet("computer");

    if (!local) {
      placeFleetRandomly(seats.computer.board, fleet, random);
      placed.computer = fleet.length;
    }

    phase = "placing";
    placingSeat = "player";
    turn = "player";
    winner = null;
    handoff = null;
  };

  if (!local) {
    placeFleetRandomly(seats.computer.board, fleet, random);
  }

  return {
    getMode: () => mode,
    pendingShip,
    fleetReady,
    canPlaceNextShip,
    placeNextShip,
    previewNextShip,
    resetFleet,
    randomizeFleet,
    start,
    acknowledge,
    fire,
    returnFire,
    isOver,
    isFleetVisible,
    aimingSeat,
    getPhase: () => phase,
    getPlacingSeat: () => placingSeat,
    getTurn: () => turn,
    getWinner: () => winner,
    getHandoff: () => handoff,
    getBoard: boardOf,
    getPlayer: (seat) => seats[seat],
    getFleet: () => fleet.map((spec) => ({ ...spec })),
    isHitAgain: () => repeatOnHit,
    setHitAgain: (value) => {
      repeatOnHit = Boolean(value);
    },
    restart,
  };
};

export default createGame;
