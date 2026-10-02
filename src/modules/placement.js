import { BOARD_SIZE, ORIENTATIONS } from "./fleet.js";
import createShip from "./ship.js";

const randomIndex = (random, count) => Math.floor(random() * count);

// A ship only fits where its whole length stays on the board, so the number of
// legal start coordinates shrinks by (length - 1) along the axis it runs down.
const randomStart = (length, orientation, random) => {
  const horizontal = orientation === "horizontal";
  const spanX = horizontal ? length : 1;
  const spanY = horizontal ? 1 : length;

  return [
    randomIndex(random, BOARD_SIZE - spanX + 1),
    randomIndex(random, BOARD_SIZE - spanY + 1),
  ];
};

export const placeShipRandomly = (board, ship, random = Math.random) => {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const orientation = ORIENTATIONS[randomIndex(random, ORIENTATIONS.length)];
    const start = randomStart(ship.length, orientation, random);

    if (board.canPlaceShip(ship, start, orientation)) {
      return board.placeShip(ship, start, orientation);
    }
  }

  throw new Error(`No free space left on the board for ${ship.name}.`);
};

export const placeFleetRandomly = (board, fleet, random = Math.random) =>
  fleet.map(({ name, length }) =>
    placeShipRandomly(board, createShip(name, length), random),
  );
