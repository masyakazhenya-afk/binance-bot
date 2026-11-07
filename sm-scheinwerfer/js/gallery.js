(() => {
  const g = document.getElementById("gallery");
  if (!g) return;
  const slides = [...g.querySelectorAll(".slide")], n = slides.length;
  const stage = g.querySelector(".g-stage"), label = g.querySelector(".g-label"), bar = g.querySelector(".g-bar i"), count = g.querySelector(".g-count");
  const DUR = 4600; let cur = -1, timer;
  g.style.setProperty("--dur", DUR + "ms");

  function show(i) {
    const prev = cur; cur = (i + n) % n;
    slides.forEach((s, k) => {
      s.classList.remove("is-active", "is-next", "is-prev", "enter");
      if (k === cur) s.classList.add("is-active");
      else if (k === (cur + 1) % n) s.classList.add("is-next");
      else if (n > 2 && k === (cur - 1 + n) % n) s.classList.add("is-prev");
    });
    void slides[cur].offsetWidth; slides[cur].classList.add("enter");
    label.style.opacity = 0; setTimeout(() => { label.textContent = slides[cur].dataset.label || ""; label.style.opacity = 1; }, 250);
    count.innerHTML = `<b>${String(cur + 1).padStart(2, "0")}</b> / ${String(n).padStart(2, "0")}`;
    bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run");
    clearTimeout(timer); if (n > 1) timer = setTimeout(() => show(cur + 1), DUR);
  }

  // pointer parallax
  g.addEventListener("pointermove", e => {
    const r = g.getBoundingClientRect();
    g.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 14 + "deg");
    g.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - .5)) * 10 + "deg");
  });
  g.addEventListener("pointerleave", () => { g.style.setProperty("--ry", "0deg"); g.style.setProperty("--rx", "0deg"); });
  g.addEventListener("click", () => show(cur + 1));
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else show(cur); });

  const start = () => show(0);
  const root = document.documentElement;
  if (root.classList.contains("intro-active")) {
    const mo = new MutationObserver(() => { if (!root.classList.contains("intro-active")) { mo.disconnect(); setTimeout(start, 300); } });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  } else start();
})();
