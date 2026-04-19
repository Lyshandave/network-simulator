/* Network Simulator — main.js */
'use strict';

const canvas = document.getElementById('networkCanvas');
const ctx    = canvas.getContext('2d');

let devices    = [];
let connections = [];
let packets    = [];
let isSimulating = false;
let simInterval  = null;
let draggedType  = null;

// ── Canvas resize ─────────────────────────────────────────────────────
function resizeCanvas() {
  canvas.width  = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  if (devices.length) draw();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── Device type definitions ───────────────────────────────────────────
const DEVICE_TYPES = {
  server:   { label: 'Server',       color: '#8b5cf6', size: 46 },
  router:   { label: 'Router',       color: '#0ea5e9', size: 42 },
  switch:   { label: 'Switch',       color: '#06b6d4', size: 38 },
  pc:       { label: 'PC',           color: '#22c55e', size: 34 },
  ap:       { label: 'Access Point', color: '#f59e0b', size: 38 },
  firewall: { label: 'Firewall',     color: '#ef4444', size: 42 },
};

const TYPE_MAP = {
  server: 'server', router: 'router', switch: 'switch',
  pc: 'pc', accesspoint: 'ap', firewall: 'firewall',
};

// ── Drawing ───────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawConnections();
  drawPackets();
  drawDevices();
}

function drawConnections() {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  connections.forEach(([a, b]) => {
    const dA = devices.find(d => d.id === a);
    const dB = devices.find(d => d.id === b);
    if (!dA || !dB) return;
    ctx.beginPath();
    ctx.moveTo(dA.x, dA.y);
    ctx.lineTo(dB.x, dB.y);
    ctx.stroke();
  });
}

function drawPackets() {
  for (let i = packets.length - 1; i >= 0; i--) {
    const pk = packets[i];
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, 5, 0, Math.PI * 2);
    ctx.fill();

    pk.progress += 0.025;
    if (pk.progress >= 1) {
      packets.splice(i, 1);
      continue;
    }
    const dA = devices.find(d => d.id === pk.from);
    const dB = devices.find(d => d.id === pk.to);
    if (dA && dB) {
      pk.x = dA.x + (dB.x - dA.x) * pk.progress;
      pk.y = dA.y + (dB.y - dA.y) * pk.progress;
    }
  }
}

function drawDevices() {
  devices.forEach(device => {
    const t = DEVICE_TYPES[device.type] || DEVICE_TYPES.pc;
    const r = t.size / 2;

    ctx.shadowColor = t.color;
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = '#1e293b';
    ctx.strokeStyle = t.color;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(device.x, device.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle    = '#fff';
    ctx.font         = `bold ${Math.round(r * 0.75)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.label.charAt(0), device.x, device.y);

    ctx.font      = '11px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(device.name, device.x, device.y + r + 14);
  });
}

// ── Sample topology ───────────────────────────────────────────────────
function addSampleTopology() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  devices = [
    { id: 1, type: 'firewall', x: cx,       y: cy - 160, name: 'Firewall'   },
    { id: 2, type: 'router',   x: cx,       y: cy - 80,  name: 'Core Router'},
    { id: 3, type: 'switch',   x: cx - 140, y: cy,       name: 'Switch 1'   },
    { id: 4, type: 'switch',   x: cx + 140, y: cy,       name: 'Switch 2'   },
    { id: 5, type: 'server',   x: cx,       y: cy + 30,  name: 'Server'     },
    { id: 6, type: 'pc',       x: cx - 210, y: cy + 100, name: 'PC 1'       },
    { id: 7, type: 'pc',       x: cx - 110, y: cy + 100, name: 'PC 2'       },
    { id: 8, type: 'pc',       x: cx + 90,  y: cy + 100, name: 'PC 3'       },
    { id: 9, type: 'ap',       x: cx + 210, y: cy + 60,  name: 'WiFi AP'    },
  ];
  connections = [[1,2],[2,3],[2,4],[2,5],[3,6],[3,7],[4,8],[4,9]];
  updateStats();
  draw();
}

// ── Simulate traffic ──────────────────────────────────────────────────
function simulateTraffic() {
  if (!connections.length) {
    alert('Add a sample topology first!');
    return;
  }
  isSimulating = true;
  clearInterval(simInterval);

  simInterval = setInterval(() => {
    if (!isSimulating) { clearInterval(simInterval); return; }
    const [a, b] = connections[Math.floor(Math.random() * connections.length)];
    const dA = devices.find(d => d.id === a);
    if (dA) packets.push({ x: dA.x, y: dA.y, from: a, to: b, progress: 0 });
  }, 400);

  requestAnimationFrame(animLoop);
  setTimeout(() => { isSimulating = false; clearInterval(simInterval); }, 10000);
}

function animLoop() {
  draw();
  if (isSimulating || packets.length) requestAnimationFrame(animLoop);
}

// ── Clear ─────────────────────────────────────────────────────────────
function clearCanvas() {
  isSimulating = false;
  clearInterval(simInterval);
  devices = []; connections = []; packets = [];
  updateStats();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ── Stats ─────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('deviceCount').textContent     = devices.length;
  document.getElementById('connectionCount').textContent = connections.length;
}

// ── Drag-and-drop ─────────────────────────────────────────────────────
document.querySelectorAll('.component').forEach(comp => {
  comp.addEventListener('dragstart', () => {
    draggedType = comp.querySelector('span').textContent.trim().toLowerCase().replace(/\s+/g, '');
  });
});

canvas.addEventListener('dragover', e => e.preventDefault());
canvas.addEventListener('drop', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const type = TYPE_MAP[draggedType];
  if (!type) return;
  devices.push({
    id:   Date.now(),
    type: type,
    x:    e.clientX - rect.left,
    y:    e.clientY - rect.top,
    name: DEVICE_TYPES[type].label,
  });
  updateStats();
  draw();
});

// ── Init ──────────────────────────────────────────────────────────────
addSampleTopology();
