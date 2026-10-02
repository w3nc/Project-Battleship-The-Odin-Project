import { BOARD_SIZE, FLEET } from "./fleet.js";
import createGameboard from "./gameboard.js";
import { placeFleetRandomly } from "./placement.js";

const seededRandom = (seed = 1) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
};

const FLEET_SQUARES = FLEET.reduce((sum, ship) => sum + ship.length, 0);

describe("placeFleetRandomly", () => {
  test("places every ship in the fleet, in order", () => {
    const board = createGameboard();

    placeFleetRandomly(board, FLEET, seededRandom(7));

    expect(board.getShips().map(({ name }) => name)).toEqual(
      FLEET.map(({ name }) => name),
    );
  });

  test("fits the whole fleet across many random runs", () => {
    FLEET.forEach((_, seed) => {
      const board = createGameboard();

      expect(() =>
        placeFleetRandomly(board, FLEET, seededRandom(seed + 1)),
      ).not.toThrow();

      const squares = board
        .getShips()
        .reduce((sum, ship) => sum + ship.length, 0);

      expect(squares).toBe(FLEET_SQUARES);
    });
  });

  test("returns the coordinates of each placed ship", () => {
    const board = createGameboard();

    const placements = placeFleetRandomly(board, FLEET, seededRandom(3));

    placements.forEach((coordinates, index) => {
      expect(coordinates).toHaveLength(FLEET[index].length);
    });
  });

  test("keeps every coordinate inside the board", () => {
    const board = createGameboard();

    const placements = placeFleetRandomly(board, FLEET, seededRandom(9));

    placements.flat().forEach(([x, y]) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(BOARD_SIZE);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(BOARD_SIZE);
    });
  });
});
