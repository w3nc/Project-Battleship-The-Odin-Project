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
├── webpack.config.js       webpack and dev server configuration
├── babel.config.js         Babel preset so Jest can run the ES modules
├── eslint.config.js        ESLint flat config
├── DESIGN.md               visual direction (see the design note below)
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

| command                | what it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run build`        | bundle the app into `dist/`                            |
| `npm start`            | serve the app on http://localhost:8080 with hot reload |
| `npm test`             | run the Jest suite once                                |
| `npm run test:watch`   | run Jest in watch mode while doing TDD                 |
| `npm run lint`         | check the code with ESLint                             |
| `npm run lint:fix`     | apply ESLint fixes                                     |
| `npm run format`       | format with Prettier                                   |
| `npm run format:check` | check the formatting                                   |

## Tests

`npm test` covers Ship, Gameboard, random placement, Player, the AI and the game
controller. The lesson asks for the game logic to be driven test first, and the
DOM is deliberately not unit tested: `src/index.js` and `src/modules/dom.js` only
wire events and paint state, so they are exercised by hand in the browser.

## Design note

`DESIGN.md` holds the direction this interface is built against: the palette with
a reason per colour, the typeface pair, the 8px size rule and the ENERGY 2 /
RHYTHM 2 / MOTION 2 dials. Everything in `src/styles.css` is derived from it, so
a colour or a size there should be traceable to a line in `DESIGN.md` rather than
invented on the spot. The two lines `DESIGN.md` marks as agent-supplied - the
per-colour reasons and the typeface - are the ones worth a second look.
