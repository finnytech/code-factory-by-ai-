// render.js — Canvas 2D renderer for AstroForge (browser only)
'use strict';

function makeRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const TRAIL_MAX = 120;

  function pushTrail(b) {
    b.trail.push({ x: b.pos.x, y: b.pos.y });
    if (b.trail.length > TRAIL_MAX) b.trail.shift();
  }

  function draw(bodies, info) {
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, w, h);

    // starfield backdrop (static-ish twinkle)
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 80; i++) {
      const x = (i * 977) % w, y = (i * 613) % h;
      ctx.fillStyle = '#22283a';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();

    // trails
    for (const b of bodies) {
      if (b.trail.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(b.trail[0].x, b.trail[0].y);
      for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i].x, b.trail[i].y);
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // bodies with glow
    for (const b of bodies) {
      const glow = ctx.createRadialGradient(b.pos.x, b.pos.y, 0, b.pos.x, b.pos.y, b.radius * 3);
      glow.addColorStop(0, b.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.radius * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = b.isStar ? '#fff6cc' : b.color;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#8fa1c7';
    ctx.font = '12px monospace';
    ctx.fillText(info, 12, h - 14);
  }

  return { draw, pushTrail };
}

if (typeof window !== 'undefined') window.makeRenderer = makeRenderer;
