const createShip = (name, length) => {
  let hits = 0;

  const hit = () => {
    hits += 1;
  };

  const isSunk = () => hits >= length;

  return {
    name,
    length,
    get hits() {
      return hits;
    },
    hit,
    isSunk,
  };
};

export default createShip;
