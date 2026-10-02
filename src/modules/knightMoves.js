const BOARD_SIZE = 8;

const KNIGHT_MOVES = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

const assertSquare = (square, label) => {
  if (!Array.isArray(square) || square.length !== 2) {
    throw new TypeError(
      `${label} must be a pair of coordinates, got ${square}.`,
    );
  }

  square.forEach((coordinate) => {
    if (!Number.isInteger(coordinate)) {
      throw new TypeError(`${label} must hold two integers, got ${square}.`);
    }

    if (coordinate < 0 || coordinate >= BOARD_SIZE) {
      throw new TypeError(
        `${label} must stay on the ${BOARD_SIZE}x${BOARD_SIZE} board, got ${square}.`,
      );
    }
  });
};

const isOnBoard = ([x, y]) =>
  x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

const squareKey = ([x, y]) => `${x},${y}`;

const neighboursOf = ([x, y]) =>
  KNIGHT_MOVES.map(([dx, dy]) => [x + dx, y + dy]).filter(isOnBoard);

const shortestPath = (start, end) => {
  const root = [start[0], start[1]];
  const target = squareKey(end);
  const parents = new Map([[squareKey(root), null]]);
  const queue = [root];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];

    if (squareKey(current) === target) {
      const path = [];

      for (
        let step = current;
        step !== null;
        step = parents.get(squareKey(step))
      ) {
        path.unshift(step);
      }

      return path;
    }

    neighboursOf(current).forEach((next) => {
      if (parents.has(squareKey(next))) return;

      parents.set(squareKey(next), current);
      queue.push(next);
    });
  }

  return [root];
};

export const formatKnightMoves = (path) => {
  const moves = path.length - 1;
  const squares = path.map((square) => `[${square.join(",")}]`).join("\n");

  return `You made it in ${moves} moves! Here's your path:\n${squares}`;
};

const knightMoves = (start, end) => {
  assertSquare(start, "The starting square");
  assertSquare(end, "The ending square");

  const path = shortestPath(start, end);

  console.log(formatKnightMoves(path));

  return path;
};

export default knightMoves;
