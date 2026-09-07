import { GAME_CONFIG, speedAt } from "../../game/scoring.js";

const { width: W, height: H, groundY: GROUND, gravity: GRAVITY, jumpVelocity: JUMP_V, doubleJumpVelocity: JUMP2_V } =
  GAME_CONFIG;

const OBSTACLE_KINDS = [
  { w: 20, h: 34, kind: "cone" },
  { w: 30, h: 26, kind: "pad" },
  { w: 24, h: 46, kind: "post" },
];

export function createGame() {
  return {
    t: 0,
    distance: 0,
    player: { x: 90, y: GROUND, vy: 0, jumps: 0, w: 34, h: 30 },
    obstacles: [],
    nextSpawnAt: 0.9,
    particles: [],
    over: false,
  };
}

export function jump(state) {
  if (state.over) return;
  const p = state.player;
  const onGround = p.y >= GROUND - 0.5;
  if (onGround) {
    p.vy = JUMP_V;
    p.jumps = 1;
  } else if (p.jumps < 2) {
    p.vy = JUMP2_V;
    p.jumps = 2;
  }
}

function spawnObstacle(state) {
  const base = OBSTACLE_KINDS[Math.floor(Math.random() * OBSTACLE_KINDS.length)];
  state.obstacles.push({ x: W + 20, w: base.w, h: base.h, kind: base.kind, passed: false });
  const { minSpawnGap, maxSpawnGap } = GAME_CONFIG;
  const difficulty = Math.min(state.t / 60, 1);
  const gap = maxSpawnGap - (maxSpawnGap - minSpawnGap) * difficulty;
  state.nextSpawnAt = state.t + gap * (0.75 + Math.random() * 0.5);
}

function aabbHit(p, o) {
  const px1 = p.x - p.w / 2;
  const px2 = p.x + p.w / 2;
  const py1 = p.y - p.h;
  const py2 = p.y;
  const ox1 = o.x;
  const ox2 = o.x + o.w;
  const oy1 = GROUND - o.h;
  const oy2 = GROUND;
  return px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1;
}

// Advances the simulation by dt seconds. Returns { crashed, scoredPass }.
export function step(state, dt) {
  if (state.over) return { crashed: false };
  state.t += dt;

  const speed = speedAt(state.t);
  state.distance += speed * dt;

  const p = state.player;
  p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  if (p.y > GROUND) {
    p.y = GROUND;
    p.vy = 0;
    p.jumps = 0;
  }

  for (const o of state.obstacles) o.x -= speed * dt;
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -20);

  if (state.t >= state.nextSpawnAt) spawnObstacle(state);

  for (const o of state.obstacles) {
    if (aabbHit(p, o)) {
      state.over = true;
      return { crashed: true };
    }
  }

  return { crashed: false };
}

export function draw(ctx, state) {
  ctx.clearRect(0, 0, W, H);

  // Ground
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND + 1);
  ctx.lineTo(W, GROUND + 1);
  ctx.stroke();

  // Scrolling floor ticks (arena-floor feel)
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  const tickSpacing = 46;
  const offset = (state.distance * 0.6) % tickSpacing;
  for (let x = -offset; x < W; x += tickSpacing) {
    ctx.fillRect(x, GROUND + 6, 22, 2);
  }

  // Obstacles
  for (const o of state.obstacles) {
    const top = GROUND - o.h;
    if (o.kind === "cone") {
      const grad = ctx.createLinearGradient(o.x, top, o.x, GROUND);
      grad.addColorStop(0, "#fe980c");
      grad.addColorStop(1, "#d8224e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, top);
      ctx.lineTo(o.x + o.w, GROUND);
      ctx.lineTo(o.x, GROUND);
      ctx.closePath();
      ctx.fill();
    } else if (o.kind === "pad") {
      const grad = ctx.createLinearGradient(o.x, top, o.x + o.w, GROUND);
      grad.addColorStop(0, "#fe980c");
      grad.addColorStop(1, "#f4791c");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, 5);
      ctx.fill();
    } else {
      ctx.fillStyle = "#d8224e";
      ctx.fillRect(o.x + o.w / 2 - 3, top, 6, o.h);
      ctx.fillStyle = "rgba(216,34,78,.35)";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, top, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Player (little Fennec-orange car)
  const p = state.player;
  const carTop = p.y - p.h;
  ctx.save();
  ctx.translate(p.x, 0);
  const bodyGrad = ctx.createLinearGradient(-p.w / 2, carTop, p.w / 2, p.y);
  bodyGrad.addColorStop(0, "#ffffff");
  bodyGrad.addColorStop(1, "#f4791c");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-p.w / 2, carTop, p.w, p.h * 0.62, 6);
  ctx.fill();
  ctx.fillStyle = "#1d1d1d";
  ctx.beginPath();
  ctx.roundRect(-p.w / 2 + 6, carTop, p.w - 12, p.h * 0.34, 4);
  ctx.fill();
  ctx.fillStyle = "#1d1d1d";
  ctx.beginPath();
  ctx.arc(-p.w / 3, p.y - 3, 6, 0, Math.PI * 2);
  ctx.arc(p.w / 3, p.y - 3, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
