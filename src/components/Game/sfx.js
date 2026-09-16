// Tiny procedural sound-effect engine (Web Audio API) — every pickup gets a
// short synthesized blip/boom instead of needing separate audio files to
// fetch and license. A single AudioContext is created lazily (must happen
// from a user-gesture handler, see unlockAudio()) and reused for every call.
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

// Call from a click/keydown handler (game start) so the browser allows audio
// to actually play, and resume it if a previous game suspended it.
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

let noiseBuffer = null;
function getNoiseBuffer(c) {
  if (!noiseBuffer) {
    const len = Math.floor(c.sampleRate * 0.5);
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function boom(c, { start, duration, gain = 0.4, cutoff = 900 }) {
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, start);
  filter.frequency.exponentialRampToValueAtTime(60, start + duration);
  const amp = c.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(c.destination);
  src.start(start);
  src.stop(start + duration + 0.02);

  // Sub thump under the noise burst, for weight.
  tone(c, { freq: 110, start, duration: duration * 0.8, type: "sine", gain: gain * 0.8, sweepTo: 40 });
}

export function playCoin(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 880, start: t, duration: 0.08, type: "square", gain: 0.12 * v });
  tone(c, { freq: 1318, start: t + 0.05, duration: 0.12, type: "square", gain: 0.14 * v });
}

export function playBombPickup(volume, muted, gold = false) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, {
    freq: gold ? 330 : 220,
    start: t,
    duration: 0.12,
    type: "triangle",
    gain: 0.16 * v,
    sweepTo: gold ? 165 : 110,
  });
  if (gold) tone(c, { freq: 1200, start: t + 0.04, duration: 0.1, type: "sine", gain: 0.08 * v });
}

export function playBombExplode(volume, muted, gold = false) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  boom(c, { start: t, duration: gold ? 0.5 : 0.32, gain: (gold ? 0.5 : 0.4) * v, cutoff: gold ? 1400 : 900 });
  if (gold) {
    [1600, 2100, 2600].forEach((freq, i) => {
      tone(c, { freq, start: t + 0.05 + i * 0.05, duration: 0.15, type: "sine", gain: 0.08 * v });
    });
  }
}

// Pitch rises a bit with each letter of ROCKET collected, so it reads as a
// little ascending scale the closer you get to completing the word.
export function playLetter(volume, muted, index = 0) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const freq = 523.25 * Math.pow(2, index / 12);
  tone(c, { freq, start: c.currentTime, duration: 0.14, type: "triangle", gain: 0.16 * v });
}

export function playWordComplete(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(c, { freq, start: t + i * 0.08, duration: 0.18, type: "square", gain: 0.15 * v });
  });
}

export function playJetpack(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(300, t);
  filter.frequency.exponentialRampToValueAtTime(2200, t + 0.35);
  const amp = c.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(0.22 * v, t + 0.05);
  amp.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(c.destination);
  src.start(t);
  src.stop(t + 0.42);
}

export function playMagnet(volume, muted) {
  const v = clampVolume(volume, muted);
  if (v <= 0) return;
  const c = getCtx();
  const t = c.currentTime;
  tone(c, { freq: 180, start: t, duration: 0.3, type: "sawtooth", gain: 0.1 * v, sweepTo: 260 });
  tone(c, { freq: 260, start: t + 0.08, duration: 0.24, type: "sawtooth", gain: 0.1 * v, sweepTo: 340 });
}
