/* SM logo cleaning intro: dirty -> foam -> sponge -> rinse -> wipe -> polish -> wipe -> shine -> subtitle */
(() => {
  const root = document.documentElement;
  const box = document.getElementById("intro");
  if (!box || !root.classList.contains("intro-active")) return;

  const cv = document.getElementById("introCanvas");
  const txt = document.getElementById("introText");
  const stage = document.getElementById("introStage");
  const skip = document.getElementById("introSkip");
  const ctx = cv.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const RATE = 1.12;                     // playback speed
  const ASPECT = 1294 / 392;             // SM crop ratio
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.scale(DPR, DPR); return [c, x]; };

  let cw, ch, lx, ly, lw, lh, L, Lx, D, Dx, F, Fx, W, Wx, H, Hx, T, Tx;
  let done = false, started = false, t0 = 0, prev = {}, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (a, b, t) => clamp((t - a) / (b - a));
  const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const tri = x => 1 - Math.abs((((x % 2) + 2) % 2) - 1);

  const S = {
    fade: [0, .9], foam: [1.1, 2.4], scrub: [2.5, 4.3], rinse: [4.4, 5.5],
    wipe1: [5.6, 6.5], polish: [6.6, 8.1], wipe2: [8.1, 8.8], shine: [8.8, 9.9],
    text: [9.4, 10.8], end: 12.2
  };

  const img = new Image();
  img.src = "assets/logo-sm.png";
  const timeout = setTimeout(() => !started && finish(true), 4000);
  img.onload = () => { clearTimeout(timeout); init(); };
  img.onerror = () => finish(true);

  function init() {
    const vw = Math.min(window.innerWidth * .9, 780);
    lw = vw * .86; lh = lw / ASPECT;
    cw = vw; ch = lh * 2;
    lx = (cw - lw) / 2; ly = (ch - lh) / 2;
    cv.width = cw * DPR; cv.height = ch * DPR;
    cv.style.width = cw + "px"; cv.style.height = ch + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    [L, Lx] = mk(cw * DPR, ch * DPR); [D, Dx] = mk(cw * DPR, ch * DPR); [F, Fx] = mk(cw * DPR, ch * DPR);
    [W, Wx] = mk(cw * DPR, ch * DPR); [H, Hx] = mk(cw * DPR, ch * DPR); [T, Tx] = mk(cw * DPR, ch * DPR);
    Lx.drawImage(img, lx, ly, lw, lh);

    // dull oxidation haze (clipped to letters)
    Hx.fillStyle = "rgba(190,190,196,.5)"; Hx.fillRect(0, 0, cw, ch);
    Hx.globalCompositeOperation = "destination-in"; Hx.setTransform(1, 0, 0, 1, 0, 0); Hx.drawImage(L, 0, 0); Hx.setTransform(DPR, 0, 0, DPR, 0, 0);
    Hx.globalCompositeOperation = "source-over";

    // grime
    Dx.fillStyle = "rgba(74,60,44,.86)"; Dx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 520; i++) {
      const x = rr(lx, lx + lw), y = rr(ly, ly + lh), r = rr(3, 26) * (lw / 760);
      const g = Dx.createRadialGradient(x, y, 0, x, y, r);
      const c = rnd() < .5 ? "40,30,20" : rnd() < .5 ? "98,82,60" : "120,120,118";
      g.addColorStop(0, `rgba(${c},${rr(.25, .6)})`); g.addColorStop(1, `rgba(${c},0)`);
      Dx.fillStyle = g; Dx.beginPath(); Dx.arc(x, y, r, 0, 7); Dx.fill();
    }
    for (let i = 0; i < 70; i++) {            // drip streaks
      const x = rr(lx, lx + lw), y = rr(ly, ly + lh * .6), len = rr(.15, .6) * lh;
      Dx.strokeStyle = `rgba(30,22,14,${rr(.15, .4)})`; Dx.lineWidth = rr(1, 3.5); Dx.beginPath(); Dx.moveTo(x, y); Dx.lineTo(x + rr(-3, 3), y + len); Dx.stroke();
    }
    for (let i = 0; i < 900; i++) { Dx.fillStyle = `rgba(${rnd() < .5 ? "20,16,12" : "150,140,120"},${rr(.2, .6)})`; Dx.fillRect(rr(lx, lx + lw), rr(ly, ly + lh), rr(.6, 2), rr(.6, 2)); }
    Dx.globalCompositeOperation = "destination-in"; Dx.setTransform(1, 0, 0, 1, 0, 0); Dx.drawImage(L, 0, 0); Dx.setTransform(DPR, 0, 0, DPR, 0, 0);
    Dx.globalCompositeOperation = "source-over";

    txt.style.width = lw * .875 + "px";
    stage.style.setProperty("--pull", -(ch - lh) / 2 + lh * .02 + "px");
    started = true; t0 = performance.now();
    addEventListener("pointermove", e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; });
    requestAnimationFrame(loop);
  }

  let px = 0, py = 0, sx = 0, sy = 0;

  const erase = (x, c, a, b, w) => {
    c.save(); c.globalCompositeOperation = "destination-out"; c.lineCap = c.lineJoin = "round"; c.lineWidth = w;
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore();
  };
  const clearL = c => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); };
  const bubble = (x, y, r) => {
    const g = Fx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,.98)"); g.addColorStop(.7, "rgba(238,244,248,.95)"); g.addColorStop(1, "rgba(190,205,215,.85)");
    Fx.fillStyle = g; Fx.beginPath(); Fx.arc(x, y, r, 0, 7); Fx.fill();
    Fx.fillStyle = "rgba(255,255,255,.9)"; Fx.beginPath(); Fx.arc(x - r * .35, y - r * .35, r * .2, 0, 7); Fx.fill();
  };
  const foamAt = (x, y, n, spread) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28, d = Math.sqrt(rnd()) * spread;
      bubble(x + Math.cos(a) * d, y + Math.sin(a) * d * .7, rr(4, 15) * (lw / 760));
    }
  };

  // ---- tools (vector) ----
  function sponge(x, y, a) {
    const w = lh * .95, h = lh * .55;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fillStyle = "#e9c640"; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h * .68, 12); ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#2f8f4e"; ctx.beginPath(); ctx.roundRect(-w / 2, h * .18, w, h * .32, 10); ctx.fill();
    ctx.fillStyle = "rgba(150,110,10,.45)";
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(-w / 2 + ((i * 37) % 100) / 100 * w * .9 + w * .05, -h / 2 + ((i * 53) % 55) / 100 * h + 6, 4, 3, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function cloth(x, y, a, wdt, hgt) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    const g = ctx.createLinearGradient(-wdt / 2, 0, wdt / 2, 0); g.addColorStop(0, "#2c6fb2"); g.addColorStop(.5, "#4b93d6"); g.addColorStop(1, "#2c6fb2");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-wdt / 2, -hgt / 2, wdt, hgt, 16); ctx.fill(); ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.5;
    for (let i = -hgt / 2 + 8; i < hgt / 2; i += 9) { ctx.beginPath(); ctx.moveTo(-wdt / 2 + 6, i); ctx.lineTo(wdt / 2 - 6, i); ctx.stroke(); }
    ctx.restore();
  }
  function pad(x, y, r, spin) {
    ctx.save(); ctx.translate(x, y); ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(0, 0, r * 1.08, 0, 7); ctx.fill(); ctx.shadowColor = "transparent";
    const g = ctx.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r); g.addColorStop(0, "#ffb347"); g.addColorStop(1, "#e0791a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.rotate(spin); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(r * .2, 0); ctx.lineTo(r * .92, 0); ctx.stroke(); }
    ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(0, 0, r * .16, 0, 7); ctx.fill();
    ctx.restore();
  }
  function nozzle(x, y) {
    ctx.save(); ctx.translate(x + lh * .3, y - lh * .45); ctx.rotate(-.5);
    ctx.fillStyle = "#222"; ctx.beginPath(); ctx.roundRect(-8, -12, 52, 24, 8); ctx.fill();
    ctx.fillStyle = "#F8B83A"; ctx.beginPath(); ctx.arc(2, 0, 5, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < 26; i++) { const k = rnd(); ctx.beginPath(); ctx.arc(x + lh * .3 - 8 - (lh * .3 + 8) * k + rr(-8, 8) * k, y - lh * .45 + (lh * .45) * k + rr(-6, 6) * k, rr(.8, 2.4), 0, 7); ctx.fill(); }
  }

  function loop(now) {
    if (done) return;
    const t = ((now - t0) / 1000) * RATE;
    draw(t);
    if (t >= S.end) return finish(false);
    requestAnimationFrame(loop);
  }

  function pos(key, p, fn) {
    const q = fn(p), pr = prev[key] || q; prev[key] = q; return [pr, q];
  }

  function draw(t) {
    const cy = ly + lh / 2;
    ctx.clearRect(0, 0, cw, ch);

    /* ---- simulation ---- */
    const pf = seg(...S.foam, t), ps = seg(...S.scrub, t), pr = seg(...S.rinse, t),
      pw1 = seg(...S.wipe1, t), pp = seg(...S.polish, t), pw2 = seg(...S.wipe2, t);

    // foam spray (two passes)
    if (t >= S.foam[0] && t <= S.foam[1] + .1) {
      const q = Math.min(pf, 1), row = q < .5 ? .3 : .7, u = (q % .5) / .5;
      const x = lx - 20 + (lw + 40) * (q < .5 ? u : 1 - u), y = ly + lh * row;
      foamAt(x, y, 16, lh * .3);
      this_nozzle = [x, y];
    } else this_nozzle = null;

    // scrubbing
    let sp = null;
    if (t >= S.scrub[0] && t <= S.scrub[1]) {
      const f = p => [lx + lw * (-.05 + 1.1 * tri(p * 3.5)), ly + lh * (.2 + .6 * p) + Math.sin(p * 60) * lh * .06];
      const [a, b] = pos("sp", ps, f); sp = b;
      erase(0, Dx, a, b, lh * .6); foamAt(b[0], b[1], 7, lh * .3);
    }
    // rinse
    let band = null;
    if (t >= S.rinse[0]) {
      const p = ease(pr), by = ly - 30 + (lh + 70) * p, pby = prev.band ?? by - 1; prev.band = by;
      Dx.save(); Fx.save();
      for (const c of [Dx, Fx]) { c.globalCompositeOperation = "destination-out"; c.beginPath(); c.moveTo(0, 0); c.lineTo(cw, 0); for (let x = cw; x >= 0; x -= 14) c.lineTo(x, by + Math.sin(x * .03 + t * 9) * 9); c.closePath(); c.fill(); }
      Dx.restore(); Fx.restore();
      // wet film + droplets in the freshly cleared strip
      Wx.fillStyle = "rgba(190,222,255,.2)"; Wx.fillRect(0, Math.min(pby, by) - 12, cw, Math.abs(by - pby) + 12);
      if (pr < 1) for (let i = 0; i < 14; i++) {
        const x = rr(lx, lx + lw), y = rr(Math.min(pby, by), by), r = rr(1.5, 5) * (lw / 760);
        Wx.fillStyle = "rgba(210,232,255,.5)"; Wx.beginPath(); Wx.arc(x, y, r, 0, 7); Wx.fill();
        Wx.fillStyle = "rgba(255,255,255,.95)"; Wx.beginPath(); Wx.arc(x - r * .3, y - r * .3, r * .35, 0, 7); Wx.fill();
      }
      if (pr < 1) band = by;
    }
    // first wipe: removes water
    let cl = null;
    if (t >= S.wipe1[0] && t <= S.wipe1[1]) {
      const f = p => [lx + lw * (-.1 + 1.2 * tri(p * 2.2)), cy + Math.sin(p * 14) * lh * .22];
      const [a, b] = pos("cl1", pw1, f); cl = b; erase(0, Wx, a, b, lh * 1.1);
    }
    if (t > S.wipe1[1]) clearL(Wx);
    if (t > S.rinse[1]) { clearL(Dx); clearL(Fx); }

    // polishing: pad erases haze
    let pd = null, glare = 0;
    if (t >= S.polish[0] && t <= S.polish[1]) {
      const f = p => [lx + lw * (-.04 + 1.08 * tri(p * 2.6)) + Math.cos(p * 120) * lh * .08, ly + lh * (.22 + .56 * p) + Math.sin(p * 120) * lh * .08];
      const [a, b] = pos("pd", pp, f); pd = b; erase(0, Hx, a, b, lh * .85); glare = 1;
    }
    // second wipe: cloth buffs the rest
    let cl2 = null;
    if (t >= S.wipe2[0] && t <= S.wipe2[1]) {
      const f = p => [lx + lw * (-.1 + 1.2 * tri(p * 1.5)), cy + Math.sin(p * 10) * lh * .15];
      const [a, b] = pos("cl2", pw2, f); cl2 = b; erase(0, Hx, a, b, lh * 1.2);
    }
    if (t > S.wipe2[1]) clearL(Hx);

    /* ---- compose ---- */
    const fade = ease(seg(...S.fade, t));
    ctx.globalAlpha = fade;
    ctx.drawImage(L, 0, 0, cw, ch);
    ctx.drawImage(H, 0, 0, cw, ch);
    ctx.drawImage(D, 0, 0, cw, ch);
    ctx.drawImage(F, 0, 0, cw, ch);
    // water clipped to letters
    clearL(Tx); Tx.drawImage(W, 0, 0, cw, ch); Tx.globalCompositeOperation = "destination-in"; Tx.setTransform(1, 0, 0, 1, 0, 0); Tx.drawImage(L, 0, 0); Tx.setTransform(DPR, 0, 0, DPR, 0, 0); Tx.globalCompositeOperation = "source-over";
    ctx.drawImage(T, 0, 0, cw, ch);
    ctx.globalAlpha = 1;

    // falling water while rinsing
    if (band !== null) {
      ctx.strokeStyle = "rgba(190,225,255,.5)"; ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) { const x = rr(lx - 10, lx + lw + 10), y1 = rr(-10, band - 20); ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + rr(-2, 2), Math.min(band + 6, y1 + rr(20, 70))); ctx.stroke(); }
    }
    // polisher glare (clipped to letters)
    if (pd && glare) {
      clearL(Tx); const g = Tx.createRadialGradient(pd[0], pd[1], 0, pd[0], pd[1], lh * .9); g.addColorStop(0, "rgba(255,255,255,.75)"); g.addColorStop(1, "rgba(255,255,255,0)");
      Tx.fillStyle = g; Tx.fillRect(0, 0, cw, ch); Tx.globalCompositeOperation = "destination-in"; Tx.setTransform(1, 0, 0, 1, 0, 0); Tx.drawImage(L, 0, 0); Tx.setTransform(DPR, 0, 0, DPR, 0, 0); Tx.globalCompositeOperation = "source-over";
      ctx.globalCompositeOperation = "lighter"; ctx.drawImage(T, 0, 0, cw, ch); ctx.globalCompositeOperation = "source-over";
    }
    // tools on top
    if (this_nozzle) nozzle(this_nozzle[0], this_nozzle[1]);
    if (sp) sponge(sp[0], sp[1], Math.sin(ps * 40) * .25);
    if (cl) cloth(cl[0], cl[1], Math.sin(pw1 * 22) * .12, lw * .17, lh * 1.0);
    if (pd) pad(pd[0], pd[1], lh * .46, pp * 90);
    if (cl2) cloth(cl2[0], cl2[1], Math.sin(pw2 * 22) * .12, lw * .17, lh * 1.0);

    // final shine sweep + sparkle
    const ph = seg(...S.shine, t);
    if (ph > 0 && ph < 1) {
      const bx = lx - lw * .25 + (lw * 1.5) * ease(ph);
      clearL(Tx); const g = Tx.createLinearGradient(bx - lw * .09, 0, bx + lw * .09, lh * .4);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.5, "rgba(255,248,225,.95)"); g.addColorStop(1, "rgba(255,255,255,0)");
      Tx.fillStyle = g; Tx.fillRect(0, 0, cw, ch);
      Tx.globalCompositeOperation = "destination-in"; Tx.setTransform(1, 0, 0, 1, 0, 0); Tx.drawImage(L, 0, 0); Tx.setTransform(DPR, 0, 0, DPR, 0, 0); Tx.globalCompositeOperation = "source-over";
      ctx.globalCompositeOperation = "lighter"; ctx.drawImage(T, 0, 0, cw, ch); ctx.globalCompositeOperation = "source-over";
    }
    if (t > S.shine[0] + .5) {
      const k = Math.sin(clamp(seg(S.shine[0] + .5, S.shine[1] + .6, t)) * Math.PI), x = lx + lw * .93, y = ly + lh * .12, s = lh * .55 * k;
      if (s > 1) {
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(x, y);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * .6); g.addColorStop(0, "rgba(255,240,200,.95)"); g.addColorStop(1, "rgba(248,184,58,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * .6, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,250,235,.95)";
        for (const r of [0, Math.PI / 2]) { ctx.save(); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * .06, s, 0); ctx.quadraticCurveTo(0, s * .06, -s, 0); ctx.fill(); ctx.restore(); }
        ctx.restore();
      }
    }

    // subtitle
    if (t >= S.text[0] && !txt.classList.contains("show")) txt.classList.add("show");
    if (t >= S.shine[0]) cv.classList.add("glow");

    // 3D tilt
    sx += (px - sx) * .06; sy += (py - sy) * .06;
    const settle = 1 - ease(seg(0, 1.2, t));
    stage.style.transform = `perspective(1100px) rotateY(${(-18 * settle + sx * 14 + Math.sin(t * .8) * 2).toFixed(2)}deg) rotateX(${(10 * settle - sy * 10).toFixed(2)}deg) translateZ(0)`;
  }
  let this_nozzle = null;

  function finish(instant) {
    if (done) return; done = true;
    try { sessionStorage.setItem("sm-intro", "1"); } catch (e) {}
    box.classList.add("out");
    root.classList.remove("intro-active");
    setTimeout(() => box.remove(), instant ? 50 : 1000);
  }
  skip.addEventListener("click", () => finish(false));
  addEventListener("keydown", e => e.key === "Escape" && finish(false));
})();
