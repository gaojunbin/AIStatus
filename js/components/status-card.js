const ICONS = {
  anthropic: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm2.327 4.18L6.124 14.29h5.545L8.896 7.7z"/></svg>`,
  openai: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>`,
  google: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>`,
  gemini: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c2.761 0 5.262 1.12 7.071 2.929L12 12V2zm0 20c-5.514 0-10-4.486-10-10 0-2.761 1.12-5.262 2.929-7.071L12 12v10zm2-10l7.071-7.071C22.88 6.738 24 9.239 24 12c0 5.514-4.486 10-10 10V12z"/></svg>`,
  default: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>`
};

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

export function createStatusCard(endpoint, status, config) {
  const card = document.createElement('div');
  card.className = 'status-card';
  card.dataset.id = endpoint.id;

  const statusClass = getStatusClass(status);
  const statusText = getStatusText(status);
  const icon = ICONS[endpoint.icon] || ICONS.default;
  const history = status?.history || [];
  const historyPoints = config?.historyPoints || 60;
  const checkInterval = config?.checkInterval || 60000;
  const timeRangeLabel = formatTimeRange(historyPoints, checkInterval);

  card.innerHTML = `
    <div class="card-header">
      <div class="card-icon" aria-hidden="true">${icon}</div>
      <div class="card-info">
        <div class="card-name">${esc(endpoint.name)}</div>
        <div class="card-meta">
          <span>${esc(endpoint.provider)}</span>
          <span>${esc(endpoint.model)}</span>
        </div>
      </div>
      <div class="status-badge ${statusClass}" role="status">${statusText}</div>
    </div>
    <div class="metrics">
      <div class="metric-box">
        <div class="metric-label">⚡ Chat Latency</div>
        <div class="metric-value">${status?.chatLatency ?? '--'} <span>ms</span></div>
      </div>
      <div class="metric-box">
        <div class="metric-label">((•)) Endpoint PING</div>
        <div class="metric-value">${status?.pingLatency ?? '--'} <span>ms</span></div>
      </div>
    </div>
    <div class="history-section">
      <div class="history-label">HISTORY (${history.length}/${historyPoints})</div>
      <div class="history-bar" data-points="${historyPoints}">${renderHistory(history, historyPoints)}</div>
      <div class="history-time"><span>${timeRangeLabel}</span><span>NOW</span></div>
    </div>
  `;

  return card;
}

export function updateStatusCard(card, status) {
  const statusClass = getStatusClass(status);
  const statusText = getStatusText(status);
  const history = status?.history || [];
  const historyBar = card.querySelector('.history-bar');
  const historyPoints = parseInt(historyBar.dataset.points) || 60;

  card.querySelector('.status-badge').className = `status-badge ${statusClass}`;
  card.querySelector('.status-badge').textContent = statusText;

  const metricValues = card.querySelectorAll('.metric-value');
  metricValues[0].innerHTML = `${status?.chatLatency ?? '--'} <span>ms</span>`;
  metricValues[1].innerHTML = `${status?.pingLatency ?? '--'} <span>ms</span>`;

  card.querySelector('.history-label').textContent = `HISTORY (${history.length}/${historyPoints})`;
  historyBar.innerHTML = renderHistory(history, historyPoints);
}

function getStatusClass(status) {
  if (!status || status.status === 'unknown') return 'warn';
  if (status.status === 'operational') {
    return status.chatLatency > 5000 ? 'warn' : 'ok';
  }
  return 'error';
}

function getStatusText(status) {
  if (!status || status.status === 'unknown') return 'Checking';
  if (status.status === 'operational') {
    return status.chatLatency > 5000 ? 'Slow' : 'OK';
  }
  return 'Down';
}

function formatTime(ts) {
  if (!ts) return '--';
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

// Returns color based on latency: green (fast) -> yellow -> red (slow/down)
function getLatencyColor(status, latency) {
  if (status !== 'operational' || latency == null) {
    return '#ef4444'; // Red for down/error
  }

  // Latency thresholds (ms)
  const minLatency = 100;   // Below this is pure green
  const maxLatency = 5000;  // Above this is pure red

  // Clamp latency to range
  const clamped = Math.max(minLatency, Math.min(maxLatency, latency));

  // Map to hue: 120 (green) -> 0 (red)
  const ratio = (clamped - minLatency) / (maxLatency - minLatency);
  const hue = 120 * (1 - ratio);

  return `hsl(${hue}, 70%, 50%)`;
}

function formatTimeRange(historyPoints, checkInterval) {
  const totalMinutes = (historyPoints * checkInterval) / 60000;
  if (totalMinutes >= 1440) {
    const days = Math.round(totalMinutes / 1440);
    return `${days}D`;
  } else if (totalMinutes >= 60) {
    const hours = Math.round(totalMinutes / 60);
    return `${hours}H`;
  } else {
    return `${Math.round(totalMinutes)}M`;
  }
}

function renderHistory(history, total = 60) {
  const points = [];
  const filled = history.length;

  for (let i = 0; i < total - filled; i++) {
    points.push('<div class="history-point empty"></div>');
  }

  for (const h of history) {
    const cls = h.status === 'operational' ? 'ok' : 'error';
    const statusText = h.status === 'operational' ? (h.chatLatency > 5000 ? 'Slow' : 'OK') : 'Down';
    const time = formatTime(h.timestamp);
    const latency = h.chatLatency ?? '--';
    const ping = h.pingLatency ?? '--';
    const color = getLatencyColor(h.status, h.chatLatency);

    points.push(`
      <div class="history-point ${cls}" style="background: ${color}">
        <div class="point-tooltip">
          <div class="tooltip-header">
            <span class="status-badge" style="background: ${color}20; color: ${color}">${statusText}</span>
            <span>${time}</span>
          </div>
          <div class="tooltip-row"><span>Latency</span><span>${latency} ms</span></div>
          <div class="tooltip-row"><span>Ping</span><span>${ping} ms</span></div>
        </div>
      </div>
    `);
  }

  return points.join('');
}
