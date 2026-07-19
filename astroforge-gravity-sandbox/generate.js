// generate.js — procedural solar system from a seed
'use strict';

const isNode = typeof module !== 'undefined' && module.exports;
const R = isNode ? require('./rng.js') : window.R;
const B = isNode ? require('./body.js') : window.B;
const P = isNode ? require('./physics.js') : window.P;

const PALETTE = ['#4fa3ff', '#ff7a59', '#8ce99a', '#ffd43b', '#b197fc',
  '#63e6be', '#ffa94d', '#f783ac', '#74c0fc'];

// Build a star + N planets on near-circular orbits.
// center: {x,y} screen-space center. Deterministic for a given seed.
function generateSystem(seed, center) {
  const rng = R.makeRng(seed >>> 0);
  const cx = center ? center.x : 0;
  const cy = center ? center.y : 0;

  const starMass = R.range(rng, 1800, 3200);
  const star = B.makeBody({
    id: 1, name: 'Sol', mass: starMass, radius: 14,
    pos: { x: cx, y: cy }, vel: { x: 0, y: 0 },
    color: '#ffe066', isStar: true,
  });

  const bodies = [star];
  const planetCount = 4 + Math.floor(rng() * 4); // 4..7
  let r = 80;
  for (let i = 0; i < planetCount; i++) {
    r += R.range(rng, 55, 110);
    const angle = R.range(rng, 0, Math.PI * 2);
    const pos = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    // circular orbit speed v = sqrt(G*M/r), perpendicular to radius vector
    const speed = Math.sqrt((P.G * starMass) / r);
    const dir = rng() < 0.5 ? 1 : -1;
    const vel = { x: -Math.sin(angle) * speed * dir, y: Math.cos(angle) * speed * dir };
    const mass = R.range(rng, 4, 40);
    bodies.push(B.makeBody({
      id: 2 + i, name: 'Planet-' + (i + 1), mass,
      pos, vel, color: PALETTE[i % PALETTE.length],
    }));
  }
  return bodies;
}

const GEN = { generateSystem, PALETTE };

if (isNode) module.exports = GEN;
if (typeof window !== 'undefined') window.GEN = GEN;
