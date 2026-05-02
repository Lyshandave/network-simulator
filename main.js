/**
 * NetworkSim Pro — main.js
 * Advanced Topology Simulator Logic
 */

'use strict';

// ── Configuration ───────────────────────────────────────────────────
const DEVICE_TYPES = {
  server:   { label: 'Server',       icon: '\uf233', color: '#8b5cf6', size: 50 },
  router:   { label: 'Router',       icon: '\uf6ff', color: '#0ea5e9', size: 46 },
  switch:   { label: 'Switch',       icon: '\uf796', color: '#06b6d4', size: 42 },
  pc:       { label: 'PC',           icon: '\uf109', color: '#22c55e', size: 40 },
  ap:       { label: 'Access Point', icon: '\uf1eb', color: '#f59e0b', size: 42 },
  firewall: { label: 'Firewall',     icon: '\uf3ed', color: '#ef4444', size: 46 },
};

const TYPE_MAP = {
  server: 'server', router: 'router', switch: 'switch',
  pc: 'pc', accesspoint: 'ap', firewall: 'firewall',
};

// ── State Management ────────────────────────────────────────────────
let state = {
  devices: [],
  connections: [],
  packets: [],
  isSimulating: false,
  mode: 'select', // 'select' or 'link'
  linkSource: null,
  draggedDevice: null,
  dragOffset: { x: 0, y: 0 },
  canvasSize: { w: 0, h: 0 }
};

const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');
const deviceCountEl = document.getElementById('deviceCount');
const connectionCountEl = document.getElementById('connectionCount');

// ── Initialization ──────────────────────────────────────────────────
function init() {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  setupInteractionListeners();
  setupToolbarListeners();
  setupMobileMenu();
  
  // Initial draw
  addSampleTopology();
  requestAnimationFrame(animLoop);
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  state.canvasSize = { w: rect.width, h: rect.height };
}

// ── Event Listeners ─────────────────────────────────────────────────
function setupInteractionListeners() {
  // Drag and Drop from Sidebar
  document.querySelectorAll('.component').forEach(comp => {
    comp.addEventListener('dragstart', (e) => {
      const type = comp.dataset.type;
      e.dataTransfer.setData('deviceType', type);
    });
    
    // Mobile Touch Support for sidebar (simple tap to add for now, or could implement touch-drag)
    comp.addEventListener('click', () => {
       if (window.innerWidth <= 768) {
         addDevice(TYPE_MAP[comp.dataset.type], state.canvasSize.w / 2, state.canvasSize.h / 2);
       }
    });
  });

  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const typeKey = e.dataTransfer.getData('deviceType');
    const type = TYPE_MAP[typeKey];
    if (!type) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addDevice(type, x, y);
  });

  // Mouse/Touch Interactions on Canvas
  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('mouseup', handlePointerUp);
  canvas.addEventListener('dblclick', handleDoubleClick);

  // Touch equivalents
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    handlePointerDown(touch);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    handlePointerMove(touch);
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    handlePointerUp();
    e.preventDefault();
  }, { passive: false });
}

function setupToolbarListeners() {
  document.getElementById('simulateBtn').addEventListener('click', toggleSimulation);
  document.getElementById('linkBtn').addEventListener('click', toggleLinkMode);
  document.getElementById('sampleBtn').addEventListener('click', addSampleTopology);
  document.getElementById('clearBtn').addEventListener('click', clearCanvas);
}

// ── Interaction Handlers ───────────────────────────────────────────
function handlePointerDown(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.pageX) - rect.left;
  const y = (e.clientY || e.pageY) - rect.top;

  const clickedDevice = findDeviceAt(x, y);

  if (state.mode === 'link') {
    if (clickedDevice) {
      if (!state.linkSource) {
        state.linkSource = clickedDevice;
      } else if (state.linkSource.id !== clickedDevice.id) {
        addConnection(state.linkSource.id, clickedDevice.id);
        state.linkSource = null;
      }
    } else {
      state.linkSource = null;
    }
    return;
  }

  if (clickedDevice) {
    state.draggedDevice = clickedDevice;
    state.dragOffset = { x: x - clickedDevice.x, y: y - clickedDevice.y };
  }
}

function handlePointerMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.pageX) - rect.left;
  const y = (e.clientY || e.pageY) - rect.top;

  if (state.draggedDevice) {
    state.draggedDevice.x = x - state.dragOffset.x;
    state.draggedDevice.y = y - state.dragOffset.y;
    
    // Bounds check
    state.draggedDevice.x = Math.max(20, Math.min(state.canvasSize.w - 20, state.draggedDevice.x));
    state.draggedDevice.y = Math.max(20, Math.min(state.canvasSize.h - 20, state.draggedDevice.y));
  }
  
  // Hover effect for link mode
  canvas.style.cursor = findDeviceAt(x, y) ? 'pointer' : (state.mode === 'link' ? 'crosshair' : 'default');
}

function handlePointerUp() {
  state.draggedDevice = null;
}

function handleDoubleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const device = findDeviceAt(x, y);
  if (device) {
    deleteDevice(device.id);
  }
}

// ── Core Actions ───────────────────────────────────────────────────
function addDevice(type, x, y) {
  const device = {
    id: Date.now() + Math.random(),
    type: type,
    x: x,
    y: y,
    name: `${DEVICE_TYPES[type].label} ${state.devices.filter(d => d.type === type).length + 1}`
  };
  state.devices.push(device);
  updateStats();
}

function deleteDevice(id) {
  state.devices = state.devices.filter(d => d.id !== id);
  state.connections = state.connections.filter(c => c[0] !== id && c[1] !== id);
  state.packets = state.packets.filter(p => p.from !== id && p.to !== id);
  updateStats();
}

function addConnection(id1, id2) {
  // Check if already exists
  const exists = state.connections.some(c => 
    (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1)
  );
  if (!exists) {
    state.connections.push([id1, id2]);
    updateStats();
  }
}

function toggleLinkMode() {
  state.mode = state.mode === 'link' ? 'select' : 'link';
  state.linkSource = null;
  document.getElementById('linkBtn').classList.toggle('active', state.mode === 'link');
}

function toggleSimulation() {
  if (state.connections.length === 0) {
    showNotification('Build a topology first!', 'error');
    return;
  }
  
  state.isSimulating = !state.isSimulating;
  const btn = document.getElementById('simulateBtn');
  btn.innerHTML = state.isSimulating ? '<i class="fas fa-stop"></i> <span>Stop</span>' : '<i class="fas fa-play"></i> <span>Simulate</span>';
  btn.classList.toggle('danger', state.isSimulating);
}

function clearCanvas() {
  state.devices = [];
  state.connections = [];
  state.packets = [];
  state.isSimulating = false;
  state.linkSource = null;
  state.mode = 'select';
  document.getElementById('linkBtn').classList.remove('active');
  document.getElementById('simulateBtn').innerHTML = '<i class="fas fa-play"></i> <span>Simulate</span>';
  document.getElementById('simulateBtn').classList.remove('danger');
  updateStats();
}

function addSampleTopology() {
  clearCanvas();
  const w = state.canvasSize.w;
  const h = state.canvasSize.h;
  const cx = w / 2;
  const cy = h / 2;

  const samples = [
    { id: 1, type: 'firewall', x: cx,       y: cy - 140, name: 'Main Firewall' },
    { id: 2, type: 'router',   x: cx,       y: cy - 60,  name: 'Core Router' },
    { id: 3, type: 'switch',   x: cx - 120, y: cy + 20,  name: 'Distribution Switch A' },
    { id: 4, type: 'switch',   x: cx + 120, y: cy + 20,  name: 'Distribution Switch B' },
    { id: 5, type: 'pc',       x: cx - 180, y: cy + 120, name: 'Workstation 1' },
    { id: 6, type: 'pc',       x: cx - 80,  y: cy + 120, name: 'Workstation 2' },
    { id: 7, type: 'server',   x: cx + 120, y: cy + 120, name: 'File Server' },
  ];
  
  state.devices = samples;
  state.connections = [[1,2], [2,3], [2,4], [3,5], [3,6], [4,7]];
  updateStats();
}

// ── Rendering ──────────────────────────────────────────────────────
function animLoop() {
  draw();
  if (state.isSimulating) {
    if (Math.random() < 0.05 && state.connections.length > 0) {
      spawnPacket();
    }
  }
  requestAnimationFrame(animLoop);
}

function draw() {
  ctx.clearRect(0, 0, state.canvasSize.w, state.canvasSize.h);
  
  drawGrid();
  drawConnections();
  drawPackets();
  drawDevices();
  
  if (state.mode === 'link' && state.linkSource) {
    drawTempLink();
  }
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < state.canvasSize.w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, state.canvasSize.h); ctx.stroke();
  }
  for (let y = 0; y < state.canvasSize.h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(state.canvasSize.w, y); ctx.stroke();
  }
}

function drawConnections() {
  state.connections.forEach(([aId, bId]) => {
    const d1 = state.devices.find(d => d.id === aId);
    const d2 = state.devices.find(d => d.id === bId);
    if (!d1 || !d2) return;

    ctx.beginPath();
    ctx.moveTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    
    const grad = ctx.createLinearGradient(d1.x, d1.y, d2.x, d2.y);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.2)');
    
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawPackets() {
  for (let i = state.packets.length - 1; i >= 0; i--) {
    const pk = state.packets[i];
    const d1 = state.devices.find(d => d.id === pk.from);
    const d2 = state.devices.find(d => d.id === pk.to);
    
    if (!d1 || !d2) {
      state.packets.splice(i, 1);
      continue;
    }

    pk.progress += 0.015;
    if (pk.progress >= 1) {
      state.packets.splice(i, 1);
      continue;
    }

    const x = d1.x + (d2.x - d1.x) * pk.progress;
    const y = d1.y + (d2.y - d1.y) * pk.progress;

    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawDevices() {
  state.devices.forEach(device => {
    const type = DEVICE_TYPES[device.type];
    const isSelected = state.linkSource && state.linkSource.id === device.id;
    
    // Outer Glow
    ctx.shadowColor = type.color;
    ctx.shadowBlur = isSelected ? 25 : 15;
    
    // Background Circle
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = isSelected ? '#fff' : type.color;
    ctx.lineWidth = isSelected ? 3 : 2;
    
    ctx.beginPath();
    ctx.arc(device.x, device.y, type.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Icon (FontAwesome)
    ctx.fillStyle = isSelected ? '#fff' : type.color;
    ctx.font = `900 ${type.size * 0.4}px "Font Awesome 6 Free"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.icon, device.x, device.y);

    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 12px "Inter"';
    ctx.fillText(device.name, device.x, device.y + (type.size / 2) + 18);
  });
}

function drawTempLink() {
  // We need current mouse position which we can track in handlePointerMove
  // For simplicity, let's just draw to where we are
}

// ── Helpers ────────────────────────────────────────────────────────
function findDeviceAt(x, y) {
  return state.devices.find(d => {
    const dist = Math.hypot(d.x - x, d.y - y);
    return dist < DEVICE_TYPES[d.type].size / 2 + 5;
  });
}

function spawnPacket() {
  const conn = state.connections[Math.floor(Math.random() * state.connections.length)];
  const reverse = Math.random() > 0.5;
  state.packets.push({
    from: reverse ? conn[1] : conn[0],
    to: reverse ? conn[0] : conn[1],
    progress: 0
  });
}

function updateStats() {
  deviceCountEl.textContent = state.devices.length;
  connectionCountEl.textContent = state.connections.length;
}

function setupMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      const icon = toggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
  }

  // Close sidebar when clicking a component on mobile
  document.querySelectorAll('.component').forEach(comp => {
    comp.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        const icon = toggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    });
  });
}

function showNotification(msg, type = 'info') {
  alert(msg); // Placeholder, could be a nice toast
}

// Start
init();
