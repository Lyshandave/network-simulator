<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="description" content="Interactive Network Topology Simulator">
  <meta name="robots" content="noindex">
  <title>Network Simulator | Lyshan Dave</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="header">
    <h1><i class="fas fa-network-wired" aria-hidden="true"></i> Network Simulator</h1>
    <a href="../../#projects" class="back-btn"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back</a>
  </header>

  <main class="container">
    <aside class="sidebar">
      <h2><i class="fas fa-cubes" aria-hidden="true"></i> Components</h2>
      <div class="component" draggable="true" data-type="server" role="button" tabindex="0" aria-label="Drag Server component"><i class="fas fa-server" aria-hidden="true"></i><span>Server</span></div>
      <div class="component" draggable="true" data-type="router" role="button" tabindex="0" aria-label="Drag Router component"><i class="fas fa-network-wired" aria-hidden="true"></i><span>Router</span></div>
      <div class="component" draggable="true" data-type="switch" role="button" tabindex="0" aria-label="Drag Switch component"><i class="fas fa-ethernet" aria-hidden="true"></i><span>Switch</span></div>
      <div class="component" draggable="true" data-type="pc" role="button" tabindex="0" aria-label="Drag PC component"><i class="fas fa-laptop" aria-hidden="true"></i><span>PC</span></div>
      <div class="component" draggable="true" data-type="accesspoint" role="button" tabindex="0" aria-label="Drag Access Point component"><i class="fas fa-wifi" aria-hidden="true"></i><span>Access Point</span></div>
      <div class="component" draggable="true" data-type="firewall" role="button" tabindex="0" aria-label="Drag Firewall component"><i class="fas fa-shield-alt" aria-hidden="true"></i><span>Firewall</span></div>
      <h3><i class="fas fa-info-circle" aria-hidden="true"></i> How to Use</h3>
      <p>Drag components onto the canvas to build your topology, then click Simulate Traffic to see packet flow.</p>
    </aside>

    <div class="canvas-area">
      <canvas id="networkCanvas" aria-label="Network topology canvas"></canvas>

      <div class="controls">
        <button class="control-btn primary" onclick="simulateTraffic()">
          <i class="fas fa-play" aria-hidden="true"></i> Simulate
        </button>
        <button class="control-btn" onclick="addSampleTopology()">
          <i class="fas fa-magic" aria-hidden="true"></i> Sample
        </button>
        <button class="control-btn" onclick="clearCanvas()">
          <i class="fas fa-trash" aria-hidden="true"></i> Clear
        </button>
      </div>

      <div class="info-panel" role="status" aria-live="polite">
        <h4><i class="fas fa-chart-line" aria-hidden="true"></i> Network Status</h4>
        <p><span class="status-indicator status-online" aria-hidden="true"></span>Online</p>
        <p>Devices: <strong id="deviceCount">0</strong> &nbsp;|&nbsp; Links: <strong id="connectionCount">0</strong></p>
      </div>
    </div>
  </main>

  <script src="main.js"></script>
</body>
</html>
