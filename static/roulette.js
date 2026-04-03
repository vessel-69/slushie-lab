/* ============================================================
   SLUSHIE LAB — roulette.js  v3.0
   Features: Wheel · Audio Ticks · Confetti · Spin Counter ·
             Keyboard Shortcut · Flavor Passport · Order History ·
             Quantum Mixer · Custom Flavors · Dynamic ::selection ·
             Flavor of the Day · Live Stats · Streak Counter ·
             Custom Cursor · Smart Redirect to /order
   ============================================================ */

"use strict";

// ── Storage Keys ─────────────────────────────────────────────
const KEY_PASSPORT = "slushielab_passport";
const KEY_ORDERS = "slushielab_orders";
const KEY_CUSTOM = "slushielab_custom";
const KEY_STREAK = "slushielab_streak";

// ── Default Flavors ──────────────────────────────────────────
const DEFAULT_FLAVORS = [
  { name: "Strawberry", color: "#FF3B6B", default: true },
  { name: "Blueberry", color: "#4F6EF7", default: true },
  { name: "Mango", color: "#FF9500", default: true },
  { name: "Lime", color: "#2DE88B", default: true },
  { name: "Grape", color: "#9B5CF6", default: true },
  { name: "Watermelon", color: "#FF4D80", default: true },
  { name: "Raspberry", color: "#FF006E", default: true },
  { name: "Peach", color: "#FFB347", default: true },
  { name: "Cherry", color: "#E0194B", default: true },
  { name: "Blue Razz", color: "#00AAFF", default: true },
];

function getAllFlavors() {
  return [...DEFAULT_FLAVORS, ...getCustomFlavors()];
}
function getCustomFlavors() {
  try {
    return JSON.parse(localStorage.getItem(KEY_CUSTOM) || "[]");
  } catch {
    return [];
  }
}

// ── Wheel State ───────────────────────────────────────────────
let flavors = getAllFlavors();
let numSegments = flavors.length;
let arc = (2 * Math.PI) / numSegments;
let currentAngle = -Math.PI / 2;
let isSpinning = false;
let hasSpun = false;
let spinCount = 0;
let quantity = 1;
let currentWinner = null;

// ── Canvas Setup ─────────────────────────────────────────────
const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
const CX = canvas.width / 2;
const CY = canvas.height / 2;
const R = CX - 5;

// ── Web Audio ─────────────────────────────────────────────────
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTick(freq = 600, vol = 0.07) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.025);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.03);
}

// ── Dynamic ::selection color ─────────────────────────────────
let selectionStyleEl = document.createElement("style");
document.head.appendChild(selectionStyleEl);

function updateSelectionColor(color) {
  selectionStyleEl.textContent = `
    ::selection { background: ${color}; color: #fff; }
    ::-moz-selection { background: ${color}; color: #fff; }
  `;
}

// ── Wheel Drawing ─────────────────────────────────────────────
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numSegments; i++) {
    const startAngle = currentAngle + i * arc;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = flavors[i].color;
    ctx.fill();

    // Depth gradient
    const grad = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R);
    grad.addColorStop(0, "rgba(0,0,0,0.3)");
    grad.addColorStop(0.6, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Segment border
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = "#161918";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = "right";
    ctx.font = '600 11.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 6;
    ctx.fillText(flavors[i].name, R - 16, 4.5);
    ctx.restore();
  }

  // Outer ring
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Tick marks
  const totalTicks = numSegments * 4;
  for (let i = 0; i < totalTicks; i++) {
    const angle = currentAngle + (i / totalTicks) * 2 * Math.PI;
    const isMain = i % 4 === 0;
    const len = isMain ? 11 : 5;
    ctx.beginPath();
    ctx.moveTo(
      CX + (R - 0.5) * Math.cos(angle),
      CY + (R - 0.5) * Math.sin(angle),
    );
    ctx.lineTo(
      CX + (R - len) * Math.cos(angle),
      CY + (R - len) * Math.sin(angle),
    );
    ctx.strokeStyle = isMain
      ? "rgba(255,255,255,0.5)"
      : "rgba(255,255,255,0.14)";
    ctx.lineWidth = isMain ? 2 : 1;
    ctx.stroke();
  }

  // Center cap
  ctx.beginPath();
  ctx.arc(CX, CY, 22, 0, 2 * Math.PI);
  ctx.fillStyle = "#161918";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
}

// ── Winning Segment ───────────────────────────────────────────
function getWinningIndex() {
  const ptr = (3 * Math.PI) / 2;
  let rel = (ptr - currentAngle) % (2 * Math.PI);
  if (rel < 0) rel += 2 * Math.PI;
  return Math.floor(rel / arc) % numSegments;
}

// ── Spin ──────────────────────────────────────────────────────
function spin() {
  if (isSpinning) return;
  ensureAudio();
  isSpinning = true;

  const btn = document.getElementById("spinBtn");
  btn.disabled = true;
  btn.classList.add("spinning");

  const totalRotation = Math.PI * 2 * (8 + Math.random() * 6);
  const duration = 4500 + Math.random() * 1500;
  const startAngle = currentAngle;
  const startTime = performance.now();

  let tickAccum = 0;
  let prevAngle = currentAngle;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }
  function dEaseOut(t) {
    return 4 * Math.pow(1 - t, 3);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    currentAngle = startAngle + totalRotation * easeOut(t);
    drawWheel();

    const delta = Math.abs(currentAngle - prevAngle);
    tickAccum += delta;
    if (tickAccum > arc / 3) {
      tickAccum = 0;
      const speed = dEaseOut(t);
      const normalized = Math.min(speed / 4, 1);
      const freq = 180 + normalized * 680;
      const vol = 0.03 + normalized * 0.06;
      playTick(freq, vol);
    }
    prevAngle = currentAngle;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      hasSpun = true;
      btn.classList.remove("spinning");

      const winner = flavors[getWinningIndex()];
      currentWinner = winner;

      // Spin counter
      spinCount++;
      const ctr = document.getElementById("spinCounter");
      ctr.textContent = `×${spinCount}`;
      ctr.classList.remove("hidden");

      btn.textContent = "SPIN AGAIN";
      btn.disabled = false;

      updateTheme(winner.color);
      updateSelectionColor(winner.color);
      launchConfetti(winner.color);
      saveSpinToPassport(winner);
      updateHistoryBadge();
      updateStreak();
      updateStats();
      showPopup(winner);
    }
  }

  requestAnimationFrame(animate);
}

// ── Dynamic Theme ─────────────────────────────────────────────
function hexToRgb(hex) {
  const c = hex.replace("#", "");
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

function updateTheme(color) {
  const { r, g, b } = hexToRgb(color);
  const root = document.documentElement;
  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},0.38)`);

  const glow = document.getElementById("bgGlow");
  glow.style.opacity = "0";
  setTimeout(() => {
    glow.style.background = `radial-gradient(ellipse 70% 45% at 50% 0%,
      rgba(${r},${g},${b},0.07) 0%, transparent 70%)`;
    glow.style.opacity = "1";
  }, 300);

  const wrap = document.getElementById("canvasWrap");
  wrap.style.boxShadow = `
    0 0 0 2px rgba(255,255,255,0.06),
    0 0 80px rgba(${r},${g},${b},0.45),
    0 20px 100px rgba(0,0,0,0.8)`;

  // Pointer color
  const pointer = document.getElementById("pointer");
  if (pointer) {
    pointer.style.borderTopColor = color;
    pointer.style.filter = `drop-shadow(0 0 12px ${color}) drop-shadow(0 2px 8px ${color})`;
  }

  // Cursor ring
  const ring = document.getElementById("cursorRing");
  if (ring) ring.style.borderColor = color;
  const dot = document.getElementById("cursorDot");
  if (dot) dot.style.background = color;

  // Footer brand
  const brandWord = document.querySelector(".footer-brand .brand-word");
  if (brandWord) {
    brandWord.style.color = color;
    brandWord.style.textShadow = `0 0 28px rgba(${r},${g},${b},0.5)`;
  }
}

// ── Confetti ──────────────────────────────────────────────────
const confettiCanvas = document.getElementById("confettiCanvas");
const cctx = confettiCanvas.getContext("2d");
let confettiParticles = [];
let confettiRAF = null;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
window.addEventListener("resize", resizeConfetti);

class ConfettiParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 14;
    this.vy = -(Math.random() * 16 + 6);
    this.gravity = 0.55;
    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 12;
    this.w = Math.random() * 10 + 5;
    this.h = Math.random() * 5 + 3;
    this.life = 1;
    this.decay = Math.random() * 0.014 + 0.008;
    this.shape = Math.random() < 0.4 ? "circle" : "rect";
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.99;
    this.rotation += this.rotSpeed;
    this.life -= this.decay;
  }
  draw(c) {
    c.save();
    c.globalAlpha = Math.max(this.life, 0);
    c.translate(this.x, this.y);
    c.rotate((this.rotation * Math.PI) / 180);
    c.fillStyle = this.color;
    if (this.shape === "circle") {
      c.beginPath();
      c.arc(0, 0, this.w / 2, 0, 2 * Math.PI);
      c.fill();
    } else {
      c.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    }
    c.restore();
  }
}

function launchConfetti(winnerColor) {
  const { r, g, b } = hexToRgb(winnerColor);
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const palette = [
    winnerColor,
    `rgba(255,255,255,0.9)`,
    `rgba(${r},${g},${b},0.65)`,
    `rgba(${Math.min(r + 70, 255)},${Math.min(g + 70, 255)},${Math.min(b + 70, 255)},0.85)`,
    "#ffffff",
  ];

  for (let i = 0; i < 160; i++) {
    confettiParticles.push(
      new ConfettiParticle(
        cx,
        cy,
        palette[Math.floor(Math.random() * palette.length)],
      ),
    );
  }
  if (!confettiRAF) animateConfetti();
}

function animateConfetti() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = confettiParticles.filter((p) => p.life > 0);
  confettiParticles.forEach((p) => {
    p.update();
    p.draw(cctx);
  });
  if (confettiParticles.length > 0) {
    confettiRAF = requestAnimationFrame(animateConfetti);
  } else {
    confettiRAF = null;
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ── Flavor of the Day ─────────────────────────────────────────
function initFOTD() {
  const all = getAllFlavors();
  const today = new Date().getDate();
  const fotd = all[today % all.length];

  const banner = document.getElementById("fotdBanner");
  const dot = document.getElementById("fotdDot");
  const name = document.getElementById("fotdName");
  if (!banner || !dot || !name) return;

  dot.style.background = fotd.color;
  dot.style.boxShadow = `0 0 10px ${fotd.color}`;
  name.textContent = fotd.name;
  name.style.color = fotd.color;
  banner.style.borderColor = fotd.color + "44";
}

// ── Live Stats ────────────────────────────────────────────────
function updateStats() {
  const spins = getPassport().length;
  const orders = getOrders().length;
  const flavNum = getAllFlavors().length;
  const streak = getStreakCount();

  const el = (id) => document.getElementById(id);
  if (el("statSpins")) el("statSpins").textContent = spins;
  if (el("statOrders")) el("statOrders").textContent = orders;
  if (el("statFlavors")) el("statFlavors").textContent = flavNum;
  if (el("statStreak")) el("statStreak").textContent = streak;
}

// ── Streak ────────────────────────────────────────────────────
function getStreakCount() {
  try {
    return parseInt(localStorage.getItem(KEY_STREAK) || "0");
  } catch {
    return 0;
  }
}
function updateStreak() {
  const n = getStreakCount() + 1;
  localStorage.setItem(KEY_STREAK, n);
}

// ── Flavor Passport ───────────────────────────────────────────
function getPassport() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PASSPORT) || "[]");
  } catch {
    return [];
  }
}
function setPassport(data) {
  localStorage.setItem(KEY_PASSPORT, JSON.stringify(data));
}

function saveSpinToPassport(flavor) {
  const log = getPassport();
  log.unshift({
    id: Date.now(),
    name: flavor.name,
    color: flavor.color,
    ts: new Date().toISOString(),
  });
  if (log.length > 100) log.pop();
  setPassport(log);
  renderPassport();
}

function renderPassport() {
  const log = getPassport();
  const list = document.getElementById("passportList");
  if (!list) return;

  if (!log.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🌀</span><p>No spins yet.<br />Give the wheel a go.</p></div>`;
    return;
  }
  list.innerHTML = log
    .map(
      (entry) => `
    <div class="history-entry">
      <div class="entry-dot" style="background:${entry.color};color:${entry.color}"></div>
      <div class="entry-body">
        <div class="entry-name" style="color:${entry.color}">${entry.name}</div>
        <div class="entry-meta">${formatTs(entry.ts)}</div>
      </div>
    </div>`,
    )
    .join("");
}

function clearPassport() {
  if (!confirm("Clear your entire spin history?")) return;
  setPassport([]);
  renderPassport();
  updateHistoryBadge();
  updateStats();
}

// ── Order History ─────────────────────────────────────────────
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(KEY_ORDERS) || "[]");
  } catch {
    return [];
  }
}
function setOrders(data) {
  localStorage.setItem(KEY_ORDERS, JSON.stringify(data));
}

function saveOrder(flavor, qty) {
  const orders = getOrders();
  orders.unshift({
    id: Date.now(),
    name: flavor.name,
    color: flavor.color,
    qty,
    ts: new Date().toISOString(),
  });
  if (orders.length > 100) orders.pop();
  setOrders(orders);
  renderOrders();
  updateOrdersBadge();
  updateStats();
}

function renderOrders() {
  const orders = getOrders();
  const list = document.getElementById("orderList");
  if (!list) return;

  if (!orders.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🧃</span><p>No orders yet.<br />Spin and place one.</p></div>`;
    return;
  }
  list.innerHTML = orders
    .map(
      (o) => `
    <div class="history-entry">
      <div class="entry-dot" style="background:${o.color};color:${o.color}"></div>
      <div class="entry-body">
        <div class="entry-name" style="color:${o.color}">${o.name}</div>
        <div class="entry-meta">${formatTs(o.ts)}</div>
      </div>
      <div class="entry-qty">×${o.qty}</div>
    </div>`,
    )
    .join("");
}

function clearOrders() {
  if (!confirm("Clear your entire order history?")) return;
  setOrders([]);
  renderOrders();
  updateOrdersBadge();
  updateStats();
}

// ── Badges ────────────────────────────────────────────────────
function updateHistoryBadge() {
  const badge = document.getElementById("historyBadge");
  if (!badge) return;
  const count = getPassport().length;
  badge.textContent = count > 99 ? "99+" : count;
  badge.classList.toggle("hidden", count === 0);
}

function updateOrdersBadge() {
  const badge = document.getElementById("ordersBadge");
  if (!badge) return;
  const count = getOrders().length;
  badge.textContent = count > 99 ? "99+" : count;
  badge.classList.toggle("hidden", count === 0);
}

// ── Drawer ────────────────────────────────────────────────────
function openDrawer() {
  document.getElementById("historyDrawer").classList.add("open");
  document.getElementById("drawerOverlay").classList.add("active");
  document.getElementById("historyDrawer").setAttribute("aria-hidden", "false");
  renderPassport();
  renderOrders();
}
function closeDrawer() {
  document.getElementById("historyDrawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("active");
  document.getElementById("historyDrawer").setAttribute("aria-hidden", "true");
}
function switchTab(tab) {
  document
    .querySelectorAll(".drawer-tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.toggle("active", c.id === `tab-${tab}`));
}

// ── Quantum Mixer ─────────────────────────────────────────────
function populateMixerSelects() {
  const all = getAllFlavors();
  const opts = all
    .map((f, i) => `<option value="${i}">${f.name}</option>`)
    .join("");
  const a = document.getElementById("mixerA");
  const b = document.getElementById("mixerB");
  if (!a || !b) return;
  a.innerHTML = opts;
  b.innerHTML = opts;
  a.value = "0";
  b.value = "1";
  syncDots();
}

function syncDots() {
  const all = getAllFlavors();
  const a = document.getElementById("mixerA");
  const b = document.getElementById("mixerB");
  const dA = document.getElementById("dotA");
  const dB = document.getElementById("dotB");
  if (!a || !b || !dA || !dB) return;
  const fa = all[parseInt(a.value)];
  const fb = all[parseInt(b.value)];
  if (fa) {
    dA.style.background = fa.color;
    dA.style.boxShadow = `0 0 8px ${fa.color}`;
  }
  if (fb) {
    dB.style.background = fb.color;
    dB.style.boxShadow = `0 0 8px ${fb.color}`;
  }
}

function blendColors(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round((a.r + b.r) / 2);
  const g = Math.round((a.g + b.g) / 2);
  const bb = Math.round((a.b + b.b) / 2);
  return "#" + [r, g, bb].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function blendNames(nameA, nameB) {
  const a = nameA.replace(/\s+/g, "");
  const b = nameB.replace(/\s+/g, "");
  const cut = Math.ceil(a.length / 2);
  const tail = b.slice(Math.floor(b.length / 2));
  const raw = a.slice(0, cut) + tail;
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function runQuantumMix() {
  const all = getAllFlavors();
  const idxA = parseInt(document.getElementById("mixerA").value);
  const idxB = parseInt(document.getElementById("mixerB").value);
  const fa = all[idxA];
  const fb = all[idxB];
  if (!fa || !fb) return;

  const btn = document.getElementById("mixBtn");
  btn.disabled = true;

  const orbA = document.getElementById("orbA");
  const orbB = document.getElementById("orbB");
  orbA.style.background = fa.color;
  orbA.style.boxShadow = `0 0 20px ${fa.color}`;
  orbB.style.background = fb.color;
  orbB.style.boxShadow = `0 0 20px ${fb.color}`;

  document.getElementById("mixResult").classList.add("hidden");
  document.getElementById("mixLoading").classList.remove("hidden");

  setTimeout(() => {
    const blendedColor = blendColors(fa.color, fb.color);
    const blendedName = blendNames(fa.name, fb.name);

    document.getElementById("mixLoading").classList.add("hidden");

    const swatch = document.getElementById("mixSwatch");
    const swatchGlow = document.getElementById("mixSwatchGlow");
    const nameEl = document.getElementById("mixName");
    const hexEl = document.getElementById("mixHex");
    const saveBtn = document.getElementById("mixSaveBtn");

    swatch.style.background = blendedColor;
    swatchGlow.style.background = blendedColor;
    nameEl.textContent = blendedName;
    nameEl.style.color = blendedColor;
    hexEl.textContent = blendedColor.toUpperCase();
    saveBtn.disabled = false;
    saveBtn.dataset.name = blendedName;
    saveBtn.dataset.color = blendedColor;
    saveBtn.textContent = "Save to Lab ✦";

    document.getElementById("mixResult").classList.remove("hidden");
    btn.disabled = false;

    // Accent flash
    const { r, g, b } = hexToRgb(blendedColor);
    document.documentElement.style.setProperty("--accent", blendedColor);
    document.documentElement.style.setProperty(
      "--accent-glow",
      `rgba(${r},${g},${b},0.38)`,
    );
    updateSelectionColor(blendedColor);
  }, 1600);
}

function saveBlendToLab() {
  const btn = document.getElementById("mixSaveBtn");
  const name = btn.dataset.name;
  const color = btn.dataset.color;
  if (!name || !color) return;

  const custom = getCustomFlavors();
  if (custom.some((f) => f.name === name)) {
    btn.textContent = "Already saved ✓";
    btn.disabled = true;
    return;
  }
  custom.push({ name, color, default: false });
  localStorage.setItem(KEY_CUSTOM, JSON.stringify(custom));

  reloadFlavors();
  populateMixerSelects();
  updateStats();

  btn.textContent = "Saved to Lab ✓";
  btn.disabled = true;
}

function openQuantum() {
  populateMixerSelects();
  document.getElementById("quantumModal").classList.add("active");
  document.getElementById("quantumOverlay").classList.add("active");
  document.getElementById("quantumModal").setAttribute("aria-hidden", "false");
  document.getElementById("mixResult").classList.add("hidden");
  document.getElementById("mixLoading").classList.add("hidden");
  document.getElementById("mixBtn").disabled = false;
}
function closeQuantum() {
  document.getElementById("quantumModal").classList.remove("active");
  document.getElementById("quantumOverlay").classList.remove("active");
  document.getElementById("quantumModal").setAttribute("aria-hidden", "true");
}

// ── Popup ─────────────────────────────────────────────────────
function showPopup(flavor) {
  quantity = 1;

  document.getElementById("orderForm").innerHTML = `
    <div class="divider"></div>
    <div class="qty-row">
      <span class="qty-label">Quantity</span>
      <div class="qty-controls">
        <button class="qty-btn" onclick="updateQuantity(-1)" aria-label="Decrease">−</button>
        <span id="qtyDisplay" class="qty-num">1</span>
        <button class="qty-btn" onclick="updateQuantity(1)" aria-label="Increase">+</button>
      </div>
    </div>
    <button class="order-btn" id="orderBtn" onclick="placeOrder()">Place Order</button>
  `;

  const flavorEl = document.getElementById("winnerFlavor");
  flavorEl.textContent = flavor.name;
  flavorEl.style.color = flavor.color;
  flavorEl.style.textShadow = `0 0 40px ${flavor.color}55`;

  const orderBtn = document.getElementById("orderBtn");
  if (orderBtn) {
    orderBtn.style.background = flavor.color;
    orderBtn.style.boxShadow = `0 4px 28px ${flavor.color}55`;
  }

  document.getElementById("overlay").classList.add("active");
  requestAnimationFrame(() => {
    document.getElementById("popup").classList.add("active");
    document.getElementById("popup").setAttribute("aria-hidden", "false");
  });
}

function closePopup() {
  document.getElementById("popup").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
  document.getElementById("popup").setAttribute("aria-hidden", "true");
}

function updateQuantity(delta) {
  quantity = Math.max(1, Math.min(99, quantity + delta));
  const el = document.getElementById("qtyDisplay");
  if (el) el.textContent = quantity;
}

function placeOrder() {
  if (!currentWinner) return;
  saveOrder(currentWinner, quantity);

  // Show confirmed state then redirect
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  document.getElementById("orderForm").innerHTML = `
    <div class="order-confirmed">
      <span class="check-icon">✓</span>
      <p class="confirmed-msg">Order confirmed</p>
      <p class="confirmed-detail" style="color:${accent}">
        ${quantity} × ${currentWinner.name} Slushie
      </p>
    </div>
  `;

  // Redirect to order confirmation page after brief delay
  const flavorName = encodeURIComponent(currentWinner.name);
  const flavorColor = encodeURIComponent(currentWinner.color);
  const qty = quantity;
  setTimeout(() => {
    window.location.href = `/order?flavor=${flavorName}&color=${flavorColor}&qty=${qty}`;
  }, 1200);
}

// ── Reload flavors ────────────────────────────────────────────
function reloadFlavors() {
  flavors = getAllFlavors();
  numSegments = flavors.length;
  arc = (2 * Math.PI) / numSegments;
  drawWheel();
}

// ── Timestamp formatter ───────────────────────────────────────
function formatTs(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Custom Cursor ─────────────────────────────────────────────
(function initCursor() {
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  let mx = -100,
    my = -100;
  let rx = -100,
    ry = -100;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });

  // Ring follows with lag
  function animRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(animRing);
  }
  animRing();

  // Hover expand
  document
    .querySelectorAll("button, a, .flavor-item, .icon-btn")
    .forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
    });
})();

// ── Keyboard Shortcuts ────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
    spin();
  }
  if (e.code === "Escape") {
    closePopup();
    closeDrawer();
    closeQuantum();
  }
  // H = history, Q = quantum mixer
  if (e.code === "KeyH" && e.target === document.body) openDrawer();
  if (e.code === "KeyQ" && e.target === document.body) openQuantum();
});

// ── Wire up header buttons ────────────────────────────────────
document.getElementById("historyToggle").addEventListener("click", openDrawer);
document.getElementById("quantumToggle").addEventListener("click", openQuantum);

const mxA = document.getElementById("mixerA");
const mxB = document.getElementById("mixerB");
if (mxA) mxA.addEventListener("change", syncDots);
if (mxB) mxB.addEventListener("change", syncDots);

// ── Init ──────────────────────────────────────────────────────
document.getElementById("spinBtn").addEventListener("click", spin);
updateHistoryBadge();
updateOrdersBadge();
renderPassport();
renderOrders();
drawWheel();
initFOTD();
updateStats();
