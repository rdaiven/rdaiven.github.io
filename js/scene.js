/* =====================================================
   scene.js — Three.js 3D scenes (ES module / CDN)
   - Hero: floating workstation + nodes + data flow
   - Stack: draggable orbit of technology labels
   - Contact: ambient particle field
   Gracefully degrades if WebGL is unavailable.
   ===================================================== */

(async function () {
  "use strict";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let THREE;
document.body.classList.add("no-webgl");
try {
  THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
} catch (e) {
  document.body.classList.add("no-webgl");
}

/* WebGL capability check */
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch (_) { return false; }
}

if (!THREE || !hasWebGL()) {
  document.body.classList.add("no-webgl");
} else {
  document.body.classList.remove("no-webgl");
  initHero();
  initStack();
  initContact();
}

/* ----------------------------------------------------
   Shared helpers
---------------------------------------------------- */
function makeRenderer(canvas, alpha = true) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.setClearColor(0x000000, 0);
  return r;
}

// Only animate scenes that are on screen (perf)
function whenVisible(el, onIn, onOut) {
  if (!("IntersectionObserver" in window)) { onIn(); return; }
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => (e.isIntersecting ? onIn() : onOut())),
    { threshold: 0.05 }
  );
  io.observe(el);
}

/* ====================================================
   1. HERO SCENE — floating workstation
==================================================== */
function initHero() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.3, 8.5);

  const renderer = makeRenderer(canvas);

  const root = new THREE.Group();
  scene.add(root);

  const EM = 0x34e2a8, VI = 0x8b7bff;

  /* --- Main "browser window" panel --- */
  const panelGeo = new THREE.PlaneGeometry(3.4, 2.2, 1, 1);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0x0e0e15, transparent: true, opacity: 0.92 });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(0, 0.2, 0);
  root.add(panel);

  // panel border (wireframe edge)
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.4, 2.2)),
    new THREE.LineBasicMaterial({ color: EM, transparent: true, opacity: 0.5 })
  );
  panel.add(edge);

  // top bar dots
  const dotGeo = new THREE.CircleGeometry(0.045, 16);
  [-1.5, -1.38, -1.26].forEach((x, i) => {
    const d = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: i === 0 ? EM : 0x44464f }));
    d.position.set(x, 1.05, 0.01);
    panel.add(d);
  });

  // "code lines" inside panel
  const lineWidths = [2.4, 1.6, 2.0, 1.2, 1.8, 1.0];
  lineWidths.forEach((w, i) => {
    const g = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 0.075),
      new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? EM : 0x2a2c38, transparent: true, opacity: i % 3 === 0 ? 0.65 : 1 })
    );
    g.position.set(-1.7 + w / 2, 0.62 - i * 0.27, 0.01);
    panel.add(g);
  });

  /* --- Floating secondary glass cards --- */
  function glassCard(w, h, color, opacity) {
    const grp = new THREE.Group();
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: 0x12121b, transparent: true, opacity })
    );
    const ed = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
    );
    grp.add(face, ed);
    return grp;
  }
  const cardA = glassCard(1.5, 0.95, VI, 0.85);
  cardA.position.set(-2.4, 1.05, 1.1);
  cardA.rotation.y = 0.5;
  root.add(cardA);

  const cardB = glassCard(1.3, 0.85, EM, 0.85);
  cardB.position.set(2.3, -0.85, 0.9);
  cardB.rotation.y = -0.5;
  root.add(cardB);

  // mini bar chart on cardB
  [0.35, 0.6, 0.45, 0.75].forEach((hh, i) => {
    const b = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, hh),
      new THREE.MeshBasicMaterial({ color: EM, transparent: true, opacity: 0.8 })
    );
    b.position.set(-0.45 + i * 0.22, -0.42 + hh / 2, 0.02);
    cardB.add(b);
  });

  /* --- Connected nodes + data flow --- */
  const nodeGroup = new THREE.Group();
  root.add(nodeGroup);
  const nodePositions = [
    [-3.0, -1.3, 0.4], [3.1, 1.2, 0.3], [-2.7, 1.9, -0.5],
    [2.7, -1.8, -0.4], [0, 2.0, -0.8], [0.2, -2.1, 0.2]
  ];
  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.075, 16, 16);
  nodePositions.forEach((p, i) => {
    const m = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? VI : EM }));
    m.position.set(...p);
    nodeGroup.add(m);
    nodes.push(m);
  });

  // connecting lines from panel center to nodes
  const linkMat = new THREE.LineBasicMaterial({ color: EM, transparent: true, opacity: 0.18 });
  nodes.forEach((n) => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.2, 0), n.position]);
    nodeGroup.add(new THREE.Line(geo, linkMat));
  });

  // travelling data pulses along the links
  const pulses = [];
  const pulseGeo = new THREE.SphereGeometry(0.05, 10, 10);
  nodes.forEach((n, i) => {
    const p = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? VI : EM }));
    p.userData = { from: new THREE.Vector3(0, 0.2, 0), to: n.position.clone(), t: Math.random(), speed: 0.004 + Math.random() * 0.004 };
    nodeGroup.add(p);
    pulses.push(p);
  });

  /* --- Ambient particles --- */
  const pCount = 90;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 12;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 }));
  scene.add(particles);

  /* --- Resize --- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 560 ? 10.2 : 8.5;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* --- Mouse parallax --- */
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  window.addEventListener("mousemove", (e) => {
    tmx = (e.clientX / window.innerWidth - 0.5);
    tmy = (e.clientY / window.innerHeight - 0.5);
  });

  // entrance
  let intro = 0;
  let running = true;
  whenVisible(canvas, () => (running = true), () => (running = false));

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    t += 0.01;
    intro = Math.min(intro + 0.012, 1);
    const ease = 1 - Math.pow(1 - intro, 3);

    mx += (tmx - mx) * 0.05;
    my += (tmy - my) * 0.05;

    if (!REDUCED) {
      root.rotation.y = mx * 0.5 + Math.sin(t * 0.3) * 0.04;
      root.rotation.x = my * 0.3 + Math.cos(t * 0.25) * 0.03;
      root.position.y = Math.sin(t * 0.6) * 0.08;

      cardA.position.y = 1.05 + Math.sin(t * 0.8) * 0.12;
      cardB.position.y = -0.85 + Math.cos(t * 0.7) * 0.12;
      nodes.forEach((n, i) => { n.position.z = nodePositions[i][2] + Math.sin(t + i) * 0.15; });

      pulses.forEach((p) => {
        p.userData.t += p.userData.speed;
        if (p.userData.t > 1) p.userData.t = 0;
        p.position.lerpVectors(p.userData.from, p.userData.to, p.userData.t);
        p.material.opacity = Math.sin(p.userData.t * Math.PI);
        p.material.transparent = true;
      });

      particles.rotation.y = t * 0.02;
    }

    root.scale.setScalar(0.6 + ease * 0.4);
    root.position.x = (1 - ease) * -1.5;
    const baseZ = canvas.clientWidth < 560 ? 10.2 : 8.5;
    camera.position.z = baseZ - ease * 0.4;

    renderer.render(scene, camera);
  }
  animate();
}

/* ====================================================
   2. STACK ORBIT — draggable tech sphere
==================================================== */
function initStack() {
  const canvas = document.getElementById("stack-canvas");
  if (!canvas) return;

  const groups = {
    fe: { color: 0x34e2a8, items: ["JavaScript", "React", "Tailwind CSS", "HTML", "CSS", "Figma"] },
    be: { color: 0x8b7bff, items: ["PHP", "PostgreSQL", "REST APIs", "Authentication", "Google OAuth", "MySQL"] },
    cms: { color: 0xf0b35b, items: ["WordPress", "WooCommerce", "ACF/SCF", "Elementor Pro", "Bricks", "Custom Themes"] },
    cloud: { color: 0x58b9ff, items: ["Railway", "GitHub", "Cloud Deployment", "Core Web Vitals", "GA4"] },
    auto: { color: 0xff7b9c, items: ["n8n", "Make", "OpenAI API", "Anthropic API", "GSC", "Rank Math"] },
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 9;
  const renderer = makeRenderer(canvas);

  const sphere = new THREE.Group();
  scene.add(sphere);

  // collect all words with their colors
  const words = [];
  Object.values(groups).forEach((g) => g.items.forEach((label) => words.push({ label, color: g.color })));

  // distribute on a sphere (fibonacci)
  const N = words.length;
  const R = canvas.clientWidth < 560 ? 2.8 : 3.4;
  const sprites = [];
  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = R * Math.sin(phi) * Math.cos(theta);
    const y = R * Math.sin(phi) * Math.sin(theta);
    const z = R * Math.cos(phi);

    const sprite = makeTextSprite(words[i].label, words[i].color);
    sprite.position.set(x, y, z);
    sphere.add(sprite);
    sprites.push(sprite);
  }

  function makeTextSprite(text, color) {
    const cnv = document.createElement("canvas");
    const ctx = cnv.getContext("2d");
    const dpr = 2;
    cnv.width = 256 * dpr; cnv.height = 64 * dpr;
    ctx.scale(dpr, dpr);
    ctx.font = "600 30px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const hex = "#" + color.toString(16).padStart(6, "0");
    ctx.fillStyle = hex;
    ctx.shadowColor = hex; ctx.shadowBlur = 14;
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(cnv);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const s = new THREE.Sprite(mat);
    const compact = canvas.clientWidth < 560;
    s.scale.set(compact ? 1.55 : 2.0, compact ? 0.4 : 0.5, 1);
    return s;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.position.z = w < 560 ? 10.5 : 9;
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // drag to rotate
  let isDown = false, lx = 0, ly = 0, vx = 0.0015, vy = 0.0006;
  const down = (x, y) => { isDown = true; lx = x; ly = y; };
  const move = (x, y) => {
    if (!isDown) return;
    vy = (x - lx) * 0.0006;
    vx = (y - ly) * 0.0006;
    lx = x; ly = y;
  };
  const up = () => (isDown = false);
  canvas.addEventListener("mousedown", (e) => down(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", (e) => down(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  canvas.addEventListener("touchmove", (e) => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  canvas.addEventListener("touchend", up);

  let running = false;
  whenVisible(canvas, () => (running = true), () => (running = false));

  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    if (!isDown && !REDUCED) { vx *= 0.96; vy *= 0.96; vy += 0.0001; }
    sphere.rotation.y += vy;
    sphere.rotation.x += vx;
    // keep sprites depth-faded
    sprites.forEach((s) => {
      const z = s.position.clone().applyMatrix4(sphere.matrixWorld).z;
      s.material.opacity = THREE.MathUtils.clamp((z + R) / (2 * R), 0.2, 1);
    });
    renderer.render(scene, camera);
  }
  animate();
}

/* ====================================================
   3. CONTACT — ambient particle field
==================================================== */
function initContact() {
  const canvas = document.getElementById("contact-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 6;
  const renderer = makeRenderer(canvas);

  const count = 1400;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c1 = new THREE.Color(0x34e2a8), c2 = new THREE.Color(0x8b7bff);
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 4;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
    pos[i * 3 + 2] = r * Math.cos(ph);
    const c = Math.random() > 0.5 ? c1 : c2;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })
  );
  scene.add(points);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let mx = 0, my = 0;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });

  let running = false;
  whenVisible(canvas, () => (running = true), () => (running = false));

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!running) return;
    t += 0.01;
    if (!REDUCED) {
      points.rotation.y = t * 0.05 + mx * 0.4;
      points.rotation.x = my * 0.3;
    }
    renderer.render(scene, camera);
  }
  animate();
}

})();
