/**
 * The appendicular skeleton — 126 bones.
 * ------------------------------------------------------------------
 * Pectoral girdle, upper limb, pelvic girdle and lower limb, including all
 * 16 carpals, 10 metacarpals, 28 hand phalanges, 14 tarsals, 10 metatarsals
 * and 28 foot phalanges.
 *
 * Every bone is authored for the LEFT side in a frame whose origin sits at
 * that bone's PROXIMAL JOINT CENTRE, then mirrored across X for the right.
 * Putting the origin on the joint is what lets the same geometry be dropped
 * straight into an animatable joint chain.
 *
 *   +X = the subject's LEFT (so +X is lateral on the left limb)
 *   +Y = superior          +Z = anterior
 */

import * as THREE from 'three';
import {
  blob, loft, merge, mirrorX, strut, plate, sweptBone, sphericalCup, bladePlate,
  superellipse, xform, boneSurface, smoothOutline,
} from '../geometry/boneGeo.js';

/* ==================================================================
 * Joint centres (world centimetres, reference male)
 * ================================================================== */

export function jointMap(p) {
  const L = p.limbScale;
  return {
    sternoclavicular: [2.2 * p.shoulderW, 142.8 * p.spineScale, 8.2 * p.cageD],
    glenohumeral:     [16.0 * p.shoulderW, 141.0 * p.spineScale, 0.0],
    hip:              [8.8 * p.pelvisW, 89.5 * p.spineScale, 0.8],
    humerusLen:       32.5 * L,
    forearmLen:       26.5 * L,
    femurLen:         42.0 * L,
    tibiaLen:         40.0 * L,
  };
}

/* ==================================================================
 * PECTORAL GIRDLE
 * ================================================================== */

/** Clavicle — S-shaped, origin at the sternoclavicular joint. */
function buildClavicle(p) {
  const w = p.shoulderW;
  const geo = sweptBone({
    path: [
      [0, 0, 0],
      [3.8 * w, 0.35, -0.55],
      [7.6 * w, 0.75, -2.35],
      [11.2 * w, 0.80, -4.65],
      [13.8 * w, 0.70, -6.20],
    ],
    profile: [
      // Rounded and stout medially, flattened into a blade laterally.
      { t: 0.00, rx: 0.95 * p.robust, ry: 1.05 * p.robust, rot: 0 },
      { t: 0.15, rx: 0.72 * p.robust, ry: 0.82 * p.robust, rot: 0 },
      { t: 0.55, rx: 0.60 * p.robust, ry: 0.70 * p.robust, rot: 20 },
      { t: 0.85, rx: 0.42 * p.robust, ry: 0.82 * p.robust, rot: 45 },
      { t: 1.00, rx: 0.40 * p.robust, ry: 0.90 * p.robust, rot: 55 },
    ],
    segments: 48, radial: 14,
  });
  // Conoid tubercle — where the coracoclavicular ligament anchors.
  const conoid = blob({ rx: 0.34, ry: 0.30, rz: 0.34, detail: 2, position: [11.6 * w, 0.30, -5.35] });
  return boneSurface(merge([geo, conoid]), 0.04, 1.0);
}

/**
 * Scapula — origin at the centre of the glenoid cavity.
 * The blade is authored in the SCAPULAR PLANE (about 35 degrees anterior to
 * the coronal plane) and then curved to sit on the posterior thorax.
 */
function buildScapula(p) {
  const parts = [];
  // The blade lies in the SCAPULAR PLANE, about 37 degrees anterior to the
  // coronal plane, so that running medially from the glenoid also carries it
  // posteriorly — onto the back of the rib cage where it belongs. A basis
  // built with too little Z here leaves the scapula floating inside the chest.
  // It must also be RIGHT-handed: cross(e1, e2), or the plate inverts.
  const e1 = new THREE.Vector3(0.80, 0, 0.60);   // lateral + anterior
  const e2 = new THREE.Vector3(0, 1, 0);          // superior
  const n = new THREE.Vector3().crossVectors(e1, e2).normalize();  // costal (anterior)

  // Blade outline in (e1, e2), measured from the glenoid. The scapula spans
  // ribs 2-7: superior angle about 3 cm above the glenoid, inferior angle
  // about 12 cm below it, for an overall height of ~15 cm.
  const W = p.shoulderW;
  const outline = [
    [0.55, 0.40], [-1.50, 2.75], [-5.40, 3.30], [-9.80 * W, 3.05],
    [-10.30 * W, -0.20], [-9.90 * W, -6.20],
    [-8.20 * W, -12.00], [-4.60, -8.00], [-1.40, -3.20],
  ];
  const blade = bladePlate({
    outline: smoothOutline(outline, 5, 0.42),
    thickness: 0.46 * p.robust,
    sectors: 88, rings: 12,
    // Thin in the supraspinous and infraspinous fossae, thick at the borders.
    thin: (x, y) => 0.30 + 0.70 * THREE.MathUtils.clamp((Math.abs(x + 5.5) / 6) ** 2 + (Math.abs(y + 3) / 9) ** 2, 0, 1),
    // Curve the blade forward toward the ribs as it runs medially, so it
    // wraps the convex thorax instead of standing off it as a flat sheet.
    bend: (x, y) => 0.050 * Math.pow(Math.max(0, -x - 1), 1.55) - 0.004 * y * y,
  });
  // Map the authored (x, y, z) into (e1, e2, n).
  const bp = blade.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < bp.count; i++) {
    v.set(0, 0, 0)
      .addScaledVector(e1, bp.getX(i))
      .addScaledVector(e2, bp.getY(i))
      .addScaledVector(n, bp.getZ(i));
    bp.setXYZ(i, v.x, v.y, v.z);
  }
  bp.needsUpdate = true;
  blade.computeVertexNormals();
  parts.push(blade);

  // Thickened medial border and inferior angle.
  const border = (a, b, r) => strut(
    [e1.x * a[0] + n.x * 0.5, a[1], e1.z * a[0] + n.z * 0.5],
    [e1.x * b[0] + n.x * 0.5, b[1], e1.z * b[0] + n.z * 0.5],
    r, r, 8,
  );
  parts.push(border([-10.30 * W, 3.0], [-9.90 * W, -6.20], 0.38));
  parts.push(border([-9.90 * W, -6.20], [-8.20 * W, -12.00], 0.40));
  // Lateral (axillary) border — the thickest part of the bone, buttressing
  // the glenoid against the pull of the whole limb.
  parts.push(strut(
    [0.35, -2.60, 0.25], [e1.x * -7.4, -11.6, e1.z * -7.4], 0.72, 0.48, 12,
  ));

  // Spine of the scapula — the palpable dorsal ridge, standing off the
  // blade and dividing the supraspinous from the infraspinous fossa.
  const P = (u, w, d) => [e1.x * u + n.x * d, w, e1.z * u + n.z * d];
  parts.push(sweptBone({
    path: [
      P(-9.90 * W, -1.10, -0.35), P(-7.00, 0.05, -1.00),
      P(-4.00, 1.35, -1.60), P(-1.20, 2.35, -1.85),
    ],
    profile: [{ t: 0, rx: 0.28, ry: 0.50 }, { t: 0.5, rx: 0.40, ry: 0.90 }, { t: 1, rx: 0.52, ry: 1.00 }],
    segments: 22, radial: 12,
  }));

  // Acromion — the bony roof of the shoulder, arching laterally and forward
  // over the humeral head from the lateral end of the spine.
  const acromion = plate({
    outline: [[-2.0, -0.85], [-1.7, 0.95], [1.6, 1.10], [2.2, -0.20], [1.1, -1.10]],
    thickness: 0.80, bevel: 0.22, center: false,
  });
  acromion.rotateX(-Math.PI / 2 + 0.18);
  acromion.rotateY(0.40);
  acromion.translate(1.15, 3.05, -1.45);
  parts.push(acromion);

  // Coracoid process — the "lighthouse of the shoulder", hooking forwards
  // and laterally beneath the clavicle.
  parts.push(sweptBone({
    path: [[-1.70, 1.50, 1.05], [-2.05, 2.60, 2.05], [-2.90, 2.45, 3.40], [-3.70, 2.05, 4.30]],
    profile: [{ t: 0, rx: 0.58, ry: 0.58 }, { t: 0.5, rx: 0.48, ry: 0.52 }, { t: 1, rx: 0.42, ry: 0.46 }],
    segments: 16, radial: 12,
  }));

  // Glenoid cavity — shallow, pear-shaped, and only a third of the humeral
  // head's area, which is why the shoulder trades stability for range.
  const glen = blob({
    rx: 1.50, ry: 2.30, rz: 1.40, detail: 4,
    position: [0, 0, 0],
    field: (x, y, z) => {
      const d = x * e1.x + z * e1.z;
      return 1 - 0.42 * Math.max(0, d) ** 1.5;
    },
  });
  parts.push(glen);
  // Supraglenoid and infraglenoid tubercles (long head of biceps / triceps).
  parts.push(blob({ rx: 0.40, ry: 0.32, rz: 0.36, detail: 2, position: [-0.55, 2.30, -0.35] }));
  parts.push(blob({ rx: 0.44, ry: 0.36, rz: 0.40, detail: 2, position: [-0.55, -2.35, -0.45] }));

  return boneSurface(merge(parts), 0.045, 0.9);
}

/* ==================================================================
 * UPPER LIMB
 * ================================================================== */

function buildHumerus(p) {
  const L = jointMap(p).humerusLen;
  const r = p.robust;
  const parts = [];

  // Head — a third of a sphere, facing superomedially and posteriorly.
  parts.push(blob({
    rx: 2.35 * r, ry: 2.30 * r, rz: 2.30 * r, detail: 4,
    position: [0, 0, 0],
    field: (x, y, z) => 1 - 0.18 * Math.max(0, x * 0.8 + y * -0.2 + z * 0.5),
  }));

  // Greater and lesser tubercles with the intertubercular groove between —
  // the groove carries the long head of biceps.
  parts.push(blob({ rx: 1.45 * r, ry: 1.65 * r, rz: 1.50 * r, detail: 3, position: [2.45 * r, -1.10, -0.20] }));
  parts.push(blob({ rx: 1.00 * r, ry: 1.25 * r, rz: 1.00 * r, detail: 3, position: [0.45, -1.35, 2.05 * r] }));

  // Shaft: round proximally, becoming triangular and flattened distally.
  parts.push(sweptBone({
    path: [
      [1.30, -0.045 * L, 0.10],
      [1.15, -0.16 * L, 0.30],
      [0.95, -0.40 * L, 0.35],
      [0.60, -0.66 * L, 0.20],
      [0.10, -0.88 * L, 0.15],
      [-0.30, -0.955 * L, 0.20],
    ],
    profile: [
      { t: 0.00, rx: 1.60 * r, ry: 1.60 * r, rot: 0 },
      { t: 0.18, rx: 1.20 * r, ry: 1.22 * r, rot: 0 },
      { t: 0.45, rx: 1.05 * r, ry: 1.12 * r, rot: 15 },
      { t: 0.75, rx: 1.15 * r, ry: 0.85 * r, rot: 25 },
      { t: 1.00, rx: 2.05 * r, ry: 0.90 * r, rot: 20 },
    ],
    segments: 60, radial: 18,
  }));

  // Deltoid tuberosity — the V-shaped roughening at mid-shaft.
  parts.push(blob({
    rx: 0.80, ry: 2.40, rz: 0.72, detail: 3,
    position: [1.60 * r, -0.41 * L, 0.45],
    rotation: [0, 0, -0.10],
  }));

  // Distal end: epicondyles, trochlea and capitulum.
  const dy = -0.985 * L;
  parts.push(blob({ rx: 1.15 * r, ry: 1.05, rz: 0.95, detail: 3, position: [-2.75 * r, dy + 0.55, -0.30] }));  // medial epicondyle
  parts.push(blob({ rx: 0.95 * r, ry: 0.90, rz: 0.90, detail: 3, position: [2.35 * r, dy + 0.55, -0.10] }));   // lateral epicondyle

  // Trochlea — a pulley, waisted in the middle, that grips the ulna.
  parts.push(blob({
    rx: 1.45, ry: 1.30, rz: 1.30, detail: 4,
    position: [-0.90, dy, 0.30],
    field: (x, y, z) => 1 - 0.30 * Math.exp(-((x * 3.2) ** 2)),
  }));
  // Capitulum — a hemisphere for the radial head.
  parts.push(blob({ rx: 1.05, ry: 1.05, rz: 1.05, detail: 3, position: [1.55, dy + 0.15, 0.55] }));
  // Olecranon fossa: a thin, sometimes translucent, depression posteriorly.
  parts.push(blob({
    rx: 1.55, ry: 1.15, rz: 0.62, detail: 3,
    position: [0.10, dy + 1.35, -0.95],
    field: (x, y, z) => 1 - 0.42 * Math.max(0, -z),
  }));

  return boneSurface(merge(parts), 0.05, 0.55);
}

function buildUlna(p) {
  const L = jointMap(p).forearmLen;
  const r = p.robust;
  const parts = [];

  // Olecranon — the point of the elbow, and the triceps insertion.
  parts.push(blob({
    rx: 0.95 * r, ry: 1.35, rz: 1.15, detail: 3,
    position: [0, 1.75, -1.35],
    field: (x, y, z) => 1 + 0.12 * Math.max(0, y),
  }));
  // Coronoid process, with the trochlear notch scooped between the two.
  parts.push(blob({
    rx: 0.85 * r, ry: 0.85, rz: 1.05, detail: 3,
    position: [-0.05, -0.45, 1.15],
    field: (x, y, z) => 1 - 0.20 * Math.max(0, y),
  }));
  parts.push(blob({
    rx: 0.95 * r, ry: 1.35, rz: 1.10, detail: 4,
    position: [0, 0.55, -0.15],
    // The C-shaped trochlear notch itself.
    field: (x, y, z) => 1 - 0.34 * Math.max(0, z) * Math.exp(-((x * 1.6) ** 2)),
  }));
  // Radial notch on the lateral side, home to the annular ligament.
  parts.push(blob({ rx: 0.62, ry: 0.62, rz: 0.75, detail: 2, position: [0.95 * r, -0.15, 0.55] }));

  parts.push(sweptBone({
    path: [
      [0.10, -0.085 * L, 0.30],
      [0.35, -0.24 * L, 0.35],
      [0.62, -0.50 * L, 0.32],
      [0.88, -0.78 * L, 0.25],
      [1.05, -0.965 * L, 0.20],
    ],
    profile: [
      { t: 0.00, rx: 1.05 * r, ry: 1.05 * r, rot: 0 },
      { t: 0.25, rx: 0.75 * r, ry: 0.80 * r, rot: 25 },
      { t: 0.65, rx: 0.55 * r, ry: 0.58 * r, rot: 15 },
      { t: 1.00, rx: 0.66 * r, ry: 0.66 * r, rot: 0 },
    ],
    segments: 48, radial: 14,
  }));
  // Head and styloid process at the distal end.
  parts.push(blob({ rx: 0.80, ry: 0.62, rz: 0.78, detail: 3, position: [1.05, -0.975 * L, 0.20] }));
  parts.push(strut([1.00, -0.985 * L, 0.05], [0.85, -1.025 * L, -0.55], 0.34, 0.16, 8));
  return boneSurface(merge(parts), 0.045, 0.7);
}

function buildRadius(p) {
  const L = jointMap(p).forearmLen;
  const r = p.robust;
  const parts = [];

  // Head — a shallow cup that spins on the capitulum in pronation/supination.
  parts.push(blob({
    rx: 1.05 * r, ry: 0.55, rz: 1.05 * r, detail: 3,
    position: [2.75, -0.45, 0.55],
    field: (x, y, z) => 1 - 0.28 * Math.max(0, y),
  }));
  parts.push(strut([2.72, -0.75, 0.55], [2.55, -2.30, 0.70], 0.62, 0.55, 10));   // neck
  // Radial tuberosity — the insertion of biceps brachii.
  parts.push(blob({ rx: 0.62, ry: 0.95, rz: 0.62, detail: 3, position: [2.15, -3.05, 0.95] }));

  parts.push(sweptBone({
    path: [
      [2.55, -0.13 * L, 0.60],
      [3.15, -0.30 * L, 0.65],
      [3.65, -0.53 * L, 0.62],
      [3.70, -0.78 * L, 0.50],
      [3.40, -0.955 * L, 0.35],
    ],
    profile: [
      { t: 0.00, rx: 0.62 * r, ry: 0.62 * r, rot: 0 },
      { t: 0.30, rx: 0.72 * r, ry: 0.78 * r, rot: 20 },
      { t: 0.65, rx: 0.85 * r, ry: 0.90 * r, rot: 10 },
      { t: 1.00, rx: 1.45 * r, ry: 1.15 * r, rot: 0 },
    ],
    segments: 48, radial: 14,
  }));
  // Distal end with the styloid process, which reaches about 1 cm further
  // distally than the ulnar styloid — a relationship lost in a Colles fracture.
  parts.push(blob({ rx: 1.55 * r, ry: 0.95, rz: 1.15 * r, detail: 3, position: [3.35, -0.975 * L, 0.35] }));
  parts.push(strut([3.85, -0.99 * L, 0.30], [4.20, -1.055 * L, 0.20], 0.55, 0.24, 8));
  // Dorsal tubercle of Lister — the pulley for extensor pollicis longus.
  parts.push(blob({ rx: 0.26, ry: 0.42, rz: 0.24, detail: 2, position: [3.20, -0.965 * L, -0.75] }));
  return boneSurface(merge(parts), 0.045, 0.7);
}

/* --- the hand -------------------------------------------------------- */

/** Carpal bones: [id, label, x, y, z, rx, ry, rz]. */
const CARPALS = [
  ['scaphoid',   'Scaphoid',   1.10, -0.85,  0.20, 0.80, 0.70, 0.62],
  ['lunate',     'Lunate',     0.05, -0.75,  0.00, 0.62, 0.58, 0.58],
  ['triquetrum', 'Triquetrum', -0.98, -0.82, -0.12, 0.58, 0.52, 0.52],
  ['pisiform',   'Pisiform',   -1.18, -1.30,  0.80, 0.38, 0.44, 0.36],
  ['trapezium',  'Trapezium',  1.40, -2.28,  0.32, 0.64, 0.58, 0.58],
  ['trapezoid',  'Trapezoid',  0.58, -2.18,  0.06, 0.48, 0.48, 0.46],
  ['capitate',   'Capitate',  -0.26, -2.12,  0.00, 0.75, 0.90, 0.64],
  ['hamate',     'Hamate',    -1.28, -2.24,  0.16, 0.68, 0.64, 0.60],
];

/**
 * Metacarpals and phalanges: base, head and the phalangeal lengths of each
 * ray. Ray 0 is the thumb, which has only two phalanges.
 */
const HAND_RAYS = [
  { name: 'thumb',  base: [1.62, -2.78, 0.60], head: [3.35, -5.10, 1.95], ph: [3.15, 2.25], spread: [0.34, 0.18] },
  { name: 'index',  base: [0.88, -2.88, 0.10], head: [1.52, -9.55, 0.45], ph: [4.05, 2.50, 1.70], spread: [0.06, 0.03, 0.01] },
  { name: 'middle', base: [0.00, -2.88, 0.00], head: [0.30, -9.95, 0.35], ph: [4.50, 3.00, 1.80], spread: [0.01, 0.0, 0.0] },
  { name: 'ring',   base: [-0.86, -2.88, 0.06], head: [-0.92, -9.40, 0.40], ph: [4.20, 2.80, 1.80], spread: [-0.05, -0.03, -0.01] },
  { name: 'little', base: [-1.62, -2.88, 0.16], head: [-2.15, -8.60, 0.45], ph: [3.40, 2.05, 1.60], spread: [-0.11, -0.06, -0.03] },
];

/** A miniature long bone: expanded base, waisted shaft, condylar head. */
function tubularBone(from, to, rBase, rShaft, rHead, radial = 12) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mid = a.clone().lerp(b, 0.5);
  const q1 = a.clone().lerp(b, 0.22), q3 = a.clone().lerp(b, 0.80);
  const shaft = sweptBone({
    path: [[a.x, a.y, a.z], [q1.x, q1.y, q1.z], [mid.x, mid.y, mid.z], [q3.x, q3.y, q3.z], [b.x, b.y, b.z]],
    profile: [
      { t: 0.00, rx: rBase, ry: rBase },
      { t: 0.16, rx: rShaft * 1.05, ry: rShaft * 1.05 },
      { t: 0.55, rx: rShaft, ry: rShaft * 0.86 },
      { t: 0.86, rx: rShaft * 1.10, ry: rShaft * 0.95 },
      { t: 1.00, rx: rHead, ry: rHead },
    ],
    segments: 24, radial,
  });
  const baseEnd = blob({ rx: rBase * 1.12, ry: rBase * 0.95, rz: rBase * 1.05, detail: 2, position: from });
  const headEnd = blob({ rx: rHead * 1.15, ry: rHead * 0.92, rz: rHead * 1.05, detail: 2, position: to });
  return merge([shaft, baseEnd, headEnd]);
}

function buildHand(p, mk) {
  const g = new THREE.Group();
  g.name = 'hand';
  const s = p.handScale;
  const sc = (v) => [v[0] * s, v[1] * s, v[2] * s];

  for (const [id, label, x, y, z, rx, ry, rz] of CARPALS) {
    let geo = blob({
      rx: rx * s, ry: ry * s, rz: rz * s, detail: 3,
      position: sc([x, y, z]),
      // Carpals are irregular, faceted blocks, not spheres.
      field: (a, b, c) => 1 - 0.16 * (Math.abs(a) ** 3 + Math.abs(b) ** 3 + Math.abs(c) ** 3) / 3,
    });
    if (id === 'hamate') {
      // The hook of the hamate, projecting into the palm.
      geo = merge([geo, strut(sc([x - 0.2, y - 0.3, z + 0.5]), sc([x - 0.35, y - 0.75, z + 1.15]), 0.24 * s, 0.16 * s, 8)]);
    }
    if (id === 'scaphoid') {
      geo = merge([geo, blob({ rx: 0.36 * s, ry: 0.34 * s, rz: 0.34 * s, detail: 2, position: sc([x + 0.35, y - 0.7, z + 0.7]) })]);
    }
    g.add(mk(boneSurface(geo, 0.03, 1.6), id, `${label} (left)`));
  }

  HAND_RAYS.forEach((ray, ri) => {
    const mcR = ri === 0 ? 0.46 : 0.40 - ri * 0.015;
    g.add(mk(
      boneSurface(tubularBone(sc(ray.base), sc(ray.head), mcR * 1.25 * s, mcR * s, mcR * 1.20 * s), 0.03, 1.7),
      'metacarpals',
      `${ri + 1}${['st', 'nd', 'rd', 'th', 'th'][ri]} metacarpal (left)`,
    ));

    // March out along the ray, phalanx by phalanx.
    let from = sc(ray.head);
    const dir = new THREE.Vector3(ray.head[0] - ray.base[0], ray.head[1] - ray.base[1], ray.head[2] - ray.base[2]).normalize();
    ray.ph.forEach((len, k) => {
      const spread = ray.spread[k] || 0;
      const d = dir.clone();
      d.x += spread;
      // Fingers curl very slightly forward at rest.
      d.z += 0.10 + k * 0.06;
      d.normalize();
      const to = [from[0] + d.x * len * s, from[1] + d.y * len * s, from[2] + d.z * len * s];
      const r0 = (ri === 0 ? 0.40 : 0.36) - k * 0.055;
      const names = ray.ph.length === 2 ? ['Proximal', 'Distal'] : ['Proximal', 'Middle', 'Distal'];
      let geo = tubularBone(from, to, r0 * 1.20 * s, r0 * 0.82 * s, r0 * 1.02 * s, 10);
      if (k === ray.ph.length - 1) {
        // Ungual tuberosity supporting the nail bed.
        geo = merge([geo, blob({ rx: r0 * 1.25 * s, ry: r0 * 0.7 * s, rz: r0 * 1.0 * s, detail: 2, position: to })]);
      }
      g.add(mk(
        boneSurface(geo, 0.025, 1.9),
        'handphalanges',
        `${names[k]} phalanx, ${ray.name} (left)`,
      ));
      from = to;
    });
  });
  return g;
}

/* ==================================================================
 * PELVIC GIRDLE
 * ================================================================== */

/**
 * One hip bone, split into its three developmental parts so each can be
 * selected on its own. Origin is the CENTRE OF THE ACETABULUM.
 */
function buildHipBone(p) {
  const flare = p.iliacFlare;
  // Iliac blade plane. e2 must lean LATERALLY as it rises — that outward
  // flare of the blade is what gives the pelvis its width — and the basis
  // must stay right-handed or the extruded blade renders inside out.
  const e1 = new THREE.Vector3(0.18, 0, 0.98);                      // anterior
  const e2 = new THREE.Vector3(0.26 * flare, 0.97, 0).normalize();  // superior + flared
  const n = new THREE.Vector3().crossVectors(e1, e2).normalize();   // medial (iliac fossa)

  /* --- ILIUM --------------------------------------------------------- */
  const H = p.iliacHeight;
  const outline = [
    [1.2, 1.6], [5.2 * flare, 5.4], [4.6 * flare, 7.6], [6.6 * flare, 10.8],
    [5.4 * flare, 13.4], [0.0, 15.4 * H], [-5.5 * flare, 13.6],
    [-8.2 * flare, 11.6], [-8.0 * flare, 8.4], [-6.0, 3.0], [-2.2, 0.9],
  ];

  /**
   * Out-of-plane curvature of the blade, positive toward the midline.
   * Two effects combined: the crest flares laterally as it rises, and the
   * posterior third tucks sharply medially to reach the sacrum — without
   * that tuck the posterior superior iliac spines end up out at the hips
   * instead of a few centimetres either side of the midline.
   */
  const bendFn = (x, y) =>
    // Crest flares laterally as the blade rises.
    -0.028 * Math.max(0, y - 3) ** 1.7 * flare
    // Posterior third tucks medially to reach the sacrum.
    + 0.140 * Math.max(0, -x - 1) ** 1.9
    // ILIAC FOSSA: the whole middle of the blade is dished away from the
    // midline, leaving the crest and both borders standing proud. Without
    // this the ilium reads as a flat triangular sail rather than a scoop.
    - 1.55 * Math.exp(-(((x - 0.4) / 5.2) ** 2 + ((y - 8.2) / 4.6) ** 2))
    // Anterior border rolls forward toward the ASIS.
    + 0.030 * Math.max(0, x - 2) ** 1.8;

  const blade = bladePlate({
    outline: smoothOutline(outline, 5, 0.45),
    thickness: 1.15 * p.robust,
    sectors: 104, rings: 16,
    // Thin in the middle of the iliac fossa, thick at the crest and at the
    // sacroiliac and acetabular buttresses.
    thin: (x, y) => 0.22 + 0.78 * THREE.MathUtils.clamp(
      Math.max(Math.abs(y - 7.5) / 8, Math.abs(x) / 8) ** 2 + Math.max(0, 3 - y) / 3, 0, 1),
    bend: bendFn,
  });
  const bp = blade.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < bp.count; i++) {
    v.set(0, 0, 0)
      .addScaledVector(e1, bp.getX(i))
      .addScaledVector(e2, bp.getY(i))
      .addScaledVector(n, bp.getZ(i));
    bp.setXYZ(i, v.x, v.y, v.z);
  }
  bp.needsUpdate = true;
  blade.computeVertexNormals();

  /**
   * Blade coordinates -> acetabulum-relative position, INCLUDING the same
   * bend the plate got. Everything welded onto the blade must use this, or
   * it detaches from the surface it is supposed to sit on.
   */
  const P = (u, w, d = 0) => {
    const t = bendFn(u, w) + d;
    return [
      e1.x * u + e2.x * w + n.x * t,
      e1.y * u + e2.y * w + n.y * t,
      e1.z * u + e2.z * w + n.z * t,
    ];
  };

  // Iliac crest — the thickened, S-curved superior border.
  const crest = sweptBone({
    path: [
      P(6.6 * flare, 10.8, 0.2), P(5.4 * flare, 13.4, 0.1), P(2.0, 15.1 * H, 0),
      P(-2.5, 15.1 * H, 0), P(-5.5 * flare, 13.6, 0), P(-8.2 * flare, 11.6, 0),
    ],
    profile: [{ t: 0, rx: 0.68, ry: 0.62 }, { t: 0.5, rx: 0.88, ry: 0.74 }, { t: 1, rx: 0.72, ry: 0.66 }],
    segments: 34, radial: 12,
  });
  // ASIS, AIIS, PSIS — the palpable landmarks.
  const asis = blob({ rx: 0.78, ry: 0.72, rz: 0.78, detail: 3, position: P(6.7 * flare, 10.7, 0.2) });
  const aiis = blob({ rx: 0.72, ry: 0.66, rz: 0.72, detail: 3, position: P(5.2 * flare, 5.4, 0.3) });
  const psis = blob({ rx: 0.70, ry: 0.66, rz: 0.70, detail: 3, position: P(-8.2 * flare, 11.6, 0) });
  // Auricular surface — the ear-shaped facet of the sacroiliac joint. It sits
  // on the MEDIAL face of the posterior ilium, opposite the sacral ala.
  const auric = blob({
    rx: 1.15, ry: 2.65, rz: 1.55, detail: 3,
    position: P(-5.6, 6.4, 0.9), rotation: [0.18, -0.5, 0.12],
  });
  // Buttress of bone running from the auricular surface down to the socket.
  const buttress = strut(P(-4.6, 4.4, 0.4), P(-1.4, 1.2, 0), 1.25, 1.45, 12);

  const ilium = boneSurface(merge([blade, crest, asis, aiis, psis, auric, buttress]), 0.05, 0.55);

  /* --- ISCHIUM ------------------------------------------------------- */
  const tubY = -7.8, tubZ = -3.2;
  const ischParts = [
    // Body, running down and back from the acetabulum.
    strut([-0.6, -1.6, -1.9], [-1.1, -5.4, -3.1], 1.55 * p.robust, 1.35 * p.robust, 14),
    // Ischial tuberosity — what you sit on, and the hamstring origin.
    blob({
      rx: 1.85 * p.robust, ry: 1.95, rz: 2.15, detail: 3,
      position: [-1.20, tubY, tubZ], rotation: [0.20, 0, 0.15],
    }),
    // Ischial spine — the obstetric landmark and pudendal block target.
    strut([-2.10, -1.90, -4.60], [-2.95, -1.55, -5.65], 0.52, 0.24, 8),
    // Ramus of the ischium, running forward to meet the inferior pubic ramus.
    strut([-1.5, tubY + 0.6, tubZ + 0.9], [-5.9, p.subpubicDrop, 1.6], 1.05, 0.75, 12),
  ];
  const ischium = boneSurface(merge(ischParts), 0.05, 0.7);

  /* --- PUBIS --------------------------------------------------------- */
  const symX = -8.8 * p.pelvisW;   // brings the symphysis to the midline
  const pubParts = [
    // Superior ramus, from the acetabulum to the pubic body.
    sweptBone({
      path: [[-0.4, -0.9, 2.7], [-3.2, -1.6, 4.4], [-6.2, -2.2, 5.2], [symX + 0.7, -2.5, 5.0]],
      profile: [{ t: 0, rx: 1.35, ry: 1.15 }, { t: 0.5, rx: 0.85, ry: 0.72 }, { t: 1, rx: 1.05, ry: 1.15 }],
      segments: 26, radial: 14,
    }),
    // Body of the pubis at the symphysis.
    blob({ rx: 1.15, ry: 1.75, rz: 1.15, detail: 3, position: [symX, -2.7, 4.7] }),
    // Pubic tubercle — the medial landmark for classifying groin hernias.
    blob({ rx: 0.40, ry: 0.38, rz: 0.40, detail: 2, position: [symX + 1.05, -1.55, 5.25] }),
    // Inferior ramus. Its angle IS the subpubic angle: narrow and V-shaped
    // in males, wide and U-shaped in females.
    strut([symX + 0.2, -3.9, 4.6], [-5.9, p.subpubicDrop, 1.7], 0.95, 0.78, 12),
  ];
  const pubis = boneSurface(merge(pubParts), 0.05, 0.7);

  /* --- ACETABULUM ---------------------------------------------------- */
  // Faces laterally, inferiorly and anteriorly — which is why the hip is
  // most unstable in flexion, adduction and internal rotation. A true
  // hemispherical shell, so the femoral head seats inside it with a joint
  // space rather than being swallowed by a solid ball.
  const open = [0.82, -0.42, 0.39];
  const cup = merge([
    sphericalCup({
      centre: [0, 0, 0], opening: open,
      rIn: 2.62 * p.robust, rOut: 3.20 * p.robust,
      halfAngle: 1.78,
      // Acetabular notch — the gap in the inferior rim bridged by the
      // transverse acetabular ligament, through which vessels reach the head.
      notch: (phi) => 0.40 * Math.max(0, Math.cos(phi - Math.PI * 1.15)) ** 3,
      seg: 16, ring: 44,
    }),
    // Thickened acetabular rim.
    blob({
      rx: 3.35 * p.robust, ry: 3.35 * p.robust, rz: 3.35 * p.robust, detail: 4,
      field: (x, y, z) => {
        const d = x * open[0] + y * open[1] + z * open[2];
        return 1 - 0.98 * Math.max(0, 1 - Math.abs(d - 0.02) * 4.5) ** 0.6 - 0.55 * Math.max(0, d);
      },
    }),
  ]);

  return {
    ilium: merge([ilium, cup.clone()]),
    ischium,
    pubis,
  };
}

/* ==================================================================
 * LOWER LIMB
 * ================================================================== */

function buildFemur(p) {
  const L = jointMap(p).femurLen;
  const r = p.robust;
  const parts = [];

  // Head — two-thirds of a sphere, deep in the acetabulum. The fovea
  // capitis marks the attachment of the ligamentum teres.
  parts.push(blob({
    rx: 2.45 * r, ry: 2.45 * r, rz: 2.40 * r, detail: 4,
    field: (x, y, z) => 1 - 0.14 * Math.max(0, -x * 0.85 - y * 0.35 + z * 0.35),
  }));
  // Neck — set at about 125 degrees to the shaft, and anteverted ~15 degrees.
  parts.push(sweptBone({
    path: [[0.3, -0.4, 0.15], [1.9, -2.1, -0.05], [3.6, -3.8, -0.30]],
    profile: [{ t: 0, rx: 1.75 * r, ry: 1.75 * r }, { t: 0.5, rx: 1.42 * r, ry: 1.62 * r }, { t: 1, rx: 1.75 * r, ry: 1.85 * r }],
    segments: 18, radial: 16,
  }));
  // Greater trochanter — the gluteal insertion, and the surface landmark for
  // applying a pelvic binder.
  parts.push(blob({
    rx: 1.95 * r, ry: 2.55, rz: 1.95 * r, detail: 3,
    position: [5.15 * r, -2.55, -0.55],
    field: (x, y, z) => 1 - 0.20 * Math.max(0, -y),
  }));
  // Lesser trochanter — the iliopsoas insertion, projecting posteromedially.
  parts.push(blob({
    rx: 1.00, ry: 0.90, rz: 0.90, detail: 3,
    position: [2.15, -5.55, -1.55], rotation: [0, 0.5, 0],
  }));

  // Shaft — bowed anteriorly, drifting medially toward the knee, and
  // ridged posteriorly by the linea aspera.
  const kneeX = -2.0 * p.limbScale;
  parts.push(sweptBone({
    path: [
      [4.15, -0.135 * L, -0.35],
      [3.60, -0.28 * L, 0.55],
      [2.55, -0.48 * L, 1.15],
      [1.10, -0.70 * L, 0.85],
      [kneeX + 0.4, -0.88 * L, -0.05],
      [kneeX, -0.955 * L, -0.35],
    ],
    profile: [
      { t: 0.00, rx: 1.95 * r, ry: 1.95 * r, rot: 0 },
      { t: 0.16, rx: 1.42 * r, ry: 1.45 * r, rot: 0 },
      { t: 0.50, rx: 1.30 * r, ry: 1.35 * r, rot: 0 },
      { t: 0.78, rx: 1.55 * r, ry: 1.50 * r, rot: 0 },
      { t: 1.00, rx: 2.70 * r, ry: 1.95 * r, rot: 0 },
    ],
    segments: 64, radial: 20,
    warp: (v, t, a) => {
      // Linea aspera: a raised crest along the posterior shaft.
      if (t > 0.16 && t < 0.84) {
        const back = Math.max(0, -Math.cos(a - Math.PI / 2));
        v.z -= 0 * back;
      }
    },
  }));
  // Linea aspera as an explicit ridge.
  parts.push(sweptBone({
    path: [
      [3.30, -0.20 * L, -1.55], [2.55, -0.40 * L, -0.75],
      [1.30, -0.62 * L, -0.85], [kneeX + 0.9, -0.80 * L, -1.65],
    ],
    profile: [{ t: 0, rx: 0.42, ry: 0.55 }, { t: 0.5, rx: 0.55, ry: 0.62 }, { t: 1, rx: 0.62, ry: 0.72 }],
    segments: 26, radial: 10,
  }));

  // Distal end: two condyles separated by the intercondylar fossa, with the
  // trochlear (patellar) groove in front.
  const dy = -0.985 * L;
  parts.push(blob({
    rx: 2.15 * r, ry: 2.55, rz: 3.05, detail: 4,
    position: [kneeX - 2.05, dy - 0.2, -0.25],
    field: (x, y, z) => 1 - 0.10 * Math.max(0, x),
  }));   // medial condyle — larger, and extends further distally
  parts.push(blob({
    rx: 2.00 * r, ry: 2.40, rz: 2.95, detail: 4,
    position: [kneeX + 2.05, dy - 0.05, -0.25],
    field: (x, y, z) => 1 - 0.10 * Math.max(0, -x),
  }));   // lateral condyle — wider, and projects further anteriorly
  // Patellar surface — the groove the patella tracks in.
  parts.push(blob({
    rx: 2.55, ry: 1.85, rz: 1.35, detail: 3,
    position: [kneeX, dy + 1.35, 1.85],
    field: (x, y, z) => 1 - 0.30 * Math.exp(-((x * 1.9) ** 2)) * Math.max(0, z),
  }));
  // Adductor tubercle — the landmark for the adductor magnus insertion.
  parts.push(blob({ rx: 0.55, ry: 0.62, rz: 0.55, detail: 2, position: [kneeX - 2.55, dy + 2.25, -0.85] }));

  return boneSurface(merge(parts), 0.05, 0.5);
}

function buildPatella() {
  // Flat anteriorly, with two facets and a vertical ridge behind.
  const geo = blob({
    rx: 2.30, ry: 2.45, rz: 1.10, detail: 4,
    field: (x, y, z) => {
      const apex = 1 - 0.35 * Math.max(0, -y) ** 1.6;          // pointed apex below
      const facet = 1 - 0.22 * Math.max(0, -z) * (1 - Math.exp(-((x * 2.4) ** 2)));
      return apex * facet;
    },
  });
  return boneSurface(geo, 0.04, 1.1);
}

function buildTibia(p) {
  const L = jointMap(p).tibiaLen;
  const r = p.robust;
  const parts = [];

  // Tibial plateau: two condyles with the intercondylar eminence between.
  parts.push(blob({
    rx: 2.35 * r, ry: 1.35, rz: 2.70, detail: 4,
    position: [-2.05, -0.85, -0.30],
    field: (x, y, z) => 1 - 0.20 * Math.max(0, y),      // concave medial plateau
  }));
  parts.push(blob({
    rx: 2.15 * r, ry: 1.30, rz: 2.60, detail: 4,
    position: [2.05, -0.85, -0.30],
    field: (x, y, z) => 1 - 0.14 * Math.max(0, y),
  }));
  parts.push(blob({ rx: 0.55, ry: 0.85, rz: 0.85, detail: 3, position: [0, 0.25, -0.35] }));  // intercondylar eminence

  // Shaft: sharply triangular, with the subcutaneous anteromedial surface
  // that makes the tibia the commonest site of open fracture.
  parts.push(sweptBone({
    path: [
      [-0.10, -0.055 * L, 0.35],
      [-0.30, -0.22 * L, 0.55],
      [-0.50, -0.48 * L, 0.30],
      [-0.60, -0.74 * L, -0.05],
      [-0.45, -0.955 * L, -0.20],
    ],
    profile: [
      { t: 0.00, rx: 2.30 * r, ry: 2.30 * r, rot: 0 },
      { t: 0.12, rx: 1.45 * r, ry: 1.60 * r, rot: 0 },
      { t: 0.45, rx: 1.10 * r, ry: 1.25 * r, rot: 0 },
      { t: 0.75, rx: 1.05 * r, ry: 1.10 * r, rot: 0 },
      { t: 1.00, rx: 1.65 * r, ry: 1.55 * r, rot: 0 },
    ],
    segments: 60, radial: 18,
    warp: (v, t, a, c) => {
      // Pull the cross-section toward a triangle with a sharp anterior crest.
      if (t > 0.08 && t < 0.94) {
        const dx = v.x - c.x, dz = v.z - c.z;
        const ang = Math.atan2(dz, dx);
        const tri = 0.16 * Math.cos(3 * (ang - Math.PI / 2));
        v.x += dx * tri; v.z += dz * tri;
      }
    },
  }));
  // Tibial tuberosity — patellar ligament insertion, and the site of both
  // Osgood-Schlatter disease and paediatric intraosseous access.
  parts.push(blob({ rx: 0.95, ry: 1.55, rz: 0.85, detail: 3, position: [-0.35, -0.105 * L, 2.05] }));
  // Gerdy tubercle — the iliotibial tract insertion.
  parts.push(blob({ rx: 0.55, ry: 0.55, rz: 0.55, detail: 2, position: [2.15, -0.085 * L, 1.45] }));

  // Distal end: the plafond of the ankle mortise plus the medial malleolus.
  parts.push(blob({ rx: 1.85 * r, ry: 1.15, rz: 1.75 * r, detail: 3, position: [-0.45, -0.975 * L, -0.20] }));
  parts.push(blob({
    rx: 0.95, ry: 1.45, rz: 1.15, detail: 3,
    position: [-1.65, -1.015 * L, -0.30],
    field: (x, y, z) => 1 - 0.16 * Math.max(0, y),
  }));
  return boneSurface(merge(parts), 0.05, 0.5);
}

function buildFibula(p) {
  const L = jointMap(p).tibiaLen;
  const r = p.robust;
  const parts = [];
  // Head — where the common fibular nerve becomes vulnerable as it winds
  // round the neck just below.
  parts.push(blob({ rx: 1.15 * r, ry: 1.05, rz: 1.05 * r, detail: 3, position: [3.55, -0.075 * L, -0.95] }));
  parts.push(blob({ rx: 0.34, ry: 0.42, rz: 0.34, detail: 2, position: [3.85, -0.045 * L, -1.25] }));  // apex/styloid
  parts.push(sweptBone({
    path: [
      [3.45, -0.115 * L, -0.90],
      [3.35, -0.30 * L, -0.85],
      [3.20, -0.52 * L, -0.75],
      [3.05, -0.75 * L, -0.55],
      [2.95, -0.985 * L, -0.58],
    ],
    profile: [
      { t: 0.00, rx: 0.80 * r, ry: 0.75 * r, rot: 0 },
      { t: 0.25, rx: 0.52 * r, ry: 0.55 * r, rot: 20 },
      { t: 0.62, rx: 0.48 * r, ry: 0.52 * r, rot: 10 },
      { t: 1.00, rx: 0.80 * r, ry: 0.85 * r, rot: 0 },
    ],
    segments: 54, radial: 14,
  }));
  // Lateral malleolus — descends about 1 cm lower than the medial, which is
  // why the ankle inverts more readily than it everts.
  parts.push(blob({
    rx: 1.05 * r, ry: 1.85, rz: 1.20 * r, detail: 3,
    position: [2.95, -1.005 * L, -0.55],
    field: (x, y, z) => 1 - 0.22 * Math.max(0, -y) * Math.max(0, -x),
  }));
  return boneSurface(merge(parts), 0.045, 0.6);
}

/* --- the foot -------------------------------------------------------- */

const TARSALS = [
  ['navicular',  'Navicular',            -0.80, -2.45, 4.10, 1.05, 1.15, 0.65],
  ['cuboid',     'Cuboid',                1.40, -3.45, 3.15, 1.15, 1.05, 1.15],
  ['cuneiforms', 'Medial cuneiform',     -1.35, -2.75, 5.55, 0.80, 1.15, 0.90],
  ['cuneiforms', 'Intermediate cuneiform', -0.25, -2.55, 5.45, 0.58, 0.90, 0.80],
  ['cuneiforms', 'Lateral cuneiform',     0.70, -2.70, 5.40, 0.62, 0.95, 0.85],
];

const FOOT_RAYS = [
  { name: 'hallux',   base: [-1.45, -3.10, 6.45], head: [-2.35, -6.10, 13.0], ph: [3.10, 2.10], r: 0.62 },
  { name: '2nd toe',  base: [-0.32, -3.00, 6.55], head: [-1.00, -6.25, 13.9], ph: [2.50, 1.30, 0.90], r: 0.42 },
  { name: '3rd toe',  base: [0.62, -3.05, 6.35], head: [0.15, -6.30, 13.5], ph: [2.40, 1.30, 0.90], r: 0.40 },
  { name: '4th toe',  base: [1.40, -3.25, 5.95], head: [1.25, -6.30, 12.8], ph: [2.10, 1.10, 0.80], r: 0.38 },
  { name: '5th toe',  base: [2.05, -3.45, 4.85], head: [2.40, -6.25, 11.8], ph: [1.65, 0.75, 0.70], r: 0.36 },
];

function buildFoot(p, mk) {
  const g = new THREE.Group();
  g.name = 'foot';
  const s = p.footScale;
  const sc = (v) => [v[0] * s, v[1] * s, v[2] * s];

  // Talus — no muscle attaches to it; over 60% of its surface is cartilage.
  const talus = merge([
    blob({
      rx: 1.60 * s, ry: 1.50 * s, rz: 2.00 * s, detail: 4,
      position: sc([0, -1.45, 0.20]),
      // The trochlea is wider anteriorly, which locks the ankle in dorsiflexion.
      field: (x, y, z) => 1 + 0.10 * Math.max(0, y) * (0.5 + 0.5 * z),
    }),
    strut(sc([-0.35, -1.90, 1.70]), sc([-0.65, -2.15, 2.65]), 1.05 * s, 0.95 * s, 12),   // neck
    blob({ rx: 1.05 * s, ry: 1.00 * s, rz: 0.95 * s, detail: 3, position: sc([-0.75, -2.20, 3.10]) }),  // head
    strut(sc([0.30, -1.70, -1.30]), sc([0.55, -1.95, -2.10]), 0.55 * s, 0.34 * s, 8),    // posterior process
  ]);
  g.add(mk(boneSurface(talus, 0.035, 1.2), 'talus', 'Talus (left)'));

  // Calcaneus — the largest tarsal, a lever for the Achilles tendon.
  const calc = merge([
    loft([
      { y: -6.85 * s, pts: xform(superellipse(1.45 * s, 3.35 * s, 26, 2.6), { dx: 0.20 * s, dz: -1.35 * s }) },
      { y: -5.60 * s, pts: xform(superellipse(1.80 * s, 3.85 * s, 26, 2.6), { dx: 0.20 * s, dz: -1.45 * s }) },
      { y: -4.30 * s, pts: xform(superellipse(1.85 * s, 3.95 * s, 26, 2.4), { dx: 0.18 * s, dz: -1.45 * s }) },
      { y: -3.10 * s, pts: xform(superellipse(1.60 * s, 3.55 * s, 26, 2.2), { dx: 0.15 * s, dz: -1.20 * s }) },
    ]),
    // Posterior tuberosity — the Achilles insertion.
    blob({ rx: 1.55 * s, ry: 1.55 * s, rz: 1.35 * s, detail: 3, position: sc([0.20, -5.30, -4.20]) }),
    // Sustentaculum tali — the shelf that holds up the talar head.
    blob({ rx: 0.85 * s, ry: 0.45 * s, rz: 0.95 * s, detail: 3, position: sc([-1.45, -3.05, 0.30]) }),
    // Posterior talar facet.
    blob({ rx: 1.30 * s, ry: 0.55 * s, rz: 1.45 * s, detail: 3, position: sc([0.20, -2.95, -0.90]) }),
  ]);
  g.add(mk(boneSurface(calc, 0.04, 0.9), 'calcaneus', 'Calcaneus (left)'));

  for (const [id, label, x, y, z, rx, ry, rz] of TARSALS) {
    let geo = blob({
      rx: rx * s, ry: ry * s, rz: rz * s, detail: 3,
      position: sc([x, y, z]),
      field: (a, b, c) => 1 - 0.14 * (Math.abs(a) ** 3 + Math.abs(b) ** 3 + Math.abs(c) ** 3) / 3,
    });
    if (label === 'Navicular') {
      // Navicular tuberosity — the tibialis posterior insertion.
      geo = merge([geo, blob({ rx: 0.45 * s, ry: 0.45 * s, rz: 0.42 * s, detail: 2, position: sc([x - 0.95, y - 0.35, z]) })]);
    }
    g.add(mk(boneSurface(geo, 0.03, 1.5), id, `${label} (left)`));
  }

  FOOT_RAYS.forEach((ray, ri) => {
    g.add(mk(
      boneSurface(tubularBone(sc(ray.base), sc(ray.head), ray.r * 1.35 * s, ray.r * s, ray.r * 1.25 * s, 12), 0.03, 1.5),
      'metatarsals',
      `${ri + 1}${['st', 'nd', 'rd', 'th', 'th'][ri]} metatarsal (left)`,
    ));
    if (ri === 4) {
      // Tuberosity of the 5th metatarsal — fibularis brevis inserts here,
      // and this is where a pseudo-Jones avulsion happens.
      g.add(mk(
        boneSurface(blob({ rx: 0.55 * s, ry: 0.50 * s, rz: 0.62 * s, detail: 2, position: sc([ray.base[0] + 0.55, ray.base[1] - 0.15, ray.base[2] - 0.55]) }), 0.03, 1.6),
        'metatarsals', '5th metatarsal tuberosity (left)',
      ));
    }
    let from = sc(ray.head);
    const dir = new THREE.Vector3(
      ray.head[0] - ray.base[0], (ray.head[1] - ray.base[1]) * 0.25, ray.head[2] - ray.base[2],
    ).normalize();
    ray.ph.forEach((len, k) => {
      const to = [from[0] + dir.x * len * s, from[1] + dir.y * len * s * 0.3, from[2] + dir.z * len * s];
      const r0 = ray.r * (0.92 - k * 0.14);
      const names = ray.ph.length === 2 ? ['Proximal', 'Distal'] : ['Proximal', 'Middle', 'Distal'];
      g.add(mk(
        boneSurface(tubularBone(from, to, r0 * 1.2 * s, r0 * 0.8 * s, r0 * s, 10), 0.025, 1.8),
        'footphalanges', `${names[k]} phalanx, ${ray.name} (left)`,
      ));
      from = to;
    });
  });

  // The two constant hallucal sesamoids under the 1st metatarsal head.
  for (const [i, dx] of [[0, -0.55], [1, 0.35]]) {
    g.add(mk(
      boneSurface(blob({ rx: 0.30 * s, ry: 0.22 * s, rz: 0.40 * s, detail: 2, position: sc([-2.35 + dx, -6.75, 12.6]) }), 0.02, 2.0),
      'sesamoids', `${i === 0 ? 'Medial (tibial)' : 'Lateral (fibular)'} hallucal sesamoid (left)`,
    ));
  }
  return g;
}

/* ==================================================================
 * Assembly
 * ================================================================== */

/**
 * Build both girdles and all four limbs as joint chains.
 * Returns the joint objects so the animation system can drive them.
 */
export function buildAppendicular(p, mk) {
  const J = jointMap(p);
  const sides = {};

  for (const side of [1, -1]) {
    const S = side > 0 ? 'L' : 'R';
    const name = side > 0 ? 'Left' : 'Right';
    const flip = (geo) => (side > 0 ? geo : mirrorX(geo));
    const at = (v) => [v[0] * side, v[1], v[2]];

    /* ---------- shoulder girdle ---------- */
    const girdle = new THREE.Group();
    girdle.name = `girdle${S}`;
    girdle.position.set(...at(J.sternoclavicular));
    girdle.add(mk(flip(buildClavicle(p)), 'clavicle', `${name} clavicle`));

    const scapulaAt = [
      J.glenohumeral[0] - J.sternoclavicular[0],
      J.glenohumeral[1] - J.sternoclavicular[1],
      J.glenohumeral[2] - J.sternoclavicular[2],
    ];
    const scapGroup = new THREE.Group();
    scapGroup.position.set(scapulaAt[0] * side, scapulaAt[1], scapulaAt[2]);
    scapGroup.add(mk(flip(buildScapula(p)), 'scapula', `${name} scapula`));
    girdle.add(scapGroup);

    /* ---------- arm chain ---------- */
    const shoulder = new THREE.Group();
    shoulder.name = `shoulder${S}`;
    shoulder.position.copy(scapGroup.position);
    // A relaxed standing hang: a few degrees of abduction so the hands clear
    // the thighs, and a trace of flexion.
    shoulder.rotation.z = side * 0.055;
    shoulder.rotation.x = -0.035;
    shoulder.add(mk(flip(buildHumerus(p)), 'humerus', `${name} humerus`));
    girdle.add(shoulder);

    const elbow = new THREE.Group();
    elbow.name = `elbow${S}`;
    elbow.position.set(-0.90 * side, -J.humerusLen * 1.0, 0.30);
    elbow.rotation.x = -0.10;                    // a few degrees of flexion
    // Semi-pronation, split between the two joints. Putting it all at the
    // elbow swings the whole forearm medially and drops the hand in front of
    // the thigh; most of the twist belongs distally, at the wrist.
    elbow.rotation.y = -side * 0.32;
    elbow.add(mk(flip(buildRadius(p)), 'radius', `${name} radius`));
    elbow.add(mk(flip(buildUlna(p)), 'ulna', `${name} ulna`));
    shoulder.add(elbow);

    const wrist = new THREE.Group();
    wrist.name = `wrist${S}`;
    wrist.position.set(2.90 * side, -J.forearmLen, 0.30);
    wrist.rotation.y = -side * 0.80;             // thumb comes forward
    const hand = buildHand(p, (geo, id, label, mat) => mk(flip(geo), id, label.replace('(left)', `(${name.toLowerCase()})`), mat));
    wrist.add(hand);
    elbow.add(wrist);

    /* ---------- hip bone ---------- */
    const hipBone = new THREE.Group();
    hipBone.name = `hipBone${S}`;
    hipBone.position.set(...at(J.hip));
    const hb = buildHipBone(p);
    hipBone.add(mk(flip(hb.ilium), 'ilium', `${name} ilium`));
    hipBone.add(mk(flip(hb.ischium), 'ischium', `${name} ischium`));
    hipBone.add(mk(flip(hb.pubis), 'pubis', `${name} pubis`));

    /* ---------- leg chain ---------- */
    const thigh = new THREE.Group();
    thigh.name = `thigh${S}`;
    thigh.position.set(0, 0, 0);
    thigh.add(mk(flip(buildFemur(p)), 'femur', `${name} femur`));
    hipBone.add(thigh);

    const knee = new THREE.Group();
    knee.name = `knee${S}`;
    knee.position.set(-2.0 * p.limbScale * side, -J.femurLen, -0.35);
    knee.add(mk(flip(buildTibia(p)), 'tibia', `${name} tibia`));
    knee.add(mk(flip(buildFibula(p)), 'fibula', `${name} fibula`));
    thigh.add(knee);

    // Patella rides in front of the femoral condyles, in the quadriceps tendon.
    const patGroup = new THREE.Group();
    patGroup.position.set(-0.5 * side, 1.60, 3.85);
    patGroup.rotation.x = 0.12;
    patGroup.add(mk(flip(buildPatella()), 'patella', `${name} patella`));
    knee.add(patGroup);

    const ankle = new THREE.Group();
    ankle.name = `ankle${S}`;
    ankle.position.set(-0.45 * side, -J.tibiaLen, -0.20);
    const foot = buildFoot(p, (geo, id, label, mat) => mk(flip(geo), id, label.replace('(left)', `(${name.toLowerCase()})`), mat));
    ankle.add(foot);
    knee.add(ankle);

    sides[S] = { girdle, shoulder, elbow, wrist, hipBone, thigh, knee, ankle, scapGroup, patGroup };
  }
  return sides;
}
