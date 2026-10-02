import createPlayer from "./player.js";

describe("createPlayer", () => {
  test("keeps its type and name", () => {
    const player = createPlayer("player", "You");

    expect(player.type).toBe("player");
    expect(player.name).toBe("You");
  });

  test("carries its own empty gameboard", () => {
    const player = createPlayer("player", "You");

    expect(player.board.getShips()).toEqual([]);
    expect(player.board.allSunk()).toBe(false);
  });

  test("gives each player a separate board", () => {
    const first = createPlayer("player", "You");
    const second = createPlayer("computer", "Computer");

    expect(first.board).not.toBe(second.board);
  });
});
