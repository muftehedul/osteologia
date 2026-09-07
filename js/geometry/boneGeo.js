/**
 * Procedural bone geometry library.
 * ------------------------------------------------------------------
 * Every bone in this atlas is generated in code rather than loaded from a
 * mesh file, so the whole skeleton is a few hundred KB of JavaScript and
 * can be rebuilt at any resolution or with any sex profile on the fly.
 *
 * The realism comes from four primitives that mirror how bones are actually
 * shaped in nature:
 *
 *   sweptBone()  long bones - a tube swept along a curved axis with an
 *                elliptical, rotating, variable-radius cross-section
 *   blob()       epiphyses, condyles, tubercles, processes - ellipsoids
 *                deformed by an arbitrary field function
 *   plate()      flat bones - an extruded outline bent over a surface
 *   archRing()   ribs and vertebral arches - a swept ring of varying width
 *
 * All four are then run through boneSurface(), which applies fractal noise
 * so no two bones look alike and no surface is perfectly smooth.
 *
 * Units are CENTIMETRES throughout. A default adult male skeleton is
 * approximately 175 units tall.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ==================================================================
 * 1. NOISE
 * ================================================================== */

/** Deterministic 3D hash in [-1, 1]. */
function hash3(x, y, z) {
  let h = x * 374761393 + y * 668265263 + z * 1274126177;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x3fffffff - 1;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** Trilinearly interpolated value noise. */
function valueNoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const lerp = (a, b, t) => a + (b - a) * t;

  const c000 = hash3(xi, yi, zi),         c100 = hash3(xi + 1, yi, zi);
  const c010 = hash3(xi, yi + 1, zi),     c110 = hash3(xi + 1, yi + 1, zi);
  const c001 = hash3(xi, yi, zi + 1),     c101 = hash3(xi + 1, yi, zi + 1);
  const c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);

  return lerp(
    lerp(lerp(c000, c100, xf), lerp(c010, c110, xf), yf),
    lerp(lerp(c001, c101, xf), lerp(c011, c111, xf), yf),
    zf,
  );
}

/** Fractal Brownian motion — layered noise giving natural bone texture. */
export function fbm(x, y, z, octaves = 4, lacunarity = 2.1, gain = 0.5) {
  let sum = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/**
 * Displace every vertex along its normal by fractal noise.
 * This is what stops the skeleton looking like it is made of plastic tubes:
 * real bone has a slightly rippled, porous cortical surface.
 */
export function boneSurface(geo, amplitude = 0.09, frequency = 0.55, octaves = 4) {
  if (!geo || amplitude <= 0) return geo;
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = fbm(x * frequency, y * frequency, z * frequency, octaves);
    // Bias toward subtractive displacement: bone erodes, it does not bulge.
    const d = amplitude * (n * 0.75 - Math.abs(n) * 0.25);
    pos.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * 2. LONG BONES — swept tube with a shaped cross-section
 * ================================================================== */

/** Sample a keyframed profile track at parameter t (0..1). */
function sampleTrack(track, t, key) {
  if (!track || !track.length) return 1;
  if (t <= track[0].t) return track[0][key];
  for (let i = 1; i < track.length; i++) {
    if (t <= track[i].t) {
      const a = track[i - 1], b = track[i];
      const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      // Smoothstep between keys so metaphyseal flares are rounded, not conical.
      const s = smooth(THREE.MathUtils.clamp(u, 0, 1));
      return a[key] + (b[key] - a[key]) * s;
    }
  }
  return track[track.length - 1][key];
}

/**
 * Sweep an elliptical cross-section along a 3D curve.
 *
 * @param {object}   o
 * @param {number[][]} o.path      control points of the bone axis
 * @param {object[]} o.profile     [{t, rx, ry, rot}] cross-section keyframes
 * @param {number}   o.segments    rings along the length
 * @param {number}   o.radial      vertices per ring
 * @param {boolean}  o.capStart / o.capEnd
 * @param {function} o.warp        optional (v3, t, angle) => v3 displacement
 */
export function sweptBone({
  path,
  profile,
  segments = 64,
  radial = 24,
  capStart = true,
  capEnd = true,
  warp = null,
  closed = false,
}) {
  const curve = new THREE.CatmullRomCurve3(
    path.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    closed,
    'catmullrom',
    0.5,
  );
  const frames = curve.computeFrenetFrames(segments, closed);
  const positions = [];
  const uvs = [];
  const indices = [];

  const tmp = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const N = frames.normals[Math.min(i, frames.normals.length - 1)];
    const B = frames.binormals[Math.min(i, frames.binormals.length - 1)];

    const rx = sampleTrack(profile, t, 'rx');
    const ry = sampleTrack(profile, t, 'ry');
    const rot = (sampleTrack(profile, t, 'rot') || 0) * Math.PI / 180;

    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const ca = Math.cos(a + rot), sa = Math.sin(a + rot);
      tmp.set(0, 0, 0)
        .addScaledVector(N, ca * rx)
        .addScaledVector(B, sa * ry)
        .add(center);
      if (warp) warp(tmp, t, a, center);
      positions.push(tmp.x, tmp.y, tmp.z);
      uvs.push(j / radial, t);
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + ((j + 1) % radial);
      const d = (i + 1) * radial + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  // Flat caps so the tube is a closed solid.
  const addCap = (ringIndex, flip) => {
    const c0 = curve.getPointAt(ringIndex === 0 ? 0 : 1);
    const ci = positions.length / 3;
    positions.push(c0.x, c0.y, c0.z);
    uvs.push(0.5, 0.5);
    const base = ringIndex * radial;
    for (let j = 0; j < radial; j++) {
      const a = base + j;
      const b = base + ((j + 1) % radial);
      if (flip) indices.push(ci, b, a);
      else indices.push(ci, a, b);
    }
  };
  if (capStart) addCap(0, true);
  if (capEnd) addCap(segments, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * 3. BLOBS — condyles, heads, tubercles, processes
 * ================================================================== */

/**
 * A deformable ellipsoid. `field` receives the unit-sphere direction and
 * returns a radius multiplier, which is how condyles get their grooves and
 * trochanters their flattened faces.
 */
export function blob({
  rx = 1, ry = 1, rz = 1,
  detail = 3,
  position = [0, 0, 0],
  rotation = null,
  field = null,
  scaleAfter = null,
}) {
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const m = field ? field(v.x, v.y, v.z) : 1;
    pos.setXYZ(i, v.x * rx * m, v.y * ry * m, v.z * rz * m);
  }
  pos.needsUpdate = true;
  if (scaleAfter) geo.scale(scaleAfter[0], scaleAfter[1], scaleAfter[2]);
  if (rotation) geo.rotateX(rotation[0]), geo.rotateY(rotation[1]), geo.rotateZ(rotation[2]);
  geo.translate(position[0], position[1], position[2]);
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * 4. PLATES — flat bones (scapula, ilium, cranial vault, sternum)
 * ================================================================== */

/**
 * Extrude a 2D outline into a thin bone plate, then bend it with a
 * displacement function so it wraps a body surface rather than staying flat.
 *
 * @param {number[][]} outline  [[x,y], ...] closed polygon in the XY plane
 * @param {number} thickness
 * @param {function} bend       (x, y) => z offset
 * @param {function} thin       (x, y) => thickness multiplier (0..1)
 */
export function plate({
  outline,
  thickness = 0.6,
  bend = null,
  thin = null,
  bevel = 0.25,
  curveSegments = 12,
  subdivide = 3,
  center = true,
}) {
  const shape = new THREE.Shape();
  shape.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length; i++) shape.lineTo(outline[i][0], outline[i][1]);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments,
    steps: Math.max(1, subdivide),
  });
  if (center) geo.center();
  else geo.translate(0, 0, -thickness / 2);   // straddle the authored plane

  if (bend || thin) {
    const pos = geo.attributes.position;
    // Recentre depth so thinning scales symmetrically about the mid-plane.
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      let z = pos.getZ(i);
      if (thin) z *= THREE.MathUtils.clamp(thin(x, y), 0.12, 1);
      if (bend) z += bend(x, y);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  }
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * 5. ARCH RINGS — ribs, vertebral arches, pelvic rims
 * ================================================================== */

/**
 * Sweep a flattened (blade-like) cross-section along an arc. Ribs are not
 * round: they are flat blades with a groove on the inferior border, which is
 * exactly what `wideTrack` / `thickTrack` produce here.
 */
export function archRing({
  path,
  wideTrack = [{ t: 0, v: 0.9 }, { t: 1, v: 0.7 }],
  thickTrack = [{ t: 0, v: 0.45 }, { t: 1, v: 0.35 }],
  segments = 60,
  radial = 14,
  twist = null,
}) {
  const profile = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    profile.push({
      t,
      rx: sampleTrack(wideTrack.map((k) => ({ t: k.t, rx: k.v })), t, 'rx'),
      ry: sampleTrack(thickTrack.map((k) => ({ t: k.t, rx: k.v })), t, 'rx'),
      rot: twist ? twist(t) : 0,
    });
  }
  return sweptBone({ path, profile, segments, radial, capStart: true, capEnd: true });
}

/* ==================================================================
 * 6. LOFTS — the workhorse for irregular bones
 * ================================================================== */

/**
 * Loft a stack of closed cross-sections into a solid.
 *
 * Every irregular bone in the atlas (vertebral bodies, the scapular blade,
 * the hip bone, the sternum, the calcaneus) is described as a handful of
 * outlines at different heights. This is far easier to author anatomically
 * than trying to bully a sphere into shape.
 *
 * @param {object[]} sections  [{ y, pts:[[x,z],...] }] — all with equal length
 */
export function loft(sections, { capStart = true, capEnd = true, closed = true } = {}) {
  const n = sections[0].pts.length;
  const positions = [];
  const uvs = [];
  const indices = [];

  sections.forEach((s, si) => {
    for (let j = 0; j < n; j++) {
      const [x, z] = s.pts[j];
      positions.push(x, s.y, z);
      uvs.push(j / n, si / (sections.length - 1));
    }
  });

  const last = closed ? n : n - 1;
  for (let i = 0; i < sections.length - 1; i++) {
    for (let j = 0; j < last; j++) {
      const jn = (j + 1) % n;
      const a = i * n + j, b = i * n + jn;
      const c = (i + 1) * n + jn, d = (i + 1) * n + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  const cap = (si, flip) => {
    let cx = 0, cy = sections[si].y, cz = 0;
    for (const [x, z] of sections[si].pts) { cx += x; cz += z; }
    cx /= n; cz /= n;
    const ci = positions.length / 3;
    positions.push(cx, cy, cz);
    uvs.push(0.5, 0.5);
    const base = si * n;
    for (let j = 0; j < n; j++) {
      const a = base + j, b = base + ((j + 1) % n);
      if (flip) indices.push(ci, b, a); else indices.push(ci, a, b);
    }
  };
  if (capStart) cap(0, true);
  if (capEnd) cap(sections.length - 1, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ---- cross-section shape generators (all return [[x,z], ...]) ---- */

/** Superellipse: `n`=2 is an ellipse, higher `n` squares it off. */
export function superellipse(rx, rz, count = 32, power = 2, cx = 0, cz = 0) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const px = Math.sign(c) * Math.pow(Math.abs(c), 2 / power) * rx;
    const pz = Math.sign(s) * Math.pow(Math.abs(s), 2 / power) * rz;
    pts.push([cx + px, cz + pz]);
  }
  return pts;
}

/**
 * Kidney/heart-shaped outline used for vertebral bodies — convex anteriorly,
 * concave posteriorly where the body is scooped for the vertebral canal.
 */
export function kidneySection(rx, rz, count = 32, concavity = 0.28, cx = 0, cz = 0) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    // s < 0 is posterior; scoop it in toward the canal.
    const dent = s < 0 ? 1 - concavity * Math.pow(-s, 1.6) : 1;
    pts.push([cx + c * rx * dent, cz + s * rz * dent]);
  }
  return pts;
}

/**
 * Round off a hand-authored polygon by running a closed Catmull-Rom spline
 * through its corners. Real flat bones (ilium, scapula, sacrum) have flowing
 * borders; a raw polygon reads unmistakably as a cut-out sheet of card.
 *
 * @param {number[][]} pts  [[x,y], ...] corner points
 * @param {number} per      samples generated per input segment
 */
export function smoothOutline(pts, per = 6, tension = 0.5) {
  const n = pts.length;
  const out = [];
  const at = (i) => pts[((i % n) + n) % n];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const c = [0, 0];
      for (let k = 0; k < 2; k++) {
        const m1 = tension * (p2[k] - p0[k]);
        const m2 = tension * (p3[k] - p1[k]);
        c[k] = (2 * t3 - 3 * t2 + 1) * p1[k] + (t3 - 2 * t2 + t) * m1
             + (-2 * t3 + 3 * t2) * p2[k] + (t3 - t2) * m2;
      }
      out.push(c);
    }
  }
  return out;
}

/** Transform an outline in place-safe fashion. */
export function xform(pts, { sx = 1, sz = 1, dx = 0, dz = 0, rot = 0 } = {}) {
  const cr = Math.cos(rot), sr = Math.sin(rot);
  return pts.map(([x, z]) => {
    const px = x * sx, pz = z * sz;
    return [px * cr - pz * sr + dx, px * sr + pz * cr + dz];
  });
}

/** Blend two equal-length outlines. */
export function blendSections(a, b, t) {
  return a.map(([x, z], i) => [x + (b[i][0] - x) * t, z + (b[i][1] - z) * t]);
}

/**
 * A flat bone as a properly tessellated blade.
 *
 * plate() is fine for small processes, but ExtrudeGeometry triangulates its
 * caps as a coarse polygon fan — so bending a large one (an iliac blade, a
 * scapular body) produces a handful of enormous flat facets instead of a
 * smooth dish. This builds the blade on a polar grid inside the outline
 * instead, giving enough interior vertices for the curvature to read.
 *
 * The outline must be star-shaped about its centroid, which every flat bone
 * modelled here is.
 *
 * @param {number[][]} outline  closed polygon in the XY plane
 * @param {function} thin       (x, y) => thickness multiplier
 * @param {function} bend       (x, y) => Z offset of the mid-surface
 */
export function bladePlate({
  outline, thickness = 0.8, thin = null, bend = null,
  sectors = 96, rings = 14, edgeRound = 0.72,
}) {
  let cx = 0, cy = 0;
  for (const [x, y] of outline) { cx += x; cy += y; }
  cx /= outline.length; cy /= outline.length;

  /** Distance from the centroid to the outline along a given angle. */
  const boundary = (a) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (let i = 0; i < outline.length; i++) {
      const [x1, y1] = outline[i];
      const [x2, y2] = outline[(i + 1) % outline.length];
      const ex = x2 - x1, ey = y2 - y1;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((x1 - cx) * ey - (y1 - cy) * ex) / den;
      const s = ((x1 - cx) * dy - (y1 - cy) * dx) / den;
      if (t > 0 && s >= 0 && s <= 1) best = Math.max(best, t);
    }
    return best;
  };

  const R = [];
  for (let j = 0; j < sectors; j++) R.push(boundary((j / sectors) * Math.PI * 2));

  const pos = [], uvs = [], idx = [];
  const half = (x, y) => {
    const t = thickness * 0.5 * (thin ? THREE.MathUtils.clamp(thin(x, y), 0.10, 1) : 1);
    return t;
  };

  // Two skins: sign +1 in front, -1 behind.
  const skinBase = [];
  for (const sign of [1, -1]) {
    skinBase.push(pos.length / 3);
    for (let i = 0; i <= rings; i++) {
      const rf = i / rings;
      for (let j = 0; j < sectors; j++) {
        const a = (j / sectors) * Math.PI * 2;
        const x = cx + Math.cos(a) * R[j] * rf;
        const y = cy + Math.sin(a) * R[j] * rf;
        // Round the thickness off toward the border so the edge is a lip,
        // not a guillotine cut.
        const taper = rf > edgeRound ? Math.sqrt(Math.max(0, 1 - ((rf - edgeRound) / (1 - edgeRound)) ** 2)) : 1;
        const z = (bend ? bend(x, y) : 0) + sign * half(x, y) * taper;
        pos.push(x, y, z);
        uvs.push(0.5 + Math.cos(a) * rf * 0.5, 0.5 + Math.sin(a) * rf * 0.5);
      }
    }
  }

  const at = (base, i, j) => base + i * sectors + (j % sectors);
  for (let s = 0; s < 2; s++) {
    const base = skinBase[s];
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < sectors; j++) {
        const a = at(base, i, j), b = at(base, i, j + 1);
        const c = at(base, i + 1, j + 1), d = at(base, i + 1, j);
        if (s === 0) idx.push(a, b, d, b, c, d);
        else idx.push(a, d, b, b, d, c);
      }
    }
  }
  // Seal the rim.
  for (let j = 0; j < sectors; j++) {
    const f0 = at(skinBase[0], rings, j), f1 = at(skinBase[0], rings, j + 1);
    const b0 = at(skinBase[1], rings, j), b1 = at(skinBase[1], rings, j + 1);
    idx.push(f0, b0, f1, f1, b0, b1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * 7. SPHERICAL CUPS — true ball-and-socket articular surfaces
 * ================================================================== */

/**
 * A hollow spherical cup, open over its mouth.
 *
 * A dented solid ball will not do for a socket: the femoral head has to sit
 * INSIDE the acetabulum with a joint space around it, which needs both an
 * inner and an outer skin joined at the rim.
 *
 * @param {number[]} centre    centre of curvature
 * @param {number[]} opening   unit vector pointing out of the socket mouth
 * @param {number} rIn         inner (articular) radius
 * @param {number} rOut        outer radius; rOut - rIn is the wall thickness
 * @param {number} halfAngle   angular half-width of the cup, in radians
 * @param {function} [notch]   (phi) => radians to trim off the rim locally
 */
export function sphericalCup({
  centre, opening, rIn, rOut, halfAngle = 1.75,
  seg = 18, ring = 40, notch = null,
}) {
  const axis = new THREE.Vector3(...opening).normalize().negate();   // into the socket
  const tmp = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(tmp, axis).normalize();
  const v = new THREE.Vector3().crossVectors(axis, u).normalize();
  const C = new THREE.Vector3(...centre);

  const pos = [], uvs = [], idx = [];
  const d = new THREE.Vector3();
  const push = (r, theta, phi) => {
    d.copy(axis).multiplyScalar(Math.cos(theta))
      .addScaledVector(u, Math.sin(theta) * Math.cos(phi))
      .addScaledVector(v, Math.sin(theta) * Math.sin(phi));
    pos.push(C.x + d.x * r, C.y + d.y * r, C.z + d.z * r);
    uvs.push(phi / (Math.PI * 2), theta / halfAngle);
  };

  const N = (ring + 1) * (seg + 1);
  for (const r of [rOut, rIn]) {
    for (let i = 0; i <= seg; i++) {
      for (let j = 0; j <= ring; j++) {
        const phi = (j / ring) * Math.PI * 2;
        const lim = halfAngle - (notch ? notch(phi) : 0);
        push(r, (i / seg) * lim, phi);
      }
    }
  }
  const at = (base, i, j) => base + i * (ring + 1) + j;
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < ring; j++) {
      // Outer skin faces away from the centre; inner skin faces into it.
      idx.push(at(0, i, j), at(0, i, j + 1), at(0, i + 1, j));
      idx.push(at(0, i, j + 1), at(0, i + 1, j + 1), at(0, i + 1, j));
      idx.push(at(N, i, j), at(N, i + 1, j), at(N, i, j + 1));
      idx.push(at(N, i, j + 1), at(N, i + 1, j), at(N, i + 1, j + 1));
    }
  }
  // Rim band closing the two skins into a solid.
  for (let j = 0; j < ring; j++) {
    const o0 = at(0, seg, j), o1 = at(0, seg, j + 1);
    const i0 = at(N, seg, j), i1 = at(N, seg, j + 1);
    idx.push(o0, i0, o1, o1, i0, i1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ==================================================================
 * 8. HELPERS
 * ================================================================== */

/**
 * Merge a list of geometries into one, tolerating nulls.
 *
 * mergeGeometries() refuses to mix indexed and non-indexed inputs, and the
 * primitives here are a mix: ExtrudeGeometry and IcosahedronGeometry come
 * back non-indexed, while sweptBone/loft build their own index. Rather than
 * expanding the indexed ones (which would multiply the vertex count several
 * times over), we give the non-indexed ones a trivial sequential index —
 * same vertex count, and now everything agrees.
 */
export function merge(list) {
  const clean = list.filter(Boolean);
  if (!clean.length) return null;

  for (const g of clean) {
    const n = g.attributes.position.count;
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    g.deleteAttribute('color');
    if (!g.index) {
      const idx = n > 65535 ? new Uint32Array(n) : new Uint16Array(n);
      for (let i = 0; i < n; i++) idx[i] = i;
      g.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    // Bevelled extrusions carry material groups; a merged bone is one piece.
    g.clearGroups();
  }
  if (clean.length === 1) return clean[0];

  const out = mergeGeometries(clean, false);
  if (!out) {
    console.warn('merge(): mergeGeometries returned null', clean.map((g) => Object.keys(g.attributes)));
    return clean[0];
  }
  out.computeVertexNormals();
  return out;
}

/** Build a geometry, then mirror it across X for the opposite side. */
export function mirrorX(geo) {
  const g = geo.clone();
  g.scale(-1, 1, 1);
  // Flip winding so faces are not inside-out after the negative scale.
  const idx = g.index;
  if (idx) {
    const arr = idx.array;
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = t;
    }
    idx.needsUpdate = true;
  }
  g.computeVertexNormals();
  return g;
}

/** Convenience: a tapered strut, used for small processes and struts. */
export function strut(from, to, r0, r1, radial = 10) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().lerp(b, 0.5);
  return sweptBone({
    path: [[a.x, a.y, a.z], [mid.x, mid.y, mid.z], [b.x, b.y, b.z]],
    profile: [{ t: 0, rx: r0, ry: r0 }, { t: 1, rx: r1, ry: r1 }],
    segments: 10,
    radial,
  });
}

/**
 * Smooth "bump" falloff used by every deformation field below.
 * Returns 1 at the centre direction and 0 beyond `width` radians.
 */
export function bump(x, y, z, cx, cy, cz, width) {
  const d = Math.acos(THREE.MathUtils.clamp(x * cx + y * cy + z * cz, -1, 1));
  const u = THREE.MathUtils.clamp(1 - d / width, 0, 1);
  return u * u * (3 - 2 * u);
}
