<?php
// Security Headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Content-Security-Policy: default-src 'self' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:;");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="description" content="Enterprise-Grade Network Topology Simulator - Build, Visualize and Secure your Network.">
  <meta name="theme-color" content="#0f172a">
  <title>NetworkSim | Enterprise Topology Designer</title>
  
  <!-- Preconnect to Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
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
        <div class="logo-icon"><i class="fas fa-shield-halved"></i></div>
        <h1>NetworkSim</h1>
      </div>
      <div class="header-actions">
        <div class="security-badge">
          <i class="fas fa-lock"></i>
          <span>Encrypted Session</span>
        </div>
        <div class="connection-status">
          <span class="pulse-dot"></span>
          <span class="status-text">Core Active</span>
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
          <div class="top-controls">
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

            <div class="view-controls">
              <button id="zoomIn" class="view-btn" title="Zoom In"><i class="fas fa-search-plus"></i></button>
              <button id="zoomOut" class="view-btn" title="Zoom Out"><i class="fas fa-search-minus"></i></button>
              <button id="resetView" class="view-btn" title="Reset View"><i class="fas fa-compress"></i></button>
            </div>
          </div>

          <div class="controls-toolbar">
            <button id="simulateBtn" class="tool-btn primary" title="Simulate Traffic">
              <i class="fas fa-play"></i> <span>Simulate</span>
            </button>
            <div class="divider"></div>
            <button id="linkBtn" class="tool-btn" title="Link Mode">
              <i class="fas fa-link"></i> <span>Link</span>
            </button>
            <button id="pingBtn" class="tool-btn" title="Ping Test">
              <i class="fas fa-satellite-dish"></i> <span>Ping</span>
            </button>
            <button id="inspectBtn" class="tool-btn" title="Inspect Node">
              <i class="fas fa-magnifying-glass"></i> <span>Inspect</span>
            </button>
            <button id="saveBtn" class="tool-btn" title="Save Topology">
              <i class="fas fa-save"></i> <span>Save</span>
            </button>
            <button id="loadBtn" class="tool-btn" title="Load Topology">
              <i class="fas fa-folder-open"></i> <span>Load</span>
            </button>
            <button id="sampleBtn" class="tool-btn" title="Load Sample">
              <i class="fas fa-magic"></i> <span>Sample</span>
            </button>
            <button id="clearBtn" class="tool-btn danger" title="Clear All">
              <i class="fas fa-trash-alt"></i> <span>Clear</span>
            </button>
          </div>
        </div>

        <!-- Node Properties Sidebar -->
        <aside id="propertiesPanel" class="properties-panel">
          <div class="panel-header">
            <h3><i class="fas fa-cog"></i> Configuration</h3>
            <button id="closeProperties" class="close-btn"><i class="fas fa-times"></i></button>
          </div>
          <div class="panel-content">
            <div class="tabs">
              <button class="tab-btn active" data-tab="general">General</button>
              <button class="tab-btn" data-tab="security">Security</button>
            </div>
            
            <div class="tab-content" id="generalTab">
              <div class="input-group">
                <label for="nodeName">Node Name</label>
                <input type="text" id="nodeName" placeholder="Enter name...">
              </div>
              <div class="input-group">
                <label for="nodeIP">IP Address</label>
                <input type="text" id="nodeIP" placeholder="192.168.1.1">
              </div>
              <div class="input-group">
                <label for="nodeSubnet">Subnet Mask</label>
                <input type="text" id="nodeSubnet" value="255.255.255.0">
              </div>
            </div>

            <div class="tab-content hidden" id="securityTab">
              <div class="security-toggle">
                <label>Encryption</label>
                <input type="checkbox" id="nodeEncrypt">
              </div>
              <div class="firewall-rules hidden" id="firewallSection">
                <label>Access Control List (ACL)</label>
                <div id="aclList" class="acl-list"></div>
                <button id="addRule" class="secondary-btn">+ Add Rule</button>
              </div>
            </div>

            <div class="status-indicator">
              <span class="label">Uptime:</span>
              <span id="nodeUptime" class="value online">99.9%</span>
            </div>
            <button id="saveProperties" class="save-btn">Apply Config</button>
          </div>
        </aside>

        <!-- Network Console -->
        <div id="networkConsole" class="network-console">
          <div class="console-header">
            <span><i class="fas fa-terminal"></i> Security Terminal</span>
            <button id="clearConsole"><i class="fas fa-ban"></i></button>
          </div>
          <div id="consoleLogs" class="console-logs"></div>
        </div>

        <!-- Notifications -->
        <div id="notificationContainer" class="notification-container"></div>
      </div>
    </main>
  </div>

  <script src="main.js"></script>
</body>
</html>

