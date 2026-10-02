import createGameboard from "./gameboard.js";

const createPlayer = (type, name) => ({
  type,
  name,
  board: createGameboard(),
});

export default createPlayer;
