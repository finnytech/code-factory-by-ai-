// test.js — headless deterministic assertions for AstroForge
'use strict';

const V = require('./vec2.js');
const R = require('./rng.js');
const B = require('./body.js');
const P = require('./physics.js');
const GEN = require('./generate.js');

let passed = 0;
const results = [];
function ok(cond, label) {
  results.push((cond ? '  ok - ' : '  FAIL - ') + label);
  if (cond) passed++;
  else process.exitCode = 1;
}

console.log('AstroForge tests');

// 1. RNG deterministic + in range
{
  const a = R.makeRng(42), b = R.makeRng(42);
  let same = true, inRange = true;
  for (let i = 0; i < 100; i++) {
    const x = a(), y = b();
    if (x !== y) same = false;
    if (x < 0 || x >= 1) inRange = false;
  }
  ok(same, 'rng deterministic for same seed');
  ok(inRange, 'rng values in [0,1)');
}

// 2. same seed -> identical generated system
{
  const s1 = GEN.generateSystem(7, { x: 0, y: 0 });
  const s2 = GEN.generateSystem(7, { x: 0, y: 0 });
  let identical = s1.length === s2.length;
  for (let i = 0; i < s1.length && identical; i++) {
    if (Math.abs(s1[i].pos.x - s2[i].pos.x) > 1e-9) identical = false;
    if (Math.abs(s1[i].vel.y - s2[i].vel.y) > 1e-9) identical = false;
    if (Math.abs(s1[i].mass - s2[i].mass) > 1e-9) identical = false;
  }
  ok(identical, 'same seed produces identical system');
  ok(s1.length >= 5 && s1.length <= 8, 'system has star + 4..7 planets');
  ok(s1[0].isStar === true, 'first body is the star');
}

// 3. circular orbit stays in a bounded radius band (integrator sanity)
{
  const starMass = 2000;
  const star = B.makeBody({ id: 1, mass: starMass, pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, isStar: true });
  const r = 200;
  const v = Math.sqrt((P.G * starMass) / r);
  const planet = B.makeBody({ id: 2, mass: 1, pos: { x: r, y: 0 }, vel: { x: 0, y: v } });
  let bodies = [star, planet];
  let rmin = Infinity, rmax = -Infinity;
  for (let i = 0; i < 4000; i++) {
    bodies = P.step(bodies, 0.05);
    const rr = Math.hypot(bodies[1].pos.x - bodies[0].pos.x, bodies[1].pos.y - bodies[0].pos.y);
    rmin = Math.min(rmin, rr); rmax = Math.max(rmax, rr);
  }
  // eccentricity should stay small for a seeded circular orbit
  const ecc = (rmax - rmin) / (rmax + rmin);
  ok(ecc < 0.15, 'circular orbit stays near-circular (ecc=' + ecc.toFixed(3) + ')');
  ok(rmin > 100 && rmax < 320, 'orbit radius stays bounded');
}

// 4. momentum conservation for an isolated system
{
  const bodies0 = GEN.generateSystem(3, { x: 0, y: 0 });
  // shift to zero total momentum first (subtract COM velocity)
  const mom0 = P.totalMomentum(bodies0);
  let totalMass = 0; for (const b of bodies0) totalMass += b.mass;
  for (const b of bodies0) { b.vel.x -= mom0.x / totalMass; b.vel.y -= mom0.y / totalMass; }
  let bodies = bodies0;
  const before = P.totalMomentum(bodies);
  for (let i = 0; i < 2000; i++) bodies = P.step(bodies, 0.02);
  const after = P.totalMomentum(bodies);
  const drift = Math.hypot(after.x - before.x, after.y - before.y);
  ok(drift < 1e-6, 'total momentum conserved (drift=' + drift.toExponential(2) + ')');
}

// 5. merge conserves mass and momentum exactly
{
  const a = B.makeBody({ id: 10, mass: 30, pos: { x: 0, y: 0 }, vel: { x: 2, y: 0 } });
  const b = B.makeBody({ id: 11, mass: 10, pos: { x: 1, y: 0 }, vel: { x: -4, y: 1 } });
  const pBefore = { x: a.mass * a.vel.x + b.mass * b.vel.x, y: a.mass * a.vel.y + b.mass * b.vel.y };
  const m = B.mergeBodies(a, b, 99);
  const pAfter = { x: m.mass * m.vel.x, y: m.mass * m.vel.y };
  ok(Math.abs(m.mass - 40) < 1e-9, 'merge conserves mass');
  ok(Math.abs(pAfter.x - pBefore.x) < 1e-9 && Math.abs(pAfter.y - pBefore.y) < 1e-9, 'merge conserves momentum');
}

// 6. collision merge reduces body count when bodies overlap
{
  const a = B.makeBody({ id: 20, mass: 50, pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 } });
  const b = B.makeBody({ id: 21, mass: 50, pos: { x: 1, y: 0 }, vel: { x: 0, y: 0 } });
  let bodies = [a, b];
  bodies = P.handleCollisions(bodies);
  ok(bodies.length === 1, 'overlapping bodies merge into one');
  ok(Math.abs(bodies[0].mass - 100) < 1e-9, 'merged body has summed mass');
}

console.log(results.join('\n'));
const total = results.length;
if (passed === total) console.log('\nALL PASSED (' + total + ' assertions)');
else console.log('\n' + passed + '/' + total + ' passed');
