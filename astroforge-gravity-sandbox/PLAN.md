# AstroForge — Procedural Solar System Simulator & Gravity Sandbox

## Concept
AstroForge is a browser-based **N-body gravitational simulator** and procedural
solar-system generator. From a single seed it deterministically builds a star
with a family of planets on stable orbits, then integrates their motion with real
Newtonian gravity. Bodies attract each other, orbits precess, and close encounters
can capture, slingshot, or **merge** bodies (conserving mass & momentum). The user
watches an animated top-down view with glowing orbit trails and can spawn new
bodies with a click to perturb the system.

This is intentionally different from every existing sub-project in the repo:
no audio, no genetics, no cryptography, no fractals — pure **celestial mechanics**.

## Why it's interesting / professional
- **Real physics**: symplectic Velocity-Verlet integrator → energy-stable orbits,
  not the naive Euler drift most toy sims use.
- **Deterministic procedural generation**: same seed ⇒ same solar system, so it's
  reproducible and testable.
- **Emergent behaviour**: gravitational slingshots, resonances, merges, ejections.
- **Clean separation**: headless physics core (Node-testable) + thin render layer.

## Architecture (files)
- `vec2.js`     — tiny 2D vector math helpers (pure functions).
- `rng.js`      — seeded deterministic PRNG (mulberry32) for reproducibility.
- `body.js`     — a celestial Body (mass, radius, pos, vel) + derived helpers.
- `physics.js`  — N-body gravity, Velocity-Verlet step, merge/collision handling,
                  total energy & momentum diagnostics.
- `generate.js` — procedural solar-system builder from a seed (star + planets on
                  near-circular orbits using v = sqrt(G*M/r)).
- `render.js`   — Canvas 2D renderer: bodies, glow, orbit trails, HUD.
- `app.js`      — wires generation + physics loop + render; click-to-spawn.
- `index.html`  — page shell + canvas.
- `style.css`   — dark space UI.
- `test.js`     — headless assertions (no DOM): determinism, circular-orbit
                  stability, momentum conservation, merge conservation, energy sanity.
- `README.md`   — usage + physics notes.

## Physics notes
- Gravity: a_i = Σ_{j≠i} G * m_j * (r_j - r_i) / (|r_j - r_i|^2 + eps^2)^(3/2)
  (Plummer softening eps avoids singularities on close approach).
- Integrator: Velocity-Verlet
  - x += v*dt + 0.5*a*dt^2
  - a_new = accel(x_new)
  - v += 0.5*(a + a_new)*dt
- Circular orbit seed velocity: |v| = sqrt(G*M_star / r), perpendicular to radius.
- Merge rule (on overlap): new mass = m1+m2, momentum-conserving velocity,
  radius from mass^(1/3), position = mass-weighted centroid.

## Testing strategy (headless, deterministic)
1. Same seed → identical generated system (deep equality of positions).
2. A single planet seeded on a circular orbit stays within a tight radius band
   over many steps (bounded eccentricity) — integrator sanity.
3. Total linear momentum is conserved (≈0 drift) over N steps for an isolated system.
4. Merging two bodies conserves mass and momentum exactly.
5. RNG is deterministic and in-range [0,1).

## Self-review
- Scope is right-sized: real physics, but self-contained and fully testable in Node.
- Clear module boundaries; physics core has zero DOM/audio deps → unit-testable.
- Deterministic seed makes tests stable (no flaky randomness).
- Safe & legal, original idea, no external services or network calls.
- Softening + Verlet prevents blow-ups on close encounters (numerical robustness).
Approved by self-review. Proceeding to implementation.
