/* Loads the 3D intro (WebGL); falls back to the lightweight 2D intro if WebGL/module is unavailable. */
(() => {
  if (!document.documentElement.classList.contains("intro-active")) return;
  const fallback = () => {
    const old = document.getElementById("introCanvas");
    if (old) { const c = document.createElement("canvas"); c.id = "introCanvas"; old.replaceWith(c); }
    const s = document.createElement("script"); s.src = "js/intro.js"; document.body.appendChild(s);
  };
  let ok = false;
  try { const c = document.createElement("canvas"); ok = !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) {}
  if (!ok) return fallback();
  import("./intro3d.js").catch(e => { console.warn("3D intro unavailable, using 2D", e); fallback(); });
})();
