import { BOARD_SIZE, FLEET } from "./fleet.js";
import createGame from "./game.js";

const seededRandom = (seed = 1) => {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
};

// Spread the fleet down the left of the board so tests can place it by hand,
// one ship per even row: Carrier, Battleship, Cruiser, Submarine, Destroyer.
const MANUAL_PLACEMENTS = [
  [0, 0],
  [0, 2],
  [0, 4],
  [0, 6],
  [0, 8],
];

const placeFleetByHand = (game) =>
  MANUAL_PLACEMENTS.forEach((start) => game.placeNextShip(start));

const shipCells = (board) => {
  const cells = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (board.shipAt([x, y])) cells.push([x, y]);
    }
  }

  return cells;
};

const emptyCell = (board) => {
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!board.shipAt([x, y])) return [x, y];
    }
  }

  return null;
};

const startGame = (options = {}) => {
  const game = createGame({ random: seededRandom(12), ...options });

  placeFleetByHand(game);
  game.start();

  return game;
};

describe("createGame", () => {
  test("starts in the placing phase with an empty player board", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.getPhase()).toBe("placing");
    expect(game.getBoard("player").getShips()).toEqual([]);
  });

  test("already has the computer fleet hidden away", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.getBoard("computer").getShips()).toHaveLength(FLEET.length);
  });

  test("will not start until the player fleet is complete", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.start()).toBe(false);

    placeFleetByHand(game);

    expect(game.start()).toBe(true);
    expect(game.getPhase()).toBe("playing");
  });

  test("places the player ships one at a time, in fleet order", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.pendingShip().name).toBe("Carrier");

    game.placeNextShip([0, 0]);

    expect(game.pendingShip().name).toBe("Battleship");
    expect(game.getBoard("player").getShips()[0].name).toBe("Carrier");
  });

  test("refuses a manual placement that would not fit", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.canPlaceNextShip([8, 0])).toBe(false);
    expect(game.canPlaceNextShip([0, 0])).toBe(true);
  });

  test("randomises the whole player fleet on demand", () => {
    const game = createGame({ random: seededRandom(21) });

    game.randomizeFleet();

    expect(game.getBoard("player").getShips()).toHaveLength(FLEET.length);
    expect(game.pendingShip()).toBeNull();
    expect(game.start()).toBe(true);
  });

  test("ignores shots before the game has started", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.fire([0, 0])).toBeNull();
  });

  test("turns a miss into the computer's move", () => {
    const game = startGame();
    const result = game.fire(emptyCell(game.getBoard("computer")));

    expect(result.outcome).toBe("miss");
    expect(game.getTurn()).toBe("computer");
  });

  test("keeps the turn on a hit while hit-again is on", () => {
    const game = startGame();
    const [cell] = shipCells(game.getBoard("computer"));

    expect(game.fire(cell).outcome).toBe("hit");
    expect(game.getTurn()).toBe("player");
  });

  test("passes the turn on a hit when hit-again is off", () => {
    const game = startGame({ hitAgain: false });
    const [cell] = shipCells(game.getBoard("computer"));

    game.fire(cell);

    expect(game.getTurn()).toBe("computer");
  });

  test("ignores a shot fired out of turn", () => {
    const game = startGame();

    game.fire(emptyCell(game.getBoard("computer")));

    // The miss handed the turn over, so the player cannot fire again.
    expect(game.fire([0, 9], "player")).toBeNull();
  });

  test("ignores a shot at a square already attacked", () => {
    const game = startGame();
    const [cell] = shipCells(game.getBoard("computer"));

    // A hit keeps the turn, so the second shot at the same square is the one
    // that has to be turned away.
    game.fire(cell);

    expect(game.fire(cell)).toBeNull();
  });

  test("only lets the computer fire on its own turn", () => {
    const game = startGame();

    expect(game.returnFire()).toBeNull();
  });

  test("lets the computer fire at a square it has not tried", () => {
    const game = startGame();

    game.fire(emptyCell(game.getBoard("computer")));
    const shot = game.returnFire();
    const playerBoard = game.getBoard("player");

    expect(shot.coordinate).toHaveLength(2);
    expect(playerBoard.hasBeenAttacked(shot.coordinate)).toBe(true);
  });

  test("ends once the whole enemy fleet is sunk", () => {
    const game = startGame();

    shipCells(game.getBoard("computer")).forEach((cell) => game.fire(cell));

    expect(game.isOver()).toBe(true);
    expect(game.getWinner()).toBe("player");
    expect(game.getPhase()).toBe("over");
  });

  test("stops accepting shots once the game is over", () => {
    const game = startGame();

    shipCells(game.getBoard("computer")).forEach((cell) => game.fire(cell));

    expect(game.fire([0, 9])).toBeNull();
  });

  test("toggles the hit-again rule", () => {
    const game = startGame();

    expect(game.isHitAgain()).toBe(true);

    game.setHitAgain(false);

    expect(game.isHitAgain()).toBe(false);
  });

  test("restarts back to a fresh placing phase", () => {
    const game = startGame();

    shipCells(game.getBoard("computer")).forEach((cell) => game.fire(cell));
    game.restart();

    expect(game.getPhase()).toBe("placing");
    expect(game.getTurn()).toBe("player");
    expect(game.isOver()).toBe(false);
    expect(game.getBoard("player").getShips()).toEqual([]);
    expect(game.getBoard("computer").getShips()).toHaveLength(FLEET.length);
  });

  test("reports the fleet as ready only once every ship is down", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.fleetReady()).toBe(false);

    placeFleetByHand(game);

    expect(game.fleetReady()).toBe(true);
  });
});

// Two players sharing one device: both fleets are placed by hand and the
// game hands the device over between turns instead of firing on its own.
describe("pass & play", () => {
  const localGame = () =>
    createGame({ random: seededRandom(5), mode: "local" });

  const startLocalGame = () => {
    const game = localGame();

    placeFleetByHand(game); // Player 1 places
    game.start(); // hands the device over
    game.acknowledge();
    placeFleetByHand(game); // Player 2 places
    game.start(); // play begins, Player 1 to move

    // The handover to Player 1 is deliberately left waiting.
    return game;
  };

  test("leaves both fleets for the players to place", () => {
    const game = localGame();

    expect(game.getMode()).toBe("local");
    expect(game.getBoard("computer").getShips()).toEqual([]);
    expect(game.getPlayer("player").name).toBe("Player 1");
    expect(game.getPlayer("computer").name).toBe("Player 2");
  });

  test("hands the device over before the second fleet is placed", () => {
    const game = localGame();

    placeFleetByHand(game);

    expect(game.start()).toBe(true);
    expect(game.getPhase()).toBe("placing");
    expect(game.getPlacingSeat()).toBe("computer");
    expect(game.getHandoff()).toBe("computer");
  });

  test("refuses a shot while the device is changing hands", () => {
    const game = startLocalGame();

    expect(game.getHandoff()).toBe("player");
    expect(game.fire([0, 0])).toBeNull();

    expect(game.acknowledge()).toBe(true);
    expect(game.fire(emptyCell(game.getBoard("computer"))).outcome).toBe(
      "miss",
    );

    // The turn has passed, so the other player now has to take the device.
    expect(game.getHandoff()).toBe("computer");
    expect(game.fire(emptyCell(game.getBoard("player")))).toBeNull();
  });

  test("only acknowledges a handover that is waiting", () => {
    const game = startLocalGame();

    expect(game.acknowledge()).toBe(true);
    expect(game.acknowledge()).toBe(false);
  });

  test("never fires by itself in two-player mode", () => {
    const game = startLocalGame();

    game.acknowledge();
    game.fire(emptyCell(game.getBoard("computer")));
    game.acknowledge();

    expect(game.getTurn()).toBe("computer");
    expect(game.returnFire()).toBeNull();
  });

  test("declares a winner without asking for a handover", () => {
    const game = startLocalGame();

    game.acknowledge();
    shipCells(game.getBoard("computer")).forEach((cell) => game.fire(cell));

    expect(game.isOver()).toBe(true);
    expect(game.getWinner()).toBe("player");
    expect(game.getHandoff()).toBeNull();
  });

  test("restarts both fleets back to the first player", () => {
    const game = startLocalGame();

    game.restart();

    expect(game.getPhase()).toBe("placing");
    expect(game.getPlacingSeat()).toBe("player");
    expect(game.getHandoff()).toBeNull();
    expect(game.getBoard("computer").getShips()).toEqual([]);
  });
});

// The enemy fleet must never be readable off the board, so the only ships ever
// painted are your own. This is the rule the renderer asks about per seat.
describe("fleet visibility", () => {
  test("shows the fleet being placed and hides the other one", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.isFleetVisible("player")).toBe(true);
    expect(game.isFleetVisible("computer")).toBe(false);
  });

  test("keeps the enemy fleet hidden once the computer takes its turn", () => {
    const game = startGame();

    game.fire(emptyCell(game.getBoard("computer")));

    expect(game.getTurn()).toBe("computer");
    expect(game.isFleetVisible("computer")).toBe(false);
    expect(game.isFleetVisible("player")).toBe(true);
  });

  test("reveals both fleets once the game is over", () => {
    const game = startGame();

    shipCells(game.getBoard("computer")).forEach((cell) => game.fire(cell));

    expect(game.isOver()).toBe(true);
    expect(game.isFleetVisible("player")).toBe(true);
    expect(game.isFleetVisible("computer")).toBe(true);
  });

  test("in pass & play follows whoever is holding the device", () => {
    const game = createGame({ random: seededRandom(5), mode: "local" });

    placeFleetByHand(game); // Player 1 places
    expect(game.isFleetVisible("player")).toBe(true);
    expect(game.isFleetVisible("computer")).toBe(false);

    game.start(); // the device changes hands
    expect(game.isFleetVisible("player")).toBe(false);
    expect(game.isFleetVisible("computer")).toBe(false);

    game.acknowledge(); // Player 2 takes it

    expect(game.isFleetVisible("computer")).toBe(true);
    expect(game.isFleetVisible("player")).toBe(false);

    placeFleetByHand(game); // Player 2 places
    game.start(); // Player 1 to move
    game.acknowledge();

    expect(game.isFleetVisible("player")).toBe(true);
    expect(game.isFleetVisible("computer")).toBe(false);
  });

  test("never shows the other fleet during a mid-game handover", () => {
    const game = createGame({ random: seededRandom(5), mode: "local" });

    placeFleetByHand(game);
    game.start();
    game.acknowledge();
    placeFleetByHand(game);
    game.start();
    game.acknowledge(); // Player 1 to move

    game.fire(emptyCell(game.getBoard("computer")));

    // Player 1 still holds the device for a beat before the screen appears, so
    // neither fleet may be painted in that window.
    expect(game.getTurn()).toBe("computer");
    expect(game.getHandoff()).toBe("computer");
    expect(game.isFleetVisible("computer")).toBe(false);
    expect(game.isFleetVisible("player")).toBe(false);

    game.acknowledge(); // Player 2 takes it

    expect(game.isFleetVisible("computer")).toBe(true);
  });
});

// Which board accepts a click, held in the game rather than the renderer because
// a click is read as fire() with the turn's seat.
describe("aiming", () => {
  test("points at the enemy board on your move", () => {
    const game = startGame();

    expect(game.aimingSeat()).toBe("computer");
  });

  test("points at nothing while the computer is taking its turn", () => {
    const game = startGame();

    game.fire(emptyCell(game.getBoard("computer")));

    expect(game.getTurn()).toBe("computer");
    expect(game.aimingSeat()).toBeNull();
  });

  test("points at nothing before the fleets are placed or once it is over", () => {
    const game = createGame({ random: seededRandom(1) });

    expect(game.aimingSeat()).toBeNull();

    const done = startGame();

    shipCells(done.getBoard("computer")).forEach((cell) => done.fire(cell));

    expect(done.isOver()).toBe(true);
    expect(done.aimingSeat()).toBeNull();
  });

  test("in pass & play points at whichever fleet is under fire", () => {
    const game = createGame({ random: seededRandom(5), mode: "local" });

    placeFleetByHand(game);
    game.start(); // Player 2 is handed the device
    game.acknowledge();
    placeFleetByHand(game); // Player 2 places
    game.start(); // Player 1 to move

    expect(game.aimingSeat()).toBeNull(); // nothing until the handover clears

    game.acknowledge();
    expect(game.aimingSeat()).toBe("computer"); // Player 1 aims at Player 2

    game.fire(emptyCell(game.getBoard("computer"))); // a miss hands over
    expect(game.aimingSeat()).toBeNull();

    game.acknowledge();
    expect(game.aimingSeat()).toBe("player"); // Player 2 aims at Player 1
  });
});
