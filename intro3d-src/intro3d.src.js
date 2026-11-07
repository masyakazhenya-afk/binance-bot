/* SM Scheinwerfer – 3D logo cleaning intro (Three.js).
   Real 3D extruded SM letters (PBR metal), dirt -> foam -> sponge -> rinse -> cloth -> polisher -> cloth -> shine. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import SHAPES from "./shapes.json";

const root = document.documentElement;
const box = document.getElementById("intro");
if (!box || !root.classList.contains("intro-active")) throw new Error("no-intro");

const oldCv = document.getElementById("introCanvas");
const txt = document.getElementById("introText");
const stage = document.getElementById("introStage");
const skip = document.getElementById("introSkip");

/* ---------- renderer (throws -> loader falls back to 2D intro) ---------- */
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const RATE = 2.15;
const vw = Math.min(window.innerWidth * 0.94, 820);
const cw = vw, ch = vw * 0.5;
const canvas = document.createElement("canvas");
canvas.id = "introCanvas";
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(DPR);
renderer.setSize(cw, ch, false);
canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
oldCv.replaceWith(canvas);

/* ---------- helpers ---------- */
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rr = (a, b) => a + (b - a) * rnd();
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (a, b, t) => clamp((t - a) / (b - a));
const ease = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const easeOut = p => 1 - Math.pow(1 - p, 3);
const tri = x => 1 - Math.abs((((x % 2) + 2) % 2) - 1);
const lerp = (a, b, k) => a + (b - a) * k;

const S = {
  fade: [0, 0.95], foam: [1.1, 2.4], scrub: [2.5, 4.3], rinse: [4.4, 5.5],
  wipe1: [5.6, 6.5], polish: [6.6, 8.1], wipe2: [8.1, 8.8], shine: [8.8, 9.9],
  text: [9.4, 10.8], end: 12.1
};

/* world units: logo rect */
const LW = 6, LH = LW * SHAPES.h / SHAPES.w, HW = LW / 2, HH = LH / 2;
const px2w = (x, y) => [(x / SHAPES.w - 0.5) * LW, (0.5 - y / SHAPES.h) * LH];
const toW = (fx, fy) => [-HW + LW * fx, HH - LH * fy];
const polyW = pts => pts.map(p => px2w(p[0], p[1]));
const POLYS = [polyW(SHAPES.S), polyW(SHAPES.M)];
const inside = (x, y) => POLYS.some(poly => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
});

/* ---------- scene ---------- */
const scene = new THREE.Scene();
const FOV = 16;
const camera = new THREE.PerspectiveCamera(FOV, cw / ch, 0.1, 60);
const camDist = (LW / 0.84) / (2 * Math.tan((FOV * Math.PI) / 360) * (cw / ch));
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.75;

const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
key.position.set(3.5, 4.5, 6); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -5, right: 5, top: 3.4, bottom: -3.4, near: 1, far: 20 });
key.shadow.bias = -0.0005; key.shadow.radius = 5;
scene.add(key);
const rim = new THREE.DirectionalLight(0x9fc4ff, 0.9); rim.position.set(-5, 2, -3); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const glint = new THREE.PointLight(0xffffff, 0, 14, 1.6); glint.position.set(0, 0, 1.4); scene.add(glint);

/* ---------- 3D letters ---------- */
const logo = new THREE.Group(); scene.add(logo);
const DEPTH = 0.42, BEV = 0.06, FRONT = DEPTH / 2 + BEV;
const letterMats = [
  new THREE.MeshPhysicalMaterial({ color: 0xd4d8de, metalness: 1, roughness: 0.65, clearcoat: 0.5, clearcoatRoughness: 0.15, envMapIntensity: 1.1 }),
  new THREE.MeshPhysicalMaterial({ color: 0xd9972a, metalness: 1, roughness: 0.65, clearcoat: 0.5, clearcoatRoughness: 0.15, envMapIntensity: 1.0 })
];
const cleanCols = [new THREE.Color(0xd4d8de), new THREE.Color(0xd9972a)];
const dirtCol = new THREE.Color(0x3a3126);

const shapes = POLYS.map(poly => new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], p[1]))));
shapes.forEach((sh, i) => {
  const g = new THREE.ExtrudeGeometry(sh, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEV, bevelSize: 0.045, bevelSegments: 5, curveSegments: 1 });
  g.translate(0, 0, -DEPTH / 2);
  const m = new THREE.Mesh(g, letterMats[i]); m.castShadow = true; m.receiveShadow = true; logo.add(m);
});

/* canvas layers laid over the letter fronts */
const TW = 1024, TH = Math.round(TW * LH / LW);
const mkLayer = () => { const c = document.createElement("canvas"); c.width = TW; c.height = TH; const x = c.getContext("2d"); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, x, t }; };
const grime = mkLayer(), haze = mkLayer(), water = mkLayer();
const w2c = (x, y) => [(x / LW + 0.5) * TW, (0.5 - y / LH) * TH];
const SC = TW / LW;                                    // px per world unit

function overlayGeo(sh) {
  const g = new THREE.ShapeGeometry(sh, 4), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / LW + 0.5, p.getY(i) / LH + 0.5);
  return g;
}
const overlayMats = {
  grime: new THREE.MeshStandardMaterial({ map: grime.t, transparent: true, roughness: 0.95, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  haze: new THREE.MeshStandardMaterial({ map: haze.t, transparent: true, roughness: 0.6, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
  water: new THREE.MeshPhysicalMaterial({ map: water.t, transparent: true, roughness: 0.05, metalness: 0, clearcoat: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
};
[["grime", 0.004], ["haze", 0.008], ["water", 0.012]].forEach(([k, dz]) => {
  shapes.forEach(sh => { const m = new THREE.Mesh(overlayGeo(sh), overlayMats[k]); m.position.z = FRONT + dz; m.receiveShadow = true; logo.add(m); });
});

/* paint grime + haze */
(function paint() {
  const g = grime.x;
  g.fillStyle = "rgba(76,62,46,.9)"; g.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 700; i++) {
    const x = rr(0, TW), y = rr(0, TH), r = rr(4, 38), c = rnd() < 0.5 ? "40,30,20" : rnd() < 0.5 ? "104,86,62" : "126,126,122";
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${rr(0.25, 0.65)})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  for (let i = 0; i < 110; i++) { const x = rr(0, TW), y = rr(0, TH * 0.6), l = rr(0.15, 0.6) * TH; g.strokeStyle = `rgba(28,20,12,${rr(0.15, 0.45)})`; g.lineWidth = rr(1, 4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-4, 4), y + l); g.stroke(); }
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "20,16,12" : "160,150,130"},${rr(0.2, 0.7)})`; g.fillRect(rr(0, TW), rr(0, TH), rr(1, 3), rr(1, 3)); }
  grime.t.needsUpdate = true;
  const h = haze.x;
  h.fillStyle = "rgba(206,206,212,.52)"; h.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 0; i++) { const x = rr(0, TW), y = rr(0, TH), r = rr(20, 90); h.strokeStyle = `rgba(255,255,255,${rr(0.08, 0.26)})`; h.lineWidth = rr(0.8, 2.2); h.beginPath(); h.arc(x, y, r, rr(0, 6), rr(0, 6) + 2); h.stroke(); }
  haze.t.needsUpdate = true;
})();

const stroke = (L, a, b, w) => {
  const x = L.x; x.save(); x.globalCompositeOperation = "destination-out"; x.lineCap = x.lineJoin = "round"; x.lineWidth = w;
  const A = w2c(a[0], a[1]), B = w2c(b[0], b[1]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); x.restore(); L.t.needsUpdate = true;
};
const clearLayer = L => { L.x.clearRect(0, 0, TW, TH); L.t.needsUpdate = true; };

/* ---------- foam (instanced 3D bubbles) ---------- */
const NF = 1500;
const foamMat = new THREE.MeshPhysicalMaterial({ color: 0xf6f9fb, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.9, iridescenceIOR: 1.35, iridescenceThicknessMinimum: 200, iridescenceThicknessMaximum: 500, envMapIntensity: 1.2 });
const foam = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), foamMat, NF);
foam.castShadow = false; foam.receiveShadow = true; foam.frustumCulled = false; scene.add(foam);
const F = { x: new Float32Array(NF), y: new Float32Array(NF), z: new Float32Array(NF), s: new Float32Array(NF), t: new Float32Array(NF), vy: new Float32Array(NF), gone: new Uint8Array(NF) };
let fNext = 0;
const dummy = new THREE.Object3D();
function addBubble(x, y, big = 1) {
  const i = fNext++ % NF;
  F.x[i] = x; F.y[i] = y; F.z[i] = FRONT + rr(0.02, 0.2) * big; F.s[i] = 0.01; F.t[i] = rr(0.05, 0.15) * big * (rnd() < 0.15 ? 1.6 : 1); F.vy[i] = 0; F.gone[i] = 0;
}
function foamAt(x, y, n, spread) {
  for (let k = 0; k < n; k++) {
    for (let tries = 0; tries < 3; tries++) {
      const a = rnd() * 6.28, d = Math.sqrt(rnd()) * spread, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.8;
      if (inside(px, py) || (tries === 2 && rnd() < 0.18 && Math.abs(px) < HW * 1.02)) { if (inside(px, py) || tries === 2) addBubble(px, py); break; }
    }
  }
}
function updateFoam(dt, bandY) {
  for (let i = 0; i < NF; i++) {
    if (F.t[i] === 0 && F.s[i] < 0.002) { dummy.scale.setScalar(0.0001); dummy.updateMatrix(); foam.setMatrixAt(i, dummy.matrix); continue; }
    if (bandY !== null && !F.gone[i] && F.y[i] > bandY - 0.1) { F.gone[i] = 1; F.vy[i] = -rr(0.1, 0.5); }
    if (F.gone[i]) { F.vy[i] -= 2.2 * dt; F.y[i] += F.vy[i] * dt; F.t[i] = Math.max(0, F.t[i] - dt * 0.12); F.s[i] -= dt * 0.1; if (F.s[i] < 0) F.s[i] = 0; }
    else F.s[i] += (F.t[i] - F.s[i]) * Math.min(1, dt * 14);
    dummy.position.set(F.x[i], F.y[i], F.z[i]); dummy.scale.setScalar(Math.max(F.s[i], 0.0001)); dummy.updateMatrix(); foam.setMatrixAt(i, dummy.matrix);
  }
  foam.instanceMatrix.needsUpdate = true;
}
function killFoam() { F.t.fill(0); F.s.fill(0); F.gone.fill(0); }

/* ---------- procedural textures for tools ---------- */
const cvTex = (w, h, draw, repeat) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(...repeat); t.colorSpace = THREE.SRGBColorSpace; return t; };
const poreTex = cvTex(256, 256, (g, w, h) => { g.fillStyle = "#888"; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { const x = rr(0, w), y = rr(0, h), r = rr(3, 11); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "#111"); gr.addColorStop(1, "#888"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } });
poreTex.colorSpace = THREE.NoColorSpace;
const weaveTex = cvTex(128, 128, (g, w, h) => { g.fillStyle = "#777"; g.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 4) { g.fillStyle = i % 8 ? "#999" : "#555"; g.fillRect(i, 0, 2, h); g.fillStyle = i % 8 ? "#555" : "#999"; g.fillRect(0, i, w, 2); } }, [8, 6]);
weaveTex.colorSpace = THREE.NoColorSpace;
const padTex = cvTex(256, 256, (g, w, h) => { g.fillStyle = "#ee8a22"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.22)"; for (let r = 20; r < 128; r += 14) { g.lineWidth = 3; g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); } g.fillStyle = "#222"; g.beginPath(); g.arc(128, 128, 14, 0, 7); g.fill(); });

/* ---------- tools ---------- */
const matte = (c, r = 0.7, m = 0.1) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const shadowed = o => { o.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } }); return o; };

// sponge
const sponge = new THREE.Group();
{
  const y = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.66, 0.3, 5, 0.09), new THREE.MeshStandardMaterial({ color: 0xf2d04c, roughness: 0.95, bumpMap: poreTex, bumpScale: 6 }));
  y.position.z = 0.09;
  const g = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.66, 0.12, 4, 0.05), new THREE.MeshStandardMaterial({ color: 0x2f9a55, roughness: 1, bumpMap: weaveTex, bumpScale: 3 }));
  g.position.z = -0.12;
  sponge.add(y, g); shadowed(sponge);
}
// microfibre cloth
const clothGeo = new THREE.PlaneGeometry(1.5, 1.15, 34, 26);
const clothBase = clothGeo.attributes.position.array.slice();
const cloth = new THREE.Mesh(clothGeo, new THREE.MeshStandardMaterial({ color: 0x2f7fcb, roughness: 1, side: THREE.DoubleSide, bumpMap: weaveTex, bumpScale: 2 }));
cloth.castShadow = true; cloth.receiveShadow = true;
// polisher
const polisher = new THREE.Group(), padG = new THREE.Group();
{
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.16, 64).rotateX(Math.PI / 2), matte(0xee8a22, 0.95));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.68, 64), new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.95 })); face.position.z = -0.081; face.rotation.y = Math.PI;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 48).rotateX(Math.PI / 2), matte(0x1c1c1e, 0.5, 0.6)); plate.position.z = 0.115;
  padG.add(pad, face, plate); padG.position.z = 0;
  const head = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.44, 0.08], [0.38, 0.24], [0.3, 0.42], [0.18, 0.5], [0, 0.52]].map(p => new THREE.Vector2(p[0], p[1])), 48).rotateX(Math.PI / 2), matte(0x151517, 0.45, 0.35));
  head.position.z = 0.16;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.022, 14, 64), matte(0xf1b94b, 0.25, 1)); ring.position.z = 0.26;
  const dir = new THREE.Vector3(0.85, 0.5, 0.62).normalize(), L = 1.5;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, L, 10, 28), matte(0x121214, 0.35, 0.3));
  body.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); body.position.set(0, 0, 0.58).addScaledVector(dir, L / 2 + 0.05);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 28), matte(0x6b6b70, 0.4, 0.7)); band.quaternion.copy(body.quaternion); band.position.copy(body.position).addScaledVector(dir, 0.35);
  const hand = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 8, 18), matte(0x1d1d20, 0.8)); hand.position.set(0.28, 0.5, 0.85); hand.rotation.z = Math.PI / 2.8;
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62 * SHAPES.h / SHAPES.w), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
  decal.quaternion.copy(body.quaternion); decal.position.copy(body.position).addScaledVector(dir, -0.12); decal.position.z += 0.2; decal.rotateX(-0.25);
  const im = new Image(); im.src = "assets/logo-sm.png";
  im.onload = () => { const c = document.createElement("canvas"); c.width = 512; c.height = Math.round(512 * im.height / im.width); const g = c.getContext("2d"); g.drawImage(im, 0, 0, c.width, c.height); g.globalCompositeOperation = "source-in"; g.fillStyle = "#f4f4f4"; g.fillRect(0, 0, c.width, c.height); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; decal.material.map = t; decal.material.needsUpdate = true; };
  polisher.add(padG, head, ring, body, band, hand, decal); shadowed(polisher);
}
// foam spray bottle
const bottle = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.9, 40), new THREE.MeshPhysicalMaterial({ color: 0x1a1c20, roughness: 0.3, metalness: 0.2, clearcoat: 1 }));
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.34, 40), matte(0xf1b94b, 0.35, 0.8)); label.position.y = -0.05;
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.24, 0.2, 40), matte(0x1a1c20, 0.3, 0.2)); shoulder.position.y = 0.55;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 24), matte(0xe9e9ec, 0.4)); neck.position.y = 0.72;
  const head = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.2, 0.22, 4, 0.05), matte(0x0d0d0f, 0.35, 0.3)); head.position.set(-0.12, 0.88, 0);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 16).rotateZ(Math.PI / 2), matte(0xf1b94b, 0.3, 0.9)); nozzle.position.set(-0.4, 0.88, 0);
  const trig = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.3, 0.1, 3, 0.03), matte(0x0d0d0f, 0.4)); trig.position.set(-0.05, 0.7, 0); trig.rotation.z = 0.35;
  bottle.add(body, label, shoulder, neck, head, nozzle, trig); shadowed(bottle);
}
// spray droplets (flying from nozzle)
const NSP = 90;
const spray = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, clearcoat: 1 }), NSP);
spray.frustumCulled = false; scene.add(spray);
const SP = Array.from({ length: NSP }, () => ({ a: 0, t: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), r: 0.03 }));
let spNext = 0;

// rain for rinse
const NR = 140;
const rain = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.012, 0.22, 3, 6), new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.6, roughness: 0.05, clearcoat: 1 }), NR);
rain.frustumCulled = false; scene.add(rain);
const RN = Array.from({ length: NR }, () => ({ x: rr(-HW - 0.2, HW + 0.2), y: 0, z: FRONT + rr(0.05, 0.4), v: rr(3, 5.5), off: rr(0, 1.2) }));

// glint star sprite
const starTex = cvTex(256, 256, (g, w, h) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,246,220,1)"); gr.addColorStop(0.18, "rgba(255,226,150,.55)"); gr.addColorStop(1, "rgba(248,184,58,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,252,240,.95)";
  for (const r of [0, Math.PI / 2]) { g.save(); g.translate(128, 128); g.rotate(r); g.beginPath(); g.moveTo(-126, 0); g.quadraticCurveTo(0, -5, 126, 0); g.quadraticCurveTo(0, 5, -126, 0); g.fill(); g.restore(); }
});
const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); star.visible = false; scene.add(star);
star.position.set(...px2w(1240, 40), FRONT + 0.1);

[sponge, cloth, polisher, bottle].forEach(o => { o.visible = false; scene.add(o); });

/* the REAL logo: the intro ends by dissolving into the original artwork (exact shapes, no re-drawn geometry) */
const origTex = new THREE.TextureLoader().load("assets/logo-sm.png"); origTex.colorSpace = THREE.SRGBColorSpace; origTex.anisotropy = 8;
const ORIG_Z = FRONT + 0.06;
const orig = new THREE.Mesh(new THREE.PlaneGeometry(LW, LH), new THREE.MeshBasicMaterial({ map: origTex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
orig.position.z = ORIG_Z; orig.scale.setScalar((camDist - ORIG_Z) / camDist); orig.visible = false; scene.add(orig);

/* ---------- animation ---------- */
let done = false, t0 = null, tPrev = 0, px = 0, py = 0, sx = 0, sy = 0;
const prev = {};
const stepPath = (k, p) => { const pr = prev[k] || p; prev[k] = p; return [pr, p]; };
addEventListener("pointermove", e => { if (e.pointerType === "touch") return; px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; });
const spawnSpray = (from, to) => { const s = SP[spNext++ % NSP]; s.from.copy(from); s.to.copy(to); s.a = 0; s.t = rr(0.18, 0.3); s.r = rr(0.02, 0.05); };

function frame(now) {
  if (done) return;
  if (t0 === null) t0 = now;
  try {
    const t = ((now - t0) / 1000) * RATE, dt = Math.min(0.05, Math.max(0.001, t - tPrev)); tPrev = t;
    sim(t, dt); render(t);
    if (t >= S.end) return finish(false);
    requestAnimationFrame(frame);
  } catch (e) { console.warn("intro3d runtime error", e); finish(true); }
}

let dtNow = 0.016;
function sim(t, dt) {
  dtNow = dt;
  const pf = seg(...S.foam, t), ps = seg(...S.scrub, t), pr = seg(...S.rinse, t), pw1 = seg(...S.wipe1, t), pp = seg(...S.polish, t), pw2 = seg(...S.wipe2, t);
  bottle.visible = sponge.visible = cloth.visible = polisher.visible = false;
  let bandY = null;

  // 1. foam spray from a bottle
  if (t >= S.foam[0] && t <= S.foam[1] + 0.12) {
    const q = Math.min(pf, 1), row = q < 0.5 ? 0.3 : 0.7, u = (q % 0.5) / 0.5, fx = -0.05 + 1.1 * (q < 0.5 ? u : 1 - u);
    const tgt = toW(fx, row);
    bottle.visible = true; bottle.scale.setScalar(0.62); bottle.position.set(tgt[0] + 0.75, tgt[1] + 0.2, 1.0); bottle.rotation.set(0.15, 0.4, -1.05 + Math.sin(t * 22) * 0.02);
    const nozzle = new THREE.Vector3(tgt[0] + 0.75 - 0.26, tgt[1] + 0.2 + 0.2, 0.98);
    for (let k = 0; k < 4; k++) spawnSpray(nozzle, new THREE.Vector3(tgt[0] + rr(-0.25, 0.25), tgt[1] + rr(-0.22, 0.22), FRONT + 0.1));
    foamAt(tgt[0], tgt[1], 12, 0.55);
  }
  // spray droplets
  for (let i = 0; i < NSP; i++) {
    const s = SP[i];
    if (s.a < 1) { s.a += dt / s.t; if (s.a >= 1) { s.a = 2; if (inside(s.to.x, s.to.y)) addBubble(s.to.x, s.to.y); } }
    if (s.a < 1) { dummy.position.lerpVectors(s.from, s.to, s.a); dummy.position.y += Math.sin(s.a * Math.PI) * 0.05; dummy.scale.setScalar(s.r); } else dummy.scale.setScalar(0.0001);
    dummy.updateMatrix(); spray.setMatrixAt(i, dummy.matrix);
  }
  spray.instanceMatrix.needsUpdate = true;

  // 2. sponge scrubbing
  if (t >= S.scrub[0] && t <= S.scrub[1]) {
    const f = p => toW(-0.05 + 1.1 * tri(p * 3.5), 0.2 + 0.6 * p + Math.sin(p * 60) * 0.06);
    const [a, b] = stepPath("sp", f(ps));
    sponge.visible = true;
    const press = 0.5 + 0.5 * Math.sin(ps * 80);
    sponge.position.set(b[0], b[1], FRONT + 0.3 + 0.18 * (1 - press)); sponge.rotation.set(Math.sin(ps * 50) * 0.18, Math.sin(ps * 33) * 0.2, Math.sin(ps * 41) * 0.22);
    sponge.scale.set(1 + press * 0.06, 1 - press * 0.1, 1 - press * 0.15);
    stroke(grime, a, b, 0.9 * SC); stroke(haze, a, b, 0.0);
    foamAt(b[0], b[1], 14, 0.55);
  }
  // 3. rinse: water sweeps down, foam slides off
  if (t >= S.rinse[0]) {
    const p = ease(pr), top = HH + 0.5, bot = -HH - 0.5, by = lerp(top, bot, p), pby = prev.band ?? by + 0.01; prev.band = by;
    bandY = pr < 1 ? by : -9;
    // clear grime above band (wavy edge)
    const gx = grime.x; gx.save(); gx.globalCompositeOperation = "destination-out"; gx.beginPath(); gx.moveTo(0, 0); gx.lineTo(TW, 0);
    for (let x = TW; x >= 0; x -= 16) gx.lineTo(x, w2c(0, by + Math.sin(x * 0.03 + t * 9) * 0.06)[1]); gx.closePath(); gx.fill(); gx.restore(); grime.t.needsUpdate = true;
    // wet film + droplets in freshly cleared strip
    const wy = w2c(0, Math.max(by, pby) + 0.05)[1], wy2 = w2c(0, Math.min(by, pby) - 0.02)[1];
    water.x.fillStyle = "rgba(190,224,255,.22)"; water.x.fillRect(0, wy, TW, Math.max(2, wy2 - wy));
    if (pr < 1) for (let i = 0; i < 12; i++) { const x = rr(0, TW), y = rr(Math.min(wy, wy2), Math.max(wy, wy2)), r = rr(1.5, 5); water.x.fillStyle = "rgba(210,232,255,.55)"; water.x.beginPath(); water.x.arc(x, y, r, 0, 7); water.x.fill(); water.x.fillStyle = "rgba(255,255,255,.95)"; water.x.beginPath(); water.x.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); water.x.fill(); }
    water.t.needsUpdate = true;
    rain.visible = pr < 1;
    for (let i = 0; i < NR; i++) { const r = RN[i]; r.y = by + 1.2 - ((t * r.v * 0.6 + r.off) % 1) * 1.2; dummy.position.set(r.x, r.y, r.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, pr < 1 ? 1 : 0.0001, 1); dummy.updateMatrix(); rain.setMatrixAt(i, dummy.matrix); }
    rain.instanceMatrix.needsUpdate = true;
  } else rain.visible = false;
  if (t > S.rinse[1]) { clearLayer(grime); }

  // 4. cloth wipes
  const clothAt = (key, p, n, sweeps, ampY, mx) => {
    const f = q => toW(-0.1 + 1.2 * tri(q * sweeps), 0.5 + Math.sin(q * n) * ampY);
    const [a, b] = stepPath(key, f(p)); cloth.visible = true;
    const vx = clamp((b[0] - a[0]) / Math.max(dtNow, 0.001), -9, 9), vy = clamp((b[1] - a[1]) / Math.max(dtNow, 0.001), -9, 9);
    const pos = clothGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = clothBase[i * 3], by = clothBase[i * 3 + 1], u = bx / 0.75, v = by / 0.575;
      const wave = 0.05 * Math.sin(bx * 5 + t * 10) * Math.cos(by * 4 + t * 3) + 0.09 * (u * u * 0.6 + v * v * 0.3) + 0.012 * Math.sin(t * 14 + u * 3) * Math.abs(vx);
      pos.setXYZ(i, bx - vx * 0.05 * v * v, by - vy * 0.03 * u * u, wave);
    }
    pos.needsUpdate = true; clothGeo.computeVertexNormals();
    cloth.position.set(b[0], b[1], FRONT + 0.2); cloth.rotation.set(Math.sin(t * 9) * 0.05, Math.sin(t * 7) * 0.1, Math.sin(p * 20) * 0.1);
    return [a, b];
  };
  if (t >= S.wipe1[0] && t <= S.wipe1[1]) { const [a, b] = clothAt("cl1", pw1, 14, 2.2, 0.22); stroke(water, a, b, 1.15 * SC); }
  if (t > S.wipe1[1]) clearLayer(water);

  // 5. polisher
  if (t >= S.polish[0] && t <= S.polish[1]) {
    const f = p => { const b = toW(-0.04 + 1.08 * tri(p * 2.6), 0.22 + 0.56 * p); return [b[0] + Math.cos(p * 120) * 0.08, b[1] + Math.sin(p * 120) * 0.08]; };
    const [a, b] = stepPath("pd", f(pp)); polisher.visible = true;
    polisher.position.set(b[0], b[1], FRONT + 0.17); polisher.rotation.set(0.05, -0.05, 0); padG.rotation.z += dt * 60;
    stroke(haze, a, b, 1.0 * SC);
    glint.position.set(b[0] + 0.5, b[1] + 0.45, 1.3); glint.intensity = 14;
  }
  if (t > S.polish[1] && t < S.shine[0]) glint.intensity = 0;
  // 6. final buff
  if (t >= S.wipe2[0] && t <= S.wipe2[1]) { const [a, b] = clothAt("cl2", pw2, 10, 1.5, 0.15); stroke(haze, a, b, 1.25 * SC); }
  if (t > S.wipe2[1]) clearLayer(haze);

  // letters: dirty -> clean tint, roughness -> mirror
  const clean = clamp(seg(S.scrub[0], S.rinse[1], t)), pol = clamp(seg(S.polish[0], S.wipe2[1], t));
  letterMats.forEach((m, i) => { m.color.lerpColors(dirtCol, cleanCols[i], clean); m.roughness = lerp(0.7, 0.26, ease(pol)); m.clearcoat = lerp(0.1, 0.45, pol); });

  updateFoam(dt, bandY);
  if (t > S.rinse[1] + 0.4 && t < S.rinse[1] + 0.5) killFoam();

  // 7. shine sweep + star
  const ph = seg(...S.shine, t);
  if (ph > 0 && ph < 1) { const x = lerp(-HW - 1.2, HW + 1.2, ease(ph)); glint.position.set(x, 0.5, 1.3); glint.intensity = 30 * Math.sin(ph * Math.PI); } else if (t > S.shine[1]) glint.intensity = 0;
  const sk = Math.sin(clamp(seg(S.shine[0] + 0.5, S.shine[1] + 0.6, t)) * Math.PI);
  star.visible = sk > 0.01; star.scale.setScalar(1.4 * sk + 0.01); star.material.rotation = t * 0.6;

  const cf = ease(seg(S.shine[0] + 0.25, S.shine[1] + 0.55, t));                 // dissolve 3D metal -> original artwork
  orig.visible = cf > 0; orig.material.opacity = cf;
  letterMats.forEach(m => { m.transparent = true; m.opacity = 1 - cf; });
  logo.children.forEach(c => { if (c.material && c.material.map) c.visible = cf < 1; });
  if (t >= S.text[0] && !txt.classList.contains("show")) txt.classList.add("show");
  if (t >= S.shine[0]) canvas.classList.add("glow");
}

function render(t) {
  const fade = easeOut(seg(...S.fade, t));
  logo.position.z = lerp(-2.4, 0, fade); logo.rotation.y = lerp(1.0, 0, fade); logo.scale.setScalar(lerp(0.7, 1, fade));
  const calm = 1 - ease(seg(S.wipe2[0], S.shine[0], t));          // pointer tilt fades out so the final logo is dead straight
  sx += (px * calm - sx) * 0.06; sy += (py * calm - sy) * 0.06;
  const settle = 1 - ease(seg(0, 1.6, t)), th = -0.55 * settle + sx * 0.16, ph = 0.22 * settle - sy * 0.1;
  const d = camDist * lerp(1, 0.97, seg(S.shine[0], S.end, t));
  camera.position.set(Math.sin(th) * d, Math.sin(ph) * d, Math.cos(th) * Math.cos(ph) * d); camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

function finish(instant) {
  if (done) return; done = true;
  try { sessionStorage.setItem("sm-intro", "1"); } catch (e) {}
  box.classList.add("out"); root.classList.remove("intro-active");
  setTimeout(() => { box.remove(); renderer.dispose(); }, instant ? 50 : 1000);
}
skip.addEventListener("click", () => finish(false));
addEventListener("keydown", e => e.key === "Escape" && finish(false));

txt.style.width = cw * 0.84 * 0.875 + "px";
stage.style.setProperty("--pull", -((ch - cw * 0.84 * LH / LW) / 2) + cw * 0.03 + "px");
try { sim(0, 0.016); render(0); } catch (e) { console.warn(e); }
const dbg = new URLSearchParams(location.search).get("introT");     // ?introT=3.2 -> render one frame at t=3.2 (testing)
if (dbg !== null) {
  const T = parseFloat(dbg) || 0; let tt = 0;
  while (tt < T) { tt += 0.034; sim(tt, 0.034); }
  render(T); setInterval(() => render(T), 150); window.__introReady = true;
} else requestAnimationFrame(frame);
