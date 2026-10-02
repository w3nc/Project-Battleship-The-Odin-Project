module.exports = {
  // dom.js reaches straight into the document, so the whole suite gets a DOM.
  // One environment rather than a split keeps the configuration simple.
  testEnvironment: "jsdom",
  collectCoverageFrom: ["src/**/*.js", "!src/modules/*.test.js"],
};
