import { BOARD_SIZE, coordinatesFor } from "./fleet.js";

const coordinateKey = ([x, y]) => `${x},${y}`;

const isOnBoard = ([x, y]) =>
  x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

const createGameboard = () => {
  const ships = [];
  const shipByCell = new Map();
  const hits = new Set();
  const misses = new Set();

  const canPlaceShip = (ship, start, orientation = "horizontal") =>
    coordinatesFor(ship.length, start, orientation).every(
      (coordinate) =>
        isOnBoard(coordinate) && !shipByCell.has(coordinateKey(coordinate)),
    );

  const placeShip = (ship, start, orientation = "horizontal") => {
    if (!canPlaceShip(ship, start, orientation)) {
      throw new RangeError(
        `${ship.name} cannot sit at ${coordinateKey(start)} going ${orientation}.`,
      );
    }

    const coordinates = coordinatesFor(ship.length, start, orientation);

    coordinates.forEach((coordinate) =>
      shipByCell.set(coordinateKey(coordinate), ship),
    );
    ships.push({ ship, coordinates });

    return coordinates;
  };

  const shipAt = (coordinate) =>
    shipByCell.get(coordinateKey(coordinate)) ?? null;

  const hasBeenAttacked = (coordinate) => {
    const key = coordinateKey(coordinate);

    return hits.has(key) || misses.has(key);
  };

  const receiveAttack = (coordinate) => {
    if (!isOnBoard(coordinate)) {
      throw new RangeError(`${coordinateKey(coordinate)} is off the board.`);
    }

    if (hasBeenAttacked(coordinate)) {
      return { outcome: "repeat", ship: null, sunk: false };
    }

    const ship = shipAt(coordinate);

    if (!ship) {
      misses.add(coordinateKey(coordinate));

      return { outcome: "miss", ship: null, sunk: false };
    }

    hits.add(coordinateKey(coordinate));
    ship.hit();

    return { outcome: "hit", ship, sunk: ship.isSunk() };
  };

  const allSunk = () =>
    ships.length > 0 && ships.every(({ ship }) => ship.isSunk());

  const getShips = () =>
    ships.map(({ ship }) => ({
      name: ship.name,
      length: ship.length,
      hits: ship.hits,
      sunk: ship.isSunk(),
    }));

  const getMisses = () => [...misses].map((key) => key.split(",").map(Number));

  return {
    placeShip,
    canPlaceShip,
    shipAt,
    hasBeenAttacked,
    receiveAttack,
    allSunk,
    getShips,
    getMisses,
  };
};

export default createGameboard;
