/**
 * The skull — 22 bones plus teeth, ossicles and the hyoid.
 * ------------------------------------------------------------------
 * The cranial vault is generated as a single deformed ellipsoid surface which
 * is then CARVED INTO BONES ALONG THE REAL SUTURE LINES. Each vault bone is a
 * shell patch bounded by the coronal, sagittal, lambdoid and squamous
 * sutures, so the pieces interlock the way they actually do on a dry skull,
 * and the pterion falls where it should.
 *
 * Local coordinate frame for this module:
 *   origin  = BASION (anterior midpoint of the foramen magnum)
 *   +Y      = superior          +Z = anterior          +X = the subject's LEFT
 *
 * Sagittal-plane landmarks used to set the proportions (adult male, cm):
 *   vertex   y = +13.0      glabella  z = +9.3
 *   nasion   y = +6.6       menton    y = -6.4
 *   orbit centre (±2.9, +5.0, +7.3)   TMJ condyle (±5.3, +1.4, +1.2)
 */

import * as THREE from 'three';
import {
  blob, loft, merge, mirrorX, strut, plate, sweptBone,
  superellipse, xform, boneSurface,
} from '../geometry/boneGeo.js';

/** Centre of the cranial-vault ellipsoid, relative to basion. */
const VAULT = new THREE.Vector3(0, 6.35, 0.55);

/* ==================================================================
 * The vault surface
 * ================================================================== */

const _d = new THREE.Vector3();

/** Smooth directional bump: 1 at (cx,cy,cz), fading to 0 at `width` radians. */
function bumpAt(d, cx, cy, cz, width) {
  const len = Math.hypot(cx, cy, cz);
  const dot = (d.x * cx + d.y * cy + d.z * cz) / len;
  const ang = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));
  const u = THREE.MathUtils.clamp(1 - ang / width, 0, 1);
  return u * u * (3 - 2 * u);
}

/**
 * Radius of the cranial vault in a given direction, with every named
 * eminence and depression of the calvaria layered on top of the base
 * ellipsoid.
 */
function vaultRadius(d, p) {
  const a = 7.05 * p.skullW, b = 6.80 * p.skullH, c = 8.70 * p.skullL;
  let r = 1 / Math.sqrt((d.x / a) ** 2 + (d.y / b) ** 2 + (d.z / c) ** 2);

  // Supraorbital ridges and glabella — the strongest sexually dimorphic
  // feature of the cranium.
  r += p.brow * 0.55 * bumpAt(d, 0, 0.06, 0.99, 0.30);
  r += p.brow * 0.48 * bumpAt(d, 0.40, 0.02, 0.90, 0.30);
  r += p.brow * 0.48 * bumpAt(d, -0.40, 0.02, 0.90, 0.30);

  // Frontal eminences (tubera frontalia) — relatively larger in females,
  // giving the more vertical, rounded female forehead.
  const fe = 0.30 + (1 - p.brow) * 0.22;
  r += fe * bumpAt(d, 0.32, 0.50, 0.80, 0.40);
  r += fe * bumpAt(d, -0.32, 0.50, 0.80, 0.40);

  // Parietal eminences
  r += 0.30 * bumpAt(d, 0.88, 0.40, -0.25, 0.45);
  r += 0.30 * bumpAt(d, -0.88, 0.40, -0.25, 0.45);

  // Occipital squama bulge and the external occipital protuberance
  r += 0.34 * bumpAt(d, 0, 0.22, -0.97, 0.55);
  r += p.brow * 0.30 * bumpAt(d, 0, -0.16, -0.99, 0.22);

  // Temporal fossa — the flat sunken area filled by temporalis
  r -= 0.62 * bumpAt(d, 0.96, -0.12, 0.22, 0.52);
  r -= 0.62 * bumpAt(d, -0.96, -0.12, 0.22, 0.52);

  // Slight posterior flattening of the upper occiput
  r -= 0.22 * bumpAt(d, 0, 0.62, -0.78, 0.40);

  return r;
}

/** Direction on the vault for spherical coordinates (theta, phi). */
function dirOf(theta, phi) {
  const sp = Math.sin(phi);
  return _d.set(sp * Math.sin(theta), Math.cos(phi), sp * Math.cos(theta)).clone();
}

/** Outer surface point of the vault for (theta, phi). */
function vaultPoint(theta, phi, p) {
  const d = dirOf(theta, phi);
  return d.multiplyScalar(vaultRadius(d, p)).add(VAULT);
}

/* --- suture lines, expressed as theta(phi) --------------------------- */

/** Coronal suture: bregma (theta 0, phi 0.36) down to pterion (1.16, 1.44). */
const coronal = (phi) =>
  1.16 * Math.pow(THREE.MathUtils.clamp((phi - 0.36) / (1.44 - 0.36), 0, 1), 0.80);

/** Lambdoid suture: lambda (theta pi, phi 0.66) down to asterion (2.08, 1.50). */
const lambdoid = (phi) =>
  Math.PI - (Math.PI - 2.08) * Math.pow(THREE.MathUtils.clamp((phi - 0.66) / (1.50 - 0.66), 0, 1), 0.80);

/** Squamous suture — the arched upper border of the temporal squama. */
const squamousPhi = (theta) => 1.40 - 0.13 * Math.sin(Math.PI * THREE.MathUtils.clamp((theta - 1.10) / 0.98, 0, 1));

/**
 * Build a closed shell patch of the vault.
 * `map(u, v)` returns [theta, phi]; both u and v run 0..1.
 */
function shellPatch(map, nU, nV, thickness, p) {
  const outer = [], inner = [];
  const pos = [], uvs = [], idx = [];

  for (let i = 0; i <= nV; i++) {
    for (let j = 0; j <= nU; j++) {
      const [theta, phi] = map(j / nU, i / nV);
      const d = dirOf(theta, phi);
      const r = vaultRadius(d, p);
      outer.push(d.clone().multiplyScalar(r).add(VAULT));
      inner.push(d.clone().multiplyScalar(Math.max(0.5, r - thickness)).add(VAULT));
    }
  }

  const push = (arr) => {
    const base = pos.length / 3;
    arr.forEach((v, k) => {
      pos.push(v.x, v.y, v.z);
      uvs.push((k % (nU + 1)) / nU, Math.floor(k / (nU + 1)) / nV);
    });
    return base;
  };
  const oBase = push(outer);
  const iBase = push(inner);

  const at = (base, i, j) => base + i * (nU + 1) + j;
  for (let i = 0; i < nV; i++) {
    for (let j = 0; j < nU; j++) {
      // Outer skin
      idx.push(at(oBase, i, j), at(oBase, i + 1, j), at(oBase, i, j + 1));
      idx.push(at(oBase, i, j + 1), at(oBase, i + 1, j), at(oBase, i + 1, j + 1));
      // Inner skin (reversed winding)
      idx.push(at(iBase, i, j), at(iBase, i, j + 1), at(iBase, i + 1, j));
      idx.push(at(iBase, i, j + 1), at(iBase, i + 1, j + 1), at(iBase, i + 1, j));
    }
  }
  // Four sutural edges, closing the shell into a solid.
  const edge = (getO, getI, n, flip) => {
    for (let k = 0; k < n; k++) {
      const o0 = getO(k), o1 = getO(k + 1), i0 = getI(k), i1 = getI(k + 1);
      if (flip) idx.push(o0, i0, o1, o1, i0, i1);
      else idx.push(o0, o1, i0, o1, i1, i0);
    }
  };
  edge((k) => at(oBase, 0, k), (k) => at(iBase, 0, k), nU, true);
  edge((k) => at(oBase, nV, k), (k) => at(iBase, nV, k), nU, false);
  edge((k) => at(oBase, k, 0), (k) => at(iBase, k, 0), nV, false);
  edge((k) => at(oBase, k, nU), (k) => at(iBase, k, nU), nV, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * Individual cranial bones
 * ================================================================== */

/* ==================================================================
 * The facial surface
 * ------------------------------------------------------------------
 * The midface is one continuous shell, exactly like the vault, described by
 * horizontal cross-sections from the brow down to the alveolar margin. Each
 * facial bone is then a bounded patch of that shell, and the boundaries are
 * the real sutures and the rims of the orbits and piriform aperture. Built
 * this way, the bones meet instead of floating past one another — which is
 * what happens if you try to assemble a face out of spheres and tubes.
 *
 *   h : 0 at the supraorbital level (y = +7.6), 1 at the alveolar margin
 *   w : 0 in the midline, +/-1 at the sides of the face
 * ================================================================== */

const FACE_TOP = 7.60, FACE_BOTTOM = -1.80;
const FACE_SECTIONS = [
  { y: 7.60, hw: 4.85, zc: 3.60, zd: 5.05 },
  { y: 5.50, hw: 5.20, zc: 3.50, zd: 5.32 },
  { y: 4.00, hw: 5.30, zc: 3.40, zd: 5.52 },
  { y: 2.50, hw: 5.05, zc: 3.40, zd: 5.62 },
  { y: 1.00, hw: 4.45, zc: 3.60, zd: 5.60 },
  { y: -0.60, hw: 3.85, zc: 4.00, zd: 5.20 },
  { y: -1.80, hw: 3.30, zc: 4.40, zd: 4.62 },
];

function faceSection(y) {
  const S = FACE_SECTIONS;
  if (y >= S[0].y) return S[0];
  for (let i = 1; i < S.length; i++) {
    if (y >= S[i].y) {
      const a = S[i - 1], b = S[i];
      const t = smoothStep((a.y - y) / (a.y - b.y));
      return {
        y, hw: a.hw + (b.hw - a.hw) * t,
        zc: a.zc + (b.zc - a.zc) * t,
        zd: a.zd + (b.zd - a.zd) * t,
      };
    }
  }
  return S[S.length - 1];
}
const smoothStep = (t) => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** Surface point of the face at (h, w), optionally pushed `inward` cm deep. */
function facePoint(h, w, inward = 0) {
  const y = FACE_TOP - h * (FACE_TOP - FACE_BOTTOM);
  const S = faceSection(y);
  const a = w * 1.78;
  let hw = S.hw, zd = S.zd;
  // Canine fossa — the hollow above the canine root, and the reason the
  // midface is not a smooth ovoid.
  const fossa = 0.55 * Math.exp(-(((w - 0.25) / 0.16) ** 2 + ((h - 0.70) / 0.16) ** 2));
  const fossa2 = 0.55 * Math.exp(-(((w + 0.25) / 0.16) ** 2 + ((h - 0.70) / 0.16) ** 2));
  hw -= (fossa + fossa2) * 0.35;
  zd -= (fossa + fossa2);
  return new THREE.Vector3(Math.sin(a) * hw, y, S.zc + Math.cos(a) * zd);
}

/** Build a closed shell patch of the facial surface. */
function facePatch(map, nU, nV, thickness) {
  const outer = [], inner = [];
  const pos = [], uvs = [], idx = [];
  const c = new THREE.Vector3();

  for (let i = 0; i <= nV; i++) {
    for (let j = 0; j <= nU; j++) {
      const [h, w] = map(j / nU, i / nV);
      const P = facePoint(h, w);
      const S = faceSection(P.y);
      c.set(0, P.y, S.zc);
      const d = P.clone().sub(c);
      const len = Math.max(0.4, d.length());
      outer.push(P);
      inner.push(c.clone().addScaledVector(d, Math.max(0.15, (len - thickness) / len)));
    }
  }

  const push = (arr) => {
    const base = pos.length / 3;
    arr.forEach((v, k) => {
      pos.push(v.x, v.y, v.z);
      uvs.push((k % (nU + 1)) / nU, Math.floor(k / (nU + 1)) / nV);
    });
    return base;
  };
  const oBase = push(outer);
  const iBase = push(inner);
  const at = (base, i, j) => base + i * (nU + 1) + j;

  for (let i = 0; i < nV; i++) {
    for (let j = 0; j < nU; j++) {
      idx.push(at(oBase, i, j), at(oBase, i + 1, j), at(oBase, i, j + 1));
      idx.push(at(oBase, i, j + 1), at(oBase, i + 1, j), at(oBase, i + 1, j + 1));
      idx.push(at(iBase, i, j), at(iBase, i, j + 1), at(iBase, i + 1, j));
      idx.push(at(iBase, i, j + 1), at(iBase, i + 1, j + 1), at(iBase, i + 1, j));
    }
  }
  const edge = (getO, getI, n, flip) => {
    for (let k = 0; k < n; k++) {
      const o0 = getO(k), o1 = getO(k + 1), i0 = getI(k), i1 = getI(k + 1);
      if (flip) idx.push(o0, i0, o1, o1, i0, i1);
      else idx.push(o0, o1, i0, o1, i1, i0);
    }
  };
  edge((k) => at(oBase, 0, k), (k) => at(iBase, 0, k), nU, true);
  edge((k) => at(oBase, nV, k), (k) => at(iBase, nV, k), nU, false);
  edge((k) => at(oBase, k, 0), (k) => at(iBase, k, 0), nV, false);
  edge((k) => at(oBase, k, nU), (k) => at(iBase, k, nU), nV, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* --- openings in the facial shell, in (h, w) space ------------------- */

/** Orbit: centre and semi-axes in (w, h). */
const ORB_W = 0.345, ORB_H = 0.272, ORB_RW = 0.255, ORB_RH = 0.205;
/** Piriform (nasal) aperture. */
const NAS_W = 0.150, NAS_H0 = 0.235, NAS_H1 = 0.645;

/** Medial edge of the orbit at a given height (in w); NaN outside its span. */
function orbitEdge(h, sign) {
  const u = (h - ORB_H) / ORB_RH;
  if (Math.abs(u) >= 1) return null;
  return ORB_W + sign * ORB_RW * Math.sqrt(1 - u * u);
}

/** Lateral edge of the piriform aperture at a given height (in w). */
function apertureEdge(h) {
  if (h < NAS_H0 || h > NAS_H1) return 0.020;
  const u = (h - (NAS_H0 + NAS_H1) / 2) / ((NAS_H1 - NAS_H0) / 2);
  // Pear-shaped: widest at the level of the inferior conchae.
  return 0.020 + (NAS_W - 0.020) * Math.sqrt(Math.max(0, 1 - u ** 4));
}

/* ------------------------------------------------------------------
 * The orbit
 * ------------------------------------------------------------------
 * The eye socket is a four-sided pyramid whose apex points backwards and
 * medially at the optic canal. Its RIM is shared between four bones, so the
 * rim is built here as four arcs and each arc is handed to the bone that
 * actually owns it — frontal above, zygomatic laterally, maxilla below,
 * lacrimal and maxillary frontal process medially.
 */
const ORBIT = {
  rim: {                                  // (x, y, z) with x already signed
    supMedial: [1.35, 6.55, 8.15],
    supMid:    [2.95, 7.10, 7.95],
    supLat:    [4.45, 6.25, 7.25],
    latMid:    [4.85, 4.90, 7.05],
    infLat:    [4.55, 3.55, 7.20],
    infMid:    [2.95, 3.10, 7.95],
    infMedial: [1.40, 3.35, 8.20],
    medMid:    [1.15, 4.95, 8.20],
  },
  apex: [0.85, 5.45, 2.45],
  centre: [2.95, 5.05, 7.75],
};

const orb = (s, k) => {
  const v = ORBIT.rim[k];
  return [s * v[0], v[1], v[2]];
};

/**
 * A rounded arc of the orbital rim through the given landmark keys.
 * Kept slim: the orbital margin is a sharp lip on a real skull, and a fat
 * tube here reads as a pair of spectacles rather than a bony rim.
 */
function rimArc(s, keys, r0 = 0.30, r1 = 0.30) {
  return sweptBone({
    path: keys.map((k) => orb(s, k)),
    profile: [{ t: 0, rx: r0, ry: r0 * 1.05 }, { t: 0.5, rx: (r0 + r1) * 0.55, ry: (r0 + r1) * 0.58 }, { t: 1, rx: r1, ry: r1 * 1.05 }],
    segments: 20, radial: 12,
  });
}

function frontalBone(p) {
  // v runs from the coronal suture (bregma) forward and down to the
  // supraorbital margin / nasion; u sweeps left-to-right across the forehead.
  const geo = shellPatch((u, v) => {
    // The lower border IS the supraorbital margin, so it arches up over each
    // orbit, dips at the nasion in the midline, and falls away laterally to
    // the frontozygomatic suture and the temporal line.
    const t = u * 2 - 1;
    const a = Math.abs(t);
    const yEdge = 6.45
      + 0.78 * Math.exp(-(((a - 0.30) / 0.21) ** 2))
      - 0.95 * Math.max(0, a - 0.55) / 0.45;
    const lower = Math.acos(THREE.MathUtils.clamp((yEdge - VAULT.y) / 8.30, -1, 1));
    const phi = 0.36 + v * (lower - 0.36);
    const half = coronal(phi);
    const narrow = v > 0.82 ? 1 - (v - 0.82) * 1.10 : 1;
    const theta = t * Math.max(0.05, half * (0.66 + 0.34 * narrow) + 0.26 * narrow);
    return [theta, phi];
  }, 44, 26, 0.52, p);

  // The lower edge wall of the patch above IS the supraorbital margin — no
  // separate rim tube, or the brow reads as two parallel pipes.
  const parts = [geo];
  for (const s of [1, -1]) {
    // Supraorbital notch, transmitting the supraorbital nerve (V1). This is
    // the point pressed to test trigeminal sensation in a GCS assessment.
    parts.push(blob({ rx: 0.30, ry: 0.26, rz: 0.34, detail: 2, position: [s * 1.85, 7.05, 8.05] }));
    // Orbital plate — the roof of the orbit and the floor of the anterior
    // cranial fossa, separated only by paper-thin bone. It slopes down and
    // back from the rim toward the optic canal.
    const roof = plate({
      outline: [[-1.85, -1.35], [-1.55, 1.15], [0.80, 1.50], [1.90, 0.90], [1.85, -1.15], [0.25, -1.55]],
      thickness: 0.26, bevel: 0.10,
      bend: (x, y) => 0.28 * Math.cos(x * 0.62),
    });
    roof.rotateX(-Math.PI / 2 + 0.30);
    roof.translate(s * 2.85, 6.72, 5.55);
    parts.push(roof);
    // Zygomatic process of the frontal, descending to the frontozygomatic
    // suture at the lateral orbital rim.
    parts.push(strut(orb(s, 'supLat'), [s * 4.90, 5.30, 6.85], 0.40, 0.38, 10));
  }
  // Nasal part, meeting the nasal bones and the frontal processes of the
  // maxillae at the nasion.
  parts.push(blob({ rx: 1.35, ry: 0.80, rz: 0.85, detail: 3, position: [0, 6.35, 8.35] }));
  // Glabella — the smooth prominence between the brow ridges.
  parts.push(blob({
    rx: 1.15 * (0.7 + 0.5 * p.brow), ry: 0.85, rz: 0.70, detail: 3,
    position: [0, 7.15, 8.55],
  }));

  return boneSurface(merge(parts), 0.05, 0.7);
}

function parietalBone(p, side) {
  // Bounded anteriorly by the coronal suture, posteriorly by the lambdoid,
  // inferiorly by the squamous suture, medially by the sagittal suture.
  const geo = shellPatch((u, v) => {
    const phi = 0.02 + v * 1.38;
    const t0 = coronal(phi);
    const t1 = Math.min(lambdoid(phi), 3.10);
    // Clip the inferolateral corner at the squamous suture.
    const lo = t0 + (t1 - t0) * u;
    const clipped = Math.min(phi, squamousPhi(lo));
    return [side * lo, clipped];
  }, 40, 30, 0.50, p);
  return boneSurface(geo, 0.05, 0.7);
}

function occipitalBone(p) {
  // Squamous part behind the lambdoid suture.
  const squama = shellPatch((u, v) => {
    const phi = 0.66 + v * 1.06;
    const half = lambdoid(phi);
    const theta = half + (2 * Math.PI - 2 * half) * u;
    return [theta, phi];
  }, 40, 24, 0.55, p);

  // Basilar and condylar parts around the foramen magnum. The foramen is a
  // real hole, cut as a Shape hole rather than faked with dark material.
  const shape = new THREE.Shape();
  const R = 5.6;
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const x = Math.cos(a) * R * 1.18;
    const y = Math.sin(a) * R * (a > Math.PI ? 0.72 : 1.02) - 0.6;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  for (let i = 0; i <= 36; i++) {
    // Foramen magnum: ~3.5 cm long, ~3.0 cm wide, oval, wider behind.
    const a = (i / 36) * Math.PI * 2;
    hole.absellipse(0, -0.35, 1.52, 1.78, a, a, false);
    const x = Math.cos(a) * 1.52;
    const y = Math.sin(a) * 1.78 - 0.35;
    i === 0 ? hole.moveTo(x, y) : hole.lineTo(x, y);
  }
  shape.holes.push(hole);
  const base = new THREE.ExtrudeGeometry(shape, {
    depth: 0.75, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.16, bevelSegments: 2, curveSegments: 8,
  });
  base.rotateX(-Math.PI / 2);
  // The basiocciput slopes up and forward as the clivus.
  const bp = base.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i), z = bp.getZ(i);
    bp.setY(i, bp.getY(i) + 0.16 * (z + 0.6) + 0.028 * x * x + Math.max(0, z + 1.6) * 0.30);
  }
  bp.needsUpdate = true;
  base.translate(0, -0.35, -1.9);

  // Occipital condyles — the "yes" joint with the atlas.
  const condyle = (s) => blob({
    rx: 0.72, ry: 0.52, rz: 1.42, detail: 3,
    position: [s * 1.85, -0.62, -1.05],
    rotation: [0, s * -0.30, s * 0.32],
    field: (x, y, z) => 1 + 0.16 * Math.max(0, -y),
  });
  // External occipital protuberance and nuchal lines.
  const inion = blob({ rx: 1.3, ry: 0.55, rz: 0.5, detail: 2, position: [0, 4.4, -8.6] });

  return boneSurface(merge([squama, base, condyle(1), condyle(-1), inion]), 0.05, 0.7);
}

function temporalBone(p, side) {
  const s = side;
  // Squamous part — the thin fan below the squamous suture.
  // It must reach down past the ear to the root of the zygomatic process,
  // or a bald gap opens between the parietal and the zygomatic arch.
  const squama = shellPatch((u, v) => {
    const theta = 1.08 + u * 1.02;
    const top = squamousPhi(theta);
    return [s * theta, top + v * (2.18 - top)];
  }, 26, 22, 0.40, p);

  // Zygomatic process — reaches forward to meet the zygomatic bone,
  // completing the zygomatic arch.
  const zygProc = sweptBone({
    path: [[s * 5.55, 2.85, 0.30], [s * 5.75, 3.05, 2.30], [s * 5.55, 3.15, 4.20], [s * 5.05, 3.10, 5.55]],
    profile: [{ t: 0, rx: 0.85, ry: 0.62 }, { t: 0.5, rx: 0.50, ry: 0.72 }, { t: 1, rx: 0.42, ry: 0.62 }],
    segments: 22, radial: 12,
  });

  // Mandibular fossa and articular tubercle — the socket of the TMJ.
  const fossa = blob({
    rx: 1.45, ry: 0.85, rz: 1.35, detail: 3,
    position: [s * 5.25, 1.55, 1.15],
    field: (x, y, z) => 1 - 0.34 * Math.max(0, -y) * Math.exp(-(z * z) * 1.2),
  });
  const tubercle = blob({ rx: 1.05, ry: 0.55, rz: 0.62, detail: 2, position: [s * 5.20, 1.35, 2.55] });

  // External acoustic meatus — a short canal into the petrous part.
  const eam = sweptBone({
    path: [[s * 5.45, 1.15, -0.45], [s * 4.45, 1.05, -0.60], [s * 3.55, 0.95, -0.70]],
    profile: [{ t: 0, rx: 0.72, ry: 0.58 }, { t: 1, rx: 0.42, ry: 0.36 }],
    segments: 10, radial: 12, capStart: false,
  });

  // Mastoid process — absent in infants, prominent and rugged in adult
  // males. It tapers to a downward-pointing tip behind the ear.
  const mastoid = blob({
    rx: 1.05 * p.mastoid, ry: 1.70 * p.mastoid, rz: 1.20 * p.mastoid, detail: 3,
    position: [s * 4.35, -1.05, -1.95],
    field: (x, y, z) => 1 - 0.34 * Math.max(0, -y) ** 1.4,
  });

  // Styloid process — the anchor of the "Riolan bouquet" of muscles.
  const styloid = strut(
    [s * 3.55, -1.05, -1.35], [s * 2.85, -3.55, 0.55], 0.30, 0.14, 8,
  );

  // Petrous part — the densest bone in the body, housing the inner ear.
  const petrous = blob({
    rx: 2.7, ry: 1.05, rz: 1.25, detail: 3,
    position: [s * 3.35, -0.15, -0.55],
    rotation: [0, s * 0.62, 0],
  });

  return boneSurface(merge([squama, zygProc, fossa, tubercle, eam, mastoid, styloid, petrous]), 0.05, 0.75);
}

function sphenoidBone(p) {
  // Body, with the sella turcica scooped out of its upper surface.
  const body = blob({
    rx: 1.85, ry: 1.35, rz: 1.65, detail: 3,
    position: [0, 1.55, 1.35],
    field: (x, y, z) => 1 - 0.30 * Math.max(0, y) * Math.exp(-(x * x * 2 + z * z * 2)),
  });

  // Greater wings — they sweep up to the pterion and form the lateral
  // orbital wall and part of the middle cranial fossa floor.
  // Greater wings — the pterion patch of the vault, continuing inward as the
  // lateral wall of the middle cranial fossa. The wing plate lies in a
  // PARASAGITTAL plane facing laterally, filling the temporal fossa; laid in
  // any other plane it juts out through the side of the head.
  const greater = (s) => {
    const g = shellPatch((u, v) => [s * (0.94 + u * 0.42), 1.30 + v * 0.44], 12, 10, 0.36, p);
    const wing = plate({
      outline: [[-1.9, -1.7], [-1.5, 1.5], [1.2, 1.9], [2.0, 0.4], [1.7, -1.7], [-0.3, -2.0]],
      thickness: 0.30, bevel: 0.12,
      bend: (x, y) => -0.22 * x,
    });
    wing.rotateY(s * (Math.PI / 2 - 0.30));   // face laterally
    wing.rotateZ(s * 0.16);
    wing.translate(s * 4.35, 3.55, 4.15);
    return merge([g, wing]);
  };

  // Lesser wings and the anterior clinoid processes — a horizontal shelf
  // dividing the anterior from the middle cranial fossa.
  const lesser = (s) => {
    const g = plate({
      outline: [[-1.9, -0.7], [-1.2, 0.8], [1.6, 0.9], [2.0, -0.4], [0.2, -1.0]],
      thickness: 0.26, bevel: 0.10,
    });
    g.rotateX(-Math.PI / 2 + 0.10);
    g.translate(s * 2.35, 3.35, 3.35);
    return g;
  };

  // Pterygoid processes — medial and lateral plates hanging down behind the
  // maxilla into the infratemporal fossa, the origin of the pterygoid
  // muscles. Both lie close to the sagittal plane.
  const pterygoid = (s) => {
    const lat = plate({
      outline: [[-1.35, -1.9], [-1.15, 1.25], [1.05, 1.45], [1.30, -1.70]],
      thickness: 0.26, bevel: 0.10,
    });
    lat.rotateY(s * (Math.PI / 2 - 0.22));
    lat.translate(s * 2.15, -0.85, 3.15);
    const med = plate({
      outline: [[-0.90, -2.10], [-0.80, 1.15], [0.80, 1.35], [0.90, -1.85]],
      thickness: 0.22, bevel: 0.09,
    });
    med.rotateY(s * (Math.PI / 2 + 0.10));
    med.translate(s * 1.05, -1.15, 3.25);
    // Pterygoid hamulus — the pulley for tensor veli palatini.
    const hamulus = strut([s * 1.05, -3.05, 3.25], [s * 1.40, -3.85, 2.85], 0.18, 0.10, 6);
    return merge([lat, med, hamulus]);
  };

  // The deep orbital funnel — a four-sided pyramid tapering back and
  // medially to the optic canal. Built as an open-mouthed tube so the socket
  // has real, explorable depth rather than being a painted-on dimple.
  const orbitFunnel = (s) => {
    const C = ORBIT.centre, A = ORBIT.apex;
    return sweptBone({
      path: [
        [s * C[0], C[1], C[2]],
        [s * (C[0] * 0.80 + A[0] * 0.20), C[1] * 0.78 + A[1] * 0.22, C[2] * 0.72 + A[2] * 0.28],
        [s * (C[0] * 0.42 + A[0] * 0.58), C[1] * 0.42 + A[1] * 0.58, C[2] * 0.38 + A[2] * 0.62],
        [s * A[0], A[1], A[2]],
      ],
      profile: [
        { t: 0.00, rx: 2.05, ry: 1.80 },
        { t: 0.35, rx: 1.55, ry: 1.35 },
        { t: 0.72, rx: 0.85, ry: 0.78 },
        { t: 1.00, rx: 0.34, ry: 0.34 },
      ],
      segments: 26, radial: 20,
      capStart: false, capEnd: true,
    });
  };

  return boneSurface(merge([
    body, greater(1), greater(-1), lesser(1), lesser(-1),
    pterygoid(1), pterygoid(-1), orbitFunnel(1), orbitFunnel(-1),
  ]), 0.04, 0.8);
}

function ethmoidBone() {
  // Perpendicular plate — the upper bony nasal septum.
  const perp = plate({
    outline: [[-1.6, -1.9], [-1.5, 1.6], [1.8, 1.9], [1.9, -1.6]],
    thickness: 0.18, bevel: 0.07,
  });
  perp.rotateY(Math.PI / 2);
  perp.translate(0, 4.15, 7.05);

  // Cribriform plate with the crista galli standing on it.
  const crib = plate({
    outline: [[-1.5, -0.9], [-1.4, 0.9], [1.5, 1.0], [1.6, -0.8]],
    thickness: 0.16, bevel: 0.06,
  });
  crib.rotateX(-Math.PI / 2);
  crib.translate(0, 5.85, 5.15);
  const crista = plate({
    outline: [[-0.8, -0.5], [-0.6, 0.8], [0.7, 0.9], [0.9, -0.4]],
    thickness: 0.16, bevel: 0.06,
  });
  crista.rotateY(Math.PI / 2);
  crista.translate(0, 6.45, 5.15);

  // Labyrinths (ethmoidal air cells) with the superior and middle conchae.
  const labyrinth = (s) => {
    const g = blob({
      rx: 0.72, ry: 1.55, rz: 1.85, detail: 3,
      position: [s * 1.15, 4.55, 5.95],
      field: (x, y, z) => 1 + 0.10 * Math.sin(y * 9),
    });
    const concha = sweptBone({
      path: [[s * 0.85, 3.85, 4.25], [s * 1.15, 3.70, 5.85], [s * 1.05, 3.55, 7.15]],
      profile: [{ t: 0, rx: 0.34, ry: 0.22 }, { t: 1, rx: 0.28, ry: 0.18 }],
      segments: 10, radial: 8,
    });
    return merge([g, concha]);
  };

  return boneSurface(merge([perp, crib, crista, labyrinth(1), labyrinth(-1)]), 0.03, 1.0);
}

function maxillaBone(p, side) {
  const s = side;

  /**
   * Body — a patch of the facial shell bounded medially by the piriform
   * aperture, above by the floor of the orbit, and laterally by the
   * zygomaticomaxillary suture. Above the orbit's lower rim the patch
   * narrows to the frontal process climbing beside the nose.
   */
  const wLat = 0.560;
  const body = facePatch((u, v) => {
    const h = 0.030 + v * (1.000 - 0.030);
    const wMin = apertureEdge(h);
    const inner = orbitEdge(h, -1);
    let wMax;
    if (inner !== null) {
      wMax = Math.max(wMin + 0.012, inner);           // beside the orbit
    } else if (h > ORB_H) {
      // Below the orbit the maxilla widens fast to the infraorbital margin.
      wMax = wMin + (wLat - wMin) * smoothStep((h - (ORB_H + ORB_RH)) / 0.09);
    } else {
      wMax = wLat;                                     // above the orbit
    }
    return [h, s * (wMin + u * (wMax - wMin))];
  }, 22, 34, 0.55);

  // Infratemporal surface with the maxillary tuberosity behind the molars.
  const tuber = blob({ rx: 0.92, ry: 1.05, rz: 0.95, detail: 3, position: [s * 3.05, -0.35, 4.35] });

  // Frontal process — thickened border climbing to the frontal bone, forming
  // the medial orbital rim and the lateral wall of the nasal aperture.
  const frontProc = sweptBone({
    path: [
      facePoint(0.62, s * apertureEdge(0.62)).toArray(),
      facePoint(0.44, s * apertureEdge(0.44)).toArray(),
      facePoint(0.26, s * apertureEdge(0.26)).toArray(),
      facePoint(0.11, s * 0.115).toArray(),
      facePoint(0.03, s * 0.105).toArray(),
    ],
    profile: [{ t: 0, rx: 0.42, ry: 0.36 }, { t: 0.5, rx: 0.38, ry: 0.34 }, { t: 1, rx: 0.44, ry: 0.40 }],
    segments: 22, radial: 12,
  });
  // Medial orbital margin, running up the side of the nose.
  const medRim = rimArc(s, ['infMedial', 'medMid'], 0.28, 0.26);

  // The upper edge of the body patch already forms the infraorbital margin;
  // only the foramen 1 cm below it needs to be added.
  const infraForamen = blob({ rx: 0.30, ry: 0.28, rz: 0.24, detail: 2, position: [s * 2.75, 2.20, 8.05] });

  // Alveolar process — the horseshoe carrying the upper teeth.
  const alveolarPts = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const a = -0.10 + t * 1.42;                 // sweep from midline backwards
    alveolarPts.push([s * Math.sin(a) * 3.25, -1.05 - t * 0.25, 9.05 - (1 - Math.cos(a)) * 5.5]);
  }
  const alveolar = sweptBone({
    path: alveolarPts,
    profile: [{ t: 0, rx: 0.68, ry: 0.98 }, { t: 0.6, rx: 0.78, ry: 1.05 }, { t: 1, rx: 0.86, ry: 1.02 }],
    segments: 28, radial: 12,
  });

  // Palatine process — the anterior two-thirds of the hard palate, arched
  // upward in the midline into the palatine vault.
  const palate = plate({
    outline: [[0, -2.6], [1.9, -2.2], [2.4, 0.4], [1.6, 2.3], [0, 2.4]],
    thickness: 0.42, bevel: 0.14,
    bend: (x, y) => -0.32 * Math.max(0, 1 - Math.abs(x) / 2.4),
  });
  palate.rotateX(-Math.PI / 2);
  palate.scale(s, 1, 1);
  palate.translate(0, -1.35, 6.55);

  // Nasal notch and anterior nasal spine (midline; drawn once, on the left).
  const spine = s > 0
    ? strut([0, 1.55, 8.85], [0, 1.35, 9.70], 0.26, 0.11, 8)
    : null;

  return boneSurface(merge([
    body, tuber, frontProc, medRim, infraForamen, alveolar, palate, spine,
  ]), 0.045, 0.85);
}

function zygomaticBone(side) {
  const s = side;
  // Body — a patch of the facial shell lateral to the orbit and to the
  // zygomaticomaxillary suture, wrapping round onto the side of the face.
  const body = facePatch((u, v) => {
    const h = 0.045 + v * 0.615;
    const outer = orbitEdge(h, +1);
    const wMin = outer !== null ? outer : (h < ORB_H ? 0.62 : 0.560);
    const wMax = 0.985 - 0.10 * Math.max(0, h - 0.42);
    return [h, s * (wMin + u * (wMax - wMin))];
  }, 18, 22, 0.50);
  // The medial edge of the body patch already forms the lateral orbital rim.
  // The frontal process climbs from it to the frontozygomatic suture — the
  // strut that fails first in a tripod fracture.
  const frontProc = strut(orb(s, 'supLat'), [s * 4.90, 5.30, 6.75], 0.48, 0.44, 10);
  // Temporal process — sweeps backwards to complete the zygomatic arch.
  const tempProc = sweptBone({
    path: [[s * 4.95, 3.55, 6.10], [s * 5.30, 3.35, 5.30], [s * 5.42, 3.20, 4.55]],
    profile: [{ t: 0, rx: 0.52, ry: 0.68 }, { t: 1, rx: 0.40, ry: 0.62 }],
    segments: 12, radial: 10,
  });
  // Maxillary process, running down to meet the maxilla at the
  // zygomaticomaxillary suture.
  const maxProc = strut([s * 4.35, 2.95, 6.95], [s * 3.55, 2.55, 7.55], 0.58, 0.46, 10);
  return boneSurface(merge([body, frontProc, tempProc, maxProc]), 0.05, 0.9);
}

function nasalBone(side) {
  const s = side;
  // A small oblong plate forming the bony bridge of the nose, wedged between
  // the frontal processes of the maxillae and meeting the frontal at the
  // nasion. Below its free lower border the nose is cartilage only.
  const g = facePatch((u, v) => {
    const h = 0.035 + v * (NAS_H0 - 0.035);
    const wMax = 0.030 + apertureEdge(Math.min(h, NAS_H0 + 0.001)) * 0.78;
    return [h, s * (0.004 + u * (wMax - 0.004))];
  }, 10, 14, 0.32);
  // The bridge stands proud of the surrounding face.
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const k = Math.exp(-((x / 1.1) ** 2)) * Math.exp(-(((y - 5.9) / 1.6) ** 2));
    pos.setZ(i, pos.getZ(i) + 0.42 * k);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return boneSurface(g, 0.03, 1.2);
}

function lacrimalBone(side) {
  // The smallest and most fragile facial bone, carrying the lacrimal fossa
  // in the anterior part of the medial orbital wall.
  const g = plate({
    outline: [[-0.62, -0.80], [-0.55, 0.78], [0.58, 0.84], [0.64, -0.75]],
    thickness: 0.12, bevel: 0.05,
  });
  g.rotateY(Math.PI / 2 - side * 0.18);
  g.translate(side * 1.55, 4.85, 7.45);
  return boneSurface(g, 0.02, 1.5);
}

function palatineBone(side) {
  const s = side;
  const horiz = plate({
    outline: [[0, -1.0], [1.5, -0.9], [1.6, 0.85], [0, 0.95]],
    thickness: 0.28, bevel: 0.10,
  });
  horiz.rotateX(-Math.PI / 2);
  horiz.scale(s, 1, 1);
  horiz.translate(0, -1.35, 4.15);
  const perp = plate({
    outline: [[-0.9, -1.6], [-0.8, 1.5], [0.85, 1.6], [0.95, -1.5]],
    thickness: 0.16, bevel: 0.06,
  });
  perp.rotateY(Math.PI / 2);
  perp.translate(s * 1.45, 0.35, 4.35);
  return boneSurface(merge([horiz, perp]), 0.03, 1.2);
}

function vomerBone() {
  const g = plate({
    outline: [[-2.0, -1.15], [-1.85, 0.95], [1.9, 1.35], [2.0, -0.95]],
    thickness: 0.14, bevel: 0.05,
  });
  g.rotateY(Math.PI / 2);
  g.translate(0, 0.85, 5.55);
  return boneSurface(g, 0.03, 1.2);
}

function inferiorConchaBone(side) {
  const s = side;
  const g = sweptBone({
    path: [[s * 0.95, 0.55, 4.15], [s * 1.20, 0.35, 5.95], [s * 1.10, 0.25, 7.75]],
    profile: [{ t: 0, rx: 0.30, ry: 0.55 }, { t: 0.5, rx: 0.34, ry: 0.68 }, { t: 1, rx: 0.26, ry: 0.50 }],
    segments: 14, radial: 10,
  });
  return boneSurface(g, 0.03, 1.2);
}

function mandibleBone(p) {
  // The mandible is built in its OWN local frame with the origin at the
  // TMJ axis, so the jaw can be animated by rotating this group alone.
  const parts = [];
  const CX = 5.30, CY = 1.40, CZ = 1.20;   // condyle position in skull space

  // Body — a parabolic arch carrying the lower dental arcade.
  const bodyPath = [];
  for (let i = -10; i <= 10; i++) {
    const t = i / 10;
    const a = t * 1.34;
    // The mandibular arch tracks just inside the maxillary one and rises
    // posteriorly toward the angles.
    bodyPath.push([Math.sin(a) * 3.62, -5.20 + Math.abs(t) * 1.30, 8.75 - (1 - Math.cos(a)) * 5.85]);
  }
  parts.push(sweptBone({
    path: bodyPath,
    profile: [
      { t: 0.00, rx: 0.80, ry: 1.25 },
      { t: 0.25, rx: 0.70, ry: 1.45 },
      { t: 0.50, rx: 0.62 * p.chin, ry: 1.52 },
      { t: 0.75, rx: 0.70, ry: 1.45 },
      { t: 1.00, rx: 0.80, ry: 1.25 },
    ],
    segments: 60, radial: 16,
  }));

  // Mental protuberance — the chin. Square and forward in males, rounded
  // and more pointed in females.
  parts.push(blob({
    rx: 1.15 * p.chin, ry: 0.95, rz: 0.75, detail: 3,
    position: [0, -5.95, 9.15],
    field: (x, y, z) => 1 + 0.16 * (p.chin - 0.6) * Math.max(0, -y),
  }));

  // Rami, angles and coronoid processes.
  // The ramus is a flat quadrilateral plate lying in a PARASAGITTAL plane,
  // so it is authored with x = anterior and then swung round to face
  // laterally. Its posterior border runs from the condyle to the angle; its
  // anterior border runs from the coronoid down onto the body.
  const ramus = (s) => {
    const g = plate({
      outline: [
        [2.35, 1.95],   // base of the coronoid, anterosuperior
        [1.00, 1.55],   // mandibular notch — a shallow scoop, not a deep V
        [-0.75, 2.25],  // condylar neck, posterosuperior
        [-1.70, 0.20],  // posterior border
        [-1.55, -2.55], // angle
        [2.15, -2.35],  // anteroinferior, overlapping the body
      ],
      thickness: 0.58, bevel: 0.18,
      bend: (x, y) => 0.14 * x,
    });
    g.rotateY(-Math.PI / 2);                  // local +x -> world +z (anterior)
    g.scale(s, 1, 1);
    g.translate(s * (4.45 * p.gonialFlare), -1.45, 2.55);

    // Condylar process and head — the TMJ, the only mobile joint of the skull.
    const neck = strut([s * 4.60, 0.35, 1.85], [s * CX, CY, CZ], 0.44, 0.55, 10);
    const head = blob({
      rx: 1.05, ry: 0.55, rz: 0.62, detail: 3,
      position: [s * CX, CY, CZ], rotation: [0, s * 0.28, 0],
    });
    // Coronoid process — the temporalis insertion, a flat triangular spike.
    const coronoid = plate({
      outline: [[-0.95, -1.30], [-0.35, 1.45], [0.35, 1.50], [0.85, -1.25]],
      thickness: 0.40, bevel: 0.13,
    });
    coronoid.rotateY(-Math.PI / 2);
    coronoid.scale(s, 1, 1);
    coronoid.translate(s * 4.25, 1.75, 4.35);

    // Angle of the mandible — everted and rugged in males from masseter pull.
    const angle = blob({
      rx: 0.85 * p.gonialFlare, ry: 0.90, rz: 1.10, detail: 3,
      position: [s * 4.55 * p.gonialFlare, -4.10, 1.75],
    });
    return merge([g, neck, head, coronoid, angle]);
  };
  parts.push(ramus(1), ramus(-1));

  const geo = boneSurface(merge(parts), 0.05, 0.8);
  // Re-origin at the TMJ hinge axis so `rotation.x` opens the jaw correctly.
  geo.translate(0, -CY, -CZ);
  return { geo, hinge: new THREE.Vector3(0, CY, CZ) };
}

/* ==================================================================
 * Teeth — 32 permanent teeth on a catenary arch
 * ================================================================== */

/**
 * The permanent dentition, in FDI-style order from the midline back.
 * Crown dimensions are approximate mesiodistal widths in centimetres.
 */
const TOOTH_SPEC = [
  { n: 'Central incisor', w: 0.86, h: 1.05, d: 0.62 },
  { n: 'Lateral incisor', w: 0.66, h: 0.95, d: 0.58 },
  { n: 'Canine',          w: 0.78, h: 1.25, d: 0.72 },
  { n: 'First premolar',  w: 0.71, h: 0.88, d: 0.82 },
  { n: 'Second premolar', w: 0.68, h: 0.85, d: 0.84 },
  { n: 'First molar',     w: 1.05, h: 0.82, d: 1.02 },
  { n: 'Second molar',    w: 1.00, h: 0.78, d: 1.00 },
  { n: 'Third molar',     w: 0.92, h: 0.72, d: 0.96 },
];

function buildArchTeeth(upper) {
  const geos = [];
  // The arches must match the alveolar processes they sit in, and the
  // maxillary arch is slightly the wider of the two — which is why the upper
  // teeth overhang the lower in normal occlusion.
  const arcR = upper ? 3.25 : 3.00;
  const zFront = upper ? 9.05 : 8.80;
  const zFactor = upper ? 5.50 : 5.30;
  const yBase = upper ? -1.75 : -4.85;

  for (const side of [1, -1]) {
    let arc = 0.085;
    TOOTH_SPEC.forEach((t) => {
      arc += (t.w / arcR) * 0.50;
      const a = arc;
      const x = side * Math.sin(a) * arcR;
      const z = zFront - (1 - Math.cos(a)) * zFactor;
      // Only the clinical crown is drawn — roughly half the tooth's length is
      // buried in the alveolar bone.
      const h = t.h * 0.72;
      const crown = new THREE.BoxGeometry(t.w * 1.02, h, t.d * 0.96, 2, 3, 2);
      const cp = crown.attributes.position;
      for (let k = 0; k < cp.count; k++) {
        const vy = cp.getY(k);
        // Taper toward the neck and round the occlusal corners.
        const toward = (upper ? vy : -vy) / h + 0.5;      // 0 at tip, 1 at neck
        const taper = 0.80 + 0.20 * toward;
        cp.setX(k, cp.getX(k) * taper);
        cp.setZ(k, cp.getZ(k) * taper * (1 - 0.10 * (1 - toward)));
      }
      cp.needsUpdate = true;
      crown.computeVertexNormals();
      crown.rotateY(-side * a);
      crown.translate(x, yBase + (upper ? -h / 2 : h / 2), z);
      geos.push(crown);
      arc += (t.w / arcR) * 0.50;
    });
  }
  return merge(geos);
}

/* ==================================================================
 * Ossicles and hyoid
 * ================================================================== */

function ossicle(kind, side) {
  const s = side;
  const at = [s * 3.85, 0.95, -0.55];      // middle ear cavity
  if (kind === 'malleus') {
    const head = blob({ rx: 0.13, ry: 0.13, rz: 0.12, detail: 2, position: [at[0], at[1] + 0.10, at[2]] });
    const handle = strut([at[0], at[1] + 0.06, at[2]], [at[0] + s * 0.10, at[1] - 0.24, at[2] + 0.10], 0.05, 0.02, 6);
    return merge([head, handle]);
  }
  if (kind === 'incus') {
    const body = blob({ rx: 0.12, ry: 0.12, rz: 0.11, detail: 2, position: [at[0] - s * 0.16, at[1] + 0.10, at[2] - 0.04] });
    const long = strut([at[0] - s * 0.16, at[1] + 0.08, at[2] - 0.04], [at[0] - s * 0.14, at[1] - 0.18, at[2] + 0.02], 0.045, 0.025, 6);
    const short = strut([at[0] - s * 0.16, at[1] + 0.10, at[2] - 0.04], [at[0] - s * 0.10, at[1] + 0.08, at[2] - 0.22], 0.045, 0.025, 6);
    return merge([body, long, short]);
  }
  // Stapes — the smallest bone in the body, ~3 mm.
  const base = blob({ rx: 0.14, ry: 0.06, rz: 0.05, detail: 2, position: [at[0] - s * 0.36, at[1] - 0.16, at[2] + 0.02], rotation: [0, 0, Math.PI / 2] });
  const crus1 = strut([at[0] - s * 0.30, at[1] - 0.16, at[2] + 0.08], [at[0] - s * 0.20, at[1] - 0.16, at[2] + 0.02], 0.025, 0.025, 5);
  const crus2 = strut([at[0] - s * 0.30, at[1] - 0.16, at[2] - 0.04], [at[0] - s * 0.20, at[1] - 0.16, at[2] + 0.02], 0.025, 0.025, 5);
  const head = blob({ rx: 0.05, ry: 0.05, rz: 0.05, detail: 1, position: [at[0] - s * 0.18, at[1] - 0.16, at[2] + 0.02] });
  return merge([base, crus1, crus2, head]);
}

function hyoidBone() {
  const body = blob({ rx: 1.15, ry: 0.40, rz: 0.42, detail: 3, position: [0, 0, 0.55] });
  const horn = (s, greater) => sweptBone({
    path: greater
      ? [[s * 1.05, 0.02, 0.45], [s * 1.55, 0.05, -0.55], [s * 1.75, 0.10, -1.75]]
      : [[s * 0.85, 0.15, 0.55], [s * 0.95, 0.55, 0.35]],
    profile: [{ t: 0, rx: 0.22, ry: 0.22 }, { t: 1, rx: 0.12, ry: 0.12 }],
    segments: 10, radial: 8,
  });
  return boneSurface(merge([body, horn(1, true), horn(-1, true), horn(1, false), horn(-1, false)]), 0.03, 1.2);
}

/* ==================================================================
 * Assembly
 * ================================================================== */

/**
 * Build the whole head.
 * Returns a group whose origin is BASION, ready to attach to the atlas.
 */
export function buildSkull(p, mk) {
  const g = new THREE.Group();
  g.name = 'skull';

  const add = (geo, boneId, label, matKey) => {
    const m = mk(geo, boneId, label, matKey);
    g.add(m);
    return m;
  };

  add(frontalBone(p), 'frontal', 'Frontal bone');
  add(parietalBone(p, 1), 'parietal', 'Left parietal bone');
  add(parietalBone(p, -1), 'parietal', 'Right parietal bone');
  add(occipitalBone(p), 'occipital', 'Occipital bone');
  add(temporalBone(p, 1), 'temporal', 'Left temporal bone');
  add(temporalBone(p, -1), 'temporal', 'Right temporal bone');
  add(sphenoidBone(p), 'sphenoid', 'Sphenoid bone');
  add(ethmoidBone(), 'ethmoid', 'Ethmoid bone');
  add(maxillaBone(p, 1), 'maxilla', 'Left maxilla');
  add(maxillaBone(p, -1), 'maxilla', 'Right maxilla');
  add(zygomaticBone(1), 'zygomatic', 'Left zygomatic bone');
  add(zygomaticBone(-1), 'zygomatic', 'Right zygomatic bone');
  add(nasalBone(1), 'nasal', 'Left nasal bone');
  add(nasalBone(-1), 'nasal', 'Right nasal bone');
  add(lacrimalBone(1), 'lacrimal', 'Left lacrimal bone');
  add(lacrimalBone(-1), 'lacrimal', 'Right lacrimal bone');
  add(palatineBone(1), 'palatine', 'Left palatine bone');
  add(palatineBone(-1), 'palatine', 'Right palatine bone');
  add(vomerBone(), 'vomer', 'Vomer');
  add(inferiorConchaBone(1), 'inferiorconcha', 'Left inferior nasal concha');
  add(inferiorConchaBone(-1), 'inferiorconcha', 'Right inferior nasal concha');

  // Dark backings behind the orbits and the piriform aperture. Without them
  // you look straight through the openings to the far side of the skull, and
  // the face loses the deep-socket read that makes a skull legible.
  const cavity = (geo) => {
    const m = mk(geo, null, 'cavity', 'cavity');
    m.userData.soft = false;
    m.castShadow = false;
    m.raycast = () => {};                 // never selectable
    return m;
  };
  for (const s of [1, -1]) {
    g.add(cavity(blob({
      rx: 1.55, ry: 1.45, rz: 1.80, detail: 3,
      position: [s * 2.15, 5.15, 5.15], rotation: [0, s * -0.30, 0],
    })));
  }
  g.add(cavity(blob({ rx: 1.15, ry: 2.15, rz: 1.65, detail: 3, position: [0, 3.75, 6.45] })));
  g.add(cavity(blob({ rx: 3.40, ry: 2.20, rz: 2.40, detail: 2, position: [0, 1.85, 2.35] })));

  // Auditory ossicles, hidden inside the petrous temporal bone.
  for (const side of [1, -1]) {
    const sideName = side > 0 ? 'Left' : 'Right';
    add(ossicle('malleus', side), 'malleus', `${sideName} malleus`, 'boneLight');
    add(ossicle('incus', side), 'incus', `${sideName} incus`, 'boneLight');
    add(ossicle('stapes', side), 'stapes', `${sideName} stapes`, 'boneLight');
  }

  // Upper dentition, carried by the maxillae.
  const upperTeeth = mk(buildArchTeeth(true), 'maxilla', 'Upper dentition (16 teeth)', 'tooth');
  upperTeeth.userData.isTeeth = true;
  g.add(upperTeeth);

  // Mandible on its own hinge so the jaw can open.
  const jaw = new THREE.Group();
  jaw.name = 'jaw';
  const mand = mandibleBone(p);
  jaw.position.copy(mand.hinge);
  jaw.add(mk(mand.geo, 'mandible', 'Mandible'));
  const lowerTeeth = buildArchTeeth(false);
  lowerTeeth.translate(-mand.hinge.x, -mand.hinge.y, -mand.hinge.z);
  const lt = mk(lowerTeeth, 'mandible', 'Lower dentition (16 teeth)', 'tooth');
  lt.userData.isTeeth = true;
  jaw.add(lt);
  g.add(jaw);
  g.userData.jaw = jaw;

  // Hyoid, suspended below the mandible at the C3 level.
  const hy = new THREE.Group();
  hy.position.set(0, -7.6, 4.6);
  hy.add(mk(hyoidBone(), 'hyoid', 'Hyoid bone'));
  g.add(hy);

  return g;
}
