const flavors = [
  { name: "Strawberry", color: "#FF3B6B" },
  { name: "Blueberry", color: "#4F6EF7" },
  { name: "Mango", color: "#FF9500" },
  { name: "Lime", color: "#2DE88B" },
  { name: "Grape", color: "#9B5CF6" },
  { name: "Watermelon", color: "#FF4D80" },
  { name: "Raspberry", color: "#FF006E" },
  { name: "Peach", color: "#FFB347" },
  { name: "Cherry", color: "#E0194B" },
  { name: "Blue Razz", color: "#00AAFF" },
];

const numSegments = flavors.length;
const arc = (2 * Math.PI) / numSegments;

//  State //

let currentAngle = -Math.PI / 2;
let isSpinning = false;
let hasSpun = false;
let quantity = 1;

//  Canvas Setup //

const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");
const CX = canvas.width / 2;
const CY = canvas.height / 2;
const R = CX - 5; // outer radius

// Drawing //

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  //  Segments //

  for (let i = 0; i < numSegments; i++) {
    const startAngle = currentAngle + i * arc;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = flavors[i].color;
    ctx.fill();

    // Subtle inner shade near center //

    const grad = ctx.createRadialGradient(CX, CY, R * 0.15, CX, CY, R);
    grad.addColorStop(0, "rgba(0,0,0,0.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Divider

    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.arc(CX, CY, R, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = "#282b28";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Label //

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = "right";
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 5;
    ctx.fillText(flavors[i].name, R - 18, 5);
    ctx.restore();
  }

  // — Outer ring —

  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // — Tick marks —

  const totalTicks = numSegments * 4;
  for (let i = 0; i < totalTicks; i++) {
    const angle = currentAngle + (i / totalTicks) * 2 * Math.PI;
    const isMain = i % 4 === 0;
    const tickLen = isMain ? 11 : 5;
    const x1 = CX + (R - 0.5) * Math.cos(angle);
    const y1 = CY + (R - 0.5) * Math.sin(angle);
    const x2 = CX + (R - tickLen) * Math.cos(angle);
    const y2 = CY + (R - tickLen) * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = isMain
      ? "rgba(255,255,255,0.55)"
      : "rgba(255,255,255,0.18)";
    ctx.lineWidth = isMain ? 2 : 1;
    ctx.stroke();
  }

  // — Center cap —

  ctx.beginPath();
  ctx.arc(CX, CY, 23, 0, 2 * Math.PI);
  ctx.fillStyle = "#282b28";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // — Center dot —

  ctx.beginPath();
  ctx.arc(CX, CY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fill();
}

// ─── Winning Index ────────────────────────

function getWinningIndex() {
  const pointerAngle = (3 * Math.PI) / 2; // top of canvas
  let relative = (pointerAngle - currentAngle) % (2 * Math.PI);
  if (relative < 0) relative += 2 * Math.PI;
  return Math.floor(relative / arc) % numSegments;
}

// ─── Spin ────────────────────────────────

function spin() {
  if (isSpinning) return;
  isSpinning = true;

  const btn = document.getElementById("spinBtn");
  btn.textContent = "SPINNING...";
  btn.disabled = true;
  btn.classList.add("spinning");

  // 8–14 full rotations with random offset, duration 4.5–6s
  const totalRotation = Math.PI * 2 * (8 + Math.random() * 6);
  const duration = 4500 + Math.random() * 1500;
  const startAngle = currentAngle;
  const startTime = performance.now();

  // Quartic ease-out
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    currentAngle = startAngle + totalRotation * easeOut(t);
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      hasSpun = true;
      btn.classList.remove("spinning");

      const winner = flavors[getWinningIndex()];
      updateTheme(winner.color);
      showPopup(winner);

      btn.textContent = "SPIN AGAIN";
      btn.disabled = false;
    }
  }

  requestAnimationFrame(animate);
}

// ─── Theme ───────────────────────────────

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function updateTheme(color) {
  const { r, g, b } = hexToRgb(color);
  const root = document.documentElement;

  root.style.setProperty("--accent", color);
  root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},0.35)`);

  // Animated background bloom swap
  const bgGlow = document.getElementById("bgGlow");
  bgGlow.style.opacity = "0";
  bgGlow.style.transition = "opacity 0.3s ease";

  setTimeout(() => {
    const winningIndex = Math.floor(normalizedRotation / segmentDegree);
    const winner = flavors[winningIndex];

    document.documentElement.style.setProperty("--flavor-color", winner.color);

    // Your existing code to show the popup
    resultDisplay.textContent = winner.name;
    resultDisplay.style.color = winner.color;
    popupOverlay.classList.add("active");

    spinBtn.disabled = false;
  }, 3000);

  // Canvas wrap glow
  const wrap = document.getElementById("canvasWrap");
  if (wrap) {
    wrap.style.boxShadow = `
      0 0 0 2px rgba(255,255,255,0.07),
      0 0 55px rgba(${r},${g},${b},0.38),
      0 8px 80px rgba(0,0,0,0.65)
    `;
  }
}

// ─── Popup ───────────────────────────────

function showPopup(flavor) {
  quantity = 1;

  // Rebuild order form (resets "order confirmed" state on spin again)
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
    <button class="order-btn" onclick="placeOrder()">Place Order</button>
  `;

  // Update flavor display
  const flavorEl = document.getElementById("winnerFlavor");
  flavorEl.textContent = flavor.name;
  flavorEl.style.color = flavor.color;
  flavorEl.style.textShadow = `0 0 32px ${flavor.color}60`;

  // Update order button color
  document.querySelector(".order-btn").style.background = flavor.color;

  // Show
  document.getElementById("overlay").classList.add("active");

  requestAnimationFrame(() => {
    document.getElementById("popup").classList.add("active");
  });
}

function closePopup() {
  document.getElementById("popup").classList.remove("active");
  document.getElementById("overlay").classList.remove("active");
}

// ─── Quantity ────────────────────────────

function updateQuantity(delta) {
  quantity = Math.max(1, Math.min(99, quantity + delta));
  const el = document.getElementById("qtyDisplay");
  if (el) el.textContent = quantity;
}

// ─── Order ───────────────────────────────

function placeOrder() {
    // 1. Get the flavor name from the popup
    const flavor = document.getElementById('winnerFlavor').innerText;
    
    // 2. Get the quantity (ensure this variable is defined globally)
    const qty = quantity || 1; 

    // 3. Get the theme color (from your CSS variable)
    const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

    // 4. Create a hidden form and submit it
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/place_order';

    const fields = { 'flavor': flavor, 'qty': qty, 'color': color };

    for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit(); // This is what actually "opens" the order confirmed page
}

// ─── Init ─────────────────────────────────

drawWheel();
document.getElementById("spinBtn").addEventListener("click", spin);
