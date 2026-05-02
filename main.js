/**
 * NetworkSim — main.js
 * Advanced Topology Simulator Logic
 */

'use strict';

// ── Configuration ───────────────────────────────────────────────────
const DEVICE_TYPES = {
  server:   { label: 'Server',       icon: '\uf233', color: '#a78bfa', size: 52 },
  router:   { label: 'Router',       icon: '\uf6ff', color: '#38bdf8', size: 48 },
  switch:   { label: 'Switch',       icon: '\uf796', color: '#06b6d4', size: 44 },
  pc:       { label: 'PC',           icon: '\uf109', color: '#4ade80', size: 42 },
  ap:       { label: 'Access Point', icon: '\uf1eb', color: '#fbbf24', size: 44 },
  firewall: { label: 'Firewall',     icon: '\uf3ed', color: '#f43f5e', size: 48 },
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
  mode: 'select', // 'select', 'link', 'inspect', 'ping'
  selectedDevice: null,
  linkSource: null,
  pingSource: null,
  draggedDevice: null,
  dragOffset: { x: 0, y: 0 },
  canvasSize: { w: 0, h: 0 },
  zoom: 1,
  offset: { x: 0, y: 0 }
};

const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');
const deviceCountEl = document.getElementById('deviceCount');
const connectionCountEl = document.getElementById('connectionCount');
const propertiesPanel = document.getElementById('propertiesPanel');
const consoleLogs = document.getElementById('consoleLogs');

// ── Initialization ──────────────────────────────────────────────────
function init() {
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  setupInteractionListeners();
  setupToolbarListeners();
  setupPropertyListeners();
  setupMobileMenu();
  setupConsole();
  
  // Initial draw
  addSampleTopology();
  requestAnimationFrame(animLoop);
  
  addLog('Network Sim Core initialized.', 'info');
  addLog('Encryption modules active.', 'success');
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  state.canvasSize = { w: rect.width, h: rect.height };
}

// ── Event Listeners ─────────────────────────────────────────────────
function setupInteractionListeners() {
  document.querySelectorAll('.component').forEach(comp => {
    comp.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('deviceType', comp.dataset.type);
    });
    
    comp.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        addDevice(TYPE_MAP[comp.dataset.type], state.canvasSize.w / 2, state.canvasSize.h / 2);
        showNotification(`${comp.dataset.type.toUpperCase()} added`);
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
    const x = (e.clientX - rect.left - state.offset.x) / state.zoom;
    const y = (e.clientY - rect.top - state.offset.y) / state.zoom;
    addDevice(type, x, y);
  });

  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('mouseup', handlePointerUp);
  canvas.addEventListener('dblclick', handleDoubleClick);

  canvas.addEventListener('touchstart', (e) => { handlePointerDown(e.touches[0]); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { handlePointerMove(e.touches[0]); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', (e) => { handlePointerUp(); e.preventDefault(); }, { passive: false });
}

function setupToolbarListeners() {
  document.getElementById('simulateBtn').addEventListener('click', toggleSimulation);
  document.getElementById('linkBtn').addEventListener('click', () => setMode('link'));
  document.getElementById('pingBtn').addEventListener('click', () => setMode('ping'));
  document.getElementById('inspectBtn').addEventListener('click', () => setMode('inspect'));
  document.getElementById('saveBtn').addEventListener('click', saveTopology);
  document.getElementById('loadBtn').addEventListener('click', loadTopology);
  document.getElementById('sampleBtn').addEventListener('click', addSampleTopology);
  document.getElementById('clearBtn').addEventListener('click', clearCanvas);
  
  document.getElementById('zoomIn').addEventListener('click', () => { state.zoom = Math.min(2, state.zoom + 0.1); });
  document.getElementById('zoomOut').addEventListener('click', () => { state.zoom = Math.max(0.5, state.zoom - 0.1); });
  document.getElementById('resetView').addEventListener('click', () => { state.zoom = 1; state.offset = {x:0, y:0}; });
}

function setupPropertyListeners() {
  document.getElementById('closeProperties').addEventListener('click', closeProperties);
  document.getElementById('saveProperties').addEventListener('click', saveNodeProperties);
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`${btn.dataset.tab}Tab`).classList.remove('hidden');
    });
  });
}

function setupConsole() {
  document.getElementById('clearConsole').addEventListener('click', () => {
    consoleLogs.innerHTML = '';
  });
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
        addLog(`Linking from ${clickedDevice.name}...`, 'info');
      } else if (state.linkSource.id !== clickedDevice.id) {
        addConnection(state.linkSource.id, clickedDevice.id);
        state.linkSource = null;
      }
    } else {
      state.linkSource = null;
    }
    return;
  }

  if (state.mode === 'ping') {
    if (clickedDevice) {
      if (!state.pingSource) {
        state.pingSource = clickedDevice;
        addLog(`Select destination for Ping from ${clickedDevice.name}...`, 'info');
      } else {
        runPingTest(state.pingSource, clickedDevice);
        state.pingSource = null;
      }
    }
    return;
  }

  if (state.mode === 'inspect') {
    if (clickedDevice) openProperties(clickedDevice);
    else closeProperties();
    return;
  }

  if (clickedDevice) {
    state.draggedDevice = clickedDevice;
    state.dragOffset = { x: (x - state.offset.x)/state.zoom - clickedDevice.x, y: (y - state.offset.y)/state.zoom - clickedDevice.y };
    state.selectedDevice = clickedDevice;
  } else {
    state.selectedDevice = null;
    closeProperties();
  }
}

function handlePointerMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX || e.pageX) - rect.left;
  const y = (e.clientY || e.pageY) - rect.top;

  if (state.draggedDevice) {
    state.draggedDevice.x = (x - state.offset.x)/state.zoom - state.dragOffset.x;
    state.draggedDevice.y = (y - state.offset.y)/state.zoom - state.dragOffset.y;
  }
  
  canvas.style.cursor = findDeviceAt(x, y) ? 'pointer' : (['link','ping'].includes(state.mode) ? 'crosshair' : 'default');
}

function handlePointerUp() { state.draggedDevice = null; }

function handleDoubleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const device = findDeviceAt(e.clientX - rect.left, e.clientY - rect.top);
  if (device) {
    deleteDevice(device.id);
    addLog(`Node ${device.name} decommissioned.`, 'warning');
  }
}

// ── Core Actions ───────────────────────────────────────────────────
function addDevice(type, x, y) {
  const device = {
    id: Date.now() + Math.random(),
    type: type,
    x: x,
    y: y,
    name: `${DEVICE_TYPES[type].label} ${state.devices.filter(d => d.type === type).length + 1}`,
    ip: `192.168.1.${10 + state.devices.length}`,
    subnet: '255.255.255.0',
    encrypt: false
  };
  state.devices.push(device);
  updateStats();
  addLog(`New ${type} node added at ${device.ip}`, 'info');
}

function deleteDevice(id) {
    state.devices = state.devices.filter(d => d.id !== id);
    state.connections = state.connections.filter(c => c[0] !== id && c[1] !== id);
    state.packets = state.packets.filter(p => p.from !== id && p.to !== id);
    if (state.selectedDevice?.id === id) closeProperties();
    updateStats();
}

function addConnection(id1, id2) {
  const exists = state.connections.some(c => (c[0] === id1 && c[1] === id2) || (c[0] === id2 && c[1] === id1));
  if (!exists) {
    state.connections.push([id1, id2]);
    updateStats();
    addLog('Physical link established between nodes.', 'success');
  }
}

function setMode(mode) {
  state.mode = state.mode === mode ? 'select' : mode;
  state.linkSource = null;
  state.pingSource = null;
  
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  if (state.mode !== 'select' && document.getElementById(`${state.mode}Btn`)) {
    document.getElementById(`${state.mode}Btn`).classList.add('active');
  }
}

function runPingTest(src, dest) {
  addLog(`Pinging ${dest.ip} from ${src.ip} with 32 bytes of data:`, 'info');
  
  const path = findPath(src.id, dest.id);
  if (path) {
    setTimeout(() => {
      animatePing(path);
      addLog(`Reply from ${dest.ip}: bytes=32 time<1ms TTL=64`, 'success');
    }, 500);
  } else {
    addLog(`Request timed out. Destination ${dest.ip} unreachable.`, 'error');
  }
}

function findPath(startId, endId) {
  let queue = [[startId]];
  let visited = new Set([startId]);

  while (queue.length > 0) {
    let path = queue.shift();
    let node = path[path.length - 1];

    if (node === endId) return path;

    for (let conn of state.connections) {
      let next = conn[0] === node ? conn[1] : (conn[1] === node ? conn[0] : null);
      if (next && !visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
}

function animatePing(path) {
  for (let i = 0; i < path.length - 1; i++) {
    setTimeout(() => {
      state.packets.push({
        from: path[i],
        to: path[i+1],
        progress: 0,
        color: '#38bdf8',
        type: 'ICMP'
      });
    }, i * 300);
  }
}

function addLog(msg, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString([], { hour12: false });
  entry.innerHTML = `<span style="color: var(--text-dim)">[${time}]</span> ${msg}`;
  consoleLogs.appendChild(entry);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// ── Properties Logic ────────────────────────────────────────────────
function openProperties(device) {
  state.selectedDevice = device;
  document.getElementById('nodeName').value = device.name;
  document.getElementById('nodeIP').value = device.ip;
  document.getElementById('nodeSubnet').value = device.subnet;
  document.getElementById('nodeEncrypt').checked = device.encrypt || false;
  
  document.getElementById('firewallSection').classList.toggle('hidden', device.type !== 'firewall');
  
  propertiesPanel.classList.add('open');
}

function closeProperties() {
  propertiesPanel.classList.remove('open');
  state.selectedDevice = null;
}

function saveNodeProperties() {
  if (!state.selectedDevice) return;
  
  state.selectedDevice.name = document.getElementById('nodeName').value.trim();
  state.selectedDevice.ip = document.getElementById('nodeIP').value.trim();
  state.selectedDevice.subnet = document.getElementById('nodeSubnet').value.trim();
  state.selectedDevice.encrypt = document.getElementById('nodeEncrypt').checked;
  
  addLog(`Configuration updated for ${state.selectedDevice.name}`, 'success');
  closeProperties();
}

// ── Rendering ──────────────────────────────────────────────────────
function animLoop() {
  draw();
  if (state.isSimulating && state.connections.length > 0) {
    if (Math.random() < 0.05) spawnPacket();
  }
  requestAnimationFrame(animLoop);
}

function draw() {
  ctx.save();
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, state.canvasSize.w, state.canvasSize.h);
  ctx.translate(state.offset.x, state.offset.y);
  ctx.scale(state.zoom, state.zoom);

  drawGrid();
  drawConnections();
  drawPackets();
  drawDevices();
  
  ctx.restore();
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.lineWidth = 1;
  const step = 60;
  const startX = -state.offset.x / state.zoom;
  const startY = -state.offset.y / state.zoom;
  const endX = startX + state.canvasSize.w / state.zoom;
  const endY = startY + state.canvasSize.h / state.zoom;

  for (let x = Math.floor(startX / step) * step; x < endX; x += step) {
    ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
  }
  for (let y = Math.floor(startY / step) * step; y < endY; y += step) {
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
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
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function drawPackets() {
  for (let i = state.packets.length - 1; i >= 0; i--) {
    const pk = state.packets[i];
    const d1 = state.devices.find(d => d.id === pk.from);
    const d2 = state.devices.find(d => d.id === pk.to);
    if (!d1 || !d2) { state.packets.splice(i, 1); continue; }

    pk.progress += 0.02;
    if (pk.progress >= 1) { state.packets.splice(i, 1); continue; }

    const x = d1.x + (d2.x - d1.x) * pk.progress;
    const y = d1.y + (d2.y - d1.y) * pk.progress;

    ctx.fillStyle = pk.color;
    ctx.shadowColor = pk.color;
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
    const isSelected = state.selectedDevice?.id === device.id;
    const isSpecial = [state.linkSource?.id, state.pingSource?.id].includes(device.id);

    ctx.shadowColor = type.color;
    ctx.shadowBlur = (isSelected || isSpecial) ? 30 : 15;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = (isSelected || isSpecial) ? '#fff' : type.color;
    ctx.lineWidth = (isSelected || isSpecial) ? 3 : 2;
    
    ctx.beginPath();
    ctx.arc(device.x, device.y, type.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = (isSelected || isSpecial) ? '#fff' : type.color;
    ctx.font = `900 ${type.size * 0.45}px "Font Awesome 6 Free"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.icon, device.x, device.y);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 12px "Inter"';
    ctx.fillText(device.name, device.x, device.y + type.size/2 + 18);
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '500 10px "JetBrains Mono"';
    ctx.fillText(device.ip, device.x, device.y + type.size/2 + 30);
  });
}

// ── Global Actions ─────────────────────────────────────────────────
function toggleSimulation() {
  state.isSimulating = !state.isSimulating;
  const btn = document.getElementById('simulateBtn');
  btn.innerHTML = state.isSimulating ? '<i class="fas fa-stop"></i> <span>Stop</span>' : '<i class="fas fa-play"></i> <span>Simulate</span>';
  btn.classList.toggle('danger', state.isSimulating);
  addLog(state.isSimulating ? 'Simulation traffic active.' : 'Simulation traffic paused.', state.isSimulating ? 'info' : 'warning');
}

function spawnPacket() {
  const conn = state.connections[Math.floor(Math.random() * state.connections.length)];
  state.packets.push({
    from: conn[0], to: conn[1], progress: 0,
    color: ['#38bdf8','#a78bfa','#4ade80'][Math.floor(Math.random()*3)]
  });
}

function clearCanvas() {
  state.devices = []; state.connections = []; state.packets = [];
  state.isSimulating = false; state.selectedDevice = null;
  updateStats();
  addLog('Topology reset.', 'warning');
}

function saveTopology() {
  localStorage.setItem('network_topology', JSON.stringify({ devices: state.devices, connections: state.connections }));
  showNotification('Topology saved');
  addLog('Topology configuration exported to local storage.', 'success');
}

function loadTopology() {
  const data = JSON.parse(localStorage.getItem('network_topology'));
  if (data) {
    state.devices = data.devices; state.connections = data.connections;
    updateStats();
    showNotification('Topology loaded');
    addLog('Restored topology from local storage.', 'success');
  }
}

function addSampleTopology() {
  clearCanvas();
  const cx = state.canvasSize.w / 2;
  const cy = state.canvasSize.h / 2;
  const samples = [
    { id: 1, type: 'firewall', x: cx, y: cy-180, name: 'Boundary FW', ip: '10.0.0.1', subnet: '255.255.255.0' },
    { id: 2, type: 'router', x: cx, y: cy-80, name: 'Core RT', ip: '192.168.1.1', subnet: '255.255.255.0' },
    { id: 3, type: 'switch', x: cx-150, y: cy+50, name: 'Access SW-A', ip: '192.168.1.2', subnet: '255.255.255.0' },
    { id: 4, type: 'switch', x: cx+150, y: cy+50, name: 'Access SW-B', ip: '192.168.1.3', subnet: '255.255.255.0' },
    { id: 5, type: 'pc', x: cx-220, y: cy+180, name: 'Admin PC', ip: '192.168.1.10', subnet: '255.255.255.0' },
    { id: 6, type: 'server', x: cx+220, y: cy+180, name: 'DB Server', ip: '192.168.1.50', subnet: '255.255.255.0' }
  ];
  state.devices = samples;
  state.connections = [[1,2], [2,3], [2,4], [3,5], [4,6]];
  updateStats();
  addLog('Standard Enterprise Topology deployed.', 'info');
}

function updateStats() {
  deviceCountEl.textContent = state.devices.length;
  connectionCountEl.textContent = state.connections.length;
}

function findDeviceAt(x, y) {
  const adjX = (x - state.offset.x) / state.zoom;
  const adjY = (y - state.offset.y) / state.zoom;
  return state.devices.find(d => Math.hypot(d.x - adjX, d.y - adjY) < DEVICE_TYPES[d.type].size / 2 + 10);
}

function showNotification(msg, type='info') {
  const container = document.getElementById('notificationContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setupMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      toggle.querySelector('i').className = sidebar.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
    });
  }
}

init();
