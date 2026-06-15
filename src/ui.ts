export function getDashboardHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Harbr</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --border: #2a2d3a;
      --text: #e2e8f0;
      --muted: #64748b;
      --accent: #6366f1;
      --danger: #ef4444;
      --success: #22c55e;
      --tag-bg: #1e2433;
      --radius: 10px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 32px 24px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .logo {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .logo span { color: var(--accent); }

    .status {
      font-size: 0.8rem;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .count {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 16px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.15s;
    }

    .card:hover { border-color: var(--accent); }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .port-number {
      font-size: 1.6rem;
      font-weight: 700;
      line-height: 1;
    }

    .label {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--tag-bg);
      color: var(--accent);
      border: 1px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .meta-row {
      display: flex;
      gap: 8px;
      font-size: 0.83rem;
    }

    .meta-key {
      color: var(--muted);
      min-width: 70px;
    }

    .meta-val {
      font-family: 'SF Mono', 'Fira Code', monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .proto-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 3px;
      background: #1e3a5f;
      color: #60a5fa;
      text-transform: uppercase;
    }

    .kill-btn {
      width: 100%;
      padding: 9px 0;
      border: 1px solid var(--danger);
      border-radius: 7px;
      background: transparent;
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .kill-btn:hover { background: var(--danger); color: #fff; }
    .kill-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 64px 0;
      color: var(--muted);
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 18px;
      font-size: 0.85rem;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }

    .toast.show { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body>
  <header>
    <div class="logo">&#9875; Harb<span>r</span></div>
    <div class="status"><div class="dot"></div> live</div>
  </header>

  <div class="count" id="count"></div>
  <div class="grid" id="grid"></div>
  <div class="toast" id="toast"></div>

  <script>
    var REFRESH_INTERVAL = 3000;

    function fetchPorts() {
      return fetch('/api/ports').then(function(r) { return r.json(); });
    }

    function killPort(pid, btn) {
      btn.disabled = true;
      btn.textContent = 'Killing...';
      return fetch('/api/ports/' + pid, { method: 'DELETE' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.success) {
            showToast('Process ' + pid + ' killed');
            render();
          } else {
            showToast('Failed: ' + (data.error || 'unknown error'));
            btn.disabled = false;
            btn.textContent = 'Kill process';
          }
        })
        .catch(function() {
          showToast('Request failed');
          btn.disabled = false;
          btn.textContent = 'Kill process';
        });
    }

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 2500);
    }

    function renderCard(entry) {
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<div class="card-header">' +
          '<div class="port-number">:' + entry.port + '</div>' +
          (entry.label ? '<div class="label">' + entry.label + '</div>' : '') +
        '</div>' +
        '<div class="card-meta">' +
          '<div class="meta-row"><span class="meta-key">process</span><span class="meta-val">' + entry.processName + '</span></div>' +
          '<div class="meta-row"><span class="meta-key">pid</span><span class="meta-val">' + entry.pid + '</span></div>' +
          '<div class="meta-row"><span class="meta-key">address</span><span class="meta-val">' + entry.localAddress + ':' + entry.port + '</span></div>' +
          '<div class="meta-row"><span class="meta-key">protocol</span><span class="meta-val"><span class="proto-badge">' + entry.protocol + '</span></span></div>' +
        '</div>' +
        '<button class="kill-btn">Kill process</button>';

      card.querySelector('.kill-btn').addEventListener('click', function() {
        killPort(entry.pid, this);
      });
      return card;
    }

    function render() {
      return fetchPorts().then(function(ports) {
        var grid = document.getElementById('grid');
        var count = document.getElementById('count');
        grid.innerHTML = '';
        count.textContent = ports.length + ' active port' + (ports.length !== 1 ? 's' : '');
        if (ports.length === 0) {
          grid.innerHTML = '<div class="empty">No active listening ports found.</div>';
          return;
        }
        ports
          .sort(function(a, b) { return a.port - b.port; })
          .forEach(function(entry) { grid.appendChild(renderCard(entry)); });
      });
    }

    render();
    setInterval(render, REFRESH_INTERVAL);
  </script>
</body>
</html>`;
}