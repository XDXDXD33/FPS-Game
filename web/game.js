import * as THREE from "three";

const $ = (id) => document.getElementById(id);
const ui = {
  overlay: $("overlay"), title: $("overlay-title"), lead: $("overlay-lead"), copy: $("overlay-copy"),
  start: $("start-button"), status: $("mission-status"), kills: $("kill-count"),
  health: $("health-value"), healthFill: $("health-fill"), ammo: $("ammo-value"),
  crosshair: $("crosshair"), hit: $("hit-marker"), toast: $("toast"), loading: $("loading"),
  mobile: $("mobile-controls")
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91a8b8);
scene.fog = new THREE.Fog(0x91a8b8, 28, 74);
const camera = new THREE.PerspectiveCamera(78, innerWidth / innerHeight, 0.1, 120);
camera.rotation.order = "YXZ";
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$("game-root").prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xd6eaff, 0x34404a, 2.0));
const sun = new THREE.DirectionalLight(0xffe2bb, 3.0);
sun.position.set(-12, 25, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28; sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28;
scene.add(sun);

const materials = {
  floor: new THREE.MeshStandardMaterial({ color: 0x424f58, roughness: 0.92 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x596772, roughness: 0.86 }),
  cover: new THREE.MeshStandardMaterial({ color: 0x65747b, roughness: 0.78 }),
  stripe: new THREE.MeshStandardMaterial({ color: 0xb27a37, roughness: 0.7 }),
  enemy: new THREE.MeshStandardMaterial({ color: 0x9d2927, roughness: 0.62 }),
  enemyDark: new THREE.MeshStandardMaterial({ color: 0x252c35, roughness: 0.82 }),
  eye: new THREE.MeshStandardMaterial({ color: 0xff4e2e, emissive: 0xd5210c, emissiveIntensity: 2.2 }),
  gun: new THREE.MeshStandardMaterial({ color: 0x202a33, metalness: 0.72, roughness: 0.35 }),
  gunAccent: new THREE.MeshStandardMaterial({ color: 0x72e6e4, emissive: 0x145e60, emissiveIntensity: 0.6 })
};
const solids = [];
const enemies = [];
const raycaster = new THREE.Raycaster();
raycaster.far = 80;
const clock = new THREE.Clock();
const keys = new Set();
const player = { position: new THREE.Vector3(0, 1.65, 15), yaw: 0, pitch: 0, health: 100, ammo: 12, reserve: 72, kills: 0, active: false, over: false, reloading: false, fireTimer: 0, reloadTimer: 0, velocityY: 0, grounded: true };
let pointerLocked = false;
let toastTimer = 0;
let recoil = 0;
let walkingTime = 0;
let audioContext = null;

function addBox(name, x, y, z, sx, sy, sz, material, solid = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = sy > 0.3;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (solid) solids.push({ x, z, hx: sx / 2, hz: sz / 2, y: sy, mesh });
  return mesh;
}

function buildArena() {
  addBox("floor", 0, -0.5, 0, 42, 1, 42, materials.floor, false);
  addBox("north wall", 0, 2, -21, 42, 4, 0.8, materials.wall);
  addBox("south wall", 0, 2, 21, 42, 4, 0.8, materials.wall);
  addBox("west wall", -21, 2, 0, 0.8, 4, 42, materials.wall);
  addBox("east wall", 21, 2, 0, 0.8, 4, 42, materials.wall);
  const cover = [
    [-8, -7, 5, 2, 1.4], [7, -8, 1.5, 2, 6], [-3, 1, 6, 2, 1.4],
    [9, 4, 5, 2, 1.4], [-10, 9, 1.5, 2, 5], [1, 11, 6, 2, 1.4],
    [-14, -3, 2.2, 1.6, 2.2], [14, -12, 2.2, 1.6, 2.2],
    [13, 12, 2.2, 1.6, 2.2], [-3, -14, 2.2, 1.6, 2.2]
  ];
  for (const [x, z, sx, sy, sz] of cover) addBox("cover", x, sy / 2, z, sx, sy, sz, materials.cover);
  for (let i = 0; i < 7; i++) addBox("lane stripe", -15 + i * 5, 0.015, 0, 0.07, 0.025, 30, materials.stripe, false);

  const grid = new THREE.GridHelper(42, 42, 0x637c8b, 0x516672);
  grid.position.y = 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);

  for (let i = 0; i < 12; i++) {
    const lamp = new THREE.PointLight(0x7bd9e5, 1.6, 9, 2);
    lamp.position.set(i % 2 ? 19 : -19, 3, -17 + i * 3);
    scene.add(lamp);
  }
}

const weapon = new THREE.Group();
const weaponBody = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.18, 0.54), materials.gun);
weaponBody.position.set(0, 0, 0);
weapon.add(weaponBody);
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.3, 10), materials.gun);
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0, 0.025, -0.38);
weapon.add(barrel);
const sight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.11), materials.gunAccent);
sight.position.set(0, 0.11, -0.04);
weapon.add(sight);
const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.2, 0.12), materials.gun);
grip.position.set(0, -0.15, 0.12);
grip.rotation.x = -0.2;
weapon.add(grip);
weapon.position.set(0.34, -0.29, -0.57);
camera.add(weapon);
scene.add(camera);

function makeEnemy(x, z, index) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.72, 4, 8), materials.enemy);
  torso.position.y = 1.02;
  torso.castShadow = true;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), materials.enemyDark);
  head.position.y = 1.68;
  head.castShadow = true;
  group.add(head);
  const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.055, 0.055), materials.eye);
  eyes.position.set(0, 1.7, -0.215);
  group.add(eyes);
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.28), materials.enemyDark);
  shoulder.position.y = 1.28;
  group.add(shoulder);
  scene.add(group);
  enemies.push({ group, health: 100, speed: 1.4 + (index % 3) * 0.18, attackTimer: 0.6 + Math.random(), alive: true, phase: Math.random() * Math.PI * 2 });
}

function spawnEnemies() {
  for (const e of enemies) scene.remove(e.group);
  enemies.length = 0;
  const positions = [[-15,-14],[-7,-16],[2,-14],[14,-14],[-15,4],[15,1],[-7,14],[8,14]];
  positions.forEach(([x,z], i) => makeEnemy(x, z, i));
  player.kills = 0;
  updateHUD();
}

function updateHUD() {
  ui.health.textContent = String(player.health);
  ui.healthFill.style.width = player.health + "%";
  ui.healthFill.style.background = player.health <= 30 ? "linear-gradient(90deg,#ff5c64,#ff9b8e)" : "linear-gradient(90deg,#ffb454,#ffe0a4)";
  ui.ammo.innerHTML = player.ammo + ' <i>/</i> ' + player.reserve;
  ui.ammo.classList.toggle("low", player.ammo <= 3);
  ui.kills.textContent = "HOSTILES " + String(player.kills).padStart(2, "0") + " / 08";
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  toastTimer = 1.25;
}
function playTone(frequency = 150, duration = 0.06, type = "square", volume = 0.025) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = type; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional. */ }
}

function beginGame() {
  player.position.set(0, 1.65, 15);
  player.yaw = 0; player.pitch = 0; player.health = 100;
  player.ammo = 12; player.reserve = 72; player.kills = 0;
  player.velocityY = 0; player.grounded = true; player.active = true; player.over = false;
  player.reloading = false; player.reloadTimer = 0; player.fireTimer = 0;
  camera.position.copy(player.position);
  camera.rotation.set(0, 0, 0);
  spawnEnemies(); updateHUD();
  ui.overlay.classList.add("hidden");
  ui.status.textContent = "ENGAGEMENT ACTIVE";
  ui.mobile.style.display = coarsePointer ? "block" : "";
  if (!coarsePointer && renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
  showToast("MISSION START // ELIMINATE ALL HOSTILES");
  playTone(440, 0.12, "sine", 0.035);
}
function endGame(won) {
  player.active = false; player.over = true;
  if (document.pointerLockElement) document.exitPointerLock();
  ui.title.textContent = won ? "MISSION CLEAR" : "MISSION FAILED";
  ui.lead.textContent = won ? "ALL HOSTILES NEUTRALIZED" : "OPERATOR DOWN";
  ui.copy.textContent = (won ? "訓練場已清空。" : "生命值歸零。") + " 擊殺數：" + player.kills + " / 8。準備好後可以再次挑戰。";
  ui.start.innerHTML = '再次遊玩 <span>↗</span>';
  ui.overlay.classList.remove("hidden");
  ui.status.textContent = won ? "MISSION COMPLETE" : "MISSION FAILED";
  ui.mobile.style.display = "none";
  playTone(won ? 660 : 90, 0.28, won ? "sine" : "sawtooth", 0.04);
}

const coarsePointer = matchMedia("(pointer: coarse)").matches || innerWidth < 760;
function collides(x, z, radius = 0.34) {
  if (Math.abs(x) > 20.0 || Math.abs(z) > 20.0) return true;
  return solids.some(s => s.y > 1.1 && x + radius > s.x - s.hx && x - radius < s.x + s.hx && z + radius > s.z - s.hz && z - radius < s.z + s.hz);
}
function movePlayer(dx, dz) {
  const nx = player.position.x + dx;
  const nz = player.position.z + dz;
  if (!collides(nx, player.position.z)) player.position.x = nx;
  if (!collides(player.position.x, nz)) player.position.z = nz;
}
function shoot() {
  if (!player.active || player.reloading || player.fireTimer > 0) return;
  if (player.ammo <= 0) { reload(); return; }
  player.ammo--; player.fireTimer = 0.19; recoil = Math.min(0.09, recoil + 0.045);
  updateHUD(); playTone(105 + Math.random() * 35, 0.07, "sawtooth", 0.035);
  const from = camera.position.clone();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const targets = [];
  for (const e of enemies) if (e.alive) e.group.traverse(o => { if (o.isMesh) { o.userData.enemyOwner = e; targets.push(o); } });
  const hits = raycaster.intersectObjects([...targets, ...solids.map(s => s.mesh)], false);
  if (!hits.length) return;
  const hit = hits[0];
  const owner = hit.object.userData.enemyOwner;
  if (owner && owner.alive) {
    owner.health -= 34;
    ui.hit.classList.add("show");
    setTimeout(() => ui.hit.classList.remove("show"), 110);
    owner.group.scale.setScalar(0.98);
    setTimeout(() => { if (owner.alive) owner.group.scale.setScalar(1); }, 75);
    if (owner.health <= 0) {
      owner.alive = false;
      scene.remove(owner.group);
      player.kills++;
      updateHUD();
      showToast("TARGET ELIMINATED");
      playTone(520, 0.08, "triangle", 0.035);
      if (player.kills >= 8) endGame(true);
    }
  }
}
function reload() {
  if (!player.active || player.reloading || player.ammo >= 12 || player.reserve <= 0) return;
  player.reloading = true; player.reloadTimer = 1.15;
  showToast("RELOADING...");
  playTone(320, 0.07, "triangle", 0.02);
}
function damagePlayer(amount) {
  if (!player.active) return;
  player.health = Math.max(0, player.health - amount);
  updateHUD();
  if (player.health <= 0) endGame(false);
}

function update(dt) {
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.classList.remove("show"); }
  player.fireTimer = Math.max(0, player.fireTimer - dt);
  recoil = Math.max(0, recoil - dt * 0.45);
  if (!player.active) return;
  if (player.reloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      const count = Math.min(12 - player.ammo, player.reserve);
      player.ammo += count; player.reserve -= count; player.reloading = false;
      updateHUD(); showToast("MAGAZINE READY"); playTone(480, 0.06, "sine", 0.025);
    }
  }

  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  let moveX = 0, moveZ = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) { moveX += forward.x; moveZ += forward.z; }
  if (keys.has("KeyS") || keys.has("ArrowDown")) { moveX -= forward.x; moveZ -= forward.z; }
  if (keys.has("KeyA") || keys.has("ArrowLeft")) { moveX -= right.x; moveZ -= right.z; }
  if (keys.has("KeyD") || keys.has("ArrowRight")) { moveX += right.x; moveZ += right.z; }
  moveX += mobileMove.x * right.x + mobileMove.y * forward.x;
  moveZ += mobileMove.x * right.z + mobileMove.y * forward.z;
  const length = Math.hypot(moveX, moveZ);
  if (length > 0.01) {
    const speed = (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 7.8 : 5.2) * dt;
    movePlayer(moveX / Math.max(1, length) * speed, moveZ / Math.max(1, length) * speed);
    walkingTime += dt * 10;
  }
  player.velocityY -= 15 * dt;
  player.position.y += player.velocityY * dt;
  if (player.position.y <= 1.65) { player.position.y = 1.65; player.velocityY = 0; player.grounded = true; }
  camera.position.copy(player.position);
  camera.rotation.set(player.pitch + recoil, player.yaw, 0, "YXZ");
  weapon.position.y = -0.29 + (length > 0.01 ? Math.sin(walkingTime) * 0.012 : 0);
  weapon.position.x = 0.34 + (length > 0.01 ? Math.cos(walkingTime * 0.5) * 0.008 : 0);

  for (const e of enemies) {
    if (!e.alive) continue;
    e.attackTimer -= dt;
    const dx = player.position.x - e.group.position.x;
    const dz = player.position.z - e.group.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > 1.45) {
      const pace = e.speed * dt;
      const nx = e.group.position.x + dx / Math.max(distance, 0.001) * pace;
      const nz = e.group.position.z + dz / Math.max(distance, 0.001) * pace;
      if (!collides(nx, e.group.position.z, 0.38)) e.group.position.x = nx;
      if (!collides(e.group.position.x, nz, 0.38)) e.group.position.z = nz;
      e.group.rotation.y = Math.atan2(-dx, -dz);
    } else if (e.attackTimer <= 0) {
      damagePlayer(8);
      e.attackTimer = 1.05;
      showToast("INCOMING DAMAGE");
      playTone(80, 0.09, "sawtooth", 0.025);
    }
    e.group.position.y = Math.sin(clock.elapsedTime * 3 + e.phase) * 0.035;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  update(dt);
  renderer.render(scene, camera);
}
buildArena();
camera.position.copy(player.position);
ui.loading.classList.add("done");
animate();

ui.start.addEventListener("click", beginGame);
renderer.domElement.addEventListener("click", () => {
  if (player.active && !coarsePointer && document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock?.();
});
document.addEventListener("pointerlockchange", () => { pointerLocked = document.pointerLockElement === renderer.domElement; });
document.addEventListener("mousemove", e => {
  if (!player.active || coarsePointer || !pointerLocked) return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * 0.002, -1.35, 1.35);
});
document.addEventListener("keydown", e => {
  keys.add(e.code);
  if (["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
  if (!player.active || e.repeat) return;
  if (e.code === "KeyR") reload();
  if (e.code === "Space" && player.grounded) { player.velocityY = 5.1; player.grounded = false; }
  if (e.code === "Escape" && player.active) showToast("CLICK GAME TO RESUME MOUSE AIM");
});
document.addEventListener("keyup", e => keys.delete(e.code));
window.addEventListener("blur", () => keys.clear());
renderer.domElement.addEventListener("mousedown", e => { if (e.button === 0 && player.active && !coarsePointer) shoot(); });
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  renderer.setSize(innerWidth, innerHeight);
});

const mobileMove = { x: 0, y: 0 };
const stickZone = $("stick-zone"), stickBase = $("stick-base"), stickKnob = $("stick-knob");
let stickPointer = null;
function updateStick(e) {
  const r = stickBase.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy;
  const max = r.width * 0.34, length = Math.hypot(dx, dy);
  if (length > max) { dx = dx / length * max; dy = dy / length * max; }
  stickKnob.style.transform = "translate(" + dx + "px," + dy + "px)";
  mobileMove.x = dx / max;
  mobileMove.y = -dy / max;
}
stickZone.addEventListener("pointerdown", e => { stickPointer = e.pointerId; stickZone.setPointerCapture(e.pointerId); updateStick(e); });
stickZone.addEventListener("pointermove", e => { if (e.pointerId === stickPointer) updateStick(e); });
function resetStick() { stickPointer = null; mobileMove.x = 0; mobileMove.y = 0; stickKnob.style.transform = "translate(0,0)"; }
stickZone.addEventListener("pointerup", resetStick);
stickZone.addEventListener("pointercancel", resetStick);

const lookZone = $("look-zone");
let lookPointer = null, lastLookX = 0, lastLookY = 0;
lookZone.addEventListener("pointerdown", e => { lookPointer = e.pointerId; lastLookX = e.clientX; lastLookY = e.clientY; lookZone.setPointerCapture(e.pointerId); });
lookZone.addEventListener("pointermove", e => {
  if (e.pointerId !== lookPointer || !player.active) return;
  const dx = e.clientX - lastLookX, dy = e.clientY - lastLookY;
  lastLookX = e.clientX; lastLookY = e.clientY;
  player.yaw -= dx * 0.005;
  player.pitch = THREE.MathUtils.clamp(player.pitch - dy * 0.0045, -1.3, 1.3);
});
function releaseLook() { lookPointer = null; }
lookZone.addEventListener("pointerup", releaseLook);
lookZone.addEventListener("pointercancel", releaseLook);
$("fire-button").addEventListener("pointerdown", e => { e.preventDefault(); shoot(); });
$("reload-button").addEventListener("pointerdown", e => { e.preventDefault(); reload(); });
$("jump-button").addEventListener("pointerdown", e => { e.preventDefault(); if (player.active && player.grounded) { player.velocityY = 5.1; player.grounded = false; } });
