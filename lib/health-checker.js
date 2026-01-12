const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'history.json');

class HealthChecker {
  constructor(config) {
    this.config = config;
    this.status = new Map();
    this.histories = {};
    this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        this.histories = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load history:', e.message);
      this.histories = {};
    }
  }

  saveHistory() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.histories, null, 2));
    } catch (e) {
      console.error('Failed to save history:', e.message);
    }
  }

  async httpRequest(url, options, body = null) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      });

      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) req.write(body);
      req.end();
    });
  }

  async checkEndpoint(endpoint) {
    const result = {
      timestamp: Date.now(),
      status: 'down',
      pingLatency: null,
      chatLatency: null,
      verified: false
    };

    // Ping check
    try {
      const pingStart = Date.now();
      const pingResp = await this.httpRequest(endpoint.url, { method: 'HEAD' });
      result.pingLatency = Date.now() - pingStart;
      result.pingOk = pingResp.statusCode >= 200 && pingResp.statusCode < 300;
    } catch {
      result.pingLatency = null;
      result.pingOk = false;
    }

    // API health check
    const checkType = endpoint.healthCheck?.type;
    const needsApiCheck = checkType === 'chat' || checkType === 'responses';

    if (needsApiCheck && endpoint.apiKey) {
      try {
        const chatStart = Date.now();
        const headers = { 'Content-Type': 'application/json' };

        // 只有官方域名才使用原生认证，代理服务器统一用 Bearer token
        const isAnthropicDirect = endpoint.url.includes('anthropic.com');
        const isGeminiDirect = endpoint.url.includes('googleapis.com') || endpoint.url.includes('generativelanguage.googleapis.com');

        if (isAnthropicDirect) {
          headers['x-api-key'] = endpoint.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else if (isGeminiDirect) {
          headers['x-goog-api-key'] = endpoint.apiKey;
        } else {
          headers['Authorization'] = `Bearer ${endpoint.apiKey}`;
        }

        const resp = await this.httpRequest(
          endpoint.url,
          { method: 'POST', headers },
          JSON.stringify(endpoint.healthCheck.payload)
        );

        result.chatLatency = Date.now() - chatStart;
        result.status = (resp.statusCode >= 200 && resp.statusCode < 300) ? 'operational' : 'down';
        result.verified = result.status === 'operational';
      } catch {
        result.chatLatency = null;
        result.status = 'down';
      }
    } else if (needsApiCheck && !endpoint.apiKey) {
      result.status = 'down';
      result.error = 'API key not configured';
    } else if (result.pingOk) {
      result.status = 'operational';
      result.chatLatency = result.pingLatency;
    }

    return result;
  }

  async checkAll() {
    console.log(`[${new Date().toISOString()}] Running health checks...`);

    for (const endpoint of this.config.endpoints) {
      const result = await this.checkEndpoint(endpoint);

      if (!this.histories[endpoint.id]) {
        this.histories[endpoint.id] = [];
      }
      this.histories[endpoint.id].push(result);

      // Keep only last N points
      if (this.histories[endpoint.id].length > this.config.historyPoints) {
        this.histories[endpoint.id].shift();
      }

      this.status.set(endpoint.id, {
        ...result,
        history: this.histories[endpoint.id]
      });

      console.log(`  ${endpoint.name}: ${result.status} (${result.chatLatency || result.pingLatency || '-'}ms)`);
    }

    this.saveHistory();
  }

  getStatusData() {
    const result = {};
    for (const endpoint of this.config.endpoints) {
      const status = this.status.get(endpoint.id);
      result[endpoint.id] = status || {
        status: 'unknown',
        history: this.histories[endpoint.id] || []
      };
    }
    return result;
  }

  start() {
    // Initial check
    this.checkAll();

    // Periodic checks
    this.interval = setInterval(() => {
      this.checkAll();
    }, this.config.checkInterval);

    console.log(`Health checker started (interval: ${this.config.checkInterval}ms)`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

module.exports = { HealthChecker };
