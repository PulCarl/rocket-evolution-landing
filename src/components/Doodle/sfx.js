// Small procedural sound-effect engine (Web Audio API, no audio files) —
// same approach as the other mini-games' sfx.js, kept as its own copy so
// this feature stays fully decoupled from the others.
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
  amp.gain.linearRampToValueAtTime(gain, start + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(amp);
  amp.connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playBounce(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  tone(c, { freq: 300, start: c.currentTime, duration: 0.08, type: "sine", gain: 0.14 * v, sweepTo: 480 });
}

export function playSpring(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  tone(c, { freq: 220, start: c.currentTime, duration: 0.22, type: "square", gain: 0.16 * v, sweepTo: 720 });
}

export function playJetpack(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 260, start: t, duration: 0.3, type: "sawtooth", gain: 0.12 * v, sweepTo: 500 });
}

export function playShield(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 500, start: t, duration: 0.14, type: "triangle", gain: 0.14 * v });
  tone(c, { freq: 750, start: t + 0.06, duration: 0.14, type: "triangle", gain: 0.12 * v });
}

export function playShieldBreak(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  tone(c, { freq: 620, start: c.currentTime, duration: 0.18, type: "square", gain: 0.14 * v, sweepTo: 180 });
}

export function playCoin(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 880, start: t, duration: 0.07, type: "square", gain: 0.11 * v });
  tone(c, { freq: 1318, start: t + 0.05, duration: 0.1, type: "square", gain: 0.13 * v });
}

export function playCrash(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  tone(c, { freq: 260, start: c.currentTime, duration: 0.4, type: "sawtooth", gain: 0.16 * v, sweepTo: 60 });
}

export function playLevelUp(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  [440, 587.33, 880].forEach((freq, i) => {
    tone(c, { freq, start: t + i * 0.06, duration: 0.16, type: "triangle", gain: 0.15 * v });
  });
}

export function playRecord(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(c, { freq, start: t + i * 0.08, duration: 0.18, type: "square", gain: 0.14 * v });
  });
}
