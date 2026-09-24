// Small procedural sound-effect engine for the circuit game (Web Audio API,
// no audio files) — same approach as the old mini-game's sfx.js, kept as its
// own copy so the two features stay fully decoupled.
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function unlockAudio() {
  const c = getCtx();
  if (c.state === "suspended") c.resume().catch(() => {});
}

function clampVolume(volume, muted) {
  return muted ? 0 : Math.max(0, Math.min(1, volume));
}

function tone(c, { freq, start, duration, type = "sine", gain = 0.2, sweepTo = null }) {
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (sweepTo != null) osc.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp);
  amp.connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playCountdownTick(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  tone(c, { freq: 440, start: c.currentTime, duration: 0.1, type: "square", gain: 0.14 * v });
}

export function playGo(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 660, start: t, duration: 0.22, type: "square", gain: 0.16 * v, sweepTo: 880 });
}

export function playCheckpoint(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 740, start: t, duration: 0.09, type: "triangle", gain: 0.14 * v });
  tone(c, { freq: 1108, start: t + 0.05, duration: 0.1, type: "triangle", gain: 0.12 * v });
}

export function playFinish(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    tone(c, { freq, start: t + i * 0.07, duration: 0.2, type: "square", gain: 0.15 * v });
  });
}
