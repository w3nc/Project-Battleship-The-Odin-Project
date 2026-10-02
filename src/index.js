import { fileURLToPath } from "node:url";
import knightMoves from "./modules/knightMoves.js";

const EXAMPLES = [
  [
    [0, 0],
    [1, 2],
  ],
  [
    [0, 0],
    [3, 3],
  ],
  [
    [3, 3],
    [0, 0],
  ],
  [
    [0, 0],
    [7, 7],
  ],
  [
    [3, 3],
    [4, 3],
  ],
  [
    [4, 4],
    [4, 4],
  ],
];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  EXAMPLES.forEach(([start, end]) => {
    console.log(`knightMoves([${start}], [${end}]) =>`);
    knightMoves(start, end);
    console.log();
  });
}
