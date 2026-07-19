// app.js — wires generation + physics + render (browser only)
'use strict';

(function () {
  const canvas = document.getElementById('sky');
  const seedInput = document.getElementById('seed');
  const regenBtn = document.getElementById('regen');
  const pauseBtn = document.getElementById('pause');
  const speedInput = document.getElementById('speed');

  const renderer = window.makeRenderer(canvas);
  let bodies = [];
  let paused = false;
  let steps = 0;

  function center() { return { x: canvas.width / 2, y: canvas.height / 2 }; }

  function regen() {
    const seed = (parseInt(seedInput.value, 10) || 1) >>> 0;
    bodies = window.GEN.generateSystem(seed, center());
    steps = 0;
  }

  function loop() {
    if (!paused) {
      const dt = 0.05;
      const sub = parseInt(speedInput.value, 10) || 2;
      for (let s = 0; s < sub; s++) {
        bodies = window.P.step(bodies, dt);
        steps++;
      }
      for (const b of bodies) renderer.pushTrail(b);
    }
    const E = window.P.totalEnergy(bodies).toFixed(1);
    renderer.draw(bodies, 'bodies=' + bodies.length + '  steps=' + steps + '  E=' + E + '  (click to spawn)');
    requestAnimationFrame(loop);
  }

  // click to spawn a small body with an orbit-ish tangential velocity around the star
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const star = bodies.find((b) => b.isStar) || bodies[0];
    const dx = x - star.pos.x, dy = y - star.pos.y;
    const r = Math.hypot(dx, dy) || 1;
    const speed = Math.sqrt((window.P.G * star.mass) / r);
    bodies.push(window.B.makeBody({
      id: 1000 + bodies.length,
      mass: 6 + Math.random() * 20,
      pos: { x, y },
      vel: { x: (-dy / r) * speed, y: (dx / r) * speed },
      color: window.GEN.PALETTE[Math.floor(Math.random() * window.GEN.PALETTE.length)],
    }));
  });

  regenBtn.addEventListener('click', regen);
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  });

  function fit() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', () => { fit(); });
  fit();
  regen();
  loop();
})();
