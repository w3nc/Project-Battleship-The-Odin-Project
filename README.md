# Project-Battleship-The-Odin-Project

Battleship for
[The Odin Project](https://www.theodinproject.com/lessons/node-path-javascript-battleship):
the classic game against the computer, built with Test Driven Development and
bundled with webpack.

## How to play

- **Place your fleet.** Click squares on _Your fleet_ to drop each ship in turn,
  or press **Random fleet**. **Rotate** flips the ship between horizontal and
  vertical, and **Clear** starts the layout again.
- **Start game** locks both fleets in and hands you the first shot.
- **Fire** by clicking a square in _Enemy waters_. A hit burns, a miss splashes.
- **Fire again on a hit** (the toggle) keeps your turn going, like papergames.io;
  switch it off for the classic one-shot-per-turn rules.
- **Two players, pass & play** hands the one device back and forth: place both
  fleets, then a cover screen with a **Ready** button stands between turns so
  neither player sees the other's layout.
- **Sound** is a set of cues synthesised in the browser (placement, shot, sunk,
  turn, verdict). Untick it for a silent game.
- Sink all five enemy ships to win. The overlay offers **Play again**.

## Rules implemented

- 10x10 board and the classic fleet of five: Carrier 5, Battleship 4, Cruiser 3,
  Submarine 3, Destroyer 2 (17 squares).
- Ships run in a straight line, cannot overlap and cannot leave the board.
- The computer never repeats a square, and it hunts: a hit sends it after the
  four neighbouring squares, two hits in a row turn that into a sweep along the
  line, and it drops the lead once the ship goes down.
- Only your own fleet is ever drawn against the computer; both fleets are
  revealed when the game ends.
- The game ends the moment a whole fleet is sunk.

## Project structure

```
.
├── webpack.common.js       entry, output, HtmlWebpackPlugin, shared loaders
├── webpack.dev.js          webpack-merge: dev server, style-loader, source maps
├── webpack.prod.js         webpack-merge: minified bundle, CSS extracted
├── jest.config.js          jsdom test environment, coverage scope
├── babel.config.js         Babel preset so Jest can run the ES modules
├── eslint.config.js        ESLint flat config
├── .github/workflows/      CI: format, lint, test and build on every push
├── src
│   ├── template.html       HtmlWebpackPlugin template
│   ├── styles.css          board, controls and state styling
│   ├── index.js            webpack entry point and event wiring
│   └── modules
│       ├── fleet.js        board size, fleet spec, coordinate helper
│       ├── ship.js         Ship factory (length, hits, sunk)
│       ├── gameboard.js    placement rules, attacks, misses, all sunk
│       ├── placement.js    random fleet placement
│       ├── player.js       Player factory (real and computer)
│       ├── ai.js           computer targeting, never repeats a shot
│       ├── game.js         phases, turns, hit-again, win/lose, restart
│       ├── dom.js          rendering, kept out of the game logic
│       └── sound.js        cues synthesised with oscillators, nothing to load
└── ...
```

The source files use ES module syntax (`import` / `export default`). Every rule
lives in a factory or module, and the DOM only reads and paints state.

## Scripts

| command                 | what it does                                           |
| ----------------------- | ------------------------------------------------------ |
| `npm run build`         | bundle the app into `dist/`                            |
| `npm start`             | serve the app on http://localhost:8080 with hot reload |
| `npm run preview`       | serve the production bundle on http://localhost:8080   |
| `npm test`              | run the Jest suite once                                |
| `npm run test:watch`    | run Jest in watch mode while doing TDD                 |
| `npm run test:coverage` | run the suite and report coverage                      |
| `npm run lint`          | check the code with ESLint                             |
| `npm run lint:fix`      | apply ESLint fixes                                     |
| `npm run format`        | format with Prettier                                   |
| `npm run format:check`  | check the formatting                                   |
| `npm run check`         | format, lint and test in one go, as CI does            |

## Tests

`npm test` covers Ship, Gameboard, random placement, Player, the AI, the game
controller and the DOM layer. The lesson asks for the game logic to be driven
test first; the DOM suite uses jsdom and was added after a run of bugs that all
turned out to live in the untested rendering layer (a gate screen that could not
be dismissed, an enemy fleet that flickered into view, a board that stayed
clickable on the wrong turn).

| suite                        | what it holds down                                 |
| ---------------------------- | -------------------------------------------------- |
| `ship`, `gameboard`, `fleet` | hitting, sinking, placement rules, misses          |
| `placement`                  | a whole random fleet, never overlapping            |
| `player`                     | the two seats                                      |
| `ai`                         | target choice, hunting neighbours, the line sweep  |
| `game`                       | phases, turns, hit-again, pass & play, visibility  |
| `sound`                      | each cue, and that audio failure is never fatal    |
| `dom`                        | rendering, the gate dialog, the verdict, the flash |

`src/index.js` is still wired by hand in the browser: it is the event wiring
between `game.js` and `dom.js`, and the two ends are now both tested.

`npm run check` runs the formatting, lint and test gates in one go, and is what
CI runs on every push and pull request.
