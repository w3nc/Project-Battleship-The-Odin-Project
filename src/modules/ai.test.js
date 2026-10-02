import createAi, { legalTargets } from "./ai.js";
import { BOARD_SIZE } from "./fleet.js";
import createGameboard from "./gameboard.js";
import createShip from "./ship.js";

const seededRandom = (seed = 1) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
};

// A five-square Carrier lying across y = 3, so a hit has room on every side.
const boardWithCarrier = () => {
  const board = createGameboard();

  board.placeShip(createShip("Carrier", 5), [2, 3]);

  return board;
};

// The AI only learns about shots it is told about, so drive that by hand.
const shoot = (board, ai, coordinate) => {
  const result = board.receiveAttack(coordinate);

  ai.digest(coordinate, result, board);

  return result;
};

describe("legalTargets", () => {
  test("starts with the whole board", () => {
    expect(legalTargets(createGameboard())).toHaveLength(
      BOARD_SIZE * BOARD_SIZE,
    );
  });

  test("drops every square that has been attacked", () => {
    const board = createGameboard();

    board.placeShip(createShip("Destroyer", 2), [0, 0]);
    board.receiveAttack([0, 0]);
    board.receiveAttack([5, 5]);

    const targets = legalTargets(board);

    expect(targets).toHaveLength(BOARD_SIZE * BOARD_SIZE - 2);
    expect(targets).not.toContainEqual([0, 0]);
    expect(targets).not.toContainEqual([5, 5]);
  });
});

describe("createAi", () => {
  test("never picks a square that has already been attacked", () => {
    const board = createGameboard();
    const ai = createAi(seededRandom(7));

    board.placeShip(createShip("Destroyer", 2), [0, 0]);

    for (let shot = 0; shot < 60; shot += 1) {
      const target = ai.nextTarget(board);

      expect(board.hasBeenAttacked(target)).toBe(false);
      shoot(board, ai, target);
    }
  });

  test("returns null once every square has been tried", () => {
    const board = createGameboard();

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) board.receiveAttack([x, y]);
    }

    expect(createAi().nextTarget(board)).toBeNull();
  });

  test("keeps searching at random after a miss", () => {
    const board = boardWithCarrier();
    const ai = createAi(() => 0);

    expect(shoot(board, ai, [0, 0]).outcome).toBe("miss");

    // No lead to follow, so the next square is simply the first legal one.
    expect(ai.nextTarget(board)).toEqual([1, 0]);
  });

  test("honours the random function it is given", () => {
    const board = createGameboard();

    expect(createAi(() => 0).nextTarget(board)).toEqual([0, 0]);
    expect(createAi(() => 0.999999).nextTarget(board)).toEqual([
      BOARD_SIZE - 1,
      BOARD_SIZE - 1,
    ]);
  });

  test("hunts the squares around a hit", () => {
    const board = boardWithCarrier();
    const ai = createAi(() => 0);

    expect(shoot(board, ai, [3, 3]).outcome).toBe("hit");

    expect([
      [2, 3],
      [4, 3],
      [3, 2],
      [3, 4],
    ]).toContainEqual(ai.nextTarget(board));
  });

  test("follows the line once two hits line up", () => {
    const board = boardWithCarrier();
    const ai = createAi(() => 0);

    shoot(board, ai, [3, 3]);
    shoot(board, ai, [4, 3]);

    // The four neighbours collapse into the two squares past the ends of the run.
    expect([
      [2, 3],
      [5, 3],
    ]).toContainEqual(ai.nextTarget(board));
  });

  test("follows a vertical line as well as a horizontal one", () => {
    const board = createGameboard();
    const ai = createAi(() => 0);

    board.placeShip(createShip("Cruiser", 3), [4, 2], "vertical");

    shoot(board, ai, [4, 3]);
    shoot(board, ai, [4, 4]);

    expect([
      [4, 2],
      [4, 5],
    ]).toContainEqual(ai.nextTarget(board));
  });

  test("drops the lead once the ship goes down", () => {
    const board = createGameboard();
    const ai = createAi(() => 0);

    board.placeShip(createShip("Destroyer", 2), [4, 4]);

    shoot(board, ai, [4, 4]);
    expect(shoot(board, ai, [5, 4]).sunk).toBe(true);

    // The hunt is over, so the next square is a fresh pick at random rather
    // than another neighbour of the ship that just sank.
    expect(ai.nextTarget(board)).toEqual([0, 0]);
  });

  test("never aims at a square that was attacked elsewhere in the meantime", () => {
    const board = boardWithCarrier();
    const ai = createAi(() => 0);

    shoot(board, ai, [3, 3]);

    // A square the AI had aimed at is taken before it gets there.
    board.receiveAttack([3, 2]);

    const targets = [
      ai.nextTarget(board),
      ai.nextTarget(board),
      ai.nextTarget(board),
    ];

    expect(targets).not.toContainEqual([3, 2]);
  });
});
