import createAi from "./ai.js";
import { coordinatesFor, FLEET } from "./fleet.js";
import createGameboard from "./gameboard.js";
import { placeFleetRandomly } from "./placement.js";
import createPlayer from "./player.js";
import createShip from "./ship.js";

export const SEATS = ["player", "computer"];

const OTHER = { player: "computer", computer: "player" };

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

  // The seat defaults to whoever is acting right now - the seat still placing,
  // or the seat whose turn it is - so the caller only names a seat when it is
  // asking about the other one (a pass-and-play handover, mostly).
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

  // Only ever one fleet on show, and it is always your own. In pass & play that
  // means whichever player is holding the device, so each sees their ships on
  // their turn. Against the computer it is the player's board throughout, so the
  // enemy fleet stays hidden for the whole game rather than flickering into view
  // whenever the computer takes its turn.
  //
  // A pending handover trumps everything: the turn has already passed to the
  // other seat, but the device is still in the outgoing player's hands, so
  // showing the incoming seat's fleet would give the game away before the
  // pass-the-device screen has even come up. Reveal nothing until they take it.
  const isFleetVisible = (seat) => {
    if (isOver()) return true;
    if (handoff) return false;
    if (phase === "placing") return seat === placingSeat;

    return seat === (local ? turn : "player");
  };

  const resolve = (attacker, coordinate) => {
    const defender = OTHER[attacker];
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
    if (boardOf(OTHER[seat]).hasBeenAttacked(coordinate)) return null;

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
    getSeats: () => [...SEATS],
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
