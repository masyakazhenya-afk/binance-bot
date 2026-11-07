(() => {
  const s = document.getElementById("shot");
  if (!s) return;
  const frame = s.querySelector(".shot-frame"), cv = s.querySelector(".dust"), ctx = cv.getContext("2d");
  const root = document.documentElement;

  // 3D tilt
  s.addEventListener("pointermove", e => {
    const r = s.getBoundingClientRect();
    s.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 16 + "deg");
    s.style.setProperty("--rx", -((e.clientY - r.top) / r.height - .5) * 12 + "deg");
  });
  s.addEventListener("pointerleave", () => { s.style.setProperty("--rx", "0deg"); s.style.setProperty("--ry", "0deg"); });

  // gold dust + bubbles rising from the pad
  let W, H, P = [];
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect(); W = cv.width = r.width * d; H = cv.height = r.height * d; };
  const spawn = init => ({
    x: init ? Math.random() * W : W * (.35 + Math.random() * .6), y: init ? Math.random() * H : H * (.68 + Math.random() * .1),
    r: (.6 + Math.random() * 2.2) * (W / 480), vy: -(.15 + Math.random() * .6) * (W / 480), vx: (Math.random() - .5) * .3, a: .2 + Math.random() * .7,
    gold: Math.random() < .65, ph: Math.random() * 6
  });
  function frameLoop(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      p.x += p.vx + Math.sin(t / 900 + p.ph) * .25; p.y += p.vy; p.a -= .0012;
      if (p.y < -10 || p.a <= 0) Object.assign(p, spawn(false));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, p.gold ? `rgba(255,225,150,${p.a})` : `rgba(255,255,255,${p.a * .8})`); g.addColorStop(1, "rgba(248,184,58,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 7); ctx.fill();
    }
    requestAnimationFrame(frameLoop);
  }
  size(); addEventListener("resize", size);
  for (let i = 0; i < 46; i++) P.push(spawn(true));
  if (!matchMedia("(prefers-reduced-motion:reduce)").matches) requestAnimationFrame(frameLoop);

  const start = () => s.classList.add("go");
  if (root.classList.contains("intro-active")) {
    const mo = new MutationObserver(() => { if (!root.classList.contains("intro-active")) { mo.disconnect(); setTimeout(start, 500); } });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  } else setTimeout(start, 300);
})();
