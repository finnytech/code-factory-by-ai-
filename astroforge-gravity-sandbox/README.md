# AstroForge — Procedural Solar System Simulator & Gravity Sandbox

A browser-based **N-body gravitational simulator**. From a single seed it
deterministically generates a star with planets on stable orbits, then integrates
their motion with real Newtonian gravity using a symplectic **Velocity-Verlet**
integrator. Bodies attract each other, orbits precess, and close encounters can
capture, slingshot, or **merge** bodies (conserving mass and momentum).

## Run it
Open `index.html` in any modern browser. No build step, no dependencies.

- **seed** — change the number and hit *Generate* for a new, reproducible system.
- **Pause / Resume** — freeze the simulation.
- **speed** — sub-steps per frame (higher = faster time).
- **click the sky** — spawn a new body on a tangential orbit to perturb the system.

## Headless tests
```
node test.js
```
Runs deterministic assertions on the physics core (no DOM required):
- RNG determinism and range
- same seed → identical generated system
- circular-orbit stability (bounded eccentricity)
- linear-momentum conservation over many steps
- mass & momentum conservation on merges
- collision merge reduces body count

## Physics
- **Gravity** (softened): `a_i = Σ_{j≠i} G·m_j·(r_j−r_i) / (|r_j−r_i|² + ε²)^(3/2)`
- **Integrator** (Velocity-Verlet):
  - `x += v·dt + ½·a·dt²`
  - recompute `a`
  - `v += ½·(a_old + a_new)·dt`
- **Circular seed velocity**: `|v| = sqrt(G·M_star / r)` perpendicular to the radius.
- **Merge**: summed mass, momentum-conserving velocity, radius ∝ mass^(1/3).

## Files
| file          | role |
|---------------|------|
| `vec2.js`     | 2D vector math |
| `rng.js`      | seeded PRNG (mulberry32) |
| `body.js`     | celestial body + merge |
| `physics.js`  | N-body gravity, Verlet step, diagnostics |
| `generate.js` | procedural system builder |
| `render.js`   | Canvas renderer (trails, glow, HUD) |
| `app.js`      | main loop + interaction |
| `index.html` / `style.css` | UI shell |
| `test.js`     | headless assertions |

Part of the *Factory of Code by AI* project.
