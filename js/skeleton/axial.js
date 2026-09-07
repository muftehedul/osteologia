/**
 * The axial skeleton below the head: vertebral column, sacrum, coccyx,
 * ribs, costal cartilages and sternum.
 * ------------------------------------------------------------------
 * The column is laid out along a real sagittal curve carrying the four
 * normal spinal curvatures (cervical lordosis, thoracic kyphosis, lumbar
 * lordosis, sacral kyphosis). Each vertebra is placed at its measured
 * height and depth and oriented to the local tangent, then the whole set is
 * re-parented into a joint chain so the spine can actually bend.
 *
 * All heights are world centimetres above the soles of the feet for a
 * 176 cm reference male.
 */

import * as THREE from 'three';
import {
  blob, loft, merge, strut, plate, sweptBone,
  superellipse, kidneySection, xform, boneSurface, smoothOutline,
} from '../geometry/boneGeo.js';

/* ==================================================================
 * The sagittal profile of the column
 * ================================================================== */

/**
 * [id, label, y (height), z (anteroposterior offset)] for every presacral
 * vertebra. The z values reproduce the S-shaped curve of the adult spine.
 */
export const VERTEBRA_LEVELS = [
  ['C1',  161.8, -0.4], ['C2',  159.6,  0.0], ['C3',  157.3,  0.5], ['C4', 155.0, 0.7],
  ['C5',  152.7,  0.5], ['C6',  150.4, -0.1], ['C7',  148.0, -1.0],
  ['T1',  145.6, -1.8], ['T2',  143.3, -2.6], ['T3',  141.0, -3.4], ['T4', 138.6, -4.0],
  ['T5',  136.2, -4.5], ['T6',  133.8, -4.8], ['T7',  131.3, -4.9], ['T8', 128.8, -4.8],
  ['T9',  126.3, -4.5], ['T10', 123.7, -4.0], ['T11', 121.1, -3.2], ['T12', 118.4, -2.2],
  ['L1',  115.4, -1.0], ['L2',  112.0,  0.1], ['L3',  108.6,  0.7], ['L4', 105.2, 0.6],
  ['L5',  101.8, -0.2],
];

/** Anthropometry of the vertebral bodies, interpolated per level. */
function vertebraSpec(id, i, p) {
  const region = id[0];
  const n = parseInt(id.slice(1), 10);
  const r = p.robust;

  if (region === 'C') {
    const t = (n - 3) / 4;                    // C3..C7
    return {
      region: 'cervical', label: id,
      bw: (0.80 + t * 0.28) * r, bd: (0.62 + t * 0.16) * r, bh: 1.32,
      canalW: 1.35, canalD: 1.05,
      spinLen: n === 7 ? 3.35 : 1.75 + t * 0.5, spinAng: n === 7 ? -0.30 : -0.42, bifid: n < 7,
      tpLen: 2.35, tpAng: -0.16, transverseForamen: true,
      apOffset: 0.75, facetTilt: 0.78,
    };
  }
  if (region === 'T') {
    const t = (n - 1) / 11;
    return {
      region: 'thoracic', label: id,
      bw: (1.20 + t * 0.55) * r, bd: (1.05 + t * 0.42) * r, bh: 1.75 + t * 0.55,
      canalW: 1.15, canalD: 1.05,
      spinLen: 3.6 + Math.sin(t * Math.PI) * 1.4, spinAng: -0.95 + Math.abs(t - 0.5) * 0.7,
      tpLen: 2.6 - t * 0.9, tpAng: 0.10, tpBack: 1.5,
      costalFacet: true, costalTP: n <= 10,
      apOffset: 0.95, facetTilt: 0.15,
    };
  }
  const t = (n - 1) / 4;
  return {
    region: 'lumbar', label: id,
    bw: (1.85 + t * 0.42) * r, bd: (1.42 + t * 0.16) * r, bh: 2.55 + t * 0.22,
    canalW: 1.35, canalD: 1.20,
    spinLen: 3.1, spinAng: -0.12,
    tpLen: 3.1 + Math.sin(t * Math.PI) * 0.6, tpAng: 0.06, tpBack: 0.2,
    mamillary: true,
    apOffset: 1.15, facetTilt: -0.10,
  };
}

/* ==================================================================
 * Generic vertebra
 * ================================================================== */

/**
 * Build a typical vertebra in its own frame:
 *   origin = centre of the vertebral body, +Y superior, +Z anterior.
 */
function buildVertebra(s) {
  const parts = [];
  const hb = s.bh / 2;

  /* --- Body: waisted in the middle, flared at the endplates ---------- */
  const secs = [];
  const rings = 9;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const y = -hb + t * s.bh;
    // Concave lateral profile — the "wasp waist" of a vertebral body.
    const waist = 1 - 0.13 * Math.sin(t * Math.PI);
    // Flare into the endplate rims at both ends.
    const rim = 1 + 0.055 * (Math.pow(Math.abs(t * 2 - 1), 6));
    const k = waist * rim;
    secs.push({ y, pts: kidneySection(s.bw * k, s.bd * k, 30, 0.22) });
  }
  parts.push(loft(secs));

  /* --- Pedicles: short stout struts running posteriorly -------------- */
  // These carry the entire load path from the body into the arch, and they
  // are genuinely thick. Drawn thin, the transverse and articular processes
  // read as loose pills floating beside the vertebral body.
  const pedZ = -s.bd * 0.62;
  const canalBack = pedZ - s.canalD * 1.25;
  const pedR = (s.region === 'lumbar' ? 0.58 : s.region === 'thoracic' ? 0.46 : 0.40) * s.bw / 1.4;
  for (const side of [1, -1]) {
    parts.push(strut(
      [side * s.bw * 0.72, 0.05, pedZ + 0.20],
      [side * (s.canalW * 0.95), 0.08, canalBack + 0.30],
      Math.max(0.34, pedR * 1.15), Math.max(0.32, pedR), 12,
    ));
  }

  /* --- Laminae: flat plates closing the vertebral arch --------------- */
  for (const side of [1, -1]) {
    const lam = plate({
      outline: [[-0.95, -0.62], [-1.05, 0.62], [0.95, 0.55], [1.0, -0.58]],
      thickness: 0.30, bevel: 0.10,
    });
    lam.rotateY(side * -0.72);
    lam.rotateX(0.10);
    lam.translate(side * s.canalW * 0.62, 0.05, canalBack - 0.45);
    parts.push(lam);
  }

  /* --- Spinous process ---------------------------------------------- */
  const spTip = [0, Math.sin(s.spinAng) * s.spinLen, canalBack - 0.75 - Math.cos(s.spinAng) * s.spinLen];
  if (s.bifid) {
    // Cervical spines C3-C6 are bifid — they fork at the tip.
    for (const side of [1, -1]) {
      parts.push(strut([0, 0.05, canalBack - 0.6], [side * 0.42, spTip[1], spTip[2]], 0.30, 0.20, 8));
    }
  } else {
    const sp = sweptBone({
      path: [
        [0, 0.05, canalBack - 0.55],
        [0, spTip[1] * 0.5, canalBack - 0.55 + (spTip[2] - canalBack + 0.55) * 0.5],
        [spTip[0], spTip[1], spTip[2]],
      ],
      profile: s.region === 'lumbar'
        ? [{ t: 0, rx: 0.24, ry: 0.72 }, { t: 0.6, rx: 0.26, ry: 0.95 }, { t: 1, rx: 0.30, ry: 1.05 }]
        : [{ t: 0, rx: 0.30, ry: 0.55 }, { t: 0.7, rx: 0.24, ry: 0.44 }, { t: 1, rx: 0.26, ry: 0.40 }],
      segments: 14, radial: 10,
    });
    parts.push(sp);
  }

  /* --- Transverse processes ----------------------------------------- */
  for (const side of [1, -1]) {
    const zBack = canalBack + 0.3 - (s.tpBack || 0);
    if (s.transverseForamen) {
      // Cervical: the process is a ring enclosing the vertebral artery.
      const ring = sweptBone({
        path: [
          [side * 0.95, 0.0, zBack + 0.9],
          [side * 1.95, 0.15, zBack + 1.15],
          [side * s.tpLen, 0.05, zBack + 0.25],
          [side * 1.85, -0.10, zBack - 0.55],
          [side * 0.95, 0.0, zBack - 0.35],
        ],
        profile: [{ t: 0, rx: 0.26, ry: 0.26 }, { t: 0.5, rx: 0.22, ry: 0.24 }, { t: 1, rx: 0.26, ry: 0.26 }],
        segments: 22, radial: 8, closed: true, capStart: false, capEnd: false,
      });
      parts.push(ring);
      // Anterior and posterior tubercles.
      parts.push(blob({ rx: 0.30, ry: 0.24, rz: 0.26, detail: 2, position: [side * s.tpLen * 0.85, 0.05, zBack + 1.05] }));
      parts.push(blob({ rx: 0.30, ry: 0.24, rz: 0.26, detail: 2, position: [side * s.tpLen * 0.85, -0.05, zBack - 0.45] }));
    } else {
      const tp = sweptBone({
        path: [
          [side * s.canalW * 0.85, 0.05, zBack + 0.2],
          [side * s.tpLen * 0.6, Math.sin(s.tpAng) * s.tpLen * 0.5, zBack - 0.35],
          [side * s.tpLen, Math.sin(s.tpAng) * s.tpLen, zBack - 0.65],
        ],
        profile: s.region === 'lumbar'
          ? [{ t: 0, rx: 0.34, ry: 0.30 }, { t: 1, rx: 0.42, ry: 0.20 }]
          : [{ t: 0, rx: 0.36, ry: 0.34 }, { t: 1, rx: 0.44, ry: 0.40 }],
        segments: 12, radial: 10,
      });
      parts.push(tp);
      // Transverse costal facet for the tubercle of the rib.
      if (s.costalTP) {
        parts.push(blob({
          rx: 0.42, ry: 0.34, rz: 0.30, detail: 2,
          position: [side * s.tpLen * 0.92, Math.sin(s.tpAng) * s.tpLen, zBack - 0.25],
        }));
      }
    }
  }

  /* --- Articular processes (facet joints) ---------------------------- */
  for (const side of [1, -1]) {
    const zf = canalBack + 0.15;
    // Superior — face posteromedially in the lumbar spine, posteriorly in
    // the thoracic, and posterosuperiorly in the cervical.
    const sup = blob({
      rx: 0.46, ry: 0.34, rz: 0.42, detail: 2,
      position: [side * s.canalW * 1.02, hb + 0.42, zf - 0.15],
      rotation: [s.facetTilt, side * (s.region === 'lumbar' ? 0.55 : 0.12), 0],
      scaleAfter: [1, 1, s.region === 'lumbar' ? 0.7 : 1],
    });
    const inf = blob({
      rx: 0.46, ry: 0.34, rz: 0.42, detail: 2,
      position: [side * s.canalW * 0.86, -hb - 0.55, zf - 0.35],
      rotation: [-s.facetTilt, side * (s.region === 'lumbar' ? -0.55 : -0.12), 0],
      scaleAfter: [1, 1, s.region === 'lumbar' ? 0.7 : 1],
    });
    parts.push(sup, inf);
    if (s.mamillary) {
      parts.push(blob({ rx: 0.24, ry: 0.30, rz: 0.24, detail: 2, position: [side * s.canalW * 1.15, hb + 0.30, zf - 0.4] }));
    }
  }

  /* --- Costal demifacets on the thoracic bodies ---------------------- */
  if (s.costalFacet) {
    for (const side of [1, -1]) {
      parts.push(blob({ rx: 0.26, ry: 0.30, rz: 0.26, detail: 2, position: [side * s.bw * 0.92, hb - 0.35, -s.bd * 0.55] }));
      parts.push(blob({ rx: 0.26, ry: 0.30, rz: 0.26, detail: 2, position: [side * s.bw * 0.92, -hb + 0.35, -s.bd * 0.55] }));
    }
  }

  return boneSurface(merge(parts), 0.045, 1.1);
}

/* --- The two atypical cervical vertebrae ----------------------------- */

function buildAtlas(p) {
  const parts = [];
  const R = 2.15 * p.robust;         // radius of the C1 ring
  // A bony ring: no body, no spinous process.
  const ring = sweptBone({
    path: (() => {
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        pts.push([Math.sin(a) * R * 1.06, 0, Math.cos(a) * R]);
      }
      return pts;
    })(),
    profile: (() => {
      const pr = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        const a = t * Math.PI * 2;
        // Thick at the lateral masses, thin across the arches.
        const lat = Math.abs(Math.sin(a));
        pr.push({ t, rx: 0.30 + lat * 0.42, ry: 0.34 + lat * 0.46 });
      }
      return pr;
    })(),
    segments: 60, radial: 12, closed: true, capStart: false, capEnd: false,
  });
  parts.push(ring);

  for (const side of [1, -1]) {
    // Lateral masses with the concave superior facets that cradle the
    // occipital condyles.
    parts.push(blob({
      rx: 0.95, ry: 0.72, rz: 1.35, detail: 3,
      position: [side * R * 0.95, 0, -0.15],
      field: (x, y, z) => 1 - 0.22 * Math.max(0, y),
    }));
    // Transverse processes — unusually long in C1, palpable below the ear.
    parts.push(strut([side * R * 0.95, 0, -0.3], [side * 3.35, -0.1, -0.55], 0.34, 0.26, 8));
    parts.push(blob({ rx: 0.28, ry: 0.24, rz: 0.30, detail: 2, position: [side * 3.35, -0.1, -0.55] }));
  }
  // Anterior and posterior tubercles.
  parts.push(blob({ rx: 0.42, ry: 0.34, rz: 0.30, detail: 2, position: [0, 0, R * 1.05] }));
  parts.push(blob({ rx: 0.46, ry: 0.30, rz: 0.34, detail: 2, position: [0, 0.05, -R * 1.02] }));
  return boneSurface(merge(parts), 0.04, 1.2);
}

function buildAxis(p) {
  const s = vertebraSpec('C2', 1, p);
  s.bifid = false;
  s.spinLen = 2.9;                    // C2 has a large, strong, bifid spine
  s.bifid = true;
  const base = buildVertebra(s);
  // The dens: the body of C1 annexed by C2 in evolution.
  const dens = sweptBone({
    path: [[0, 0.55, 0.35], [0, 1.55, 0.42], [0, 2.45, 0.40]],
    profile: [{ t: 0, rx: 0.55, ry: 0.50 }, { t: 0.6, rx: 0.42, ry: 0.40 }, { t: 1, rx: 0.30, ry: 0.30 }],
    segments: 14, radial: 12,
  });
  const tip = blob({ rx: 0.30, ry: 0.28, rz: 0.28, detail: 2, position: [0, 2.55, 0.40] });
  return boneSurface(merge([base, dens, tip]), 0.045, 1.1);
}

/* ==================================================================
 * Sacrum and coccyx
 * ================================================================== */

function buildSacrum(p) {
  const W = 5.55 * p.sacrumW;      // half-width across the alae
  const H = 11.2;                  // base to apex

  // The sacrum is authored as a plate with REAL anterior sacral foramina
  // punched through it, then bent into the sacral curve. The outline is the
  // true silhouette: broad winged alae above, tapering to a narrow apex.
  const shape = new THREE.Shape();
  const outline = [
    [2.55, 0.60], [W * 0.80, 0.15], [W, -1.45], [W * 0.90, -3.10],
    [W * 0.64, -4.70], [W * 0.50, -6.40], [W * 0.39, -8.10], [W * 0.30, -9.80], [W * 0.24, -H],
    [-W * 0.24, -H], [-W * 0.30, -9.80], [-W * 0.39, -8.10], [-W * 0.50, -6.40],
    [-W * 0.64, -4.70], [-W * 0.90, -3.10], [-W, -1.45], [-W * 0.80, 0.15], [-2.55, 0.60],
  ];
  const smooth = smoothOutline(outline, 4, 0.40);
  shape.moveTo(smooth[0][0], smooth[0][1]);
  smooth.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();

  // Four pairs of foramina transmitting the ventral sacral rami.
  const foramina = [[2.30, -2.5, 0.55], [2.00, -4.6, 0.48], [1.72, -6.5, 0.40], [1.44, -8.3, 0.32]];
  for (const [fx, fy, fr] of foramina) {
    for (const side of [1, -1]) {
      const h = new THREE.Path();
      h.absellipse(side * fx * p.sacrumW, fy, fr * 1.15, fr, 0, Math.PI * 2, true);
      shape.holes.push(h);
    }
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 2.0, bevelEnabled: true, bevelThickness: 0.34, bevelSize: 0.34,
    bevelSegments: 3, curveSegments: 12, steps: 5,
  });
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox;
  const midZ = (min.z + max.z) / 2;
  geo.center();

  // Bend into the sacral kyphosis and thin the bone toward the apex.
  const pos = geo.attributes.position;
  const span = max.y - min.y;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    let z = pos.getZ(i);
    const v = THREE.MathUtils.clamp((span / 2 - y) / span, 0, 1);   // 0 base, 1 apex
    // The alae are thick; the lower segments are little more than a shell.
    z *= THREE.MathUtils.clamp(1.15 - v * 0.72, 0.28, 1.2);
    z += -p.sacrumCurve * 2.5 * v * v;                    // anterior concavity
    z += -0.55 * (x / W) ** 2;                            // transverse concavity
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const parts = [geo];
  // Auricular surfaces — the ear-shaped facets of the sacroiliac joints,
  // on the LATERAL aspect of the alae facing the ilia.
  for (const side of [1, -1]) {
    parts.push(blob({
      rx: 0.95, ry: 2.30, rz: 1.45, detail: 3,
      position: [side * W * 0.90, span / 2 - 2.6, -0.55],
      rotation: [0.12, side * 0.30, 0],
      field: (x, y, z) => 1 - 0.16 * Math.max(0, side > 0 ? x : -x),
    }));
  }
  // Sacral promontory — the anterosuperior lip of S1 and the key landmark
  // of the pelvic inlet in obstetric pelvimetry.
  parts.push(blob({ rx: 2.30, ry: 0.80, rz: 1.05, detail: 3, position: [0, span / 2 - 0.55, 1.15] }));
  // Median sacral crest — the four fused spinous processes.
  for (let i = 0; i < 4; i++) {
    const y = span / 2 - 1.9 - i * 2.05;
    const v = (span / 2 - y) / span;
    parts.push(blob({
      rx: 0.40, ry: 0.60, rz: 0.44, detail: 2,
      position: [0, y, -1.05 * (1.15 - v * 0.72) - p.sacrumCurve * 2.5 * v * v - 0.30],
    }));
  }
  // Sacral cornua flanking the sacral hiatus — the caudal epidural landmark.
  for (const side of [1, -1]) {
    parts.push(blob({
      rx: 0.26, ry: 0.58, rz: 0.30, detail: 2,
      position: [side * 0.68, -span / 2 + 0.85, -p.sacrumCurve * 2.2 - 0.45],
    }));
  }
  return boneSurface(merge(parts), 0.05, 0.7);
}

function buildCoccyx() {
  const parts = [];
  let y = 0, z = 0;
  for (let i = 0; i < 4; i++) {
    const r = 0.85 - i * 0.16;
    parts.push(blob({ rx: r, ry: 0.42 - i * 0.05, rz: r * 0.72, detail: 2, position: [0, y, z] }));
    y -= 0.95 - i * 0.10;
    z += 0.30 + i * 0.10;             // the coccyx curves forward
  }
  // Coccygeal cornua, which meet the sacral cornua.
  for (const side of [1, -1]) {
    parts.push(blob({ rx: 0.20, ry: 0.38, rz: 0.20, detail: 2, position: [side * 0.55, 0.42, -0.15] }));
  }
  return boneSurface(merge(parts), 0.04, 1.2);
}

/* ==================================================================
 * Ribs, costal cartilages and sternum
 * ================================================================== */

/**
 * Per-rib shape parameters. `hw` is the maximum half-width of the cage at
 * that level; `ax/ay/az` locate the costochondral junction relative to the
 * parent vertebra. Ribs 11 and 12 float.
 */
const RIB_SPEC = [
  { hw: 5.6,  ax: 1.9, ay: -1.4, az: 8.6 },
  { hw: 7.7,  ax: 2.2, ay: -3.0, az: 10.0 },
  { hw: 9.7,  ax: 2.4, ay: -4.6, az: 10.7 },
  { hw: 11.3, ax: 2.6, ay: -6.0, az: 11.0 },
  { hw: 12.5, ax: 2.8, ay: -7.2, az: 11.1 },
  { hw: 13.3, ax: 3.0, ay: -8.2, az: 10.9 },
  { hw: 13.9, ax: 3.3, ay: -9.0, az: 10.4 },
  { hw: 14.0, ax: 4.6, ay: -9.6, az: 9.4 },
  { hw: 13.6, ax: 5.9, ay: -9.8, az: 8.0 },
  { hw: 12.7, ax: 7.0, ay: -9.5, az: 6.2 },
  { hw: 10.9, ax: 8.1, ay: -7.2, az: 1.6, floating: true },
  { hw: 8.3,  ax: 7.3, ay: -5.6, az: -0.8, floating: true },
];

/** Path of one rib, in the local frame of its thoracic vertebra. */
function ribPath(n, side, p) {
  const r = RIB_SPEC[n];
  const hw = r.hw * p.cageW;
  const az = r.az * p.cageD;
  const s = side;
  return [
    [s * 1.35, 0.10, -0.75],                                  // head — costovertebral joint
    [s * 2.60, 0.00, -2.10],                                  // neck
    [s * 3.90, -0.55, -3.05],                                 // tubercle
    [s * hw * 0.66, -1.70, -3.30],                            // angle of the rib
    [s * hw * 0.97, r.ay * 0.30, -0.90],                      // widest point
    [s * hw * 0.92, r.ay * 0.58, az * 0.34],
    [s * hw * 0.66, r.ay * 0.82, az * 0.70],
    [s * r.ax * p.cageW, r.ay, az],                           // costochondral junction
  ];
}

function buildRib(n, side, p) {
  const path = ribPath(n, side, p);
  const th = p.robust;
  // Ribs are flat blades, not rods: wide superoinferiorly, thin front-to-back,
  // with the costal groove sheltering the neurovascular bundle inferiorly.
  const geo = sweptBone({
    path,
    profile: [
      { t: 0.00, rx: 0.52 * th, ry: 0.46 * th, rot: 0 },
      { t: 0.08, rx: 0.42 * th, ry: 0.40 * th, rot: 10 },
      { t: 0.22, rx: 0.30 * th, ry: 0.62 * th, rot: 25 },
      { t: 0.50, rx: 0.26 * th, ry: 0.72 * th, rot: 12 },
      { t: 0.80, rx: 0.28 * th, ry: 0.66 * th, rot: 0 },
      { t: 1.00, rx: 0.34 * th, ry: 0.56 * th, rot: 0 },
    ],
    segments: 70, radial: 14,
    warp: (v, t) => {
      // Costal groove: a shallow scoop along the lower inner border.
      if (t > 0.25 && t < 0.92) {
        const g = Math.sin((t - 0.25) / 0.67 * Math.PI) * 0.08;
        v.y += g * 0.2;
      }
    },
  });
  return boneSurface(geo, 0.035, 1.3);
}

/** Costal cartilage joining a rib end to the sternum or the costal margin. */
function buildCartilage(from, to, r0, r1, bow) {
  const mid = [
    (from[0] + to[0]) / 2 + (bow?.[0] || 0),
    (from[1] + to[1]) / 2 + (bow?.[1] || 0),
    (from[2] + to[2]) / 2 + (bow?.[2] || 0.9),
  ];
  return sweptBone({
    path: [from, mid, to],
    profile: [{ t: 0, rx: r0, ry: r0 * 1.15 }, { t: 1, rx: r1, ry: r1 * 1.15 }],
    segments: 18, radial: 12,
  });
}

function buildSternum(p) {
  const w = p.cageW;
  // Manubrium — with the jugular notch scooped from its upper border and
  // the clavicular notches at its upper angles.
  const manub = loft([
    { y: 0.0,  pts: superellipse(2.55 * w, 0.62, 26, 3) },
    { y: -1.0, pts: superellipse(2.70 * w, 0.66, 26, 3) },
    { y: -2.6, pts: superellipse(2.45 * w, 0.68, 26, 3) },
    { y: -4.3, pts: superellipse(1.95 * w, 0.62, 26, 3) },
  ]);
  const mp = manub.attributes.position;
  for (let i = 0; i < mp.count; i++) {
    const x = mp.getX(i), y = mp.getY(i);
    // Jugular (suprasternal) notch.
    if (y > -1.1) mp.setY(i, y - 0.85 * Math.max(0, 1 - (x / (1.35 * w)) ** 2));
  }
  mp.needsUpdate = true;
  manub.computeVertexNormals();

  // Body of the sternum, set slightly back at the sternal angle of Louis.
  const body = loft([
    { y: -4.35, pts: superellipse(1.75 * w, 0.60, 26, 3) },
    { y: -6.5,  pts: superellipse(1.85 * w, 0.56, 26, 3) },
    { y: -9.0,  pts: superellipse(1.95 * w, 0.54, 26, 3) },
    { y: -11.5, pts: superellipse(1.80 * w, 0.52, 26, 3) },
    { y: -13.6, pts: superellipse(1.45 * w, 0.48, 26, 3) },
  ]);
  body.translate(0, 0, -0.45);

  // Xiphoid process — cartilaginous until roughly age 40.
  const xiph = blob({ rx: 0.75, ry: 1.15, rz: 0.42, detail: 3, position: [0, -14.5, -0.55] });

  // Costal notches down both sides.
  const notches = [];
  for (let i = 0; i < 7; i++) {
    const y = -1.0 - i * 2.05;
    for (const side of [1, -1]) {
      notches.push(blob({ rx: 0.34, ry: 0.42, rz: 0.34, detail: 2, position: [side * (i === 0 ? 2.5 : 1.85) * w, y, -0.25] }));
    }
  }
  return boneSurface(merge([manub, body, xiph, ...notches]), 0.045, 0.9);
}

/* ==================================================================
 * Assembly
 * ================================================================== */

/**
 * Build the vertebral column, thoracic cage and sacrum.
 *
 * @param p    sex/anthropometry profile
 * @param mk   mesh factory (geometry, boneId, label, materialKey) => Mesh
 * @param root the group everything is initially added to in WORLD space;
 *             the caller re-parents into the joint chain afterwards
 */
export function buildAxialSkeleton(p, mk) {
  const joints = {};          // 'T4' -> Object3D at that vertebra
  const ribGroups = [];       // for the breathing animation
  const loose = [];           // meshes/groups the caller must place

  /* --- vertebrae ----------------------------------------------------- */
  VERTEBRA_LEVELS.forEach(([id, y, z], i) => {
    const j = new THREE.Group();
    j.name = id;
    j.position.set(0, y * p.spineScale, z);

    // Orient each vertebra to the local tangent of the spinal curve so the
    // endplates stay perpendicular to the column.
    const prev = VERTEBRA_LEVELS[Math.max(0, i - 1)];
    const next = VERTEBRA_LEVELS[Math.min(VERTEBRA_LEVELS.length - 1, i + 1)];
    const dy = (next[1] - prev[1]) * p.spineScale;
    const dz = next[2] - prev[2];
    j.rotation.x = Math.atan2(dz, dy);

    let geo;
    if (id === 'C1') geo = buildAtlas(p);
    else if (id === 'C2') geo = buildAxis(p);
    else geo = buildVertebra(vertebraSpec(id, i, p));

    const boneId = id === 'C1' ? 'atlas' : id === 'C2' ? 'axis'
      : id[0] === 'C' ? 'cervical' : id[0] === 'T' ? 'thoracicvert' : 'lumbar';
    const mesh = mk(geo, boneId, `${id} vertebra`, 'boneAxial');
    mesh.userData.level = id;
    j.add(mesh);
    joints[id] = j;
    loose.push(j);

    // Intervertebral disc below each vertebra (not below C1).
    if (i > 0 && id !== 'C1') {
      const s = vertebraSpec(id, i, p);
      const prevSpec = id === 'C2' ? { bw: 0.9, bd: 0.7 } : s;
      const gap = Math.abs(y - prev[1]) * p.spineScale - s.bh;
      if (gap > 0.15) {
        const d = loft([
          { y: 0, pts: kidneySection(s.bw * 0.97, s.bd * 0.97, 24, 0.22) },
          { y: gap * 0.5, pts: kidneySection(s.bw * 1.02, s.bd * 1.02, 24, 0.22) },
          { y: gap, pts: kidneySection(prevSpec.bw * 0.97, prevSpec.bd * 0.97, 24, 0.22) },
        ]);
        d.translate(0, -s.bh / 2 - gap, 0);
        const dm = mk(d, null, `${id}/${prev[0]} intervertebral disc`, 'disc');
        dm.userData.soft = true;
        j.add(dm);
      }
    }
  });

  /* --- ribs, attached to their thoracic vertebrae --------------------- */
  for (let n = 0; n < 12; n++) {
    const level = `T${n + 1}`;
    for (const side of [1, -1]) {
      const rg = new THREE.Group();
      rg.name = `rib${n + 1}${side > 0 ? 'L' : 'R'}`;
      rg.userData.ribIndex = n;
      const label = `${side > 0 ? 'Left' : 'Right'} rib ${n + 1}` +
        (n < 7 ? ' (true rib)' : n < 10 ? ' (false rib)' : ' (floating rib)');
      rg.add(mk(buildRib(n, side, p), 'ribs', label, 'boneAxial'));
      joints[level].add(rg);
      ribGroups.push(rg);
    }
  }

  /* --- sternum -------------------------------------------------------- */
  const sternumGroup = new THREE.Group();
  sternumGroup.name = 'sternum';
  sternumGroup.position.set(0, 143.0 * p.spineScale, 8.3 * p.cageD);
  sternumGroup.add(mk(buildSternum(p), 'sternum', 'Sternum', 'boneAxial'));
  loose.push(sternumGroup);

  /* --- costal cartilages ---------------------------------------------- */
  const cartGroup = new THREE.Group();
  cartGroup.name = 'costalCartilage';
  const sternWorld = (yLocal, xHalf) => [xHalf, 143.0 * p.spineScale + yLocal, 8.3 * p.cageD - 0.2];

  for (let n = 0; n < 10; n++) {
    const lv = VERTEBRA_LEVELS[7 + n];      // T1 is index 7
    const r = RIB_SPEC[n];
    for (const side of [1, -1]) {
      const from = [
        side * r.ax * p.cageW,
        lv[1] * p.spineScale + r.ay,
        lv[2] + r.az * p.cageD,
      ];
      let to, bow;
      if (n < 7) {
        // True ribs — straight to their own notch on the sternum.
        to = sternWorld(-0.9 - n * 2.05, side * 1.9 * p.cageW);
        bow = [0, 0.2, 0.5];
      } else {
        // False ribs — sweep up the costal margin to join rib 7's cartilage.
        const prev = RIB_SPEC[n - 1];
        const pv = VERTEBRA_LEVELS[6 + n];
        to = [
          side * (prev.ax + 0.5) * p.cageW,
          pv[1] * p.spineScale + prev.ay + 0.7,
          pv[2] + prev.az * p.cageD - 0.2,
        ];
        bow = [side * 0.6, -0.6, 1.0];
      }
      const c = buildCartilage(from, to, 0.42, 0.36, bow);
      const cm = mk(c, null, `${side > 0 ? 'Left' : 'Right'} costal cartilage ${n + 1}`, 'cartilage');
      cm.userData.soft = true;
      cartGroup.add(cm);
    }
  }
  loose.push(cartGroup);

  /* --- sacrum and coccyx ---------------------------------------------- */
  const sacrumGroup = new THREE.Group();
  sacrumGroup.name = 'sacrum';
  sacrumGroup.position.set(0, 94.9 * p.spineScale, -2.9);
  sacrumGroup.rotation.x = 0.46;                 // lumbosacral angle
  sacrumGroup.add(mk(buildSacrum(p), 'sacrum', 'Sacrum', 'boneAxial'));

  const coccyxGroup = new THREE.Group();
  coccyxGroup.position.set(0, -6.0, -1.5);
  coccyxGroup.rotation.x = -0.30;
  coccyxGroup.add(mk(buildCoccyx(), 'coccyx', 'Coccyx', 'boneAxial'));
  sacrumGroup.add(coccyxGroup);
  loose.push(sacrumGroup);

  return { joints, ribGroups, loose, sternumGroup, sacrumGroup, cartGroup };
}
