import * as THREE from "./vendor/three.module.min.js?v=20260909c";

// КАНОНІЧНИЙ ФОН САЙТУ (2026-09-10, вибір користувача): варіант C — сцена
// «монітор + клавіатура» з дрібними деталями з пена (OPRBwOd): bloom-гало, блиски
// клавіш, контактна тінь. Підключається з `index.html` (канон), а також із
// `bg-demo-c.html` (демо для порівняння).
//
// SAFARI-СУМІСНІСТЬ (головне правило): жодних EffectComposer / UnrealBloom / OutputPass
// / рендер-таргетів / spotlight.map — ця трійка вже ламала сторінку в WebKit
// (GL_INVALID_OPERATION). Усі «дорогі» ефекти пена імітовані дешевими примітивами:
//   - bloom     → адитивні halo-квади з радіальним затуханням (перед екраном + за монітором);
//   - блиски    → ОДИН merged-mesh на всі 44 клавіші (1 draw call) з per-key фазою;
//   - тінь      → класична fake contact shadow (м'який радіальний градієнт), без shadow maps.
// Не повертати EffectComposer/UnrealBloom назад — спочатку Safari-перевірка.
//
// Доробка 2026-09-10: додано трапецієвидну підставку монітора (була відсутня — сцена
// читалась як «пливучий монітор»), портовано scroll-паралакс вправо та паузу рендеру
// при прокрутці hero за межі екрана (як у background.js), додано screenGlow — теплий
// point light над клавіатурою, колір синхронізовано з палітрою екрана (клавіші
// «підсвічені екраном», як у пена).

// Канонічна сторінка використовує контейнер #bg-three; демо — #bg-scene. Приймаємо обидва.
const app = document.getElementById("bg-scene") || document.getElementById("bg-three");
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
  // Canvas прозорий: задній фон тепер живе в CSS, а 3D-ПК малюється поверх нього.
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power", alpha: true });
} catch (e) {
  if (fallback) { fallback.style.display = "grid"; }
  throw e;
}
const MAX_DPR = 1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const world = new THREE.Group();
// Користувацька корекція 2026-09-10: desktop-ПК трохи компактніший, але його
// прив'язка до hero-copy та scroll-паралакс мають залишатися тими самими.
const SCENE_SCALE = 0.93;
world.scale.setScalar(SCENE_SCALE);
scene.add(world);

// Спільний шум + палітра: ТОЙ САМИЙ fbm, що в варіанті B і поточному фоні (ідентичність 8fc8).
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

// ЕКРАН монітора — без змін відносно варіанту B (емісія з тих самих переливів).
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

// HALO (bloom): радіальний квадрат із затуханням; колір корелює з палітрою екрана,
// інтенсивність пульсує повільно (спокійний ритм, узгоджений із TIME_SCALE).
const HALO_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uStrength;
${NOISE}
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float falloff = pow(max(0.0, 1.0 - d), 2.4);
  float pulse = 0.9 + 0.1 * sin(uTime * 0.6);
  vec3 tint = mix(vec3(1.0), palette(0.5, uTime * 0.065), 0.55);
  gl_FragColor = vec4(tint, falloff * uStrength * pulse);
}
`;

// GLINTS клавіш: merged-геометрія всіх клавіш, per-key фаза в атрибуті aPhase.
// Блиск дозволений тільки на верхніх гранях (нормаль.y). Адитивне змішування,
// сплеск pow(...,10) дає короткі «спалахи» замість рівномірного мерехтіння.
const GLINT_VERT = `
attribute float aPhase;
varying float vPhase;
varying float vTop;
void main() {
  vPhase = aPhase;
  vTop = step(0.5, normal.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const GLINT_FRAG = `
precision highp float;
varying float vPhase;
varying float vTop;
uniform float uTime;
uniform float uStrength;
void main() {
  if (vTop < 0.5) discard;
  float pulse = 0.5 + 0.5 * sin(uTime * 2.2 + vPhase);
  float glint = pow(pulse, 10.0);
  vec3 col = mix(vec3(0.62, 0.74, 1.0), vec3(1.0, 0.97, 0.9), glint);
  gl_FragColor = vec4(col, glint * uStrength);
}
`;

// CONTACT SHADOW: м'який чорний радіальний градієнт на підлозі. Без shadow maps —
// це найдешевша і найпередбачуваніша тінь, ідентична на всіх GPU і в Safari.
const SHADOW_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uOpacity;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.12, d) * uOpacity;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
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

// Контактні тіні (прозорі, поверх CSS gradient; depthWrite вимкнено, щоб не конфліктували)
const shadowMatMonitor = new THREE.ShaderMaterial({
  vertexShader: UV_VERT, fragmentShader: SHADOW_FRAG,
  uniforms: { uOpacity: { value: 0.5 } }, transparent: true, depthWrite: false,
});
const shadowMatKeys = new THREE.ShaderMaterial({
  vertexShader: UV_VERT, fragmentShader: SHADOW_FRAG,
  uniforms: { uOpacity: { value: 0.4 } }, transparent: true, depthWrite: false,
});
const shadowMonitor = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.3), shadowMatMonitor);
shadowMonitor.rotation.x = -Math.PI / 2;
shadowMonitor.position.set(0, 0.002, 0.45);
shadowMonitor.renderOrder = 1;
const shadowKeys = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), shadowMatKeys);
shadowKeys.rotation.x = -Math.PI / 2;
shadowKeys.position.set(0, 0.002, 1.28);
shadowKeys.renderOrder = 1;
world.add(shadowMonitor, shadowKeys);

// Монітор: рама + стійка + підставка-трапеція + екран. Трапецієвидна ніжка — з пена
// (2026-09-10): без неї сцена читалась як «пливучий монітор». Форма: широка основа 0.9,
// верх 0.3, висота 0.05, товщина по Y 0.05.
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.7, metalness: 0.15 });
const frame = new THREE.Mesh(new THREE.BoxGeometry(2.16, 1.46, 0.07), bodyMat);
frame.position.set(0, 1.0, 0.42);
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), bodyMat);
stand.position.set(0, 0.19, 0.44);
const footShape = new THREE.Shape();
footShape.moveTo(-0.45, 0);
footShape.lineTo(0.45, 0);
footShape.lineTo(0.15, 0.22);
footShape.lineTo(-0.15, 0.22);
footShape.closePath();
const footGeo = new THREE.ExtrudeGeometry(footShape, { depth: 0.05, bevelEnabled: false });
footGeo.rotateX(-Math.PI / 2);
const foot = new THREE.Mesh(footGeo, bodyMat);
foot.position.set(0, 0, 0.55);
const screenMat = addTimed(new THREE.ShaderMaterial({
  vertexShader: UV_VERT, fragmentShader: SCREEN_FRAG,
  uniforms: { uTime: { value: 0 } },
}));
const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.3), screenMat);
screen.position.set(0, 1.0, 0.462);
world.add(frame, stand, foot, screen);

// BLOOM-ГАЛО: (1) м'який ореол ПЕРЕД екраном; (2) слабке гало ЗА монітором —
// центр гало перекривається рамкою, тож по контуру монітора лишається світлий рим.
const haloFrontMat = addTimed(new THREE.ShaderMaterial({
  vertexShader: UV_VERT, fragmentShader: HALO_FRAG,
  uniforms: { uTime: { value: 0 }, uStrength: { value: 0.16 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
const haloFront = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.9), haloFrontMat);
haloFront.position.set(0, 1.0, 0.475);
haloFront.renderOrder = 3;
const haloBackMat = addTimed(new THREE.ShaderMaterial({
  vertexShader: UV_VERT, fragmentShader: HALO_FRAG,
  uniforms: { uTime: { value: 0 }, uStrength: { value: 0.1 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
const haloBack = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), haloBackMat);
haloBack.position.set(0, 1.0, 0.37);
haloBack.renderOrder = 3;
world.add(haloFront, haloBack);

// Клавіатура: геометрія з оригінального пена (база + сітка клавіш).
// 11×4 замість 10×3 (2026-09-10): силует реальної клавіатури, +1 колонка + ряд. База 1.30×0.045×0.42.
const keyboard = new THREE.Group();
const keyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.88, metalness: 0.06 });
const base = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.045, 0.42), keyMat);
base.position.y = 0.0225;
keyboard.add(base);
const cols = 11, rows = 4;
const keyW = 0.09, keyH = 0.072, keyD = 0.07, gapX = 0.012, gapZ = 0.01;
const startX = -((cols - 1) * (keyW + gapX)) / 2;
const startZ = -((rows - 1) * (keyD + gapZ)) / 2;
const keyGeo = new THREE.BoxGeometry(keyW, keyH, keyD);
const keyTransforms = [];
for (let rz = 0; rz < rows; rz += 1) {
  for (let cx = 0; cx < cols; cx += 1) {
    const x = startX + cx * (keyW + gapX);
    const y = 0.045 + keyH * 0.5 + 0.002;
    const z = startZ + rz * (keyD + gapZ);
    const key = new THREE.Mesh(keyGeo, keyMat);
    key.position.set(x, y, z);
    keyboard.add(key);
    // Детермінована псевдовипадкова фаза блиску на клавішу (без Math.random — стабільна між запусками)
    keyTransforms.push({ x, y, z, phase: (cx * 7.13 + rz * 3.71) % 6.28318 });
  }
}
keyboard.position.set(0, 0, 1.28);
world.add(keyboard);

// GLINTS: один merged-mesh на всі клавіші (1 draw call замість 30 матеріалів).
// Шаблонну геометрію розгортаємо в non-indexed і вручну конкатенуємо зі зсувом
// (BufferGeometryUtils з addons не вендорений — не тягнемо зайву залежність).
const glintGeo = (() => {
  const tpl = keyGeo.toNonIndexed();
  const pos = tpl.attributes.position.array;
  const nor = tpl.attributes.normal.array;
  const vertCount = pos.length / 3;
  const total = vertCount * keyTransforms.length;
  const P = new Float32Array(total * 3);
  const N = new Float32Array(total * 3);
  const Ph = new Float32Array(total);
  for (let i = 0; i < keyTransforms.length; i += 1) {
    const tr = keyTransforms[i];
    for (let v = 0; v < vertCount; v += 1) {
      const o = (i * vertCount + v) * 3;
      P[o] = pos[v * 3] + tr.x;
      P[o + 1] = pos[v * 3 + 1] + tr.y;
      P[o + 2] = pos[v * 3 + 2] + tr.z;
      N[o] = nor[v * 3]; N[o + 1] = nor[v * 3 + 1]; N[o + 2] = nor[v * 3 + 2];
      Ph[i * vertCount + v] = tr.phase;
    }
  }
  tpl.dispose();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
  g.setAttribute("aPhase", new THREE.BufferAttribute(Ph, 1));
  return g;
})();
const glintMat = addTimed(new THREE.ShaderMaterial({
  vertexShader: GLINT_VERT, fragmentShader: GLINT_FRAG,
  uniforms: { uTime: { value: 0 }, uStrength: { value: 0.85 } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
const glints = new THREE.Mesh(glintGeo, glintMat);
glints.renderOrder = 2;
keyboard.add(glints); // успадковує позицію клавіатури (0,0,1.28)

// Світло для пластикових частин (екран/підлога/гало світяться своїми шейдерами)
scene.add(new THREE.HemisphereLight(0xffffff, 0x060608, 0.25));
const keyLight = new THREE.PointLight(0xbfd4ff, 6, 9, 2);
keyLight.position.set(0.4, 2.4, 2.6);
scene.add(keyLight);

// screenGlow (2026-09-10): теплий point light низько над клавіатурою, колір синхронізовано
// з палітрою екрана — клавіші «підсвічені екраном», як у пена. Без цього клавіатура читалась
// глухою темною плямою. Дешево: одна lerpColors на кадр замість шейдера.
const screenGlow = new THREE.PointLight(0xffb08a, 14, 7, 2);
screenGlow.position.set(0, 0.75, 0.9);
scene.add(screenGlow);
const glowA = new THREE.Color(0xffb08a);
const glowB = new THREE.Color(0x8ab4ff);
const glowCur = new THREE.Color();
function syncGlow(tSec) {
  const m = 0.5 + 0.5 * Math.sin(6.28318 * 0.42 + tSec * 6.28318 * 0.065);
  glowCur.copy(glowA).lerp(glowB, m);
  screenGlow.color.copy(glowCur);
}

// СКРОЛ-ПАРАЛАКС ВПРАВО (2026-09-10, побажання користувача): на головному екрані
// екран монітора стоїть у нижньому правому прямокутнику поруч із hero-текстом, при
// скролі поступово виходить за правий край кадру і повертається при зворотному скролі.
// Це НЕ вертикальний рух — фон не «пролистується вгору».
// ВАЖЛИВО: scrollX у world.units. Раніше в B було px→world помилка (SCROLL_SPAN у px
// додавався напряму до world.x — ПК зникав за один піксель скролу). Тут: переводимо
// бажаний зсув у пікселях у world.units через pxToWorld = 2*halfW / innerWidth
// (рахує layout(), бо залежить від FOV/аспекту/камери).
let baseX = 0;
let baseY = 0;
let scrollX = 0;
let pxToWorld = 0.005;
let scrollSpanPx = 440;

function applyScrollX() {
  world.position.x = baseX + scrollX;
  world.position.y = baseY;
}

function layout() {
  const aspect = window.innerWidth / window.innerHeight;
  // Якір композиції: екран має жити праворуч від рамки hero-тексту, а його верхній
  // край починатися приблизно на рівні заголовка. Камера ближча (екран більший),
  // сцена опущена; горизонтальний старт вирішується нижче через DOM-геометрію рамки.
  // Не повертати розгалуження «на вузьких екранах сховати сцену»: фон має лишатися
  // присутнім, а fallback вмикається лише коли WebGL/рендерер справді недоступний.
  const FRAME_HALF = 1.08;
  const FRAME_Y = 1.0;
  const FRAME_Z = 0.42;
  const EDGE_MARGIN = 0.05;
  const CAMERA_Z = 5.3;
  const TARGET_Y = -1.35;
  const isWide = aspect >= 1.15;
  const POSITION_X_SHIFT = isWide ? -0.20 : -0.14;
  const POSITION_Y_SHIFT = isWide ? 0.12 : 0.09;
  const halfW = Math.tan((camera.fov * Math.PI) / 360) * CAMERA_Z * aspect;
  const halfH = Math.tan((camera.fov * Math.PI) / 360) * CAMERA_Z;
  pxToWorld = (2 * halfW) / Math.max(1, window.innerWidth);
  baseY = TARGET_Y + halfH * POSITION_Y_SHIFT * 2;
  camera.position.set(0, 1.25, CAMERA_Z);
  camera.lookAt(0, 0.8, 0.4);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  // На канонічній сторінці якір береться з реальної рамки .hero-copy, а не з
  // приблизного vw-зсуву. Тому стартова відстань між текстом і монітором завжди
  // дорівнює 3rem; для NAS-only bg-demo без цієї рамки лишається старий fallback.
  const copy = document.querySelector(".hero-copy");
  const targetLeftPx = copy
    ? copy.getBoundingClientRect().right + 3 * parseFloat(getComputedStyle(document.documentElement).fontSize || "16")
    : null;
  const projectFrameLeftPx = (x) => {
    // world.scale впливає на локальну геометрію, але не на world.position;
    // враховуємо це тут, щоб 3rem-відступ від hero-copy не змістився після resize.
    const point = new THREE.Vector3(
      x - FRAME_HALF * SCENE_SCALE,
      FRAME_Y * SCENE_SCALE + baseY,
      FRAME_Z * SCENE_SCALE,
    );
    point.project(camera);
    return (point.x * 0.5 + 0.5) * window.innerWidth;
  };
  if (targetLeftPx !== null) {
    const leftAtZero = projectFrameLeftPx(0);
    const pxPerWorld = projectFrameLeftPx(1) - leftAtZero;
    baseX = Math.abs(pxPerWorld) > 0.0001 ? (targetLeftPx - leftAtZero) / pxPerWorld : 0;
  } else {
    const targetRight = halfW * (1 - EDGE_MARGIN);
    baseX = targetRight - FRAME_HALF * SCENE_SCALE + halfW * POSITION_X_SHIFT * 2;
  }
  scrollSpanPx = Math.max(window.innerWidth * 1.1, 440);
  applyScrollX();
}
layout();

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TIME_SCALE = 0.25; // та сама «спокійна» швидкість, що у варіанті B і затвердженому фоні

// Скрол у пікселях → світові одиниці (pxToWorld рахує layout()): 1 екран скролу
// зсуває сцену на ~35% ширини вікна, чого вистачає, щоб монітор повністю вийшов
// за правий край і не вертикально «поплив» униз. На зворотному скролі повертається.
window.addEventListener("scroll", () => {
  const y = window.scrollY || 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const p = Math.min(1, y / maxScroll);
  scrollX = p * scrollSpanPx * pxToWorld;
  applyScrollX();
  // IntersectionObserver ставить rAF на паузу, коли hero вже поза viewport.
  // Один кадр на scroll все одно потрібен: саме він показує паралакс і зворотний рух.
  renderFrame(reducedMotion ? 0 : performance.now() * 0.001 * TIME_SCALE);
}, { passive: true });

function renderFrame(tSec) {
  for (const m of timeMats) m.uniforms.uTime.value = tSec;
  syncGlow(tSec);
  applyScrollX();
  renderer.render(scene, camera);
}
renderFrame(0);

let rafId = null;
function setRunning(run) {
  if (run && rafId === null) {
    rafId = requestAnimationFrame(animate);
  } else if (!run && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
function animate() {
  rafId = requestAnimationFrame(animate);
  renderFrame(performance.now() * 0.001 * TIME_SCALE);
}
if (!reducedMotion) {
  let offscreenCount = 0;
  document.addEventListener("visibilitychange", () => {
    setRunning(!document.hidden && offscreenCount === 0);
  });
  // Пауза, коли hero прокручений за межі екрана: фон перекритий скляними секціями,
  // кадри марні (економія батареї/фпс на телефонах). Сцена сама по собі статична
  // відносно скролу — це НЕ паралакс, а лише зупинка рендеру.
  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        offscreenCount = entries[0].isIntersecting ? 0 : 1;
        setRunning(!document.hidden && offscreenCount === 0);
      },
      { threshold: 0.05 }
    ).observe(hero);
  }
  setRunning(true);
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  layout();
  renderFrame(reducedMotion ? 0 : performance.now() * 0.001 * TIME_SCALE);
});

// Шрифт може завантажитись уже після першого layout і змінити ширину .hero-copy.
// Перерахунок після fonts.ready не дає монітору «плавати» відносно рамки після FOUT.
if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    layout();
    renderFrame(reducedMotion ? 0 : performance.now() * 0.001 * TIME_SCALE);
  }).catch(() => {});
}

window.addEventListener("beforeunload", () => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  screenMat.dispose(); keyMat.dispose(); bodyMat.dispose();
  glintMat.dispose(); haloFrontMat.dispose(); haloBackMat.dispose();
  shadowMatMonitor.dispose(); shadowMatKeys.dispose();
  frame.geometry.dispose(); stand.geometry.dispose(); footGeo.dispose();
  screen.geometry.dispose(); base.geometry.dispose(); keyGeo.dispose();
  glintGeo.dispose(); haloFront.geometry.dispose(); haloBack.geometry.dispose();
  shadowMonitor.geometry.dispose(); shadowKeys.geometry.dispose();
  renderer.dispose();
});
