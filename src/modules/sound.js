// Every sound is synthesised from a few oscillators, so there is nothing to
// load and nothing to ship. The module is deliberately quiet about failure:
// audio is a nicety and must never break a game.
let context = null;
let muted = false;

const supported = () =>
  typeof window !== "undefined" &&
  Boolean(window.AudioContext || window.webkitAudioContext);

const audio = () => {
  if (!context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;

    context = new AudioContext();
  }

  return context;
};

const blip = ({
  frequency,
  duration = 0.12,
  type = "sine",
  delay = 0,
  volume = 0.05,
}) => {
  if (muted || !supported()) return;

  try {
    const ctx = audio();

    if (ctx.state === "suspended") ctx.resume();

    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  } catch {
    // audio is a nicety, never let it break the game
  }
};

export const setMuted = (value) => {
  muted = Boolean(value);
};

export const isMuted = () => muted;

export const playPlace = () => {
  blip({ frequency: 520, type: "triangle", duration: 0.08, volume: 0.035 });
};

export const playShot = (outcome) => {
  if (outcome === "hit")
    blip({ frequency: 300, type: "square", duration: 0.16 });
  if (outcome === "miss")
    blip({ frequency: 170, duration: 0.12, volume: 0.03 });
};

export const playSunk = () => {
  blip({ frequency: 220, type: "square", duration: 0.3, volume: 0.05 });
  blip({ frequency: 138, delay: 0.14, duration: 0.42, volume: 0.04 });
};

export const playTurn = (seat) => {
  blip({
    frequency: seat === "player" ? 620 : 440,
    type: "triangle",
    duration: 0.1,
    volume: 0.04,
  });
};

// The pass-the-device screen: two rising notes, so handing the game over has
// its own cue instead of sounding like a turn starting.
export const playGate = () => {
  blip({ frequency: 494, type: "triangle", duration: 0.1, volume: 0.04 });
  blip({ frequency: 740, delay: 0.11, type: "triangle", duration: 0.16 });
};

export const playVerdict = (won) => {
  if (won) {
    blip({ frequency: 523.25, duration: 0.16 });
    blip({ frequency: 659.25, delay: 0.14, duration: 0.16 });
    blip({ frequency: 783.99, delay: 0.28, duration: 0.3 });
    return;
  }

  blip({ frequency: 392, duration: 0.2 });
  blip({ frequency: 311, delay: 0.18, duration: 0.2 });
  blip({ frequency: 233, delay: 0.36, duration: 0.34 });
};
