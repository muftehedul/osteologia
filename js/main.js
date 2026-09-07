/**
 * Osteologia — application shell.
 * ------------------------------------------------------------------
 * Scene, lighting, picking, camera choreography and all UI wiring.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createMaterials, createEnvironment } from './materials.js';
import { buildSkeleton, disposeSkeleton, PROFILES } from './skeleton/index.js';
import { BONES, BONE_BY_ID, REGIONS, DIVISIONS, SEX_DIFFERENCES, BONE_FACTS, TOTAL_NAMED_BONES } from './data/bones.js';
import { Animator, MODES } from './anim.js';

const $ = (id) => document.getElementById(id);

/**
 * Yield to the browser so the loader can repaint between build phases.
 * requestAnimationFrame alone is not enough: it is throttled to a crawl (or
 * suspended entirely) in a background tab, which would stall the whole boot
 * sequence. Racing it against a timer keeps the build progressing either way.
 */
const nextFrame = () => new Promise((resolve) => {
  let done = false;
  const finish = () => { if (!done) { done = true; resolve(); } };
  requestAnimationFrame(() => requestAnimationFrame(finish));
  setTimeout(finish, 40);
});

/* ==================================================================
 * State
 * ================================================================== */

const state = {
  sex: 'male',
  skeleton: null,
  selected: null,       // Mesh
  hovered: null,        // Mesh
  isolated: false,
  explode: 0,
  xray: false,
  showLabels: false,
  quiz: null,
};

const animator = new Animator();

/* ==================================================================
 * Renderer, scene, camera
 * ================================================================== */

const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e13);
scene.fog = new THREE.Fog(0x0b0e13, 320, 720);

const camera = new THREE.PerspectiveCamera(34, 1, 1, 2000);
camera.position.set(62, 108, 330);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 88, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.minDistance = 22;
controls.maxDistance = 620;
controls.maxPolarAngle = Math.PI * 0.96;
controls.rotateSpeed = 0.75;
controls.panSpeed = 0.7;

/* ---- lighting rig: a four-point studio setup ----
 * The extra underlight matters more than it sounds: the sacrum, the hard
 * palate, the acetabula and the plantar surfaces all face downward and
 * forward, and with only overhead keys they render almost black.
 */
scene.add(new THREE.HemisphereLight(0x92abcb, 0x3c3327, 0.75));

const key = new THREE.DirectionalLight(0xfff4e2, 2.35);
key.position.set(90, 210, 130);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 60;
key.shadow.camera.far = 420;
key.shadow.camera.left = -70; key.shadow.camera.right = 70;
key.shadow.camera.top = 130;  key.shadow.camera.bottom = -130;
// Flat bones are only 2–10 mm thick at this scale. A normalBias larger than
// that thickness makes the plate shadow its own front face, which reads as a
// dead-black scapula and ilium — so keep both biases very small.
key.shadow.bias = -0.00015;
key.shadow.normalBias = 0.04;
scene.add(key);

const fill = new THREE.DirectionalLight(0x9dc4ff, 0.70);
fill.position.set(-150, 95, 80);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xdff0ff, 1.30);
rim.position.set(-40, 150, -190);
scene.add(rim);

// Warm bounce from below and in front — the "floor light".
const under = new THREE.DirectionalLight(0xffd7ac, 0.62);
under.position.set(20, -60, 150);
scene.add(under);

const underBack = new THREE.DirectionalLight(0xffe0c0, 0.30);
underBack.position.set(-30, -70, -110);
scene.add(underBack);

/* ---- ground ---- */
function makeGround() {
  const g = new THREE.Group();
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#1d2531');
  grad.addColorStop(0.45, '#141a24');
  grad.addColorStop(1, '#0b0e13');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // Concentric measuring rings, 20 cm apart.
  ctx.strokeStyle = 'rgba(120,150,180,.09)';
  ctx.lineWidth = 1.5;
  for (let r = 40; r < size / 2; r += 40) {
    ctx.beginPath(); ctx.arc(size / 2, size / 2, r, 0, 7); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(280, 96),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  g.add(disc);
  return g;
}
const ground = makeGround();
scene.add(ground);

/* ==================================================================
 * Boot
 * ================================================================== */

let materials;

async function boot() {
  const setProgress = (pct, msg) => {
    $('loaderFill').style.width = pct + '%';
    $('loaderMsg').textContent = msg;
  };

  setProgress(8, 'Generating bone textures…');
  await nextFrame();
  materials = createMaterials();

  setProgress(22, 'Building studio environment…');
  await nextFrame();
  scene.environment = createEnvironment(renderer);

  setProgress(36, 'Generating skull, spine and thoracic cage…');
  await nextFrame();
  await rebuild('male');

  setProgress(88, 'Preparing atlas…');
  await nextFrame();
  buildTree();
  buildAnimSelect();
  buildSexTable();
  wireUI();
  rotateFacts();

  setProgress(100, 'Ready');
  await nextFrame();
  $('app').hidden = false;
  $('loader').classList.add('done');
  setTimeout(() => $('loader').remove(), 600);
  resize();
}

/** Build (or rebuild) the skeleton for a sex profile. */
async function rebuild(sexKey) {
  const wasSelected = state.selected?.userData.boneId || null;
  if (state.skeleton) disposeSkeleton(state.skeleton);
  state.selected = null;
  state.hovered = null;

  state.sex = sexKey;
  state.skeleton = buildSkeleton(PROFILES[sexKey], materials);
  scene.add(state.skeleton.root);
  await nextFrame();

  const m = state.skeleton.meta;
  $('statMeshes').textContent = m.boneMeshCount;
  $('statHeight').textContent = `${m.heightCm} cm`;
  $('statTris').textContent = m.triangles.toLocaleString();

  applyVisibility();
  applyExplode();
  if (wasSelected) selectByBoneId(wasSelected, false);
  updateTreeSelection();
}

/* ==================================================================
 * Picking
 * ================================================================== */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerClient = { x: 0, y: 0 };
let hoverDirty = false;

function pick(ev) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  pointerClient = { x: ev.clientX - r.left, y: ev.clientY - r.top };
  raycaster.setFromCamera(pointer, camera);
  const targets = state.skeleton.bones.filter((b) => b.visible);
  const hits = raycaster.intersectObjects(targets, false);
  return hits.length ? hits[0].object : null;
}

canvas.addEventListener('pointermove', (ev) => {
  if (!state.skeleton) return;
  const hit = pick(ev);
  if (hit !== state.hovered) {
    if (state.hovered && state.hovered !== state.selected) restoreMaterial(state.hovered);
    state.hovered = hit;
    if (hit && hit !== state.selected) hit.material = materials.hovered;
  }
  const tip = $('tooltip');
  if (hit) {
    const rec = BONE_BY_ID[hit.userData.boneId];
    tip.hidden = false;
    tip.innerHTML = `<b>${hit.userData.label}</b>${rec ? `<i>${rec.latin}</i>` : ''}`;
    tip.style.left = pointerClient.x + 'px';
    tip.style.top = pointerClient.y + 'px';
    canvas.style.cursor = 'pointer';
  } else {
    tip.hidden = true;
    canvas.style.cursor = 'grab';
  }
});

canvas.addEventListener('pointerleave', () => {
  $('tooltip').hidden = true;
  if (state.hovered && state.hovered !== state.selected) restoreMaterial(state.hovered);
  state.hovered = null;
});

let downAt = null;
canvas.addEventListener('pointerdown', (ev) => { downAt = { x: ev.clientX, y: ev.clientY }; });
canvas.addEventListener('pointerup', (ev) => {
  if (!downAt) return;
  const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
  downAt = null;
  if (moved > 5) return;                 // that was an orbit drag, not a click
  const hit = pick(ev);
  if (state.quiz) { answerQuiz(hit); return; }
  if (hit) select(hit);
  else deselect();
});

/* ==================================================================
 * Selection & detail panel
 * ================================================================== */

function restoreMaterial(mesh) {
  mesh.material = state.isolated && mesh !== state.selected
    ? materials.ghost
    : mesh.userData.baseMaterial;
}

function select(mesh, moveCamera = false) {
  if (state.selected) restoreMaterial(state.selected);
  state.selected = mesh;
  mesh.material = materials.selected;
  if (state.isolated) applyIsolate(true);
  showDetail(mesh);
  updateTreeSelection();
  if (moveCamera) focusOn(mesh);
}

function selectByBoneId(id, moveCamera = true) {
  const mesh = state.skeleton.bones.find((b) => b.userData.boneId === id);
  if (mesh) select(mesh, moveCamera);
}

function deselect() {
  if (state.selected) restoreMaterial(state.selected);
  state.selected = null;
  if (state.isolated) applyIsolate(false);
  $('detailCard').hidden = true;
  $('detailEmpty').hidden = false;
  updateTreeSelection();
}

function showDetail(mesh) {
  const rec = BONE_BY_ID[mesh.userData.boneId];
  if (!rec) return;
  $('detailEmpty').hidden = true;
  $('detailCard').hidden = false;

  const region = REGIONS[rec.region];
  $('dRegion').textContent = region ? region.label : rec.region;
  $('dName').textContent = rec.name;
  $('dLatin').textContent = rec.latin;
  $('dType').textContent = rec.type;
  $('dCount').textContent = rec.count === 1 ? '1 (unpaired)' : `${rec.count}${rec.paired ? ' (paired)' : ''}`;
  $('dGroup').textContent = rec.group;
  $('dDivision').textContent = DIVISIONS.axial.includes(rec.region) ? 'Axial' : 'Appendicular';
  $('dDesc').textContent = rec.desc;

  const fill = (id, arr) => {
    $(id).innerHTML = arr.map((s) => `<li>${highlightCaps(s)}</li>`).join('');
  };
  fill('dLandmarks', rec.landmarks);
  fill('dArtic', rec.articulations);
  fill('dMuscles', rec.muscles);
  $('dOssify').innerHTML = highlightCaps(rec.ossify);
  $('dClinical').innerHTML = highlightCaps(rec.clinical);
  $('dSelected').innerHTML = `Selected in model: <b>${mesh.userData.label}</b>`;
  $('detail').scrollTop = 0;
}

/** Emphasise the ALL-CAPS terms the data uses to flag high-yield facts. */
function highlightCaps(s) {
  return String(s).replace(/\b([A-Z][A-Z'’–-]{3,}(?:\s+[A-Z][A-Z'’–-]{1,})*)\b/g,
    (m) => `<strong style="color:var(--text);font-weight:600">${m}</strong>`);
}

/* ==================================================================
 * Camera choreography
 * ================================================================== */

const camTween = { active: false, t: 0, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(), fromTgt: new THREE.Vector3(), toTgt: new THREE.Vector3() };

function flyTo(pos, target, dur = 0.85) {
  camTween.fromPos.copy(camera.position);
  camTween.toPos.copy(pos);
  camTween.fromTgt.copy(controls.target);
  camTween.toTgt.copy(target);
  camTween.t = 0;
  camTween.dur = dur;
  camTween.active = true;
}

function focusOn(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(box.getSize(new THREE.Vector3()).length() * 0.5, 3.2);
  const dist = r / Math.tan((camera.fov * Math.PI / 180) / 2) * 1.9;
  // Approach from the current viewing direction so the move feels continuous.
  const dir = camera.position.clone().sub(controls.target).normalize();
  flyTo(c.clone().addScaledVector(dir, dist), c);
}

const VIEWS = {
  front: [0, 108, 340], back: [0, 108, -340], left: [340, 108, 0],
  top: [0, 400, 26], reset: [62, 108, 330],
};
function setView(k) {
  const h = state.skeleton ? state.skeleton.meta.heightCm : 176;
  const s = h / 176;
  const t = new THREE.Vector3(0, h * 0.50, 0);
  const v = VIEWS[k] || VIEWS.reset;
  flyTo(new THREE.Vector3(v[0] * s, v[1] * s, v[2] * s), t);
}

/* ==================================================================
 * View modes
 * ================================================================== */

function applyVisibility() {
  const soft = $('softTissue').checked;
  for (const m of state.skeleton.soft) m.visible = soft;
  ground.visible = $('showFloor').checked;
}

function applyIsolate(on) {
  state.isolated = on;
  for (const m of state.skeleton.bones) {
    if (m === state.selected) { m.material = materials.selected; continue; }
    m.material = on ? materials.ghost : m.userData.baseMaterial;
  }
  for (const m of state.skeleton.soft) m.visible = !on && $('softTissue').checked;
  $('isolateBtn').classList.toggle('on', on);
}

function applyExplode() {
  const k = state.explode;
  const all = [...state.skeleton.bones, ...state.skeleton.soft];
  for (const m of all) {
    const d = m.userData.explodeDir;
    if (!d) continue;
    m.position.copy(m.userData.restPos).addScaledVector(d, k * 0.55);
  }
}

function applyXray(on) {
  state.xray = on;
  for (const k of ['bone', 'boneAxial', 'boneLight', 'tooth']) {
    const m = materials[k];
    m.transparent = on;
    m.opacity = on ? 0.30 : 1;
    m.depthWrite = !on;
    m.needsUpdate = true;
  }
  document.querySelector('#xray').checked = on;
}

/* ==================================================================
 * Region labels (projected each frame)
 * ================================================================== */

const labelEls = {};
function buildLabels() {
  const host = $('labels');
  host.innerHTML = '';
  for (const key of Object.keys(REGIONS)) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.textContent = REGIONS[key].label;
    el.style.position = 'absolute';
    el.style.display = 'none';
    host.appendChild(el);
    labelEls[key] = el;
  }
}

const _v = new THREE.Vector3();
function updateLabels() {
  const on = state.showLabels && state.skeleton;
  for (const key of Object.keys(labelEls)) {
    const el = labelEls[key];
    const list = on ? state.skeleton.regions[key] : null;
    if (!list || !list.length) { el.style.display = 'none'; continue; }
    // Anchor on the largest bone of the region.
    const anchor = list.reduce((a, b) =>
      (b.geometry.boundingSphere?.radius || 0) > (a.geometry.boundingSphere?.radius || 0) ? b : a, list[0]);
    if (!anchor.visible) { el.style.display = 'none'; continue; }
    anchor.getWorldPosition(_v).project(camera);
    if (_v.z > 1) { el.style.display = 'none'; continue; }
    const w = canvas.clientWidth, h = canvas.clientHeight;
    el.style.display = 'block';
    el.style.left = ((_v.x * 0.5 + 0.5) * w) + 'px';
    el.style.top = ((-_v.y * 0.5 + 0.5) * h) + 'px';
    el.style.transform = 'translate(-50%,-50%)';
  }
}

/* ==================================================================
 * Navigator tree
 * ================================================================== */

function buildTree() {
  const host = $('tree');
  host.innerHTML = '';
  const order = Object.entries(REGIONS).sort((a, b) => a[1].order - b[1].order);

  for (const [key, meta] of order) {
    const list = BONES.filter((b) => b.region === key);
    if (!list.length) continue;
    const total = list.reduce((n, b) => n + b.count, 0);

    const wrap = document.createElement('div');
    wrap.className = 'tree-region';
    wrap.dataset.region = key;
    wrap.dataset.division = DIVISIONS.axial.includes(key) ? 'axial' : 'appendicular';

    const head = document.createElement('button');
    head.innerHTML =
      `<span class="caret">▶</span>` +
      `<span class="dot" style="background:#${meta.color.toString(16).padStart(6, '0')}"></span>` +
      `<span>${meta.label}</span><span class="cnt">${total}</span>`;
    head.addEventListener('click', () => wrap.classList.toggle('open'));
    wrap.appendChild(head);

    const items = document.createElement('div');
    items.className = 'tree-items';
    for (const b of list) {
      const btn = document.createElement('button');
      btn.className = 'tree-item';
      btn.dataset.bone = b.id;
      btn.innerHTML = `${b.name}${b.count > 1 ? `<span class="n">×${b.count}</span>` : ''}`;
      btn.addEventListener('click', () => selectByBoneId(b.id, true));
      items.appendChild(btn);
    }
    wrap.appendChild(items);
    host.appendChild(wrap);
  }
  // Open the skull by default so the tree does not look empty.
  host.querySelector('.tree-region')?.classList.add('open');
}

function updateTreeSelection() {
  const id = state.selected?.userData.boneId;
  document.querySelectorAll('.tree-item').forEach((el) => {
    const on = el.dataset.bone === id;
    el.classList.toggle('sel', on);
    if (on) el.closest('.tree-region')?.classList.add('open');
  });
}

function filterTree(division) {
  document.querySelectorAll('.tree-region').forEach((el) => {
    el.style.display = division === 'all' || el.dataset.division === division ? '' : 'none';
  });
}

/* ==================================================================
 * Search
 * ================================================================== */

function searchBones(q) {
  const t = q.trim().toLowerCase();
  if (t.length < 2) return [];
  const scored = [];
  for (const b of BONES) {
    let score = 0, where = '';
    const hay = [
      [b.name, 100], [b.latin, 80], [b.group, 40], [b.type, 25],
      [b.desc, 12], [b.landmarks.join(' | '), 18],
      [b.articulations.join(' | '), 14], [b.muscles.join(' | '), 14],
      [b.clinical, 20], [b.ossify, 10],
    ];
    for (const [text, weight] of hay) {
      const low = String(text).toLowerCase();
      const i = low.indexOf(t);
      if (i >= 0) {
        score += weight + (i === 0 ? weight * 0.5 : 0);
        if (!where) {
          const start = Math.max(0, i - 34);
          where = (start ? '…' : '') + String(text).slice(start, i + t.length + 56).trim() + '…';
        }
      }
    }
    if (score) scored.push({ b, score, where });
  }
  return scored.sort((x, y) => y.score - x.score).slice(0, 12);
}

function renderSearch(q) {
  const box = $('searchResults');
  const hits = searchBones(q);
  if (!q.trim() || q.trim().length < 2) { box.hidden = true; return; }
  box.hidden = false;
  if (!hits.length) { box.innerHTML = `<div class="sr-none">No match for “${escapeHtml(q)}”</div>`; return; }
  const re = new RegExp(`(${q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  box.innerHTML = hits.map(({ b, where }, i) => `
    <div class="sr-item${i === 0 ? ' on' : ''}" data-bone="${b.id}">
      <div style="min-width:0">
        <b>${b.name.replace(re, '<mark>$1</mark>')}</b>
        <div><em>${b.latin}</em></div>
        ${where ? `<div style="color:var(--text-3);font-size:11px;margin-top:2px">${escapeHtml(where).replace(re, '<mark>$1</mark>')}</div>` : ''}
      </div>
      <span>${REGIONS[b.region]?.label || ''}</span>
    </div>`).join('');
  box.querySelectorAll('.sr-item').forEach((el) => {
    el.addEventListener('click', () => {
      selectByBoneId(el.dataset.bone, true);
      box.hidden = true;
      $('search').blur();
    });
  });
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ==================================================================
 * Quiz
 * ================================================================== */

function startQuiz() {
  state.quiz = { score: 0, asked: 0, streak: 0, best: 0, target: null, pool: null };
  $('quizPanel').hidden = false;
  $('quizBtn').classList.add('on');
  deselect();
  nextQuestion();
}

function stopQuiz() {
  state.quiz = null;
  $('quizPanel').hidden = true;
  $('quizBtn').classList.remove('on');
}

function nextQuestion() {
  const q = state.quiz;
  // Only ask about bones that actually have a visible mesh right now.
  const present = new Set(state.skeleton.bones.filter((b) => b.visible).map((b) => b.userData.boneId));
  const pool = BONES.filter((b) => present.has(b.id));
  q.target = pool[Math.floor(Math.random() * pool.length)];
  $('quizTarget').textContent = q.target.name;
  $('quizFeedback').textContent = '';
  $('quizFeedback').className = 'quiz-feedback';
}

function answerQuiz(mesh) {
  const q = state.quiz;
  q.asked++;
  const fb = $('quizFeedback');
  if (mesh && mesh.userData.boneId === q.target.id) {
    q.score++; q.streak++; q.best = Math.max(q.best, q.streak);
    fb.textContent = `Correct — ${q.target.latin}. ${q.target.type}, ${q.target.count === 1 ? 'unpaired' : `${q.target.count} in the body`}.`;
    fb.className = 'quiz-feedback ok';
    flash(mesh, materials.selected);
    setTimeout(nextQuestion, 1400);
  } else {
    q.streak = 0;
    const got = mesh ? BONE_BY_ID[mesh.userData.boneId] : null;
    fb.textContent = mesh
      ? `Not quite — that is the ${got ? got.name.toLowerCase() : 'unknown'}. Try again.`
      : 'You clicked empty space. Click directly on a bone.';
    fb.className = 'quiz-feedback no';
    if (mesh) flash(mesh, materials.wrong);
  }
  $('quizScore').textContent = q.score;
  $('quizStreak').textContent = q.streak;
  $('quizAsked').textContent = q.asked;
}

function flash(mesh, mat) {
  const orig = mesh.material;
  mesh.material = mat;
  setTimeout(() => { if (mesh.material === mat) mesh.material = state.isolated ? materials.ghost : mesh.userData.baseMaterial; }, 700);
}

function revealAnswer() {
  const q = state.quiz;
  if (!q) return;
  q.streak = 0;
  $('quizStreak').textContent = 0;
  const mesh = state.skeleton.bones.find((b) => b.userData.boneId === q.target.id && b.visible);
  if (mesh) {
    flash(mesh, materials.selected);
    focusOn(mesh);
    $('quizFeedback').textContent = `That is the ${q.target.name.toLowerCase()} — highlighted for you.`;
    $('quizFeedback').className = 'quiz-feedback';
  }
  setTimeout(nextQuestion, 1800);
}

/* ==================================================================
 * UI wiring
 * ================================================================== */

function buildAnimSelect() {
  const sel = $('animSelect');
  sel.innerHTML = Object.entries(MODES)
    .map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('');
  sel.value = 'breathing';
  animator.setMode('breathing');
  $('animHint').textContent = MODES.breathing.hint;
}

function buildSexTable() {
  const host = $('sexTable');
  host.innerHTML =
    `<div class="h">Feature</div><div class="h">Male</div><div class="h">Female</div>` +
    SEX_DIFFERENCES.map((d) =>
      `<div class="f">${d.feature}</div><div>${d.male}</div><div>${d.female}</div>`).join('');
}

function wireUI() {
  buildLabels();

  // sex profile
  $('sexToggle').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-sex]');
    if (!btn || btn.dataset.sex === state.sex) return;
    document.querySelectorAll('#sexToggle button').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });
    btn.disabled = true;
    await rebuild(btn.dataset.sex);
    btn.disabled = false;
  });

  // division filter
  $('divToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-div]');
    if (!btn) return;
    document.querySelectorAll('#divToggle button').forEach((b) => b.classList.toggle('active', b === btn));
    filterTree(btn.dataset.div);
  });

  // search
  const search = $('search');
  search.addEventListener('input', () => renderSearch(search.value));
  search.addEventListener('focus', () => renderSearch(search.value));
  search.addEventListener('keydown', (e) => {
    const box = $('searchResults');
    const items = [...box.querySelectorAll('.sr-item')];
    const cur = items.findIndex((el) => el.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      const next = (cur + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle('on', i === next));
      items[next].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const el = items[Math.max(0, cur)];
      if (el) { selectByBoneId(el.dataset.bone, true); box.hidden = true; search.blur(); }
    } else if (e.key === 'Escape') {
      box.hidden = true; search.blur();
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) $('searchResults').hidden = true;
  });

  // views
  document.querySelectorAll('.vbtn').forEach((b) =>
    b.addEventListener('click', () => setView(b.dataset.view)));

  // animation
  $('animSelect').addEventListener('change', (e) => {
    animator.setMode(e.target.value);
    $('animHint').textContent = MODES[e.target.value].hint;
  });
  $('playBtn').addEventListener('click', togglePlay);
  $('speed').addEventListener('input', (e) => {
    animator.speed = +e.target.value;
    $('speedOut').textContent = (+e.target.value).toFixed(2) + '×';
  });

  // explode
  $('explode').addEventListener('input', (e) => {
    state.explode = +e.target.value;
    $('explodeOut').textContent = e.target.value + '%';
    applyExplode();
  });

  // toggles
  $('softTissue').addEventListener('change', applyVisibility);
  $('showFloor').addEventListener('change', applyVisibility);
  $('showLabels').addEventListener('change', (e) => { state.showLabels = e.target.checked; });
  $('xray').addEventListener('change', (e) => applyXray(e.target.checked));

  // detail actions
  $('focusBtn').addEventListener('click', () => state.selected && focusOn(state.selected));
  $('isolateBtn').addEventListener('click', () => applyIsolate(!state.isolated));

  // quiz
  $('quizBtn').addEventListener('click', () => (state.quiz ? stopQuiz() : startQuiz()));
  $('quizClose').addEventListener('click', stopQuiz);
  $('quizSkip').addEventListener('click', revealAnswer);

  // help
  $('helpBtn').addEventListener('click', () => { $('helpModal').hidden = false; });
  $('helpClose').addEventListener('click', () => { $('helpModal').hidden = true; });
  $('helpModal').addEventListener('click', (e) => { if (e.target.id === 'helpModal') $('helpModal').hidden = true; });

  // keyboard
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    switch (e.key) {
      case '/': e.preventDefault(); $('search').focus(); break;
      case 'Escape':
        if (!$('helpModal').hidden) $('helpModal').hidden = true;
        else if (state.quiz) stopQuiz();
        else deselect();
        break;
      case ' ': e.preventDefault(); togglePlay(); break;
      case 'i': case 'I': applyIsolate(!state.isolated); break;
      case 'f': case 'F': if (state.selected) focusOn(state.selected); break;
      case 'x': case 'X': applyXray(!state.xray); break;
      case '1': setView('front'); break;
      case '2': setView('back'); break;
      case '3': setView('left'); break;
      case '4': setView('top'); break;
      case '5': setView('reset'); break;
    }
  });

  addEventListener('resize', resize);
}

function togglePlay() {
  animator.playing = !animator.playing;
  $('playBtn').textContent = animator.playing ? '⏸' : '▶';
}

function rotateFacts() {
  const el = $('fact');
  let i = Math.floor(Math.random() * BONE_FACTS.length);
  const show = () => {
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = BONE_FACTS[i % BONE_FACTS.length];
      el.style.opacity = 1;
      i++;
    }, 500);
  };
  show();
  setInterval(show, 11000);
}

/* ==================================================================
 * Loop
 * ================================================================== */

function resize() {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (camTween.active) {
    camTween.t += dt / camTween.dur;
    const u = Math.min(1, camTween.t);
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;   // easeInOutCubic
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTgt, camTween.toTgt, e);
    if (u >= 1) camTween.active = false;
  }

  if (state.skeleton) {
    animator.update(dt, state.skeleton.joints);
    // Animation overwrites joint transforms, so re-apply the explode offsets.
    if (state.explode > 0) applyExplode();
  }

  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

// Exposed for console inspection and for automated visual checks.
window.__osteo = { scene, camera, controls, state, animator, THREE, setView, focusOn, flyTo };

boot().then(() => tick()).catch((err) => {
  console.error(err);
  $('loaderMsg').textContent = 'Failed to initialise: ' + err.message;
  $('loaderMsg').style.color = '#e2594c';
});
