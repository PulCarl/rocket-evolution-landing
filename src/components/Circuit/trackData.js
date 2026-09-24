// One lap around an oval circuit: 8 gates. Index 0 is the start/finish line
// — the race begins there and ends the instant it's crossed again after
// every other gate has been hit in order (1, 2, 3, ... then back to 0).
const RADIUS_X = 36;
const RADIUS_Z = 24;
const GATE_COUNT = 8;
const GATE_TRIGGER_RADIUS = 7;

function buildCheckpoints() {
  const points = [];
  for (let i = 0; i < GATE_COUNT; i++) {
    const angle = -Math.PI / 2 + (i / GATE_COUNT) * Math.PI * 2;
    points.push({ x: Math.cos(angle) * RADIUS_X, z: Math.sin(angle) * RADIUS_Z });
  }
  return points.map((p, i) => {
    const next = points[(i + 1) % GATE_COUNT];
    const prev = points[(i - 1 + GATE_COUNT) % GATE_COUNT];
    // Face the gate across the direction of travel (tangent between the
    // neighbouring points), so driving "through" it reads naturally.
    const rotationY = Math.atan2(next.x - prev.x, next.z - prev.z);
    return { x: p.x, z: p.z, rotationY, radius: GATE_TRIGGER_RADIUS };
  });
}

export const CHECKPOINTS = buildCheckpoints();

// Start just behind gate 0, facing toward gate 1 (matches the gates'
// tangent direction convention: heading 0 = +Z).
export const START_POSITION = {
  x: CHECKPOINTS[0].x,
  z: CHECKPOINTS[0].z - 6,
  heading: CHECKPOINTS[0].rotationY,
};
