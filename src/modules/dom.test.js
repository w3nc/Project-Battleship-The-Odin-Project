import createGameboard from "./gameboard.js";
import createShip from "./ship.js";
import {
  cellName,
  clearPreview,
  flashBoard,
  hideGate,
  hideOverlay,
  paintBoard,
  paintPreview,
  renderFleet,
  renderGrid,
  renderSeatTitles,
  renderStatus,
  setBoardInteractive,
  setGameInert,
  showGate,
  showOverlay,
} from "./dom.js";

const SEATS = ["player", "computer"];

const board = (label) => `
  <article class="board">
    <h2 data-board-title="${label}">${label}</h2>
    <div class="grid" data-grid="${label}"></div>
    <ul class="fleet" data-fleet="${label}"></ul>
  </article>`;

const LAYOUT = `
  <main class="app">
    <p class="status" data-status role="status"></p>
    <div class="controls" data-controls></div>
    <section class="boards">${SEATS.map(board).join("")}</section>
    <div class="overlay overlay--gate" data-gate hidden>
      <h2 data-gate-title></h2>
      <p data-gate-message></p>
      <button data-gate-button data-action="ready">Ready</button>
    </div>
    <div class="overlay" data-overlay hidden>
      <h2 data-overlay-title></h2>
      <p data-overlay-message></p>
    </div>
  </main>`;

const cellAt = (label, [x, y]) =>
  document.querySelector(
    `[data-grid="${label}"] [data-x="${x}"][data-y="${y}"]`,
  );

const boardWith = (name, length, start, orientation) => {
  const fresh = createGameboard();

  fresh.placeShip(createShip(name, length), start, orientation);

  return fresh;
};

beforeEach(() => {
  document.body.innerHTML = LAYOUT;
});

describe("cellName", () => {
  test("gives a column letter and a one-based row", () => {
    expect(cellName([0, 0])).toBe("A1");
    expect(cellName([9, 9])).toBe("J10");
  });
});

describe("renderGrid", () => {
  test("fills the board with a full set of labelled buttons", () => {
    const grid = renderGrid("player");

    expect(grid.querySelectorAll(".cell")).toHaveLength(100);
    expect(grid.querySelectorAll("button.cell")).toHaveLength(100);
    expect(cellAt("player", [0, 0]).getAttribute("aria-label")).toBe("A1");
  });

  test("reports a board that is not on the page rather than throwing", () => {
    document.body.innerHTML = "<main class='app'></main>";

    expect(renderGrid("player")).toBeNull();
  });
});

describe("paintBoard", () => {
  test("marks a hit, a miss and an untouched square", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("player");
    fresh.receiveAttack([0, 0]);
    fresh.receiveAttack([5, 5]);
    paintBoard("player", fresh, { revealShips: true });

    expect(cellAt("player", [0, 0]).classList.contains("cell--hit")).toBe(true);
    expect(cellAt("player", [5, 5]).classList.contains("cell--miss")).toBe(
      true,
    );
    expect(cellAt("player", [9, 9]).className).toBe("cell");
  });

  test("marks a wreck as sunk as well as hit", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("player");
    fresh.receiveAttack([0, 0]);
    fresh.receiveAttack([1, 0]);
    paintBoard("player", fresh, { revealShips: true });

    const cell = cellAt("player", [0, 0]);

    expect(cell.classList.contains("cell--hit")).toBe(true);
    expect(cell.classList.contains("cell--sunk")).toBe(true);
  });

  test("draws your own ships only when they are revealed", () => {
    const fresh = boardWith("Carrier", 5, [2, 3]);

    renderGrid("player");
    renderGrid("computer");

    paintBoard("player", fresh, { revealShips: true });
    paintBoard("computer", fresh, { revealShips: false });

    expect(cellAt("player", [2, 3]).classList.contains("cell--ship")).toBe(
      true,
    );
    expect(cellAt("computer", [2, 3]).classList.contains("cell--ship")).toBe(
      false,
    );
  });
});

describe("the spoken state of a square", () => {
  test("names open water and your own ships", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("player");
    paintBoard("player", fresh, { revealShips: true });

    expect(cellAt("player", [0, 0]).getAttribute("aria-label")).toBe(
      "A1, your ship",
    );
    expect(cellAt("player", [5, 5]).getAttribute("aria-label")).toBe(
      "F6, open water",
    );
  });

  test("updates as hits and misses land", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("player");
    fresh.receiveAttack([0, 0]);
    fresh.receiveAttack([5, 5]);
    paintBoard("player", fresh, { revealShips: true });

    expect(cellAt("player", [0, 0]).getAttribute("aria-label")).toBe("A1, hit");
    expect(cellAt("player", [5, 5]).getAttribute("aria-label")).toBe(
      "F6, miss",
    );
  });

  test("calls a wreck a wreck, not just a hit", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("player");
    fresh.receiveAttack([0, 0]);
    fresh.receiveAttack([1, 0]);
    paintBoard("player", fresh, { revealShips: true });

    expect(cellAt("player", [0, 0]).getAttribute("aria-label")).toBe(
      "A1, sunk",
    );
  });

  test("keeps a hidden enemy ship reading as water", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("computer");
    paintBoard("computer", fresh, { revealShips: false });

    expect(cellAt("computer", [0, 0]).getAttribute("aria-label")).toBe(
      "A1, open water",
    );
  });
});

describe("renderFleet", () => {
  test("lists the fleet by name and length", () => {
    const fresh = boardWith("Cruiser", 3, [0, 0]);

    renderFleet("player", fresh.getShips());

    const items = document.querySelectorAll(
      '[data-fleet="player"] .fleet__item',
    );

    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe("Cruiser · 3");
  });

  test("strikes a ship off the readout once it goes down", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    fresh.receiveAttack([0, 0]);
    fresh.receiveAttack([1, 0]);
    renderFleet("player", fresh.getShips());

    const [item] = document.querySelectorAll(
      '[data-fleet="player"] .fleet__item',
    );

    expect(item.classList.contains("fleet__item--sunk")).toBe(true);
  });
});

describe("renderStatus", () => {
  test("does not rewrite an unchanged live region", () => {
    const status = document.querySelector("[data-status]");

    renderStatus("Your turn. Fire at enemy waters.");

    const written = status.firstChild;

    renderStatus("Your turn. Fire at enemy waters.");

    expect(status.firstChild).toBe(written);
  });

  test("writes a changed status through", () => {
    renderStatus("Your turn.");
    renderStatus("The computer is aiming…");

    expect(document.querySelector("[data-status]").textContent).toBe(
      "The computer is aiming…",
    );
  });
});

describe("setBoardInteractive", () => {
  test("opens the board in play and keeps spent squares shut", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("computer");
    fresh.receiveAttack([0, 0]);
    setBoardInteractive("computer", fresh, true);

    expect(cellAt("computer", [5, 5]).disabled).toBe(false);
    expect(cellAt("computer", [0, 0]).disabled).toBe(true);
  });

  test("shuts the whole board when it is not the one in play", () => {
    const fresh = boardWith("Destroyer", 2, [0, 0]);

    renderGrid("computer");
    setBoardInteractive("computer", fresh, false);

    expect(cellAt("computer", [5, 5]).disabled).toBe(true);
  });
});

describe("placement preview", () => {
  test("marks a legal placement, then clears it", () => {
    renderGrid("player");

    paintPreview("player", [[0, 0]], true);
    expect(cellAt("player", [0, 0]).classList.contains("cell--preview")).toBe(
      true,
    );

    clearPreview("player");
    expect(cellAt("player", [0, 0]).classList.contains("cell--preview")).toBe(
      false,
    );
  });

  test("marks an illegal placement as invalid instead", () => {
    renderGrid("player");

    paintPreview("player", [[0, 0]], false);

    const cell = cellAt("player", [0, 0]);

    expect(cell.classList.contains("cell--invalid")).toBe(true);
    expect(cell.classList.contains("cell--preview")).toBe(false);
  });
});

describe("renderSeatTitles", () => {
  test("renames both board headings", () => {
    renderSeatTitles({
      player: "Player 1's fleet",
      computer: "Player 2's fleet",
    });

    expect(
      document.querySelector('[data-board-title="player"]').textContent,
    ).toBe("Player 1's fleet");
    expect(
      document.querySelector('[data-board-title="computer"]').textContent,
    ).toBe("Player 2's fleet");
  });
});

describe("the pass-the-device gate", () => {
  test("takes the boards and the controls out of reach behind it", () => {
    setGameInert(true);

    expect(document.querySelector(".boards").hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".controls").hasAttribute("inert")).toBe(
      true,
    );
  });

  test("hands them back when the device has changed hands", () => {
    setGameInert(true);
    setGameInert(false);

    expect(document.querySelector(".boards").hasAttribute("inert")).toBe(false);
    expect(document.querySelector(".controls").hasAttribute("inert")).toBe(
      false,
    );
  });

  test("shows the gate by unhiding its own dialog", () => {
    showGate({ title: "Player 2, take the device", message: "Press Ready." });

    const gate = document.querySelector("[data-gate]");

    expect(gate.hidden).toBe(false);
    expect(gate.querySelector("[data-gate-title]").textContent).toBe(
      "Player 2, take the device",
    );
    expect(gate.querySelector("[data-gate-message]").textContent).toBe(
      "Press Ready.",
    );
    expect(gate.querySelector("[data-gate-button]").textContent).toBe("Ready");
  });

  test("puts focus on Ready so the other fleet cannot be read past it", () => {
    showGate({ title: "x", message: "y" });

    expect(document.activeElement).toBe(
      document.querySelector("[data-gate-button]"),
    );
  });

  test("hides the gate again", () => {
    showGate({ title: "x", message: "y" });
    hideGate();

    expect(document.querySelector("[data-gate]").hidden).toBe(true);
  });

  test("drives the dialog and leaves the app shell alone", () => {
    // The bug this guards: the shell once carried a data-gate of its own, so
    // [data-gate] matched <main> and the dialog stayed hidden with no way out.
    const shell = document.querySelector(".app");

    showGate({ title: "x", message: "y" });

    expect(document.querySelector(".overlay--gate").hidden).toBe(false);
    expect(shell.hidden).toBe(false);
    expect(shell.hasAttribute("data-gate")).toBe(false);
  });
});

describe("the verdict overlay", () => {
  test("shows the outcome and how it should read", () => {
    showOverlay({ title: "Victory", message: "You sank the enemy fleet." });

    const overlay = document.querySelector("[data-overlay]");

    expect(overlay.hidden).toBe(false);
    expect(overlay.dataset.verdict).toBe("win");
    expect(overlay.querySelector("[data-overlay-title]").textContent).toBe(
      "Victory",
    );
  });

  test("marks a loss so the panel drops the accent", () => {
    showOverlay({ title: "Defeat", message: "x", verdict: "lose" });

    expect(document.querySelector("[data-overlay]").dataset.verdict).toBe(
      "lose",
    );
  });

  test("hides again for a new game", () => {
    showOverlay({ title: "Victory", message: "x" });
    hideOverlay();

    expect(document.querySelector("[data-overlay]").hidden).toBe(true);
  });
});

describe("flashBoard", () => {
  test("marks the board so the stylesheet can run the flash", () => {
    renderGrid("player");
    flashBoard("player");

    expect(document.querySelector('[data-grid="player"]').dataset.shot).toBe(
      "landed",
    );
  });

  test("clears the mark once the flash is over", () => {
    jest.useFakeTimers();
    renderGrid("player");
    flashBoard("player", 400);

    jest.advanceTimersByTime(400);

    expect(
      document.querySelector('[data-grid="player"]').dataset.shot,
    ).toBeUndefined();
    jest.useRealTimers();
  });

  test("restarts rather than truncates when a second shot lands mid-flash", () => {
    jest.useFakeTimers();
    renderGrid("player");

    flashBoard("player", 400);
    jest.advanceTimersByTime(200);
    flashBoard("player", 400);

    jest.advanceTimersByTime(300);
    expect(document.querySelector('[data-grid="player"]').dataset.shot).toBe(
      "landed",
    );

    jest.advanceTimersByTime(100);
    expect(
      document.querySelector('[data-grid="player"]').dataset.shot,
    ).toBeUndefined();
    jest.useRealTimers();
  });

  test("falls back to the token's own value with no stylesheet to read", () => {
    jest.useFakeTimers();
    renderGrid("player");
    flashBoard("player");

    jest.advanceTimersByTime(399);
    expect(document.querySelector('[data-grid="player"]').dataset.shot).toBe(
      "landed",
    );

    jest.advanceTimersByTime(1);
    expect(
      document.querySelector('[data-grid="player"]').dataset.shot,
    ).toBeUndefined();
    jest.useRealTimers();
  });

  test("reports a board that is not on the page", () => {
    document.body.innerHTML = "<main class='app'></main>";

    expect(flashBoard("player")).toBeNull();
  });
});
