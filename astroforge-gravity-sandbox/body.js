// body.js — a celestial body
'use strict';

let __id = 0;

function makeBody(opts) {
  return {
    id: opts.id != null ? opts.id : ++__id,
    name: opts.name || ('body-' + (opts.id != null ? opts.id : __id)),
    mass: opts.mass,
    // radius drawn ~ mass^(1/3) but with a floor for visibility
    radius: opts.radius != null ? opts.radius : radiusForMass(opts.mass),
    pos: { x: opts.pos.x, y: opts.pos.y },
    vel: { x: opts.vel.x, y: opts.vel.y },
    acc: { x: 0, y: 0 },
    color: opts.color || '#cccccc',
    isStar: !!opts.isStar,
    trail: [],
    alive: true,
  };
}

function radiusForMass(m) {
  return Math.max(1.5, Math.cbrt(m) * 0.9);
}

// momentum-conserving merge of two bodies into a new one
function mergeBodies(a, b, nextId) {
  const m = a.mass + b.mass;
  const pos = {
    x: (a.pos.x * a.mass + b.pos.x * b.mass) / m,
    y: (a.pos.y * a.mass + b.pos.y * b.mass) / m,
  };
  const vel = {
    x: (a.vel.x * a.mass + b.vel.x * b.mass) / m,
    y: (a.vel.y * a.mass + b.vel.y * b.mass) / m,
  };
  const keep = a.mass >= b.mass ? a : b;
  return makeBody({
    id: nextId,
    name: keep.name,
    mass: m,
    pos,
    vel,
    color: keep.color,
    isStar: a.isStar || b.isStar,
  });
}

const B = { makeBody, radiusForMass, mergeBodies };

if (typeof module !== 'undefined' && module.exports) module.exports = B;
if (typeof window !== 'undefined') window.B = B;
