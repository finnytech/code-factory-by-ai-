// rng.js — deterministic seeded PRNG (mulberry32)
'use strict';

function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// float in [min,max)
function range(rng, min, max) {
  return min + rng() * (max - min);
}

const R = { makeRng, range };

if (typeof module !== 'undefined' && module.exports) module.exports = R;
if (typeof window !== 'undefined') window.R = R;
