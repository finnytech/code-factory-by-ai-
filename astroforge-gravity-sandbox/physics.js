// physics.js — N-body gravity with Velocity-Verlet integration
'use strict';

const isNode = typeof module !== 'undefined' && module.exports;
const V = isNode ? require('./vec2.js') : window.V;
const B = isNode ? require('./body.js') : window.B;

const G = 1.0;          // gravitational constant (sim units)
const EPS2 = 4.0;       // Plummer softening^2 to avoid singularities

// compute acceleration on each body from all others; writes into b.acc
function computeAccelerations(bodies) {
  for (const b of bodies) { b.acc.x = 0; b.acc.y = 0; }
  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      const dx = bj.pos.x - bi.pos.x;
      const dy = bj.pos.y - bi.pos.y;
      const r2 = dx * dx + dy * dy + EPS2;
      const inv = 1 / (r2 * Math.sqrt(r2)); // 1 / r^3 (softened)
      const gi = G * bj.mass * inv;
      const gj = G * bi.mass * inv;
      bi.acc.x += dx * gi; bi.acc.y += dy * gi;
      bj.acc.x -= dx * gj; bj.acc.y -= dy * gj;
    }
  }
}

// one Velocity-Verlet step
function step(bodies, dt) {
  if (bodies.length && bodies[0].acc.x === 0 && bodies[0].acc.y === 0) {
    computeAccelerations(bodies);
  }
  // half-drift positions using current acc
  for (const b of bodies) {
    b.pos.x += b.vel.x * dt + 0.5 * b.acc.x * dt * dt;
    b.pos.y += b.vel.y * dt + 0.5 * b.acc.y * dt * dt;
    b.__oldAcc = { x: b.acc.x, y: b.acc.y };
  }
  computeAccelerations(bodies);
  for (const b of bodies) {
    b.vel.x += 0.5 * (b.__oldAcc.x + b.acc.x) * dt;
    b.vel.y += 0.5 * (b.__oldAcc.y + b.acc.y) * dt;
  }
  return handleCollisions(bodies);
}

// merge overlapping bodies; returns possibly-new array
function handleCollisions(bodies) {
  let changed = false;
  let maxId = bodies.reduce((m, b) => Math.max(m, b.id), 0);
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    if (!a.alive) continue;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (!b.alive) continue;
      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < a.radius + b.radius) {
        const merged = B.mergeBodies(a, b, ++maxId);
        merged.trail = a.mass >= b.mass ? a.trail : b.trail;
        bodies[i] = merged;
        b.alive = false;
        changed = true;
        break;
      }
    }
  }
  return changed ? bodies.filter((b) => b.alive) : bodies;
}

// diagnostics
function totalMomentum(bodies) {
  let px = 0, py = 0;
  for (const b of bodies) { px += b.mass * b.vel.x; py += b.mass * b.vel.y; }
  return { x: px, y: py };
}

function totalEnergy(bodies) {
  let ke = 0, pe = 0;
  for (const b of bodies) ke += 0.5 * b.mass * V.len2(b.vel);
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const r = Math.sqrt(V.len2(V.sub(bodies[j].pos, bodies[i].pos)) + EPS2);
      pe -= G * bodies[i].mass * bodies[j].mass / r;
    }
  }
  return ke + pe;
}

const P = { G, EPS2, computeAccelerations, step, handleCollisions, totalMomentum, totalEnergy };

if (isNode) module.exports = P;
if (typeof window !== 'undefined') window.P = P;
