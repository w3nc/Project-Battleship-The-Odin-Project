import knightMoves, { formatKnightMoves } from "./knightMoves.js";

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

const SQUARES = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => [
  index % BOARD_SIZE,
  Math.floor(index / BOARD_SIZE),
]);

const silent = (callback) => {
  const spy = jest.spyOn(console, "log").mockImplementation(() => {});

  try {
    return callback(spy);
  } finally {
    spy.mockRestore();
  }
};

const isKnightMove = ([x, y], [nextX, nextY]) =>
  KNIGHT_MOVES.some(([dx, dy]) => nextX - x === dx && nextY - y === dy);

const keyOf = ([x, y]) => `${x},${y}`;

const referenceDistance = ([startX, startY], [endX, endY]) => {
  const seen = new Set([keyOf([startX, startY])]);
  const queue = [[startX, startY, 0]];

  for (let index = 0; index < queue.length; index += 1) {
    const [x, y, steps] = queue[index];

    if (x === endX && y === endY) return steps;

    KNIGHT_MOVES.forEach(([dx, dy]) => {
      const next = [x + dx, y + dy];
      const [nextX, nextY] = next;

      const offBoard =
        nextX < 0 || nextX >= BOARD_SIZE || nextY < 0 || nextY >= BOARD_SIZE;

      if (offBoard || seen.has(keyOf(next))) return;

      seen.add(keyOf(next));
      queue.push([nextX, nextY, steps + 1]);
    });
  }

  return Infinity;
};

describe("knightMoves", () => {
  test("returns the lesson's one move hop", () => {
    const path = silent(() => knightMoves([0, 0], [1, 2]));

    expect(path).toEqual([
      [0, 0],
      [1, 2],
    ]);
  });

  test("returns one of the lesson's two shortest routes", () => {
    const path = silent(() => knightMoves([0, 0], [3, 3]));

    expect(path).toHaveLength(3);
    expect([
      [
        [0, 0],
        [2, 1],
        [3, 3],
      ],
      [
        [0, 0],
        [1, 2],
        [3, 3],
      ],
    ]).toContainEqual(path);
  });

  test("walks the same route backwards, from the other end", () => {
    const path = silent(() => knightMoves([3, 3], [0, 0]));

    expect(path).toHaveLength(3);
    expect(path[0]).toEqual([3, 3]);
    expect(path.at(-1)).toEqual([0, 0]);
  });

  test("takes six moves across the board, as the lesson shows", () => {
    const path = silent(() => knightMoves([0, 0], [7, 7]));

    expect(path).toHaveLength(7);
    expect(path[0]).toEqual([0, 0]);
    expect(path.at(-1)).toEqual([7, 7]);
  });

  test("makes the lesson's three move call", () => {
    const path = silent(() => knightMoves([3, 3], [4, 3]));

    expect(path).toHaveLength(4);
    expect(path[0]).toEqual([3, 3]);
    expect(path.at(-1)).toEqual([4, 3]);
  });

  test("prints the moves and the squares it stops on", () => {
    silent((log) => {
      const path = knightMoves([3, 3], [4, 3]);
      const squares = path.map((square) => `[${square.join(",")}]`).join("\n");

      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(
        `You made it in 3 moves! Here's your path:\n${squares}`,
      );
    });
  });

  test("prints the same text that formatKnightMoves builds", () => {
    silent((log) => {
      const path = knightMoves([0, 0], [1, 2]);
      const [message] = log.mock.calls[0];

      expect(log).toHaveBeenCalledWith(formatKnightMoves(path));
      expect(message).toContain("You made it in 1 moves!");
      expect(message).toContain("[0,0]");
      expect(message).toContain("[1,2]");
    });
  });

  test("stays put when the knight is already on the target square", () => {
    silent((log) => {
      const path = knightMoves([4, 4], [4, 4]);

      expect(path).toEqual([[4, 4]]);
      expect(log.mock.calls[0][0]).toContain("You made it in 0 moves!");
    });
  });

  test("only ever takes legal knight moves, and never repeats a square", () => {
    silent(() => {
      SQUARES.forEach((start) => {
        SQUARES.forEach((end) => {
          const path = knightMoves(start, end);

          expect(path[0]).toEqual(start);
          expect(path.at(-1)).toEqual(end);
          expect(new Set(path.map(keyOf)).size).toBe(path.length);

          path.slice(1).forEach((square, index) => {
            expect(isKnightMove(path[index], square)).toBe(true);
          });
        });
      });
    });
  });

  test("is never longer than an independent breadth first search", () => {
    silent(() => {
      SQUARES.forEach((start) => {
        SQUARES.forEach((end) => {
          const moves = knightMoves(start, end).length - 1;

          expect(moves).toBe(referenceDistance(start, end));
          expect(moves).toBeLessThanOrEqual(6);
        });
      });
    });
  });

  test("keeps every square reachable from every other square", () => {
    silent(() => {
      SQUARES.forEach((start) => {
        SQUARES.forEach((end) => {
          expect(knightMoves(start, end).length).toBeGreaterThan(0);
        });
      });
    });
  });

  test("leaves the squares it is given untouched", () => {
    const start = [0, 0];
    const end = [7, 7];

    silent(() => knightMoves(start, end));

    expect(start).toEqual([0, 0]);
    expect(end).toEqual([7, 7]);
  });

  test("returns the same path when it is called with the same squares", () => {
    const first = silent(() => knightMoves([0, 0], [7, 7]));
    const second = silent(() => knightMoves([0, 0], [7, 7]));

    expect(second).toEqual(first);
  });

  test("refuses a starting square that is not a pair of coordinates", () => {
    expect(() => knightMoves([0], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves([0, 1, 2], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves("0,0", [1, 2])).toThrow(TypeError);
    expect(() => knightMoves(undefined, [1, 2])).toThrow(TypeError);
  });

  test("refuses coordinates that are not whole numbers", () => {
    expect(() => knightMoves([0.5, 0], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves([0, NaN], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves(["0", 0], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves([0, Infinity], [1, 2])).toThrow(TypeError);
  });

  test("refuses to move off the board", () => {
    expect(() => knightMoves([-1, 0], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves([0, 8], [1, 2])).toThrow(TypeError);
    expect(() => knightMoves([0, 0], [8, 0])).toThrow(TypeError);
    expect(() => knightMoves([0, 0], [0, -1])).toThrow(TypeError);
  });

  test("says what was wrong with an off board square", () => {
    expect(() => knightMoves([0, 0], [0, 8])).toThrow(/8x8 board/);
  });

  test("does not print anything when the squares are invalid", () => {
    silent((log) => {
      expect(() => knightMoves([0, 0], [8, 8])).toThrow(TypeError);
      expect(log).not.toHaveBeenCalled();
    });
  });
});

describe("formatKnightMoves", () => {
  test("builds the lesson's transcript", () => {
    const transcript = formatKnightMoves([
      [3, 3],
      [4, 5],
      [2, 4],
      [4, 3],
    ]);

    expect(transcript).toBe(
      "You made it in 3 moves! Here's your path:\n[3,3]\n[4,5]\n[2,4]\n[4,3]",
    );
  });

  test("counts the moves as the squares travelled through minus one", () => {
    expect(formatKnightMoves([[4, 4]])).toBe(
      "You made it in 0 moves! Here's your path:\n[4,4]",
    );
  });

  test("prints each square on its own line", () => {
    const lines = formatKnightMoves([
      [0, 0],
      [1, 2],
      [3, 3],
    ]).split("\n");

    expect(lines).toEqual([
      "You made it in 2 moves! Here's your path:",
      "[0,0]",
      "[1,2]",
      "[3,3]",
    ]);
  });
});
