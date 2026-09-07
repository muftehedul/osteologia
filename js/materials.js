/**
 * Procedural materials.
 * ------------------------------------------------------------------
 * Cortical bone is not a flat cream colour. It is a slightly translucent,
 * mottled, semi-glossy surface with visible vascular porosity, and it takes
 * on a faint waxy sheen from the periosteum. We build that here from canvas
 * textures rather than image files so the app has zero binary assets.
 */

import * as THREE from 'three';

/* ------------------------------------------------------------------
 * Canvas texture generators
 * ------------------------------------------------------------------ */

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

/**
 * Base colour map: warm ivory with mineral mottling, faint growth striations
 * and scattered Volkmann/Haversian pores.
 */
function boneAlbedo(size = 1024, tint = [0.90, 0.86, 0.77]) {
  const c = canvas(size);
  const ctx = c.getContext('2d');

  // Base wash
  ctx.fillStyle = `rgb(${(tint[0] * 255) | 0},${(tint[1] * 255) | 0},${(tint[2] * 255) | 0})`;
  ctx.fillRect(0, 0, size, size);

  // Large-scale mineral mottling
  ctx.globalAlpha = 0.055;
  for (let i = 0; i < 900; i++) {
    const r = 8 + Math.random() * 70;
    const x = Math.random() * size, y = Math.random() * size;
    const warm = Math.random() > 0.45;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, warm ? 'rgb(168,150,116)' : 'rgb(255,252,242)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  // Fine longitudinal striation — the grain of osteonal bone
  ctx.globalAlpha = 0.035;
  ctx.lineWidth = 1;
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * size;
    ctx.strokeStyle = Math.random() > 0.5 ? '#8d7f63' : '#fffaf0';
    ctx.beginPath();
    ctx.moveTo(x, Math.random() * size);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 25, Math.random() * size,
      x + (Math.random() - 0.5) * 25, Math.random() * size,
      x + (Math.random() - 0.5) * 12, Math.random() * size,
    );
    ctx.stroke();
  }

  // Vascular porosity
  ctx.globalAlpha = 1;
  for (let i = 0; i < 2600; i++) {
    const r = 0.4 + Math.random() * 1.9;
    ctx.fillStyle = `rgba(105,93,72,${0.10 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, 7);
    ctx.fill();
  }

  // Very faint speckle to break up specular banding
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Roughness map — pores and cancellous patches read as rougher. */
function boneRoughness(size = 512) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.30;
  for (let i = 0; i < 700; i++) {
    const r = 6 + Math.random() * 55;
    const x = Math.random() * size, y = Math.random() * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = Math.random() > 0.5 ? 235 : 60;
    g.addColorStop(0, `rgb(${v},${v},${v})`);
    g.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(245,245,245,${0.25 + Math.random() * 0.5})`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 0.4 + Math.random() * 1.7, 0, 7);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Normal map derived from the roughness pattern — micro relief. */
function boneNormal(size = 512) {
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, size, size);

  // Pit the surface: each pore becomes a small concave dimple.
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 1 + Math.random() * 4.5;
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, 'rgba(150,150,255,0.55)');
    g.addColorStop(0.5, 'rgba(128,128,255,0)');
    g.addColorStop(1, 'rgba(106,106,255,0.55)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/* ------------------------------------------------------------------
 * Material set
 * ------------------------------------------------------------------ */

let cache = null;

export function createMaterials() {
  if (cache) return cache;

  const albedo = boneAlbedo(1024);
  const rough = boneRoughness(512);
  const normal = boneNormal(512);

  const bone = new THREE.MeshPhysicalMaterial({
    color: 0xf2ead9,
    map: albedo,
    roughnessMap: rough,
    roughness: 0.62,
    metalness: 0.0,
    normalMap: normal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    clearcoat: 0.22,
    clearcoatRoughness: 0.68,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xfff3dd),
    sheenRoughness: 0.85,
    // A trace of transmission gives the waxy translucency of thin cortical
    // bone at the edges without the cost of true subsurface scattering.
    envMapIntensity: 1.05,
    // Double-sided throughout: several bones are genuinely open shells — the
    // orbital funnels, the external acoustic meatus, the atlas ring — and
    // back-face culling turns their interiors into holes you see through.
    side: THREE.DoubleSide,
  });

  /** Slightly denser, greyer bone used for the axial skeleton. */
  const boneAxial = bone.clone();
  boneAxial.color = new THREE.Color(0xeae2d0);

  /** Cancellous / young bone — lighter and chalkier (used for ossicles). */
  const boneLight = bone.clone();
  boneLight.color = new THREE.Color(0xf7f1e3);
  boneLight.clearcoat = 0.08;

  /** Hyaline and costal cartilage — translucent bluish white. */
  const cartilage = new THREE.MeshPhysicalMaterial({
    color: 0xdfe8ea,
    roughness: 0.22,
    metalness: 0,
    transmission: 0.55,
    thickness: 1.6,
    ior: 1.36,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    transparent: true,
    opacity: 0.92,
  });

  /** Intervertebral discs — fibrocartilage, denser and more opaque. */
  const disc = new THREE.MeshPhysicalMaterial({
    color: 0xcdd5cf,
    roughness: 0.45,
    transmission: 0.28,
    thickness: 1.0,
    transparent: true,
    opacity: 0.9,
    clearcoat: 0.3,
  });

  /** Enamel — whiter, glossier, harder than bone. */
  const tooth = new THREE.MeshPhysicalMaterial({
    color: 0xfbf7ec,
    roughness: 0.16,
    metalness: 0,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    transmission: 0.18,
    thickness: 0.4,
    ior: 1.63,
  });

  /** Interior of orbits, nasal aperture, foramina — reads as a cavity. */
  const cavity = new THREE.MeshStandardMaterial({
    color: 0x1a1712,
    roughness: 0.95,
    metalness: 0,
  });

  /** Applied to the currently selected bone. */
  const selected = new THREE.MeshPhysicalMaterial({
    color: 0x2fb8c8,
    emissive: 0x0d6c78,
    emissiveIntensity: 0.75,
    roughness: 0.35,
    metalness: 0.05,
    clearcoat: 0.5,
  });

  /** Applied on hover. */
  const hovered = new THREE.MeshPhysicalMaterial({
    color: 0xffd36e,
    emissive: 0x7a5410,
    emissiveIntensity: 0.55,
    roughness: 0.4,
    clearcoat: 0.4,
  });

  /** Ghost material for non-focused bones during isolate mode. */
  const ghost = new THREE.MeshPhysicalMaterial({
    color: 0xcfd6dd,
    roughness: 0.8,
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
  });

  /** Quiz "wrong answer" flash. */
  const wrong = new THREE.MeshStandardMaterial({
    color: 0xe0554a,
    emissive: 0x7a1a12,
    emissiveIntensity: 0.7,
    roughness: 0.5,
  });

  cache = { bone, boneAxial, boneLight, cartilage, disc, tooth, cavity, selected, hovered, ghost, wrong, albedo };
  return cache;
}

/**
 * Studio environment built in code — three soft area lights reflected in a
 * dark room. Gives the bone its specular roll-off without an HDR file.
 */
export function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(60, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ color: 0x14181f, side: THREE.BackSide });
  scene.add(new THREE.Mesh(geo, mat));

  const panel = (w, h, color, intensity, pos, look) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) }),
    );
    m.position.set(...pos);
    m.lookAt(...(look || [0, 0, 0]));
    scene.add(m);
  };

  panel(30, 22, 0xffffff, 4.2, [16, 18, 18]);   // key
  panel(26, 20, 0xbfd4ff, 1.6, [-22, 8, 14]);   // cool fill
  panel(34, 12, 0xffd9b0, 1.9, [0, -14, -22]);  // warm bounce from below
  panel(20, 26, 0xffffff, 2.4, [-6, 14, -24]);  // rim

  const env = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  geo.dispose(); mat.dispose();
  return env;
}
