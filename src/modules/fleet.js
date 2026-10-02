export const BOARD_SIZE = 10;

export const ORIENTATIONS = ["horizontal", "vertical"];

export const coordinatesFor = (length, [x, y], orientation) =>
  Array.from({ length }, (_, offset) =>
    orientation === "vertical" ? [x, y + offset] : [x + offset, y],
  );

// The classic 10x10 fleet: 17 squares in total.
export const FLEET = [
  { name: "Carrier", length: 5 },
  { name: "Battleship", length: 4 },
  { name: "Cruiser", length: 3 },
  { name: "Submarine", length: 3 },
  { name: "Destroyer", length: 2 },
];
