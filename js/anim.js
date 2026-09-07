/**
 * Procedural animation for the skeleton rig.
 * ------------------------------------------------------------------
 * Nothing here is keyframed. The gait cycle is driven by published joint
 * kinematics (Winter, "Biomechanics and Motor Control of Human Movement"),
 * expressed as sagittal-plane angle curves against percent of gait cycle,
 * which is exactly the form a student meets them in.
 *
 * Angles in these tables are DEGREES; flexion is positive.
 */

import * as THREE from 'three';

const D = Math.PI / 180;
const _e = new THREE.Euler();
const _q = new THREE.Quaternion();

/** Smoothly sample a keyframe track [[t, value], ...] with wraparound. */
function curve(keys, t) {
  t = ((t % 1) + 1) % 1;
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t >= t0 && t <= t1) {
      let u = (t - t0) / (t1 - t0);
      u = u * u * (3 - 2 * u);
      return v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}

/** Apply a rotation relative to the joint's captured rest pose. */
function pose(obj, rx = 0, ry = 0, rz = 0, order = 'XYZ') {
  if (!obj || !obj.userData.restQuat) return;
  _e.set(rx * D, ry * D, rz * D, order);
  _q.setFromEuler(_e);
  obj.quaternion.copy(obj.userData.restQuat).multiply(_q);
}

/** Offset a joint's position relative to its rest position. */
function shift(obj, dx = 0, dy = 0, dz = 0) {
  if (!obj || !obj.userData.restPosition) return;
  obj.position.copy(obj.userData.restPosition).add(new THREE.Vector3(dx, dy, dz));
}

/* ==================================================================
 * Gait kinematics — one full cycle, heel strike to heel strike
 * ================================================================== */

const HIP_FLEX = [[0, 26], [0.15, 18], [0.32, 4], [0.50, -12], [0.62, -6], [0.78, 20], [0.92, 28], [1, 26]];
const KNEE_FLEX = [[0, 5], [0.12, 18], [0.30, 6], [0.45, 12], [0.58, 52], [0.70, 62], [0.82, 30], [0.94, 6], [1, 5]];
const ANKLE_FLEX = [[0, 0], [0.08, -7], [0.25, 3], [0.45, 11], [0.58, -18], [0.68, -8], [0.85, 2], [1, 0]];
const SHOULDER_SWING = [[0, -18], [0.25, -6], [0.5, 16], [0.75, 4], [1, -18]];
const ELBOW_SWING = [[0, 28], [0.3, 18], [0.55, 34], [0.8, 40], [1, 28]];

/* ==================================================================
 * Animation modes
 * ================================================================== */

export const MODES = {
  rest: {
    label: 'Anatomical rest',
    hint: 'The standard anatomical position used for all descriptive anatomy.',
    apply() { /* rest pose is the default */ },
  },

  breathing: {
    label: 'Quiet respiration',
    hint: 'Ribs 2–6 swing on the "pump handle", ribs 7–10 on the "bucket handle". Watch the sternum move up and forward.',
    apply(j, t) {
      const b = Math.sin(t * Math.PI * 2 * 0.24);
      applyBreathing(j, b, 2.6);
      pose(j.vertebrae.T7, b * 0.6);
      shift(j.sternum, 0, b * 0.25, b * 0.55);
    },
  },

  walk: {
    label: 'Walking gait',
    hint: 'Sagittal hip, knee and ankle angles follow published gait kinematics. Note the reciprocal arm swing and the pelvic rotation and list.',
    speed: 0.9,
    apply(j, t) { gait(j, t, 1.0); },
  },

  run: {
    label: 'Running gait',
    hint: 'Greater joint excursion, a longer swing phase and a true flight phase with both feet off the ground.',
    speed: 1.9,
    apply(j, t) { gait(j, t, 1.75, true); },
  },

  spine: {
    label: 'Spinal range of motion',
    hint: 'Flexion, extension, lateral flexion and rotation. Note how the thoracic spine rotates but barely flexes, while the lumbar spine does the opposite.',
    apply(j, t) {
      const phase = (t * 0.10) % 1;
      const seg = Math.floor(phase * 4);
      const u = Math.sin((phase * 4 % 1) * Math.PI * 2);
      const levels = Object.entries(j.vertebrae);
      for (const [id, v] of levels) {
        const region = id[0];
        // Weight each region by its true contribution to that movement.
        let flex = 0, side = 0, rot = 0;
        if (region === 'C') { flex = 3.2; side = 2.6; rot = 3.4; }
        if (region === 'T') { flex = 0.5; side = 0.7; rot = 0.9; }
        if (region === 'L') { flex = 2.8; side = 1.4; rot = 0.15; }
        if (seg === 0) pose(v, u * flex);           // flexion / extension
        else if (seg === 1) pose(v, 0, 0, u * side); // lateral flexion
        else if (seg === 2) pose(v, 0, u * rot, 0);  // axial rotation
        else pose(v, Math.max(0, u) * flex * 0.6, 0, 0);
      }
      applyBreathing(j, Math.sin(t * 1.4), 1.4);
    },
  },

  upperlimb: {
    label: 'Upper limb range of motion',
    hint: 'Shoulder abduction with scapular rotation (the 2:1 scapulohumeral rhythm), elbow flexion, and forearm pronation/supination.',
    apply(j, t) {
      const phase = (t * 0.14) % 1;
      const u = (1 - Math.cos(phase * Math.PI * 2)) / 2;
      for (const S of ['L', 'R']) {
        const s = S === 'L' ? 1 : -1;
        const limb = j[S];
        // Scapulohumeral rhythm: for every 2 degrees of glenohumeral motion
        // the scapula upwardly rotates 1 degree.
        pose(limb.girdle, 0, 0, s * u * 22);
        pose(limb.shoulder, -u * 20, 0, s * u * 78);
        pose(limb.elbow, -u * 95, -s * (1.05 / D) * 0 - s * u * 60, 0);
        pose(limb.wrist, u * 18, 0, 0);
      }
      applyBreathing(j, Math.sin(t * 1.4), 1.6);
    },
  },

  jaw: {
    label: 'Temporomandibular joint',
    hint: 'The TMJ both hinges and translates: rotation for the first 20 mm of opening, then the condyle glides forward onto the articular tubercle.',
    apply(j, t) {
      const u = (1 - Math.cos(t * 1.7)) / 2;
      pose(j.jaw, -u * 24);
      // Beyond a hinge, the condyle translates forward and down.
      shift(j.jaw, 0, -u * 0.55, u * 1.35);
      applyBreathing(j, Math.sin(t * 1.4), 1.4);
    },
  },
};

/** Rib elevation and thoracic expansion, shared by every mode. */
function applyBreathing(j, b, amp) {
  for (const rib of j.ribs) {
    const n = rib.userData.ribIndex;
    // Upper ribs: pump handle (sternum up and forward).
    // Lower ribs: bucket handle (lateral expansion).
    const pump = Math.max(0, 1 - n / 7);
    const bucket = Math.min(1, n / 5);
    const side = rib.name.endsWith('L') ? 1 : -1;
    pose(rib, b * amp * 0.55 * pump, 0, side * b * amp * 0.75 * bucket);
  }
}

/** One full gait cycle applied to the whole rig. */
function gait(j, t, scale, running = false) {
  const cyc = t;
  for (const S of ['L', 'R']) {
    const s = S === 'L' ? 1 : -1;
    const phase = S === 'L' ? cyc : cyc + 0.5;
    const limb = j[S];

    pose(limb.thigh, curve(HIP_FLEX, phase) * scale, 0, 0);
    pose(limb.knee, -curve(KNEE_FLEX, phase) * scale, 0, 0);
    pose(limb.ankle, curve(ANKLE_FLEX, phase) * scale * 0.9, 0, 0);

    // Arms swing in reciprocal fashion — contralateral to the leg.
    const armPhase = phase + 0.5;
    pose(limb.shoulder, curve(SHOULDER_SWING, armPhase) * scale, 0, -s * 4);
    pose(limb.elbow, -curve(ELBOW_SWING, armPhase) * (running ? 1.5 : 0.7), 0, 0);
    // Shoulder girdle counter-rotates slightly with the trunk.
    pose(limb.girdle, 0, s * Math.sin(cyc * Math.PI * 2) * 2.5, 0);
  }

  // Pelvic rotation (transverse), list (frontal) and vertical displacement.
  const rot = Math.sin(cyc * Math.PI * 2) * (running ? 7 : 4.5);
  const list = Math.sin(cyc * Math.PI * 2 + Math.PI / 2) * (running ? 5 : 3);
  pose(j.pelvis, 0, rot, list);
  // The centre of mass rises and falls twice per cycle.
  const bob = -Math.abs(Math.cos(cyc * Math.PI * 2)) * (running ? 3.4 : 1.4) + (running ? 1.7 : 0.7);
  shift(j.pelvis, Math.sin(cyc * Math.PI * 2) * 1.1, bob, 0);

  // The trunk counter-rotates against the pelvis; the thoracic spine does
  // most of that work.
  for (const [id, v] of Object.entries(j.vertebrae)) {
    if (id[0] === 'T') pose(v, running ? 0.35 : 0.15, -rot / 12, 0);
    else if (id[0] === 'L') pose(v, running ? 0.5 : 0.2, -rot / 22, 0);
    else pose(v, 0, rot / 30, 0);
  }
  applyBreathing(j, Math.sin(cyc * Math.PI * 2 * (running ? 1 : 0.5)), running ? 3.4 : 2.0);
}

/* ==================================================================
 * Driver
 * ================================================================== */

export class Animator {
  constructor() {
    this.mode = 'rest';
    this.time = 0;
    this.playing = true;
    this.speed = 1;
  }

  setMode(name) {
    this.mode = MODES[name] ? name : 'rest';
    this.time = 0;
  }

  update(dt, joints) {
    if (!joints || !joints.rig) return;
    const m = MODES[this.mode];
    if (this.playing) this.time += dt * this.speed * (m.speed || 1);

    // Reset the rig to its rest pose, then let the mode deform it.
    for (const o of joints.rig) {
      if (o.userData.restQuat) o.quaternion.copy(o.userData.restQuat);
      if (o.userData.restPosition) o.position.copy(o.userData.restPosition);
    }
    m.apply(joints, this.time);
  }
}
