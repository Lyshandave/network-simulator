<?php
// Security Headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Content-Security-Policy: default-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-data:;");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="description" content="Premium Interactive Network Topology Simulator - Build, Visualize and Simulate Network Traffic.">
  <meta name="theme-color" content="#0f172a">
  <title>NetworkSim Pro | Premium Topology Designer</title>
  
  <!-- Preconnect to Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="app-wrapper">
    <header class="header">
      <div class="logo">
        <button id="menuToggle" class="menu-toggle" aria-label="Toggle Menu">
          <i class="fas fa-bars"></i>
        </button>
        <div class="logo-icon"><i class="fas fa-network-wired"></i></div>
        <h1>NetworkSim <span>Pro</span></h1>
      </div>
      <div class="header-actions">
        <div class="connection-status">
          <span class="pulse-dot"></span>
          <span class="status-text">System Ready</span>
        </div>
      </div>
    </header>

    <main class="container">
      <aside class="sidebar">
        <div class="sidebar-section">
          <h2><i class="fas fa-microchip"></i> Node Library</h2>
          <div class="component-grid">
            <div class="component" draggable="true" data-type="server" role="button" aria-label="Add Server">
              <i class="fas fa-server"></i>
              <span>Server</span>
            </div>
            <div class="component" draggable="true" data-type="router" role="button" aria-label="Add Router">
              <i class="fas fa-network-wired"></i>
              <span>Router</span>
            </div>
            <div class="component" draggable="true" data-type="switch" role="button" aria-label="Add Switch">
              <i class="fas fa-ethernet"></i>
              <span>Switch</span>
            </div>
            <div class="component" draggable="true" data-type="pc" role="button" aria-label="Add PC">
              <i class="fas fa-laptop"></i>
              <span>PC</span>
            </div>
            <div class="component" draggable="true" data-type="accesspoint" role="button" aria-label="Add Access Point">
              <i class="fas fa-wifi"></i>
              <span>Access Point</span>
            </div>
            <div class="component" draggable="true" data-type="firewall" role="button" aria-label="Add Firewall">
              <i class="fas fa-shield-alt"></i>
              <span>Firewall</span>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section help-section">
          <h3><i class="fas fa-lightbulb"></i> Instructions</h3>
          <ul class="help-list">
            <li><i class="fas fa-plus"></i> Drag nodes to canvas</li>
            <li><i class="fas fa-mouse-pointer"></i> Drag nodes to reposition</li>
            <li><i class="fas fa-link"></i> Use Link tool to connect</li>
            <li><i class="fas fa-times-circle"></i> Double-click to delete</li>
          </ul>
        </div>
      </aside>

      <div class="canvas-area">
        <canvas id="networkCanvas"></canvas>

        <div class="canvas-overlay">
          <div class="controls-toolbar">
            <button id="simulateBtn" class="tool-btn primary" title="Simulate Traffic">
              <i class="fas fa-play"></i> <span>Simulate</span>
            </button>
            <div class="divider"></div>
            <button id="linkBtn" class="tool-btn" title="Link Mode">
              <i class="fas fa-link"></i> <span>Link</span>
            </button>
            <button id="sampleBtn" class="tool-btn" title="Load Sample">
              <i class="fas fa-magic"></i> <span>Sample</span>
            </button>
            <button id="clearBtn" class="tool-btn danger" title="Clear All">
              <i class="fas fa-trash-alt"></i> <span>Clear</span>
            </button>
          </div>

          <div class="metrics-panel">
            <div class="metric">
              <span class="label">Nodes</span>
              <span id="deviceCount" class="value">0</span>
            </div>
            <div class="metric-divider"></div>
            <div class="metric">
              <span class="label">Links</span>
              <span id="connectionCount" class="value">0</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script src="main.js"></script>
</body>
</html>

