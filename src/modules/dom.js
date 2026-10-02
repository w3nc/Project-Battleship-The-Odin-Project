import { BOARD_SIZE } from "./fleet.js";

const ROW_LABELS = Array.from({ length: BOARD_SIZE }, (_, index) =>
  String.fromCharCode(65 + index),
);

export const cellName = ([x, y]) => `${ROW_LABELS[y]}${x + 1}`;

const gridOf = (label) => document.querySelector(`[data-grid="${label}"]`);

const fleetOf = (label) => document.querySelector(`[data-fleet="${label}"]`);

const cellAt = (label, [x, y]) =>
  gridOf(label).querySelector(`[data-x="${x}"][data-y="${y}"]`);

const buildCell = ([x, y]) => {
  const cell = document.createElement("button");

  cell.type = "button";
  cell.className = "cell";
  cell.dataset.x = String(x);
  cell.dataset.y = String(y);
  cell.setAttribute("aria-label", cellName([x, y]));

  return cell;
};

export const renderGrid = (label) => {
  const grid = gridOf(label);

  if (!grid) return null;

  const cells = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) cells.push(buildCell([x, y]));
  }

  grid.replaceChildren(...cells);

  return grid;
};

// What the square is, said out loud: the board is colour-only, so without this a
// hit, a wreck and open water are the same word to a screen reader.
const stateOf = ({ ship, hit, miss, sunk }) => {
  if (sunk) return "sunk";
  if (hit) return "hit";
  if (miss) return "miss";
  if (ship) return "your ship";

  return "open water";
};

const paintCell = (cell, state) => {
  const { ship, hit, miss, sunk } = state;
  const label = `${cellName([
    Number(cell.dataset.x),
    Number(cell.dataset.y),
  ])}, ${stateOf(state)}`;

  cell.classList.toggle("cell--ship", ship);
  cell.classList.toggle("cell--hit", hit);
  cell.classList.toggle("cell--miss", miss);
  cell.classList.toggle("cell--sunk", sunk);

  // A live region would read all hundred of these on every repaint, so the
  // label is only written when it has actually changed.
  if (cell.getAttribute("aria-label") !== label) {
    cell.setAttribute("aria-label", label);
  }
};

export const paintBoard = (label, board, { revealShips = false } = {}) => {
  const misses = new Set(
    board.getMisses().map((coordinates) => coordinates.join(",")),
  );

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const coordinate = [x, y];
      const ship = board.shipAt(coordinate);
      const hit = Boolean(ship) && board.hasBeenAttacked(coordinate);

      paintCell(cellAt(label, coordinate), {
        ship: revealShips && Boolean(ship),
        hit,
        miss: misses.has(`${x},${y}`),
        sunk: hit && ship.isSunk(),
      });
    }
  }
};

// One pending flash per board, so a shot landing inside the previous flash
// restarts it instead of leaving the board stuck lit.
const flashTimers = {};

// Read from the token the keyframes use, so the mark is not stripped before the
// animation finishes (a snap) or long after it (a wasted repaint).
const flashDuration = () => {
  if (typeof getComputedStyle !== "function") return 400;

  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--dur-slow",
  );

  return parseFloat(value) || 400;
};

// The mark is dropped and the layout re-read first: without that flush the
// browser keeps the finished animation and a second shot would not re-run it.
export const flashBoard = (label, duration = flashDuration()) => {
  const grid = gridOf(label);

  if (!grid) return null;

  window.clearTimeout(flashTimers[label]);
  delete grid.dataset.shot;
  grid.getBoundingClientRect();

  grid.dataset.shot = "landed";
  flashTimers[label] = window.setTimeout(() => {
    delete grid.dataset.shot;
    delete flashTimers[label];
  }, duration);

  return grid;
};

export const renderFleet = (label, ships) => {
  const panel = fleetOf(label);

  if (!panel) return null;

  panel.replaceChildren(
    ...ships.map(({ name, length, sunk }) => {
      const item = document.createElement("li");

      item.className = sunk ? "fleet__item fleet__item--sunk" : "fleet__item";
      item.textContent = `${name} · ${length}`;

      return item;
    }),
  );

  return panel;
};

export const renderStatus = (message) => {
  const status = document.querySelector("[data-status]");

  // Writing the same string back into a live region re-announces it, so a plain
  // re-render (pressing Rotate, say) would read the status out again for nothing.
  if (status && status.textContent !== message) status.textContent = message;

  return status;
};

export const setBoardInteractive = (label, board, enabled) => {
  gridOf(label)
    .querySelectorAll(".cell")
    .forEach((cell) => {
      const coordinate = [Number(cell.dataset.x), Number(cell.dataset.y)];

      cell.disabled = !enabled || board.hasBeenAttacked(coordinate);
    });
};

export const clearPreview = (label) => {
  gridOf(label)
    .querySelectorAll(".cell--preview, .cell--invalid")
    .forEach((cell) => cell.classList.remove("cell--preview", "cell--invalid"));
};

export const paintPreview = (label, coordinates, valid) => {
  clearPreview(label);

  coordinates.forEach((coordinate) => {
    const cell = cellAt(label, coordinate);

    if (cell) cell.classList.add(valid ? "cell--preview" : "cell--invalid");
  });
};

export const renderSeatTitles = (titles) => {
  Object.entries(titles).forEach(([label, text]) => {
    const node = document.querySelector(`[data-board-title="${label}"]`);

    if (node) node.textContent = text;
  });
};

// The gate dialog is found by its own [data-gate] flag, so no other element may
// carry that attribute - the shell wearing it once hid the dialog entirely.
export const setGameInert = (inert) => {
  const surface = document.querySelectorAll(".boards, .controls");

  surface.forEach((node) => node.toggleAttribute("inert", Boolean(inert)));

  return surface;
};

// The pass-the-device screen. It covers the boards and takes focus, so the
// player picking the device up cannot read the other fleet from behind it.
export const showGate = ({ title, message, label = "Ready" }) => {
  const gate = document.querySelector("[data-gate]");

  if (!gate) return null;

  gate.querySelector("[data-gate-title]").textContent = title;
  gate.querySelector("[data-gate-message]").textContent = message;

  const button = gate.querySelector("[data-gate-button]");

  button.textContent = label;
  gate.hidden = false;
  button.focus({ preventScroll: true });

  return gate;
};

export const hideGate = () => {
  const gate = document.querySelector("[data-gate]");

  if (gate) gate.hidden = true;
};

export const showOverlay = ({ title, message, verdict = "win" }) => {
  const overlay = document.querySelector("[data-overlay]");

  if (!overlay) return null;

  overlay.dataset.verdict = verdict;
  overlay.querySelector("[data-overlay-title]").textContent = title;
  overlay.querySelector("[data-overlay-message]").textContent = message;
  overlay.hidden = false;

  return overlay;
};

export const hideOverlay = () => {
  const overlay = document.querySelector("[data-overlay]");

  if (overlay) overlay.hidden = true;
};
