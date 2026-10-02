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

const flashTimers = {};

const flashDuration = () => {
  if (typeof getComputedStyle !== "function") return 400;

  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--dur-slow",
  );

  return parseFloat(value) || 400;
};

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

export const setGameInert = (inert) => {
  const surface = document.querySelectorAll(".boards, .controls");

  surface.forEach((node) => node.toggleAttribute("inert", Boolean(inert)));

  return surface;
};

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
