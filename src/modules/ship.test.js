import createShip from "./ship.js";

describe("createShip", () => {
  test("carries its name and length", () => {
    const ship = createShip("Cruiser", 3);

    expect(ship.name).toBe("Cruiser");
    expect(ship.length).toBe(3);
  });

  test("starts with no hits", () => {
    expect(createShip("Destroyer", 2).hits).toBe(0);
  });

  test("adds a hit each time hit() is called", () => {
    const ship = createShip("Destroyer", 2);

    ship.hit();
    ship.hit();

    expect(ship.hits).toBe(2);
  });

  test("is not sunk while hits are fewer than its length", () => {
    const ship = createShip("Cruiser", 3);

    ship.hit();
    ship.hit();

    expect(ship.isSunk()).toBe(false);
  });

  test("is sunk once its hits reach its length", () => {
    const ship = createShip("Destroyer", 2);

    ship.hit();
    ship.hit();

    expect(ship.isSunk()).toBe(true);
  });
});
