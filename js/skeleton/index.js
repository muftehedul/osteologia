/**
 * Skeleton assembly.
 * ------------------------------------------------------------------
 * Builds every bone in world space, then RE-PARENTS the pieces into a joint
 * chain with Object3D.attach(), which preserves each part's world transform
 * while computing the correct local one. That gives us anatomically placed
 * bones AND a rig that can be animated, without having to author the same
 * numbers twice.
 */

import * as THREE from 'three';
import { buildSkull } from './skull.js';
import { buildAxialSkeleton, VERTEBRA_LEVELS } from './axial.js';
import { buildAppendicular, jointMap } from './appendicular.js';
import { BONE_BY_ID } from '../data/bones.js';

/* ==================================================================
 * Sex profiles
 * ------------------------------------------------------------------
 * These encode the population-level skeletal differences that forensic
 * anthropologists use to sex a skeleton. The pelvis carries the strongest
 * signal, followed by the skull.
 * ================================================================== */

export const PROFILES = {
  male: {
    key: 'male', label: 'Male', statureCm: 176,
    spineScale: 1.00, limbScale: 1.00, robust: 1.00,
    shoulderW: 1.00, pelvisW: 1.00, cageW: 1.00, cageD: 1.00,
    iliacFlare: 1.00, iliacHeight: 1.00, sacrumW: 1.00, sacrumCurve: 1.00,
    subpubicDrop: -5.80,                 // low junction -> narrow V-shaped arch
    skullW: 1.00, skullH: 1.00, skullL: 1.00,
    brow: 1.00, mastoid: 1.00, chin: 1.00, gonialFlare: 1.00,
    handScale: 1.00, footScale: 1.08,
  },
  female: {
    key: 'female', label: 'Female', statureCm: 163,
    spineScale: 0.945, limbScale: 0.930, robust: 0.86,
    shoulderW: 0.895, pelvisW: 1.065, cageW: 0.905, cageD: 0.930,
    iliacFlare: 1.170, iliacHeight: 0.905, sacrumW: 1.165, sacrumCurve: 0.720,
    subpubicDrop: -3.85,                 // high junction -> wide U-shaped arch
    skullW: 0.955, skullH: 0.950, skullL: 0.940,
    brow: 0.22, mastoid: 0.60, chin: 0.52, gonialFlare: 0.86,
    handScale: 0.925, footScale: 1.00,
  },
};

/* ==================================================================
 * Build
 * ================================================================== */

/**
 * @param {object} profile   one of PROFILES
 * @param {object} materials from createMaterials()
 * @returns {{root, bones, joints, regions, meta}}
 */
export function buildSkeleton(profile, materials) {
  const p = profile;
  const root = new THREE.Group();
  root.name = `skeleton-${p.key}`;

  const bones = [];      // every selectable bone mesh
  const soft = [];       // discs and cartilages
  const regions = {};    // region key -> Object3D[] for layer toggles

  /** Mesh factory shared by every builder. */
  const mk = (geo, boneId, label, matKey = 'bone') => {
    const mat = materials[matKey] || materials.bone;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.boneId = boneId;
    m.userData.label = label;
    m.userData.matKey = matKey;
    m.userData.baseMaterial = mat;
    if (boneId) {
      const rec = BONE_BY_ID[boneId];
      m.userData.region = rec ? rec.region : 'other';
      bones.push(m);
      (regions[m.userData.region] ||= []).push(m);
    } else if (matKey === 'cavity') {
      // Orbital and nasal backings: structural, not soft tissue, and never
      // toggled off with the cartilage layer.
      m.userData.cavity = true;
      m.castShadow = false;
    } else {
      m.userData.soft = true;
      soft.push(m);
    }
    return m;
  };

  /* ---- 1. build every part in world space ---- */
  const axial = buildAxialSkeleton(p, mk);
  axial.loose.forEach((o) => root.add(o));

  const limbs = buildAppendicular(p, mk);
  for (const S of ['L', 'R']) {
    root.add(limbs[S].girdle);
    root.add(limbs[S].hipBone);
  }

  // The skull sits on the atlas; its origin is basion.
  const skull = buildSkull(p, mk);
  skull.position.set(0, 163.0 * p.spineScale, -0.9);
  root.add(skull);

  root.updateMatrixWorld(true);

  /* ---- 2. re-parent into a joint chain ---- */
  const J = jointMap(p);
  const pelvis = new THREE.Group();
  pelvis.name = 'pelvis';
  pelvis.position.set(0, J.hip[1], 0);
  root.add(pelvis);
  root.updateMatrixWorld(true);

  pelvis.attach(axial.sacrumGroup);
  pelvis.attach(limbs.L.hipBone);
  pelvis.attach(limbs.R.hipBone);

  // Spine: L5 upward, each vertebra a child of the one below.
  const V = axial.joints;
  const order = [...VERTEBRA_LEVELS].map(([id]) => id).reverse();   // L5 ... C1
  axial.sacrumGroup.attach(V.L5);
  for (let i = 0; i < order.length - 1; i++) {
    V[order[i]].attach(V[order[i + 1]]);
  }

  // Head on the atlas, shoulder girdles and sternum on T1.
  V.C1.attach(skull);
  V.T1.attach(limbs.L.girdle);
  V.T1.attach(limbs.R.girdle);
  V.T1.attach(axial.sternumGroup);

  // Each costal cartilage follows its own rib so the costochondral junction
  // never separates during the breathing animation.
  const carts = [...axial.cartGroup.children];
  carts.forEach((c, i) => {
    const ribIdx = Math.floor(i / 2);
    const side = i % 2 === 0 ? 1 : -1;
    const rib = axial.ribGroups.find((r) => r.userData.ribIndex === ribIdx && r.name.endsWith(side > 0 ? 'L' : 'R'));
    (rib || axial.sternumGroup).attach(c);
  });
  root.remove(axial.cartGroup);

  root.updateMatrixWorld(true);

  /* ---- 3. drop the skeleton onto the floor ---- */
  const box = new THREE.Box3().setFromObject(root);
  root.position.y -= box.min.y;
  root.updateMatrixWorld(true);
  const size = new THREE.Vector3();
  box.getSize(size);

  /* ---- 4. precompute explode vectors and rest poses ---- */
  const centre = new THREE.Vector3(0, (box.max.y - box.min.y) * 0.52, 0);
  const wp = new THREE.Vector3();
  const bb = new THREE.Box3();
  const parentInv = new THREE.Matrix4();

  for (const m of [...bones, ...soft]) {
    bb.setFromObject(m);
    bb.getCenter(wp);
    const dir = wp.clone().sub(centre);
    // Push mainly outward in the transverse plane, gently along the axis, so
    // an exploded skeleton reads like an anatomical plate rather than a cloud.
    dir.y *= 0.55;
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    dir.normalize();
    parentInv.copy(m.parent.matrixWorld).invert();
    const local = dir.clone().transformDirection(parentInv).normalize();
    m.userData.explodeDir = local;
    m.userData.restPos = m.position.clone();
    m.userData.worldCentre = wp.clone();
  }

  /* ---- 5. collect the rig ---- */
  const joints = {
    root, pelvis,
    vertebrae: V,
    ribs: axial.ribGroups,
    sternum: axial.sternumGroup,
    sacrum: axial.sacrumGroup,
    skull,
    jaw: skull.userData.jaw,
    L: limbs.L, R: limbs.R,
  };
  // Snapshot the rest pose of every joint so animations can blend from it.
  const rig = [pelvis, ...Object.values(V), skull, joints.jaw, ...axial.ribGroups];
  for (const S of ['L', 'R']) {
    rig.push(limbs[S].girdle, limbs[S].shoulder, limbs[S].elbow, limbs[S].wrist,
      limbs[S].hipBone, limbs[S].thigh, limbs[S].knee, limbs[S].ankle);
  }
  for (const o of rig) {
    if (!o) continue;
    o.userData.restQuat = o.quaternion.clone();
    o.userData.restPosition = o.position.clone();
  }
  joints.rig = rig.filter(Boolean);

  const meta = {
    profile: p,
    heightCm: +(size.y).toFixed(1),
    boneMeshCount: bones.length,
    triangles: bones.reduce((n, m) => n + (m.geometry.index ? m.geometry.index.count / 3 : 0), 0) | 0,
    shoulderCm: +((limbs.L.girdle.position.x + 16.0 * p.shoulderW) * 2).toFixed(1),
  };

  return { root, bones, soft, joints, regions, meta };
}

/** Free all GPU resources for a skeleton returned by buildSkeleton(). */
export function disposeSkeleton(sk) {
  sk.root.traverse((o) => {
    if (o.isMesh) o.geometry.dispose();
  });
  sk.root.removeFromParent();
}
