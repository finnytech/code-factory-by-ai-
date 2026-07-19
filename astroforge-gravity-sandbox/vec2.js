// vec2.js — minimal 2D vector helpers (pure, no state)
'use strict';

const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a, s) => ({ x: a.x * s, y: a.y * s });
const dot = (a, b) => a.x * b.x + a.y * b.y;
const len = (a) => Math.hypot(a.x, a.y);
const len2 = (a) => a.x * a.x + a.y * a.y;
const norm = (a) => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
};
// perpendicular (rotate +90 degrees)
const perp = (a) => ({ x: -a.y, y: a.x });

const V = { add, sub, scale, dot, len, len2, norm, perp };

if (typeof module !== 'undefined' && module.exports) module.exports = V;
if (typeof window !== 'undefined') window.V = V;
