import * as THREE from "./vendor/three.module.min.js?v=20260909c";

// ДЕМО-ВАРІАНТ B фону: сцена «монітор + клавіатура» з Codepen toi-nagasawa (OPRBwOd),
// де градієнт є ВМІСТОМ ЕКРАНА і світлом-плямою на підлозі, а не фоном усього сайту.
// Свідомо БЕЗ EffectComposer/UnrealBloom/spotlight.map з оригіналу: ця трійка вже ламалась
// у WebKit/Safari (GL_INVALID_OPERATION, див. коментар у background.js). Екран і «пролив»
// на підлозі зроблено чистими ShaderMaterial (той самий fbm, що в поточному фоні) —
// це сумісно за побудовою. Якщо все ж переносити в канон — спочатку Safari-перевірка.

const app = document.getElementById("bg-scene");
const fallback = document.getElementById("bg-fallback");

const testCanvas = document.createElement("canvas");
const gl2 = testCanvas.getContext("webgl2");
const gl = gl2 ?? testCanvas.getContext("webgl");
if (!gl || !app) {
  if (fallback) { fallback.style.display = "grid"; }
  if (!gl) throw new Error("WebGL unavailable");
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
} catch (e) {
  if (fallback) { fallback.style.display = "grid"; }
  throw e;
}
const MAX_DPR = 1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a10, 1);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a10);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const world = new THREE.Group();
scene.add(world);

// Спільний шум + палітра: ТОЙ САМИЙ fbm, що в поточному фоні сайту (візуальна ідентичність 8fc8).
// Палітра винесена в функцію, щоб екран і пляма на підлозі мали ідентичні кольори в кожен момент.
const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * snoise(p); p = p * 2.0 + vec2(17.0, 31.0); a *= 0.5; }
  return v;
}
vec3 palette(float base, float tHue) {
  return vec3(
    0.18 + 0.86 * (0.5 + 0.5 * cos(6.28318 * (base + 0.02 + tHue))),
    0.14 + 0.9  * (0.5 + 0.5 * cos(6.28318 * (base + 0.37 + tHue))),
    0.2  + 0.9  * (0.5 + 0.5 * cos(6.28318 * (base + 0.72 + tHue)))
  );
}
`;

// ЕКРАН монітора: анімований градієнт (перливи), яскравіші за колишній фон (0.9 проти 0.36),
// бо це «емісія екрана», а не підкладка під текстом.
const SCREEN_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
${NOISE}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float t = uTime;
  vec2 flow = vec2(t * 0.19, t * 0.13);
  vec2 q = vec2(fbm(p * 1.45 + flow), fbm(p * 1.45 + vec2(-flow.y * 1.1, flow.x * 0.9)));
  vec2 w = p + q * 0.62;
  float nA = 0.5 + 0.5 * fbm(w * 3.0 + flow * 0.8);
  float nB = 0.5 + 0.5 * fbm(w * 6.7 + vec2(-flow.x * 0.5, flow.y * 0.35));
  float ridge = 1.0 - abs(2.0 * nB - 1.0);
  float mask = clamp(0.18 + 1.12 * (0.58 * nA + 0.42 * ridge), 0.0, 1.0);
  float edgeFade = 1.0 - clamp(length(p) * 0.7, 0.0, 1.0);
  float intensity = pow(clamp(mask * (0.72 + edgeFade * 0.45), 0.0, 1.0), 1.05);
  float base = nA * 0.82 + ridge * 0.18;
  vec3 col = palette(base, t * 0.065) * intensity * 0.9;
  float highlight = pow(clamp((nA * 1.1 + ridge * 0.75) - 1.1, 0.0, 1.0), 2.2);
  col = mix(col, vec3(1.0, 0.96, 0.92), highlight * 0.18);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// ПІДЛОГА: темна кімната + «світлова пляма» від екрана — той самий градієнт у світових
// координатах, еліптично затухаючий від точки під екраном. Це заміна spotlight.map з оригіналу.
const FLOOR_FRAG = `
precision highp float;
varying vec3 vWorld;
uniform float uTime;
${NOISE}
void main() {
  float t = uTime;
  vec2 sp = vWorld.xz * 0.55;
  vec2 flow = vec2(t * 0.19, t * 0.13);
  float n = 0.5 + 0.5 * fbm(sp * 2.2 + flow);
  vec3 col = palette(n, t * 0.065);
  float d = length((vWorld.xz - vec2(0.0, 0.9)) * vec2(1.0, 0.55));
  float spill = smoothstep(3.2, 0.4, d);
  vec3 outc = mix(vec3(0.05, 0.05, 0.07), col * spill * 0.5, spill);
  gl_FragColor = vec4(outc, 1.0);
}
`;

const WORLD_VERT = `
varying vec3 vWorld;
void main() {
  vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const UV_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const timeMats = [];

function addTimed(mat) { timeMats.push(mat); return mat; }

// Підлога
const floorMat = addTimed(new THREE.ShaderMaterial({
  vertexShader: WORLD_VERT, fragmentShader: FLOOR_FRAG,
  uniforms: { uTime: { value: 0 } }, depthWrite: true,
}));
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
floor.rotation.x = -Math.PI / 2;
world.add(floor);

// Монітор: рама + стійка + ніжка-підставка + екран. Ніжка — трапецієвидна підставка
// (Shape → ExtrudeGeometry: екструзія по Z), бо реальні монітори стоять на широкій
// підставці, а не на стовпчику; трапеція читається здалеку і в профіль сховає стійку.
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.7, metalness: 0.15 });
const frame = new THREE.Mesh(new THREE.BoxGeometry(2.16, 1.46, 0.07), bodyMat);
frame.position.set(0, 1.0, 0.42);
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), bodyMat);
stand.position.set(0, 0.19, 0.44);
// Трапеція ніжки: основа 0.9, верх 0.3, висота 0.05 (в XZ-площині, товщина по Y)
const footShape = new THREE.Shape();
footShape.moveTo(-0.45, 0);
footShape.lineTo(0.45, 0);
footShape.lineTo(0.15, 0.22);
footShape.lineTo(-0.15, 0.22);
footShape.closePath();
const footGeo = new THREE.ExtrudeGeometry(footShape, { depth: 0.05, bevelEnabled: false });
footGeo.rotateX(-Math.PI / 2); // екструзія по Y вгору; тепер «висота трапеції» лежить по Z
const foot = new THREE.Mesh(footGeo, bodyMat);
foot.position.set(0, 0, 0.55);
const screenMat = addTimed(new THREE.ShaderMaterial({
  vertexShader: UV_VERT, fragmentShader: SCREEN_FRAG,
  uniforms: { uTime: { value: 0 } },
}));
const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.3), screenMat);
screen.position.set(0, 1.0, 0.462);
world.add(frame, stand, foot, screen);

// Клавіатура: геометрія з оригінального пена (база + сітка клавіш).
// 11×4 замість 10×3 (2026-09-10, зауваження користувача «трошки долити»): попередня
// розкладка при ширшому екрані виглядала як «дві смужки дрібних кубиків»; +1 колонка
// зліва + ряд знизу дають силует, ближчий до реальної клавіатури. База 1.30×0.045×0.42.
const keyboard = new THREE.Group();
const keyMat = new THREE.MeshStandardMaterial({ color: 0x23232e, roughness: 0.8, metalness: 0.1 });
const base = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.045, 0.42), keyMat);
base.position.y = 0.0225;
keyboard.add(base);
const cols = 11, rows = 4;
const keyW = 0.09, keyH = 0.072, keyD = 0.07, gapX = 0.012, gapZ = 0.01;
const startX = -((cols - 1) * (keyW + gapX)) / 2;
const startZ = -((rows - 1) * (keyD + gapZ)) / 2;
const keyGeo = new THREE.BoxGeometry(keyW, keyH, keyD);
for (let rz = 0; rz < rows; rz += 1) {
  for (let cx = 0; cx < cols; cx += 1) {
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(startX + cx * (keyW + gapX), 0.045 + keyH * 0.5 + 0.002, startZ + rz * (keyD + gapZ));
    keyboard.add(key);
  }
}
keyboard.position.set(0, 0, 1.28);
world.add(keyboard);

// Світло для пластикових частин. Клавіатура додатково ловить «відблиск екрана»:
// у пена клавіші підсвічені градієнтом з екрана (spotlight.map), у нас — теплий
// point light низько над клавіатурою, забарвлений у кольору палітри, + трохи світліший
// базовий матеріал (0x23232e), інакше клавіші читаються глухою темною плямою.
scene.add(new THREE.HemisphereLight(0xffffff, 0x060608, 0.25));
const keyLight = new THREE.PointLight(0xbfd4ff, 6, 9, 2);
keyLight.position.set(0.4, 2.4, 2.6);
scene.add(keyLight);
const screenGlow = new THREE.PointLight(0xffb08a, 14, 7, 2);
screenGlow.position.set(0, 0.75, 0.9);
scene.add(screenGlow);
// Анімація кольору підсвітки: той самий palette() час, що й у шейдерів (uTime) —
// гало завжди в тон екрану. Дешево: одна lerpColors на кадр замість шейдера.
const glowA = new THREE.Color(0xffb08a);
const glowB = new THREE.Color(0x8ab4ff);
const glowCur = new THREE.Color();
function syncGlow(tSec) {
  const m = 0.5 + 0.5 * Math.sin(6.28318 * 0.42 + tSec * 6.28318 * 0.065);
  glowCur.copy(glowA).lerp(glowB, m);
  screenGlow.color.copy(glowCur);
}

// СКРОЛ-ПАРАЛЛАКС (побажання 2026-09-10): сторінка скролиться вертикально, а сцена
// уходить ВПРАВО за межі кадру і повертається справа при зворотному скролі — без
// вертикального зсуву (фон не «пролистується в гору», монітор не пливе вгору від тексту).
// Оголошення ПЕРЕД layout() (2026-09-10): layout() писав у baseX до його ініціалізації —
// ReferenceError (TDZ), сцена взагалі не рендерилась. Піднято сюди.
// Також (2026-09-10): px→world конвертація. Раніше SCROLL_SPAN у пікселях додавався
// напряму до world.position.x — на 1440x900 ПК зникав за перший піксель скролу. Тепер
// pxToWorld = 2*halfW / innerWidth (рахує layout()).
let baseX = 0; // актуальний базовий зсув (пише layout())
let scrollX = 0; // поточний паралакс-зсув
let pxToWorld = 0.005;
const SCROLL_SPAN = Math.max(window.innerWidth * 0.35, 220); // крок уходу за 1 екран скролу (px)

function applyScrollX() {
  world.position.x = baseX + scrollX;
}

function layout() {
  const aspect = window.innerWidth / window.innerHeight;
  // Притиснути правий край монітора до правого краю кадру: обчислюємо half-width
  // фрустума на глибині монітора (5.0 світ. од.), потім — координату world.x, що
  // кладе правий край frame (FRAME_HALF = 1.08) на (1 - EDGE_MARGIN) * halfW.
  // Раніше було «фактор 0.72 від halfW» — на 1440x900 правий край обрізало ~30 px;
  // тепер права рамка стоїть на 4% від краю кадру незалежно від aspect.
  const FRAME_HALF = 1.08;
  const EDGE_MARGIN = 0.04;
  const halfW = Math.tan((camera.fov * Math.PI) / 360) * 5.0 * aspect;
  pxToWorld = (2 * halfW) / Math.max(1, window.innerWidth);
  const targetRight = halfW * (1 - EDGE_MARGIN);
  world.position.x = aspect > 1.15 ? Math.max(0, targetRight - FRAME_HALF) : 0;
  camera.position.set(0, 1.25, aspect > 1.15 ? 5.5 : 7.2);
  camera.lookAt(0, 0.8, 0.4);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  baseX = world.position.x; // фіксуємо для applyScrollX (паралакс додається поверх)
}
layout();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TIME_SCALE = 0.25; // та сама «спокійна» швидкість, що затверджена для поточного фону

window.addEventListener("scroll", () => {
  if (reducedMotion) return;
  const y = window.scrollY || 0;
  const vh = window.innerHeight || 1;
  const p = Math.min(1, y / vh); // 0 — верх, 1 — один екран проскролено
  scrollX = p * SCROLL_SPAN * pxToWorld;
  applyScrollX();
}, { passive: true });

function renderFrame(tSec) {
  for (const m of timeMats) m.uniforms.uTime.value = tSec;
  syncGlow(tSec);
  applyScrollX(); // кожен кадр — щоб baseX після resize не конфліктував із паралаксом
  renderer.render(scene, camera);
}
renderFrame(0);

let rafId = null;
function animate() {
  rafId = requestAnimationFrame(animate);
  renderFrame(performance.now() * 0.001 * TIME_SCALE);
}
if (!reducedMotion) {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    else if (!document.hidden && rafId === null) { rafId = requestAnimationFrame(animate); }
  });
  rafId = requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  layout();
  renderFrame(reducedMotion ? 0 : performance.now() * 0.001 * TIME_SCALE);
});

window.addEventListener("beforeunload", () => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  floorMat.dispose(); screenMat.dispose(); keyMat.dispose(); bodyMat.dispose();
  floor.geometry.dispose(); frame.geometry.dispose(); stand.geometry.dispose(); footGeo.dispose();
  screen.geometry.dispose(); base.geometry.dispose(); keyGeo.dispose();
  renderer.dispose();
});
