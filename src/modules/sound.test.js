import {
  isMuted,
  playGate,
  playPlace,
  playShot,
  playSunk,
  playTurn,
  playVerdict,
  setMuted,
} from "./sound.js";

// Every note the stub hears, in order.
const played = [];

// The module builds its audio context once and keeps it, so the fake has to be
// in place before the first note and stay the same object throughout.
const installAudioContext = () => {
  if (global.window) return played;

  class FakeAudioContext {
    constructor() {
      this.state = "running";
      this.currentTime = 0;
      this.destination = {};
    }

    createOscillator() {
      return {
        type: "sine",
        frequency: { setValueAtTime: (value) => played.push(value) },
        connect: (node) => node,
        start: () => {},
        stop: () => {},
      };
    }

    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: (node) => node,
      };
    }

    resume() {}
  }

  global.window = { AudioContext: FakeAudioContext };

  return played;
};

describe("sound", () => {
  test("starts unmuted and follows setMuted", () => {
    expect(isMuted()).toBe(false);

    setMuted(true);
    expect(isMuted()).toBe(true);

    setMuted(false);
    expect(isMuted()).toBe(false);
  });

  test("stays quiet, and quiet about it, with no browser audio to use", () => {
    expect(() => {
      playPlace();
      playShot("hit");
      playShot("miss");
      playSunk();
      playTurn("player");
      playGate();
      playVerdict(true);
      playVerdict(false);
    }).not.toThrow();
  });

  test("says nothing at all while muted", () => {
    const notes = installAudioContext();

    setMuted(true);
    notes.length = 0;
    playShot("hit");

    expect(notes).toHaveLength(0);

    setMuted(false);
  });

  test("gives a hit and a miss different notes", () => {
    const notes = installAudioContext();

    notes.length = 0;
    playShot("miss");
    const [miss] = notes;

    notes.length = 0;
    playShot("hit");
    const [hit] = notes;

    expect(notes).toHaveLength(1);
    expect(hit).not.toBe(miss);
  });

  test("gives each seat its own turn cue", () => {
    const notes = installAudioContext();

    notes.length = 0;
    playTurn("player");
    const [player] = notes;

    notes.length = 0;
    playTurn("computer");
    const [computer] = notes;

    expect(player).not.toBe(computer);
  });

  test("plays a two-note cue for the pass-the-device screen", () => {
    const notes = installAudioContext();

    notes.length = 0;
    playGate();

    expect(notes).toHaveLength(2);
    expect(notes[1]).toBeGreaterThan(notes[0]);
  });

  test("plays a rising fanfare for a win and a falling one for a loss", () => {
    const notes = installAudioContext();

    notes.length = 0;
    playVerdict(true);
    const win = [...notes];

    notes.length = 0;
    playVerdict(false);
    const loss = [...notes];

    expect(win).toEqual([...win].sort((a, b) => a - b));
    expect(loss).toEqual([...loss].sort((a, b) => b - a));
    expect(win[0]).not.toBe(loss[0]);
  });
});
