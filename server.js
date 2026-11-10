'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { URL } = require('node:url');

const ROOT = __dirname;
const MAX_BODY_BYTES = 256 * 1024;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnv();

function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request is too large.'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const { GoogleGenAI } = require('@google/genai');

async function answerFarmQuestion(body) {
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) throw Object.assign(new Error('A question is required.'), { status: 400 });
  if (question.length > 2000) throw Object.assign(new Error('The question is too long.'), { status: 400 });
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured on the server.'), { status: 503, code: 'not_configured' });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const records = typeof body.farmContext === 'string' ? body.farmContext : '{}';

  const systemInstruction = `You are Hydrobot.Ai, an intelligent, agriculture-focused assistant dedicated to supporting farmers, growers, and agricultural professionals.

CORE DOMAIN & SCOPE:
1. Agriculture & Farming Expertise:
   - Your scope strictly covers farming, agriculture, horticulture, hydroponics, protected cultivation/greenhouses, soil science, crop biology, plant pathology, irrigation, and farm management.
   - Answer general farming and agricultural questions, cultivation techniques, crop nutritional requirements, disease and pest management (IPM), and best practices.
   - Provide recommendations on agricultural technologies, tools, sensors, monitoring equipment, automation systems, and growing methods suitable for various farming needs and scales.
   - If a question is completely unrelated to farming or agriculture (such as writing arbitrary software code, pop culture, entertainment, or sports), politely decline and clarify that you are specialized in farming and agriculture.

2. Farm Records & Website Integration:
   - When questions refer to this farm's current data or dashboard features (batches, greenhouses, tasks, inventory, harvests, sales, navigation), use the live FARM RECORDS provided below and cite record IDs in square brackets such as [B-401], [T-502], [I-05], [H-1010], or [Greenhouse D].
   - Remind the user that sensor readings on this platform are simulated demo values when relying on them.

3. Live Google Search Grounding:
   - You have access to Google Search grounding to retrieve up-to-date and accurate agricultural research, equipment pricing, market trends, or current information.

SITE FEATURES:
- Dashboard: Overview of total plants, active greenhouses, average plant health, and projected harvest revenue.
- Plant Management: Track crop batches, varieties, growth stages, plant counts, and health scores.
- Greenhouse Management: Monitor environmental telemetry (pH, EC, temp, humidity, water level, CO2) and target ranges.
- Harvest Management: Record yields, quality grades (A/B/C), dates, and observations.
- Farmer Tasks: Manage work orders, assignees, priorities, and deadlines.
- Smart Inventory: Track supplies and enforce reorder thresholds (qty < reorderAt).
- Crop Nutrition & Disease Detection: Chemical balancing guides and foliar symptom checks.
- Production Forecast & Yield Analytics: Harvest predictions and historical trends.
- Financial Dashboard & Sales: Track expenses, customer orders, and deliveries.

FARM RECORDS:
${records}`;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const contents = [
    ...history
      .filter(item => item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string')
      .map(item => ({ role: item.role === 'model' ? 'model' : 'user', parts: [{ text: item.text.slice(0, 4000) }] })),
    { role: 'user', parts: [{ text: question }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = (response.text || '').trim();
    if (!text) throw Object.assign(new Error('Gemini returned an empty response.'), { status: 502, code: 'empty_response' });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = Array.isArray(chunks)
      ? chunks.filter(c => c && c.web && c.web.uri).map(c => ({ uri: c.web.uri, title: c.web.title || c.web.uri }))
      : [];

    return { text, sources };
  } catch (error) {
    const detail = error.message || 'Gemini API call failed.';
    throw Object.assign(new Error(detail), { status: error.status || 500, code: error.code || 'provider_error' });
  }
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = path.resolve(ROOT, '.' + requested);
  if (!file.startsWith(ROOT + path.sep)) return sendJson(res, 403, { error: 'Forbidden.' });
  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) return sendJson(res, 404, { error: 'Not found.' });
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/api/farm-assistant') {
    try {
      const body = await readBody(req);
      const data = await answerFarmQuestion(body);
      sendJson(res, 200, data);
    } catch (error) {
      sendJson(res, error.status || 500, { error: error.message || 'The assistant request failed.', code: error.code || 'server_error' });
    }
    return;
  }
  if (req.method === 'GET') return serveStatic(req, res, url.pathname);
  sendJson(res, 405, { error: 'Method not allowed.' });
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, '0.0.0.0', () => console.log(`Hydrobot.Ai is running at http://0.0.0.0:${port}`));
