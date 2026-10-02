import "./styles.css";
import {
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
} from "./modules/dom.js";
import createGame, { OTHER_SEAT, SEATS } from "./modules/game.js";
import {
  isMuted,
  playGate,
  playPlace,
  playShot,
  playSunk,
  playTurn,
  playVerdict,
  setMuted,
} from "./modules/sound.js";

// The computer takes a beat between shots so its hunt is readable, and the
// pass-the-device screen waits a beat so the shooter sees where the shot landed.
const COMPUTER_PAUSE = 650;
const HANDOFF_PAUSE = 900;

let mode = "computer";
let orientation = "horizontal";
let game = createGame({ mode });

// Sound bookkeeping: a cue fires on a change, never on a plain re-render.
let lastPhase = null;
let lastTurn = null;
let gateSeat = null;
let gateTimer = null;

const grids = Object.fromEntries(
  SEATS.map((label) => [
    label,
    document.querySelector(`[data-grid="${label}"]`),
  ]),
);

const app = document.querySelector(".app");
const controls = document.querySelector("[data-controls]");
const rotateButton = document.querySelector('[data-action="rotate"]');
const startButton = document.querySelector('[data-action="start"]');
const hitAgainToggle = document.querySelector('[data-toggle="hit-again"]');
const localToggle = document.querySelector('[data-toggle="local"]');
const soundToggle = document.querySelector('[data-toggle="sound"]');

const nameOf = (seat) => game.getPlayer(seat).name;

// Once play starts the question belongs to the game, not the DOM (see
// aimingSeat), because it depends on the mode and on whose move it is.
const interactiveSeat = () => {
  if (game.isOver() || game.getHandoff()) return null;

  return game.getPhase() === "placing"
    ? game.getPlacingSeat()
    : game.aimingSeat();
};

const titlesFor = () =>
  game.getMode() === "local"
    ? {
        player: `${nameOf("player")}'s fleet`,
        computer: `${nameOf("computer")}'s fleet`,
      }
    : { player: "Your fleet", computer: "Enemy waters" };

const statusFor = () => {
  if (game.isOver()) {
    const winner = game.getWinner();

    if (game.getMode() === "local") {
      return `${nameOf(winner)} sank the other fleet.`;
    }

    return winner === "player"
      ? "You sank the enemy fleet."
      : "The computer sank your fleet.";
  }

  if (game.getPhase() === "placing") {
    const ship = game.pendingShip();
    const prefix =
      game.getMode() === "local" ? `${nameOf(game.getPlacingSeat())}: ` : "";

    return ship
      ? `${prefix}Place your ${ship.name} (${ship.length} squares). Click a square or use Random fleet.`
      : `${prefix}Fleet ready. Press Start game.`;
  }

  if (game.getMode() === "local") {
    return `${nameOf(game.getTurn())}: fire at ${nameOf(OTHER_SEAT[game.getTurn()])}'s waters.`;
  }

  return game.getTurn() === "player"
    ? "Your turn. Fire at enemy waters."
    : "The computer is aiming…";
};

const renderControls = () => {
  const placingSeat = game.getPlacingSeat();

  controls.dataset.phase = game.getPhase();
  rotateButton.textContent =
    orientation === "vertical" ? "Rotate: vertical" : "Rotate: horizontal";

  // Start game stays locked until the whole fleet is on the board, so an
  // unfinished layout can never be started by accident.
  startButton.disabled = !(placingSeat && game.fleetReady(placingSeat));
};

const openGate = (seat) => {
  setGameInert(true);
  showGate({
    title: `${nameOf(seat)}, take the device`,
    message:
      game.getPhase() === "placing"
        ? "Press Ready when the device is in your hands, then place your fleet."
        : "Your fleet and your shots stay hidden until you press Ready.",
  });
  playGate();
};

const renderGate = () => {
  const handoff = game.getHandoff();

  if (!handoff) {
    if (gateTimer) {
      window.clearTimeout(gateTimer);
      gateTimer = null;
    }

    gateSeat = null;
    setGameInert(false);
    hideGate();

    return;
  }

  if (gateSeat === handoff) return;

  gateSeat = handoff;

  // Placing is private anyway, so the screen goes up straight away. A shot
  // gets a beat first, otherwise the boards blur before it is even seen.
  if (game.getPhase() === "placing") {
    openGate(handoff);

    return;
  }

  gateTimer = window.setTimeout(() => {
    gateTimer = null;
    openGate(handoff);
  }, HANDOFF_PAUSE);
};

const renderOutcome = () => {
  if (!game.isOver()) {
    hideOverlay();

    return;
  }

  const winner = game.getWinner();
  const local = game.getMode() === "local";
  const won = winner === "player";

  showOverlay({
    title: local ? `${nameOf(winner)} wins` : won ? "Victory" : "Defeat",
    message: statusFor(),
    verdict: local || won ? "win" : "lose",
  });
};

const announce = () => {
  const phase = game.getPhase();
  const over = game.isOver();
  const turn = game.getTurn();

  if (over && lastPhase !== "over") {
    // On a shared device somebody always won, so the fanfare always fits.
    playVerdict(
      game.getMode() === "local" ? true : game.getWinner() === "player",
    );
  } else if (
    !over &&
    game.getMode() !== "local" &&
    phase === "playing" &&
    turn !== lastTurn
  ) {
    playTurn(turn);
  }

  lastPhase = phase;
  lastTurn = turn;
};

const render = () => {
  const interactive = interactiveSeat();

  SEATS.forEach((seat) => {
    paintBoard(seat, game.getBoard(seat), {
      revealShips: game.isFleetVisible(seat),
    });
    renderFleet(seat, game.getBoard(seat).getShips());
    setBoardInteractive(seat, game.getBoard(seat), seat === interactive);
  });

  renderStatus(statusFor());
  renderControls();
  renderSeatTitles(titlesFor());
  renderOutcome();
  renderGate();
  announce();

  app.dataset.phase = game.getPhase();
  app.dataset.turn = game.getTurn();
  app.dataset.mode = game.getMode();
};

const clearPreviews = () => SEATS.forEach((seat) => clearPreview(seat));

const playComputer = () => {
  const shot = game.returnFire();

  if (!shot) return;

  flashBoard("player");

  if (shot.sunk) playSunk();
  else playShot(shot.outcome);

  render();

  if (!game.isOver() && game.getTurn() === "computer") {
    window.setTimeout(playComputer, COMPUTER_PAUSE);
  }
};

const fire = (coordinate) => {
  // The board being shot at, read before the shot: a miss hands the turn over,
  // so asking afterwards would name the wrong one.
  const target = interactiveSeat();
  const result = game.fire(coordinate);

  if (!result) return;

  if (target) flashBoard(target);

  if (result.sunk) playSunk();
  else playShot(result.outcome);

  render();

  if (
    !game.isOver() &&
    game.getMode() !== "local" &&
    game.getTurn() === "computer"
  ) {
    window.setTimeout(playComputer, COMPUTER_PAUSE);
  }
};

const place = (coordinate) => {
  if (!game.canPlaceNextShip(coordinate, orientation)) return;

  game.placeNextShip(coordinate, orientation);
  playPlace();
  clearPreviews();
  render();
};

const previewAt = (label, coordinate) => {
  if (game.getPhase() !== "placing" || label !== game.getPlacingSeat()) return;

  paintPreview(
    label,
    game.previewNextShip(coordinate, orientation),
    game.canPlaceNextShip(coordinate, orientation),
  );
};

const restart = () => {
  game.restart();
  clearPreviews();
  hideOverlay();
  render();
};

const startFresh = () => {
  game = createGame({ mode, hitAgain: hitAgainToggle.checked });
  orientation = "horizontal";
  lastPhase = null;
  lastTurn = null;
  clearPreviews();
  hideOverlay();
  render();
};

SEATS.forEach(renderGrid);

SEATS.forEach((label) => {
  const grid = grids[label];

  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".cell");

    if (!cell || cell.disabled) return;

    const coordinate = [Number(cell.dataset.x), Number(cell.dataset.y)];

    if (game.getPhase() === "placing") place(coordinate);
    else fire(coordinate);
  });

  grid.addEventListener("pointerover", (event) => {
    const cell = event.target.closest(".cell");

    if (cell)
      previewAt(label, [Number(cell.dataset.x), Number(cell.dataset.y)]);
  });

  grid.addEventListener("pointerleave", () => clearPreview(label));
});

const actions = {
  random: () => {
    game.randomizeFleet();
    clearPreviews();
    render();
  },
  rotate: () => {
    orientation = orientation === "horizontal" ? "vertical" : "horizontal";
    render();
  },
  reset: () => {
    game.resetFleet();
    clearPreviews();
    render();
  },
  start: () => {
    if (!game.start()) return;

    lastTurn = null;
    render();
  },
  ready: () => {
    game.acknowledge();
    render();
  },
  restart,
  "play-again": restart,
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (button) actions[button.dataset.action]?.();
});

hitAgainToggle.checked = game.isHitAgain();
hitAgainToggle.addEventListener("change", () => {
  game.setHitAgain(hitAgainToggle.checked);
});

localToggle.addEventListener("change", () => {
  mode = localToggle.checked ? "local" : "computer";
  startFresh();
});

soundToggle.checked = !isMuted();
soundToggle.addEventListener("change", () => {
  setMuted(!soundToggle.checked);
});

render();
