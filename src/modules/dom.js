import { BOARD_SIZE } from "./fleet.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// Side-on profiles drawn in one 34x12 box, each spanning its own length so the
// silhouette itself carries the size of the ship. No raster assets to load.
const SILHOUETTES = {
  Carrier: "M1 10h32l-3-5H12L7 7 1 10z M22 5V1h4v4z",
  Battleship: "M2 10h30l-2-4H4z M9 6V2h4v4z M21 6V2h4v4z",
  Cruiser: "M6 10h24l-3-4H9z M15 6V2h6v4z",
  Submarine:
    "M5 9h24c2 0 3-1 3-2s-1-2-3-2H5c-2 0-3 1-3 2s1 2 3 2z M15 5V1h4v4z",
  Destroyer: "M10 10h14l-3-4H13z M16 6V3h2v3z",
};

const silhouette = (name) => {
  const svg = document.createElementNS(SVG_NS, "svg");
  const hull = document.createElementNS(SVG_NS, "path");

  svg.setAttribute("viewBox", "0 0 34 12");
  svg.setAttribute("class", "fleet__ship");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  hull.setAttribute("d", SILHOUETTES[name] ?? SILHOUETTES.Destroyer);
  svg.append(hull);

  return svg;
};

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
  delete grid.dataset.aim;

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
        ship: (revealShips && Boolean(ship)) || hit,
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
      const text = document.createElement("span");

      item.className = sunk ? "fleet__item fleet__item--sunk" : "fleet__item";
      text.className = "fleet__label";
      text.textContent = `${name} · ${length}`;
      item.append(silhouette(name), text);

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

// The aiming band is the column the shot would fall down: a colour rule the
// stylesheet paints, driven by one custom property on the board.
export const setAimColumn = (label, column = null) => {
  const grid = gridOf(label);

  if (!grid) return null;

  if (column === null) delete grid.dataset.aim;
  else {
    grid.dataset.aim = "on";
    grid.style.setProperty("--aim-col", String(column));
  }

  return grid;
};

export const clearAimColumn = (label) => setAimColumn(label, null);

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
