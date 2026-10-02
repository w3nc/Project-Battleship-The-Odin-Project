import createGameboard from "./gameboard.js";
import createShip from "./ship.js";

const place = (board, name, length, start, orientation) =>
  board.placeShip(createShip(name, length), start, orientation);

describe("createGameboard", () => {
  test("starts empty", () => {
    const board = createGameboard();

    expect(board.getShips()).toEqual([]);
    expect(board.getMisses()).toEqual([]);
    expect(board.allSunk()).toBe(false);
  });

  test("places a ship horizontally across its coordinates", () => {
    const board = createGameboard();

    expect(place(board, "Destroyer", 2, [1, 1], "horizontal")).toEqual([
      [1, 1],
      [2, 1],
    ]);
  });

  test("places a ship vertically down its coordinates", () => {
    const board = createGameboard();

    expect(place(board, "Cruiser", 3, [4, 4], "vertical")).toEqual([
      [4, 4],
      [4, 5],
      [4, 6],
    ]);
  });

  test("defaults to a horizontal ship", () => {
    const board = createGameboard();

    expect(place(board, "Destroyer", 2, [0, 0])).toEqual([
      [0, 0],
      [1, 0],
    ]);
  });

  test("fits a ship that ends on the last row and column", () => {
    const board = createGameboard();

    expect(place(board, "Carrier", 5, [5, 0], "horizontal")).toEqual([
      [5, 0],
      [6, 0],
      [7, 0],
      [8, 0],
      [9, 0],
    ]);
  });

  test("refuses a ship that would run off the board", () => {
    const board = createGameboard();

    expect(() => place(board, "Carrier", 5, [6, 0], "horizontal")).toThrow(
      RangeError,
    );
    expect(() => place(board, "Carrier", 5, [0, 6], "vertical")).toThrow(
      RangeError,
    );
  });

  test("refuses a ship that would overlap another", () => {
    const board = createGameboard();

    place(board, "Cruiser", 3, [0, 0], "horizontal");

    expect(() => place(board, "Destroyer", 2, [2, 0], "horizontal")).toThrow(
      RangeError,
    );
  });

  test("knows where a ship sits", () => {
    const board = createGameboard();
    const ship = createShip("Destroyer", 2);

    board.placeShip(ship, [3, 3]);

    expect(board.shipAt([3, 3])).toBe(ship);
    expect(board.shipAt([9, 9])).toBeNull();
  });

  test("sends a hit to the ship on the attacked square", () => {
    const board = createGameboard();
    const ship = createShip("Destroyer", 2);

    board.placeShip(ship, [0, 0]);
    const result = board.receiveAttack([0, 0]);

    expect(result.outcome).toBe("hit");
    expect(result.ship).toBe(ship);
    expect(ship.hits).toBe(1);
  });

  test("reports a ship as sunk on the attack that fills it", () => {
    const board = createGameboard();

    board.placeShip(createShip("Destroyer", 2), [0, 0]);

    expect(board.receiveAttack([0, 0]).sunk).toBe(false);
    expect(board.receiveAttack([1, 0]).sunk).toBe(true);
  });

  test("records the coordinates of a missed shot", () => {
    const board = createGameboard();

    board.placeShip(createShip("Destroyer", 2), [0, 0]);
    const result = board.receiveAttack([5, 5]);

    expect(result.outcome).toBe("miss");
    expect(board.getMisses()).toEqual([[5, 5]]);
  });

  test("knows which squares have been attacked", () => {
    const board = createGameboard();

    board.placeShip(createShip("Destroyer", 2), [0, 0]);
    board.receiveAttack([0, 0]);
    board.receiveAttack([5, 5]);

    expect(board.hasBeenAttacked([0, 0])).toBe(true);
    expect(board.hasBeenAttacked([5, 5])).toBe(true);
    expect(board.hasBeenAttacked([9, 9])).toBe(false);
  });

  test("does not score the same square twice", () => {
    const board = createGameboard();
    const ship = createShip("Destroyer", 2);

    board.placeShip(ship, [0, 0]);
    board.receiveAttack([0, 0]);

    expect(board.receiveAttack([0, 0]).outcome).toBe("repeat");
    expect(ship.hits).toBe(1);
  });

  test("refuses a shot off the board", () => {
    const board = createGameboard();

    expect(() => board.receiveAttack([10, 0])).toThrow(RangeError);
    expect(() => board.receiveAttack([0, -1])).toThrow(RangeError);
  });

  test("reports the fleet sunk only when every ship is down", () => {
    const board = createGameboard();

    board.placeShip(createShip("Destroyer", 2), [0, 0]);
    board.placeShip(createShip("Cruiser", 3), [0, 2]);

    board.receiveAttack([0, 0]);
    board.receiveAttack([1, 0]);

    expect(board.allSunk()).toBe(false);

    board.receiveAttack([0, 2]);
    board.receiveAttack([1, 2]);
    board.receiveAttack([2, 2]);

    expect(board.allSunk()).toBe(true);
  });

  test("lists each ship with its hits and sunk state", () => {
    const board = createGameboard();

    board.placeShip(createShip("Destroyer", 2), [0, 0]);
    board.receiveAttack([0, 0]);

    expect(board.getShips()).toEqual([
      { name: "Destroyer", length: 2, hits: 1, sunk: false },
    ]);
  });
});
