'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { GoogleGenAI } = require('@google/genai');

const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envFile = path.join(ROOT, '.env');
  const exampleFile = path.join(ROOT, '.env.example');

  const parseFile = (file) => {
    if (!fs.existsSync(file)) return;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
      }
    }
  };

  parseFile(envFile);
  parseFile(exampleFile);

  if (!fs.existsSync(envFile) && fs.existsSync(exampleFile)) {
    try {
      fs.copyFileSync(exampleFile, envFile);
    } catch (e) {}
  }
}

loadEnv();

function parseGeminiError(error) {
  let message = error.message || 'Gemini API call failed.';
  let code = error.code || 'provider_error';
  let status = error.status || 500;

  if (typeof message === 'string' && message.startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error && parsed.error.message) {
        message = parsed.error.message;
      }
      if (parsed.error && parsed.error.status) {
        if (parsed.error.status === 'INVALID_ARGUMENT' || message.includes('API key')) {
          code = 'api_key_invalid';
          status = 400;
        }
      }
    } catch (e) {}
  }

  if (message.includes('API key not valid') || message.includes('API_KEY_INVALID')) {
    message = 'API key not valid. Please check or select a valid API key in Settings > Secrets (or set GEMINI_API_KEY in .env).';
    code = 'api_key_invalid';
    status = 400;
  }

  return { message, code, status };
}

async function answerFarmQuestion(body) {
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    const err = new Error('A question is required.');
    err.status = 400;
    throw err;
  }
  if (question.length > 2000) {
    const err = new Error('The question is too long.');
    err.status = 400;
    throw err;
  }

  loadEnv();
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured on the server. Please set a valid API key in Settings > Secrets or .env.');
    err.status = 503;
    err.code = 'not_configured';
    throw err;
  }

  const preferredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const modelsToTry = Array.from(new Set([preferredModel, 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'])).filter(Boolean);
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

  let lastError = null;
  for (const modelToUse of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = (response.text || '').trim();
      if (!text) continue;

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = Array.isArray(chunks)
        ? chunks.filter(c => c && c.web && c.web.uri).map(c => ({ uri: c.web.uri, title: c.web.title || c.web.uri }))
        : [];

      return { text, sources };
    } catch (error) {
      lastError = error;
      const msg = error.message || '';
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('NOT_FOUND') || msg.includes('404')) {
        console.warn(`Model ${modelToUse} failed with: ${msg}. Retrying with next model...`);
        continue;
      }
      break;
    }
  }

  if (lastError) {
    const parsed = parseGeminiError(lastError);
    const err = new Error(parsed.message);
    err.status = parsed.status;
    err.code = parsed.code;
    throw err;
  }

  const err = new Error('Gemini returned an empty response across all models.');
  err.status = 502;
  err.code = 'empty_response';
  throw err;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const data = await answerFarmQuestion(body);
    res.status(200).json(data);
  } catch (error) {
    const parsed = parseGeminiError(error);
    res.status(parsed.status || 500).json({
      error: parsed.message || 'The assistant request failed.',
      code: parsed.code || 'server_error',
    });
  }
};
