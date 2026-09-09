import * as THREE from "three";

// Важливо: це навмисно МІНІМАЛЬний пайплайн (1 quad + 1 shader, без EffectComposer/bloom/spotlight).
// Попередня версія з composer + spotlight-проєкцією ламалась у WebKit/Safari
// (GL_INVALID_OPERATION: invalid mailbox name / texture is not a shared image)
// і могла заливати сторінку білим. Якщо "спростити" далі або повернути composer —
// спочатку перевір сторінку в Safari. Fallback: #bg-fallback (показується без WebGL).

const app = document.getElementById("bg-three");
const fallback = document.getElementById("bg-fallback");

const testCanvas = document.createElement("canvas");
const gl2 = testCanvas.getContext("webgl2");
const gl = gl2 ?? testCanvas.getContext("webgl");
if (!gl || !app) {
  if (fallback) { fallback.style.display = "block"; fallback.style.opacity = "1"; }
  if (!gl) throw new Error("WebGL unavailable");
}

const VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Той самий fbm-градієнт, що й у попередній версії (візуальна ідентичність 8fc8),
// плюс затемнення нижньої частини (колишній OVERLAY_FRAG) — щоб текст залишався читабельним.
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;

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

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;
  float t = uTime;

  vec2 flow = vec2(t * 0.19, t * 0.13);
  // Масштаб патерну: множники частоти (~1.4x від початкових 1.05/2.15/4.8),
  // бо фон виглядав занадто збільшеним. Більше множник = дрібніші деталі (менший зум).
  // Якщо міняти — перевіряти і на 320px (дрібні октави шуму), і на 2560px.
  vec2 q = vec2(fbm(p * 1.45 + flow), fbm(p * 1.45 + vec2(-flow.y * 1.1, flow.x * 0.9)));
  vec2 w = p + q * 0.62;

  float nA = 0.5 + 0.5 * fbm(w * 3.0 + flow * 0.8);
  float nB = 0.5 + 0.5 * fbm(w * 6.7 + vec2(-flow.x * 0.5, flow.y * 0.35));
  float ridge = 1.0 - abs(2.0 * nB - 1.0);
  float mask = clamp(0.18 + 1.12 * (0.58 * nA + 0.42 * ridge), 0.0, 1.0);
  float edgeFade = 1.0 - clamp(length(p) * 0.7, 0.0, 1.0);
  float intensity = pow(clamp(mask * (0.72 + edgeFade * 0.45), 0.0, 1.0), 1.05);

  float base = nA * 0.82 + ridge * 0.18;
  // ВАЖЛИВО: усі три канали мають іти з ОДНАКОВОЮ швидкістю часу (0.065).
  // Раніше було 0.07/0.06/0.065 — фази повільно розходились і разом на ~200с
  // (~6-7 реальних хвилин) всі канали одночасно провалювались у дно кола кольору:
  // фон «зникав» до ~28% яскравості, потім повертався. З однаковою швидкістю
  // взаємні фази сталі, сумарна яскравість коливається лише ~7% — це справжній цикл.
  float tHue = t * 0.065;
  vec3 col = vec3(
    0.18 + 0.86 * (0.5 + 0.5 * cos(6.28318 * (base + 0.02 + tHue))),
    0.14 + 0.9  * (0.5 + 0.5 * cos(6.28318 * (base + 0.37 + tHue))),
    0.2  + 0.9  * (0.5 + 0.5 * cos(6.28318 * (base + 0.72 + tHue)))
  );
  // Яскравість: 0.5 → 0.36 (користувач просив темніший фон).
  // Це ГОЛОВНА ручка яскравості візерунка; темна база (0.04) і градієнт низу нижче — окремі речі.
  col *= intensity * 0.36;

  float highlight = pow(clamp((nA * 1.1 + ridge * 0.75) - 1.1, 0.0, 1.0), 2.2);
  col = mix(col, vec3(1.0, 0.96, 0.92), highlight * 0.18);
  vec3 tex = clamp(col, 0.0, 1.0);

  // Темна база під градієнтом + затемнення низу (читабельність CTA)
  // mix-фактор 1.4 → 1.05: патерн сильніше притискається до темної бази (загальне затемнення).
  tex = mix(vec3(0.04, 0.04, 0.05), tex, clamp(intensity * 1.05, 0.0, 1.0));
  float vgrad = smoothstep(0.3, 1.0, uv.y);
  tex = mix(tex, vec3(0.04, 0.04, 0.05), vgrad * 0.75);

  gl_FragColor = vec4(tex, 1.0);
}
`;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power", alpha: false });
} catch (e) {
  if (fallback) { fallback.style.display = "block"; fallback.style.opacity = "1"; }
  throw e;
}
// Обмеження DPR: слабкі телефони мають DPR 2.5–3.4 — рендер у фізичних пікселях множить
// фрагментну нагрузку в ~7–11 разів проти CSS-пікселів. Фон — м'який fbm-градієнт,
// різниця 1.5 vs 3 непомітна оком. Це ручка продуктивності для слабких пристроїв, не баг.
const MAX_DPR = 1.5;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a10, 1);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const material = new THREE.ShaderMaterial({
  vertexShader: VERT,
  fragmentShader: FRAG,
  uniforms: { uTime: { value: 0 } },
  depthTest: false,
  depthWrite: false,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Сповільнення анімації фону: єдиний множник часу, що йде в шейдер (uTime).
// Історія за побажаннями користувача: 1.0 → 0.5 («вдвічі повільніше») → 0.25
// («ще повільніше і спокійніше»). Міняти треба ТІЛЬКИ цей множник: окремі константи
// шейдера (0.19/0.13/0.07...) узгоджені між собою; змінювати їх поштучно не можна —
// саме поштучні швидкості каналів колись дали ефект періодичного «зникнення» фону.
const TIME_SCALE = 0.25;

function renderFrame(tSec) {
  material.uniforms.uTime.value = tSec;
  renderer.render(scene, camera);
}

renderFrame(0);

// Слабкі пристрої/мережі: анімація фону — найдорожчий постійний процес сторінки.
// Пауза, коли вона нікому не видима:
// 1) вкладка в фоні — rAF сам стопориться, але явний cancel надійніший;
// 2) hero з фігурами прокручений за межі екрана (він 100vh на всіх брейкпоінтах, див. CSS) —
//    фон під контентом усе одно перекритий скляними секціями, кадри марні.
// Обидві умови через один стан: кадр іде лише коли offscreenCount === 0 і вкладка видима.
let offscreenCount = 0;
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
  document.addEventListener("visibilitychange", () => {
    setRunning(!document.hidden && offscreenCount === 0);
  });

  const hero = document.querySelector(".hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        offscreenCount = entries[0].isIntersecting ? 0 : 1;
        setRunning(!document.hidden && offscreenCount === 0);
        // Пауза може тривати хвилини скролу нижче hero: наступний кадр бере свіжий
        // performance.now(), тож час не «стрибкає» наперед після повернення нагору.
      },
      { threshold: 0.05 }
    ).observe(hero);
  }

  setRunning(true);

  window.addEventListener("beforeunload", () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    material.dispose();
    renderer.dispose();
  });
}

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
  renderFrame(reducedMotion ? 0 : performance.now() * 0.001 * TIME_SCALE);
});
