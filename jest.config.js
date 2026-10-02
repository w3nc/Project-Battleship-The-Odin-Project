module.exports = {
  // dom.js reaches straight into the document, so the whole suite gets a DOM to
  // render into. The game logic does not care either way, and running one
  // environment keeps the configuration honest rather than split in two.
  testEnvironment: "jsdom",
  collectCoverageFrom: ["src/**/*.js", "!src/modules/*.test.js"],
};
