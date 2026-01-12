const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const { HealthChecker } = require('./lib/health-checker');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

// Load config and start health checker
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'endpoints.json'), 'utf8'));
const healthChecker = new HealthChecker(config);
healthChecker.start();

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // API: Get status data
  if (parsedUrl.pathname === '/api/status') {
    const statusData = healthChecker.getStatusData();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      config: {
        title: config.title || 'API Status Monitor',
        checkInterval: config.checkInterval,
        historyPoints: config.historyPoints,
        endpoints: config.endpoints.map(e => ({
          id: e.id,
          name: e.name,
          provider: e.provider,
          model: e.model,
          icon: e.icon
        }))
      },
      status: statusData
    }));
    return;
  }

  // CORS proxy endpoint (still needed for streaming responses test if needed)
  if (parsedUrl.pathname === '/api/proxy') {
    return handleProxy(req, res, Object.fromEntries(parsedUrl.searchParams));
  }

  // Static file serving
  let filePath = path.join(__dirname, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  const ext = path.extname(filePath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'text/plain',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  fs.createReadStream(filePath).pipe(res);
});

async function handleProxy(req, res, query) {
  const targetUrl = query.url;
  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing url parameter' }));
    return;
  }

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.origin;
  delete headers.referer;

  if (query.apiKey) {
    const isAnthropic = targetUrl.includes('anthropic') || query.provider?.toLowerCase() === 'anthropic';
    if (isAnthropic) {
      headers['x-api-key'] = query.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else {
      headers['authorization'] = `Bearer ${query.apiKey}`;
    }
  }

  const parsed = new URL(targetUrl);
  const client = parsed.protocol === 'https:' ? https : http;

  let body = '';
  if (req.method === 'POST') {
    for await (const chunk of req) body += chunk;
  }

  const proxyReq = client.request(targetUrl, {
    method: req.method,
    headers: { ...headers, 'Content-Type': 'application/json' }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
