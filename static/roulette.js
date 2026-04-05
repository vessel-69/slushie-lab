/* ============================================================
   SLUSHIE LAB — roulette.js  v4.0
   ============================================================ */
"use strict";

// ── Storage Keys ─────────────────────────────────────────────
const KEY_PASSPORT = "slushielab_passport";
const KEY_ORDERS = "slushielab_orders";
const KEY_CUSTOM = "slushielab_custom";
const KEY_STREAK = "slushielab_streak";
const KEY_ACTIVE_COLOR = "slushielab_active_color";
const KEY_ACTIVE_NAME = "slushielab_active_name";

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

// ── Active color persistence (survives page nav) ───────────────
// sessionStorage — cleared automatically when the tab/window closes,
// but survives same-tab navigation (ORDER AGAIN → home still works).
function getActiveColor() {
  return sessionStorage.getItem(KEY_ACTIVE_COLOR) || "#ff2d2d";
}
function getActiveName() {
  return sessionStorage.getItem(KEY_ACTIVE_NAME) || null;
}
function setActiveColor(color, name) {
  sessionStorage.setItem(KEY_ACTIVE_COLOR, color);
  if (name) sessionStorage.setItem(KEY_ACTIVE_NAME, name);
}

// ── Wheel State ───────────────────────────────────────────────
let flavors = getAllFlavors();
let numSegments = flavors.length;
let arc = (2 * Math.PI) / numSegments;
let currentAngle = -Math.PI / 2;
let isSpinning = false;
let spinCount = 0;
let quantity = 1;
let currentWinner = null;

// ── Canvas ───────────────────────────────────────────────────
const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
const CX = canvas.width / 2,
  CY = canvas.height / 2,
  R = CX - 5;

// ── Audio ─────────────────────────────────────────────────────
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playTick(freq = 600, vol = 0.07) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator(),
    gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.025);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.03);
}

// ── Selection color ───────────────────────────────────────────
const selEl = document.createElement("style");
document.head.appendChild(selEl);
function updateSelectionColor(color) {
  selEl.textContent = `::selection{background:${color};color:#fff}::-moz-selection{background:${color};color:#fff}`;
}

// ── Draw wheel ────────────────────────────────────────────────
function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < numSegments; i++) {
    const s = currentAngle + i * arc,
      e = s + arc;
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, s, e);
    ctx.closePath();
    ctx.fillStyle = flavors[i].color;
    ctx.fill();

    const g = ctx.createRadialGradient(CX, CY, R * 0.1, CX, CY, R);
    g.addColorStop(0, "rgba(0,0,0,0.3)");
    g.addColorStop(0.6, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, s, e);
    ctx.closePath();
    ctx.strokeStyle = "#161918";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(s + arc / 2);
    ctx.textAlign = "right";
    ctx.font = '600 11.5px "IBM Plex Mono",monospace';
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 6;
    ctx.fillText(flavors[i].name, R - 16, 4.5);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 3;
  ctx.stroke();

  const tt = numSegments * 4;
  for (let i = 0; i < tt; i++) {
    const a = currentAngle + (i / tt) * 2 * Math.PI,
      m = i % 4 === 0,
      l = m ? 11 : 5;
    ctx.beginPath();
    ctx.moveTo(CX + (R - 0.5) * Math.cos(a), CY + (R - 0.5) * Math.sin(a));
    ctx.lineTo(CX + (R - l) * Math.cos(a), CY + (R - l) * Math.sin(a));
    ctx.strokeStyle = m ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.14)";
    ctx.lineWidth = m ? 2 : 1;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(CX, CY, 22, 0, 2 * Math.PI);
  ctx.fillStyle = "#161918";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fill();
}

function getWinningIndex() {
  let rel = ((3 * Math.PI) / 2 - currentAngle) % (2 * Math.PI);
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

  const totalRot = Math.PI * 2 * (8 + Math.random() * 6);
  const dur = 4500 + Math.random() * 1500;
  const start = currentAngle,
    t0 = performance.now();
  let tickAccum = 0,
    prev = currentAngle;

  const easeOut = (t) => 1 - Math.pow(1 - t, 4);
  const dEaseOut = (t) => 4 * Math.pow(1 - t, 3);

  function animate(now) {
    const t = Math.min((now - t0) / dur, 1);
    currentAngle = start + totalRot * easeOut(t);
    drawWheel();
    tickAccum += Math.abs(currentAngle - prev);
    if (tickAccum > arc / 3) {
      tickAccum = 0;
      const n = Math.min(dEaseOut(t) / 4, 1);
      playTick(180 + n * 680, 0.03 + n * 0.06);
    }
    prev = currentAngle;
    if (t < 1) {
      requestAnimationFrame(animate);
      return;
    }

    isSpinning = false;
    btn.classList.remove("spinning");
    const winner = flavors[getWinningIndex()];
    currentWinner = winner;
    spinCount++;

    const ctr = document.getElementById("spinCounter");
    ctr.textContent = `×${spinCount}`;
    ctr.classList.remove("hidden");
    btn.textContent = "SPIN AGAIN";
    btn.disabled = false;

    // Persist color before anything else
    setActiveColor(winner.color, winner.name);
    applyThemeFull(winner.color);
    launchConfetti(winner.color);
    saveSpinToPassport(winner);
    updateHistoryBadge();
    updateStreak();
    updateStats();
    showPopup(winner);
  }
  requestAnimationFrame(animate);
}

// ── Theme ─────────────────────────────────────────────────────
function hexToRgb(hex) {
  const c = hex.replace("#", "");
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

function applyThemeFull(color) {
  const { r, g, b } = hexToRgb(color);
  const root = document.documentElement;
  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},0.38)`);
  updateSelectionColor(color);

  const glow = document.getElementById("bgGlow");
  if (glow) {
    glow.style.opacity = "0";
    setTimeout(() => {
      glow.style.background = `radial-gradient(ellipse 70% 45% at 50% 0%,rgba(${r},${g},${b},0.07) 0%,transparent 70%)`;
      glow.style.opacity = "1";
    }, 300);
  }

  const wrap = document.getElementById("canvasWrap");
  if (wrap)
    wrap.style.boxShadow = `0 0 0 2px rgba(255,255,255,0.06),0 0 80px rgba(${r},${g},${b},0.45),0 20px 100px rgba(0,0,0,0.8)`;

  const pointer = document.getElementById("pointer");
  if (pointer) {
    pointer.style.borderTopColor = color;
    pointer.style.filter = `drop-shadow(0 0 12px ${color}) drop-shadow(0 2px 8px ${color})`;
  }

  const ring = document.getElementById("cursorRing");
  if (ring) ring.style.borderColor = color;
  const dot = document.getElementById("cursorDot");
  if (dot) dot.style.background = color;

  // Footer brand
  const bw = document.querySelector(".footer-brand .brand-word");
  if (bw) {
    bw.style.color = color;
    bw.style.textShadow = `0 0 28px rgba(${r},${g},${b},0.5)`;
  }

  // Header brand
  const hb = document.querySelector("header .brand");
  if (hb) {
    hb.style.color = color;
    hb.style.textShadow = `0 0 24px rgba(${r},${g},${b},0.55)`;
  }

  // Icon buttons color-burn
  applyIconBtnColor(color, r, g, b);
}

function applyIconBtnColor(color, r, g, b) {
  let sheet = document.getElementById("_iconBtnSheet");
  if (!sheet) {
    sheet = document.createElement("style");
    sheet.id = "_iconBtnSheet";
    document.head.appendChild(sheet);
  }
  sheet.textContent = `
    .icon-btn {
      border-color: rgba(${r},${g},${b},0.5) !important;
      box-shadow: 0 0 12px rgba(${r},${g},${b},0.22), inset 0 0 14px rgba(${r},${g},${b},0.08);
    }
    .icon-btn svg { color: rgba(${r},${g},${b},0.9); stroke: rgba(${r},${g},${b},0.9); }
    .icon-btn:hover {
      background: rgba(${r},${g},${b},0.16) !important;
      border-color: ${color} !important;
      box-shadow: 0 0 28px rgba(${r},${g},${b},0.5), inset 0 0 22px rgba(${r},${g},${b},0.12) !important;
    }
    .icon-btn:hover svg { color: ${color}; stroke: ${color}; }
    .icon-badge { background: ${color} !important; }
    .nav-lab { color: ${color} !important; }
    .drawer-tab.active { border-bottom-color: ${color} !important; }
    .tab-badge { background: ${color} !important; }
    .mix-btn { background: ${color} !important; box-shadow: 0 4px 28px rgba(${r},${g},${b},0.5) !important; }
    .add-btn  { background: ${color} !important; box-shadow: 0 4px 24px rgba(${r},${g},${b},0.45) !important; }
  `;
}

// ── Confetti ──────────────────────────────────────────────────
const confettiCanvas = document.getElementById("confettiCanvas");
const cctx = confettiCanvas.getContext("2d");
let particles = [],
  cRAF = null;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfetti();
window.addEventListener("resize", resizeConfetti);

class CP {
  constructor(x, y, color) {
    Object.assign(this, {
      x,
      y,
      color,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 16 + 6),
      gravity: 0.55,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      life: 1,
      decay: Math.random() * 0.014 + 0.008,
      shape: Math.random() < 0.4 ? "circle" : "rect",
    });
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
    } else c.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    c.restore();
  }
}

function launchConfetti(wc) {
  const { r, g, b } = hexToRgb(wc);
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2,
    cy = rect.top + rect.height / 2;
  const pal = [
    wc,
    `rgba(255,255,255,0.9)`,
    `rgba(${r},${g},${b},0.65)`,
    `rgba(${Math.min(r + 70, 255)},${Math.min(g + 70, 255)},${Math.min(b + 70, 255)},0.85)`,
    "#fff",
  ];
  for (let i = 0; i < 160; i++)
    particles.push(new CP(cx, cy, pal[Math.floor(Math.random() * pal.length)]));
  if (!cRAF) animConfetti();
}

function animConfetti() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => {
    p.update();
    p.draw(cctx);
  });
  if (particles.length > 0) {
    cRAF = requestAnimationFrame(animConfetti);
  } else {
    cRAF = null;
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ── Flavor of the Day ─────────────────────────────────────────
// Seed: full date (YYYY + dayOfYear) cycles through ALL flavors including custom
function getFOTD() {
  const all = getAllFlavors(),
    now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const doy = Math.floor((now - start) / 86400000);
  return all[(now.getFullYear() * 1000 + doy) % all.length];
}

let fotdFlavor = null;

function initFOTD() {
  fotdFlavor = getFOTD();
  const banner = document.getElementById("fotdBanner");
  const dot = document.getElementById("fotdDot");
  const name = document.getElementById("fotdName");
  if (!banner || !dot || !name) return;

  dot.style.background = fotdFlavor.color;
  dot.style.boxShadow = `0 0 10px ${fotdFlavor.color}`;
  name.textContent = fotdFlavor.name;
  name.style.color = fotdFlavor.color;
  banner.style.borderColor = fotdFlavor.color + "44";
  banner.style.cursor = "pointer";
  banner.title = `Order today's pick — ${fotdFlavor.name}`;

  // Click opens order popup for today's flavor
  banner.addEventListener("click", () => {
    currentWinner = fotdFlavor;
    setActiveColor(fotdFlavor.color, fotdFlavor.name);
    applyThemeFull(fotdFlavor.color);
    showPopup(fotdFlavor);
  });
}

// ── Stats ─────────────────────────────────────────────────────
function updateStats() {
  const el = (id) => document.getElementById(id);
  if (el("statSpins")) el("statSpins").textContent = getPassport().length;
  if (el("statOrders")) el("statOrders").textContent = getOrders().length;
  if (el("statFlavors")) el("statFlavors").textContent = getAllFlavors().length;
  if (el("statStreak")) el("statStreak").textContent = getStreakCount();
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
  localStorage.setItem(KEY_STREAK, getStreakCount() + 1);
}

// ── Passport ─────────────────────────────────────────────────
function getPassport() {
  try {
    return JSON.parse(localStorage.getItem(KEY_PASSPORT) || "[]");
  } catch {
    return [];
  }
}
function setPassport(d) {
  localStorage.setItem(KEY_PASSPORT, JSON.stringify(d));
}

function saveSpinToPassport(f) {
  const log = getPassport();
  log.unshift({
    id: Date.now(),
    name: f.name,
    color: f.color,
    ts: new Date().toISOString(),
  });
  if (log.length > 100) log.pop();
  setPassport(log);
  renderPassport();
}

function renderPassport() {
  const log = getPassport(),
    list = document.getElementById("passportList");
  if (!list) return;
  if (!log.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🌀</span><p>No spins yet.<br/>Give the wheel a go.</p></div>`;
    return;
  }
  list.innerHTML = log
    .map(
      (e) => `
    <div class="history-entry">
      <div class="entry-dot" style="background:${e.color};color:${e.color}"></div>
      <div class="entry-body">
        <div class="entry-name" style="color:${e.color}">${e.name}</div>
        <div class="entry-meta">${formatTs(e.ts)}</div>
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

// ── Orders ────────────────────────────────────────────────────
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(KEY_ORDERS) || "[]");
  } catch {
    return [];
  }
}
function setOrders(d) {
  localStorage.setItem(KEY_ORDERS, JSON.stringify(d));
}

function saveOrder(f, qty) {
  const o = getOrders();
  o.unshift({
    id: Date.now(),
    name: f.name,
    color: f.color,
    qty,
    ts: new Date().toISOString(),
  });
  if (o.length > 100) o.pop();
  setOrders(o);
  renderOrders();
  updateOrdersBadge();
  updateStats();
}

function renderOrders() {
  const o = getOrders(),
    list = document.getElementById("orderList");
  if (!list) return;
  if (!o.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">🧃</span><p>No orders yet.<br/>Spin and place one.</p></div>`;
    return;
  }
  list.innerHTML = o
    .map(
      (r) => `
    <div class="history-entry">
      <div class="entry-dot" style="background:${r.color};color:${r.color}"></div>
      <div class="entry-body">
        <div class="entry-name" style="color:${r.color}">${r.name}</div>
        <div class="entry-meta">${formatTs(r.ts)}</div>
      </div>
      <div class="entry-qty">×${r.qty}</div>
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
  const b = document.getElementById("historyBadge");
  if (!b) return;
  const n = getPassport().length;
  b.textContent = n > 99 ? "99+" : n;
  b.classList.toggle("hidden", n === 0);
}
function updateOrdersBadge() {
  const b = document.getElementById("ordersBadge");
  if (!b) return;
  const n = getOrders().length;
  b.textContent = n > 99 ? "99+" : n;
  b.classList.toggle("hidden", n === 0);
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
  const a = document.getElementById("mixerA"),
    b = document.getElementById("mixerB");
  if (!a || !b) return;
  a.innerHTML = opts;
  b.innerHTML = opts;
  a.value = "0";
  b.value = "1";
  syncDots();
}

function syncDots() {
  const all = getAllFlavors();
  const a = document.getElementById("mixerA"),
    b = document.getElementById("mixerB");
  const dA = document.getElementById("dotA"),
    dB = document.getElementById("dotB");
  if (!a || !b || !dA || !dB) return;
  const fa = all[parseInt(a.value)],
    fb = all[parseInt(b.value)];
  if (fa) {
    dA.style.background = fa.color;
    dA.style.boxShadow = `0 0 8px ${fa.color}`;
  }
  if (fb) {
    dB.style.background = fb.color;
    dB.style.boxShadow = `0 0 8px ${fb.color}`;
  }
}

function blendColors(hA, hB) {
  const a = hexToRgb(hA),
    b = hexToRgb(hB);
  return (
    "#" +
    [
      Math.round((a.r + b.r) / 2),
      Math.round((a.g + b.g) / 2),
      Math.round((a.b + b.b) / 2),
    ]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}
function blendNames(nA, nB) {
  const a = nA.replace(/\s+/g, ""),
    b = nB.replace(/\s+/g, "");
  const raw =
    a.slice(0, Math.ceil(a.length / 2)) + b.slice(Math.floor(b.length / 2));
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

let blendedWinner = null,
  mixQty = 1;

function runQuantumMix() {
  const all = getAllFlavors();
  const fa = all[parseInt(document.getElementById("mixerA").value)];
  const fb = all[parseInt(document.getElementById("mixerB").value)];
  if (!fa || !fb) return;

  document.getElementById("mixBtn").disabled = true;
  const oA = document.getElementById("orbA"),
    oB = document.getElementById("orbB");
  oA.style.background = fa.color;
  oA.style.boxShadow = `0 0 20px ${fa.color}`;
  oB.style.background = fb.color;
  oB.style.boxShadow = `0 0 20px ${fb.color}`;
  document.getElementById("mixResult").classList.add("hidden");
  document.getElementById("mixLoading").classList.remove("hidden");

  setTimeout(() => {
    const bc = blendColors(fa.color, fb.color),
      bn = blendNames(fa.name, fb.name);
    blendedWinner = { name: bn, color: bc };
    mixQty = 1;
    document.getElementById("mixLoading").classList.add("hidden");
    document.getElementById("mixSwatch").style.background = bc;
    document.getElementById("mixSwatchGlow").style.background = bc;
    document.getElementById("mixName").textContent = bn;
    document.getElementById("mixName").style.color = bc;
    document.getElementById("mixHex").textContent = bc.toUpperCase();

    const sb = document.getElementById("mixSaveBtn");
    sb.disabled = false;
    sb.dataset.name = bn;
    sb.dataset.color = bc;
    sb.textContent = "Save to Lab ✦";

    // Order section
    const os = document.getElementById("mixOrderSection");
    if (os) {
      os.classList.remove("hidden");
      os.style.borderColor = bc + "55";
      const ob = document.getElementById("mixOrderBtn");
      if (ob) {
        ob.style.background = bc;
        ob.style.boxShadow = `0 4px 28px ${bc}55`;
      }
      const qd = document.getElementById("mixQtyDisplay");
      if (qd) qd.textContent = "1";
    }

    document.getElementById("mixResult").classList.remove("hidden");
    document.getElementById("mixBtn").disabled = false;

    // Persist blended color
    setActiveColor(bc, bn);
    applyThemeFull(bc);
  }, 1600);
}

function updateMixQty(delta) {
  mixQty = Math.max(1, Math.min(99, mixQty + delta));
  const el = document.getElementById("mixQtyDisplay");
  if (el) el.textContent = mixQty;
}

function placeMixOrder() {
  if (!blendedWinner) return;
  saveOrder(blendedWinner, mixQty);
  const os = document.getElementById("mixOrderSection");
  if (os) {
    os.innerHTML = `<div class="order-confirmed" style="padding:0.6rem 0 0">
      <span class="check-icon" style="font-size:2rem">✓</span>
      <p class="confirmed-msg">Order confirmed</p>
      <p class="confirmed-detail" style="color:${blendedWinner.color}">${mixQty} × ${blendedWinner.name} Slushie</p>
    </div>`;
  }
  setTimeout(() => {
    window.location.href = `/order?flavor=${encodeURIComponent(blendedWinner.name)}&color=${encodeURIComponent(blendedWinner.color)}&qty=${mixQty}`;
  }, 1200);
}

function saveBlendToLab() {
  const btn = document.getElementById("mixSaveBtn");
  const name = btn.dataset.name,
    color = btn.dataset.color;
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
  const os = document.getElementById("mixOrderSection");
  if (os) os.classList.add("hidden");
  blendedWinner = null;
  mixQty = 1;
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
        <button class="qty-btn" onclick="updateQuantity(-1)">−</button>
        <span id="qtyDisplay" class="qty-num">1</span>
        <button class="qty-btn" onclick="updateQuantity(1)">+</button>
      </div>
    </div>
    <button class="order-btn" id="orderBtn" onclick="placeOrder()">Place Order</button>`;

  const fe = document.getElementById("winnerFlavor");
  fe.textContent = flavor.name;
  fe.style.color = flavor.color;
  fe.style.textShadow = `0 0 40px ${flavor.color}55`;

  const ob = document.getElementById("orderBtn");
  if (ob) {
    ob.style.background = flavor.color;
    ob.style.boxShadow = `0 4px 28px ${flavor.color}55`;
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
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  document.getElementById("orderForm").innerHTML = `
    <div class="order-confirmed">
      <span class="check-icon">✓</span>
      <p class="confirmed-msg">Order confirmed</p>
      <p class="confirmed-detail" style="color:${accent}">${quantity} × ${currentWinner.name} Slushie</p>
    </div>`;
  // color already persisted — survives redirect
  setTimeout(() => {
    window.location.href = `/order?flavor=${encodeURIComponent(currentWinner.name)}&color=${encodeURIComponent(currentWinner.color)}&qty=${quantity}`;
  }, 1200);
}

function reloadFlavors() {
  flavors = getAllFlavors();
  numSegments = flavors.length;
  arc = (2 * Math.PI) / numSegments;
  drawWheel();
}

function formatTs(iso) {
  const d = new Date(iso),
    now = new Date(),
    diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Custom Cursor ─────────────────────────────────────────────
(function initCursor() {
  const dot = document.getElementById("cursorDot"),
    ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;
  let mx = -100,
    my = -100,
    rx = -100,
    ry = -100;
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + "px";
    dot.style.top = my + "px";
  });
  (function animRing() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(animRing);
  })();
  document.querySelectorAll("button,a,.flavor-item,.icon-btn").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
  });
})();

// ── Keyboard ─────────────────────────────────────────────────
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
  if (e.code === "KeyH" && e.target === document.body) openDrawer();
  if (e.code === "KeyQ" && e.target === document.body) openQuantum();
});

// ── Wire up ───────────────────────────────────────────────────
document.getElementById("historyToggle").addEventListener("click", openDrawer);
document.getElementById("quantumToggle").addEventListener("click", openQuantum);
const mxA = document.getElementById("mixerA"),
  mxB = document.getElementById("mixerB");
if (mxA) mxA.addEventListener("change", syncDots);
if (mxB) mxB.addEventListener("change", syncDots);
document.getElementById("spinBtn").addEventListener("click", spin);

// ── INIT — restore persistent color on every page load ───────
(function () {
  const savedColor = getActiveColor();
  applyThemeFull(savedColor);
  // Restore current winner if name known
  const savedName = getActiveName();
  if (savedName) {
    const match = getAllFlavors().find((f) => f.name === savedName);
    if (match) currentWinner = match;
  }
})();

updateHistoryBadge();
updateOrdersBadge();
renderPassport();
renderOrders();
drawWheel();
initFOTD();
updateStats();
