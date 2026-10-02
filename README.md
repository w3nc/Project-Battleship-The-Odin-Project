# Project-Knights-Travails-The-Odin-Project

Knights Travails project for The Odin Project: a `knightMoves` function that finds
the shortest way for a knight to travel between two squares of a standard 8x8
chessboard.

## Modules

The source files use ES module syntax (`import` / `export default`).

## Scripts

`npm test`

`npm run test:watch`

`npm run lint`

`npm run lint:fix`

`npm run format`

`npm run format:check`

`npm run demo`


## API

`knightMoves(start, end)`


```js
knightMoves([0, 0], [1, 2]);
knightMoves([3, 3], [4, 3]); 
```

What the demo prints for the lesson's three move call (the lesson lists a
different but equally short route, see below):

```
> knightMoves([3,3],[4,3])
You made it in 3 moves! Here's your path:
[3,3]
[4,5]
[6,4]
[4,3]
```

`[0, 0]` to `[3, 3]` may come back as either `[[0,0],[2,1],[3,3]]` or
`[[0,0],[1,2],[3,3]]`. Every square on the board can be reached from every other
square within six moves.

`formatKnightMoves(path)` named export that turns a path into the printed
text, which keeps the message testable without a console:

```js
formatKnightMoves([[4, 4]]);

```

`knightMoves` returns the path as an array of squares and also `console.log`s it,
so the demo reads like the lesson transcript while the returned value stays easy
to assert in the tests.
