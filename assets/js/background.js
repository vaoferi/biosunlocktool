// Three.js Background — lightweight shader for BIOS Unlock Tool
let scene, camera, renderer, mesh, material;

function init() {
  const container = document.querySelector('.page');
  if (!container) return;

  // Create canvas container
  const canvasContainer = document.createElement('div');
  canvasContainer.style.position = 'fixed';
  canvasContainer.style.top = '0';
  canvasContainer.style.left = '0';
  canvasContainer.style.width = '100%';
  canvasContainer.style.height = '100%';
  canvasContainer.style.zIndex = '0';
  canvasContainer.style.pointerEvents = 'none';
  document.body.appendChild(canvasContainer);

  scene = new THREE.Scene();
  scene.background = null; // transparent

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a12, 0); // Match CSS bg color with transparency
  canvasContainer.appendChild(renderer.domElement);

  // Geometry — soft gradient plane
  const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);

  material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x0a3d6b) },
      uColor2: { value: new THREE.Color(0x0d5c5c) }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 2.0 + uTime * 0.3) * 0.2 + cos(pos.y * 2.0 + uTime * 0.2) * 0.2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      void main() {
        float wave = sin(vUv.x * 3.14 + uTime * 0.5) * 0.5 + 0.5;
        vec3 color = mix(uColor1, uColor2, wave);
        float alpha = 0.4 + sin(vUv.x * 3.14 + uTime * 0.2) * 0.1;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (material) {
    material.uniforms.uTime.value = performance.now() * 0.001;
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function onResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener('resize', onResize);

// Load Three.js and init background
(async function loadBackground() {
  try {
    const { createApp, ref } = await import('https://unpkg.com/three@0.166.1/build/three.module.js');
    window.THREE = createApp;
    init();
  } catch (e) {
    console.log('Background skipped — low performance mode');
  }
})();
