import { createStatusCard, updateStatusCard } from './components/status-card.js';

class App {
  constructor() {
    this.config = null;
    this.cards = new Map();
    this.statusData = {};
  }

  async init() {
    const grid = document.getElementById('status-grid');
    grid.innerHTML = '<div class="loading">Loading...</div>';

    try {
      await this.fetchStatus();
    } catch (e) {
      grid.innerHTML = `<div class="loading" style="color: var(--color-error)">Load failed: ${e.message}</div>`;
      return;
    }

    if (!this.config.endpoints?.length) {
      grid.innerHTML = '<div class="loading">No endpoints configured</div>';
      return;
    }

    grid.innerHTML = '';

    // Update page title
    if (this.config.title) {
      document.title = this.config.title;
      const h1 = document.querySelector('header h1');
      if (h1) h1.textContent = this.config.title;
    }

    // Create cards
    for (const endpoint of this.config.endpoints) {
      const status = this.statusData[endpoint.id];
      const card = createStatusCard(endpoint, status, this.config);
      this.cards.set(endpoint.id, card);
      grid.appendChild(card);
    }

    this.updateHeader();

    // Periodically fetch status from server
    this.startPolling();
  }

  async fetchStatus() {
    const resp = await fetch('/api/status');
    if (!resp.ok) throw new Error('Failed to load status');
    const data = await resp.json();
    this.config = data.config;
    this.statusData = data.status;
  }

  startPolling() {
    // Poll every 10 seconds for UI updates
    setInterval(async () => {
      try {
        await this.fetchStatus();
        this.onStatusUpdate();
      } catch (e) {
        console.error('Failed to fetch status:', e);
      }
    }, 10000);
  }

  onStatusUpdate() {
    for (const endpoint of this.config.endpoints) {
      const status = this.statusData[endpoint.id];
      const card = this.cards.get(endpoint.id);
      if (card && status) {
        updateStatusCard(card, status);
      }
    }
    this.updateHeader();
  }

  updateHeader() {
    const subtitle = document.getElementById('subtitle');
    if (!subtitle) return;

    let allOk = true;
    let hasData = false;

    for (const endpoint of this.config.endpoints) {
      const s = this.statusData[endpoint.id];
      if (s && s.status !== 'unknown') {
        hasData = true;
        if (s.status !== 'operational') allOk = false;
      }
    }

    if (!hasData) {
      subtitle.textContent = 'Checking endpoint status...';
      subtitle.style.color = '';
    } else if (allOk) {
      subtitle.textContent = 'All systems operational';
      subtitle.style.color = 'var(--color-ok)';
    } else {
      subtitle.textContent = 'Some systems have issues';
      subtitle.style.color = 'var(--color-error)';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App().init();
});
