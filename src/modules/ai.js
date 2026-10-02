import { BOARD_SIZE } from "./fleet.js";

const isOnBoard = ([x, y]) =>
  x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

const neighbours = ([x, y]) => [
  [x + 1, y],
  [x - 1, y],
  [x, y + 1],
  [x, y - 1],
];

export const legalTargets = (board) => {
  const targets = [];

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!board.hasBeenAttacked([x, y])) targets.push([x, y]);
    }
  }

  return targets;
};

const openCells = (board, cells) =>
  cells.filter((cell) => isOnBoard(cell) && !board.hasBeenAttacked(cell));

// Two hits in a row fix the axis of the ship, so the four squares beside them
// collapse into two worth probing: the ones just past either end of the run.
const lineEnds = (chain, board) => {
  const vertical = chain[0][0] === chain[1][0];
  const along = (cell) => (vertical ? cell[1] : cell[0]);
  const sorted = [...chain].sort((a, b) => along(a) - along(b));
  const head = sorted[0];
  const tail = sorted[sorted.length - 1];

  return openCells(board, [
    vertical ? [head[0], head[1] - 1] : [head[0] - 1, head[1]],
    vertical ? [tail[0], tail[1] + 1] : [tail[0] + 1, tail[1]],
  ]);
};

// A hit sends it hunting the four squares beside it, two hits in a row turn that
// into a sweep along the line, and a sunk ship wipes the lead and it searches.
const createAi = (random = Math.random) => {
  let aims = [];
  let chain = [];

  const forget = () => {
    aims = [];
    chain = [];
  };

  const nextTarget = (board) => {
    while (aims.length) {
      const candidate = aims.shift();

      if (isOnBoard(candidate) && !board.hasBeenAttacked(candidate)) {
        return candidate;
      }
    }

    const targets = legalTargets(board);

    if (targets.length === 0) return null;

    return targets[Math.floor(random() * targets.length)];
  };

  const digest = (coordinate, result, board) => {
    if (result.outcome !== "hit") return;

    // Nothing left to hunt on a sunk ship, and its neighbours cannot be told
    // apart from another ship sitting alongside, so drop the whole lead.
    if (result.sunk) {
      forget();
      return;
    }

    chain.push(coordinate);

    if (chain.length < 2) {
      aims = openCells(board, neighbours(coordinate));
      return;
    }

    const ends = lineEnds(chain, board);

    // Either end is as good a guess as the other, so pick one at random: a
    // predictable AI is a free win for the player.
    aims = ends.length > 1 && random() < 0.5 ? [...ends].reverse() : ends;
  };

  return { nextTarget, digest };
};

export default createAi;
