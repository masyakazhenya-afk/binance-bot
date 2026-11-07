const WA = "4915567463623";
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Header
const header = $("header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 30), { passive: true });
const burger = $(".burger"), menu = $(".menu");
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  menu.classList.toggle("open");
});
$$(".menu a").forEach(a => a.addEventListener("click", () => {
  burger.classList.remove("open");
  menu.classList.remove("open");
}));

// Scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .15 });
$$(".rv").forEach(el => io.observe(el));

// Active menu item for on-page sections
const links = $$('.menu a[href*="#"]');
const secs = links.map(a => $(a.getAttribute("href").slice(a.getAttribute("href").indexOf("#")))).filter(Boolean);
if (secs.length && !location.pathname.match(/(ueber|einsatz|termin)/)) {
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href").endsWith("#" + e.target.id)));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach(s => so.observe(s));
}

// Glow follows cursor on cards
$$(".card").forEach(c => c.addEventListener("pointermove", e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty("--mx", e.clientX - r.left + "px");
  c.style.setProperty("--my", e.clientY - r.top + "px");
}));

// Before / After slider
$$(".ba").forEach(ba => {
  const after = $(".after", ba), bar = $(".bar", ba), knob = $(".knob", ba);
  const set = x => {
    const r = ba.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
    after.style.clipPath = `inset(0 0 0 ${p}%)`;
    bar.style.left = knob.style.left = p + "%";
  };
  let drag = false;
  ba.addEventListener("pointerdown", e => { drag = true; ba.setPointerCapture(e.pointerId); set(e.clientX); });
  ba.addEventListener("pointermove", e => drag && set(e.clientX));
  ba.addEventListener("pointerup", () => drag = false);
});
