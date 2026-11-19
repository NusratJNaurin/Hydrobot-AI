'use strict';

const { GoogleGenAI, Type } = require('@google/genai');

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const MAX_IMAGE_BASE64_BYTES = 6 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VALID_CATEGORIES = new Set([
  'Fungal',
  'Bacterial',
  'Viral',
  'Pest',
  'Nutrient Deficiency',
  'Environmental Stress',
  'Healthy',
  'Inconclusive',
]);
const VALID_SEVERITIES = new Set(['None', 'Mild', 'Moderate', 'Severe', 'Undetermined']);
const VALID_QUALITIES = new Set(['clear', 'uncertain', 'unusable']);

const rateBuckets = new Map();

function httpError(message, status, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.isHttpError = true;
  return err;
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  if (rateBuckets.size > 2000) {
    for (const [k, v] of rateBuckets.entries()) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) rateBuckets.delete(k);
    }
  }
  let entry = rateBuckets.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
    rateBuckets.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)),
    };
  }
  return { allowed: true };
}

function verifySameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  let originHost;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (!hostHeader) return false;
  return originHost === hostHeader;
}

async function verifySupabaseAuthIfConfigured(req) {
  const sbUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const sbAnon = (process.env.SUPABASE_ANON_KEY || '').trim();
  if (!sbUrl || !sbAnon || sbUrl === 'https://your-project.supabase.co' || sbAnon === 'your-anon-key') {
    return { enforced: false };
  }
  const auth = String(req.headers.authorization || '');
  const match = auth.match(/^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/i);
  if (!match) throw httpError('Authentication required.', 401, 'unauthorized');

  const resp = await fetch(`${sbUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: sbAnon,
      Authorization: `Bearer ${match[1]}`,
    },
  });
  if (!resp.ok) throw httpError('Invalid or expired session.', 401, 'unauthorized');
  const user = await resp.json().catch(() => null);
  if (!user || !user.id) throw httpError('Invalid user session.', 401, 'unauthorized');
  return { enforced: true, userId: user.id };
}

function parseImageInput(body) {
  const rawDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
  if (rawDataUrl) {
    const match = rawDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/i);
    if (!match) {
      throw httpError('Image must be a valid JPEG, PNG, or WebP data URL.', 400, 'invalid_image');
    }
    const mimeType = match[1].toLowerCase();
    const base64 = match[2].replace(/\s+/g, '');
    const estimatedBytes = Math.floor((base64.length * 3) / 4);
    if (!base64 || estimatedBytes < 32) {
      throw httpError('Uploaded image appears empty or corrupted.', 400, 'invalid_image');
    }
    if (estimatedBytes > MAX_IMAGE_BASE64_BYTES) {
      throw httpError('Image exceeds the 6 MB analysis limit.', 413, 'payload_too_large');
    }
    return { mimeType, base64 };
  }

  const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : '';
  const base64 = typeof body.imageBase64 === 'string' ? body.imageBase64.replace(/\s+/g, '') : '';
  if (!ALLOWED_MIME_TYPES.has(mimeType) || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw httpError('A valid JPEG, PNG, or WebP image is required.', 400, 'invalid_image');
  }
  const estimatedBytes = Math.floor((base64.length * 3) / 4);
  if (estimatedBytes < 32) {
    throw httpError('Uploaded image appears empty or corrupted.', 400, 'invalid_image');
  }
  if (estimatedBytes > MAX_IMAGE_BASE64_BYTES) {
    throw httpError('Image exceeds the 6 MB analysis limit.', 413, 'payload_too_large');
  }
  return { mimeType, base64 };
}

function sanitizeContext(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const pickStr = (v, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const pickNum = v => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

  const out = {
    cropLabel: pickStr(raw.cropLabel, 80),
    stage: pickStr(raw.stage, 60),
    greenhouse: pickStr(raw.greenhouse, 80),
    notes: pickStr(raw.notes, 240),
  };

  if (raw.readings && typeof raw.readings === 'object' && !Array.isArray(raw.readings)) {
    const readings = {
      ph: pickNum(raw.readings.ph),
      ec: pickNum(raw.readings.ec),
      temp: pickNum(raw.readings.temp),
      hum: pickNum(raw.readings.hum),
    };
    if (Object.values(readings).some(v => v !== null)) {
      out.readings = readings;
    }
  }

  if (!out.cropLabel && !out.stage && !out.greenhouse && !out.notes && !out.readings) return null;
  return out;
}

function parseGeminiError(error) {
  if (error?.isHttpError) {
    return {
      message: error.message,
      code: error.code || 'server_error',
      status: Number(error.status) || 500,
    };
  }

  const rawMessage = String(error?.message || 'Image analysis request failed.');
  let code = error?.code || 'provider_error';
  let status = Number(error?.status) || 500;

  if (
    rawMessage.includes('API key not valid') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('API_KEY_SERVICE_BLOCKED') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    status === 403
  ) {
    return {
      message: 'Vision AI authentication failed. Check the GEMINI_API_KEY configuration in Settings > Secrets.',
      code: 'provider_auth_error',
      status: 502,
    };
  }

  if (rawMessage.includes('NOT_FOUND') || status === 404) {
    return {
      message: 'Configured Vision AI model was not found or is unavailable.',
      code: 'model_not_found',
      status: 502,
    };
  }

  if (rawMessage.includes('RESOURCE_EXHAUSTED') || status === 429) {
    return {
      message: 'Vision AI quota or rate limit was reached. Please wait a moment and try again.',
      code: 'rate_limited',
      status: 429,
    };
  }

  if (status >= 400 && status < 500) {
    return { message: rawMessage, code, status };
  }

  return {
    message: 'Vision AI image analysis is temporarily unavailable. Please try again shortly.',
    code,
    status: status >= 500 ? status : 500,
  };
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    imageQuality: {
      type: Type.STRING,
      description: 'One of: clear, uncertain, unusable.',
    },
    plantIdentified: {
      type: Type.STRING,
      description: 'Brief identification of the plant, crop, or tree/herb/shrub visible in the photo, or a note if unidentifiable or non-plant.',
    },
    isHealthyAppearing: {
      type: Type.BOOLEAN,
      description: 'True only if the visible plant tissue looks healthy with no clear pathology or stress.',
    },
    summary: {
      type: Type.STRING,
      description: '1-2 sentence clinical overview distinguishing what is visually observable versus preliminary diagnostic possibilities.',
    },
    observedSymptoms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '1 to 5 strictly visual observations directly seen in the uploaded image (color changes, lesions, spores, pests, wilting, chlorosis, or image clarity limits).',
    },
    hypotheses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          condition: {
            type: Type.STRING,
            description: 'Suspected disease, infection, pest damage, nutrient deficiency, healthy finding, or inconclusive result.',
          },
          category: {
            type: Type.STRING,
            description: 'One of: Fungal, Bacterial, Viral, Pest, Nutrient Deficiency, Environmental Stress, Healthy, Inconclusive.',
          },
          visualEvidence: {
            type: Type.STRING,
            description: 'Specific visual evidence from the image supporting this hypothesis.',
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Calibrated confidence estimate from 0.0 to 1.0. Use lower values (below 0.5) when symptoms overlap or lighting/focus limits certainty.',
          },
          confidenceRationale: {
            type: Type.STRING,
            description: 'Concise explanation of the confidence level and any diagnostic uncertainty.',
          },
        },
        required: ['condition', 'category', 'visualEvidence', 'confidence', 'confidenceRationale'],
      },
      description: '1 to 3 preliminary hypotheses ranked most likely first.',
    },
    severity: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.STRING,
          description: 'One of: None, Mild, Moderate, Severe, Undetermined.',
        },
        assessment: {
          type: Type.STRING,
          description: 'Short explanation of severity supported strictly by the visible extent and tissue impact in the image.',
        },
      },
      required: ['level', 'assessment'],
    },
    recommendedSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 6 practical next steps: physical scouting checks, root/environmental verification, sanitation, targeted treatment considerations, or photo retake guidance if unclear.',
    },
  },
  required: [
    'imageQuality',
    'plantIdentified',
    'isHealthyAppearing',
    'summary',
    'observedSymptoms',
    'hypotheses',
    'severity',
    'recommendedSteps',
  ],
};

function normalizeAnalysis(raw, modelUsed) {
  const quality = VALID_QUALITIES.has(String(raw?.imageQuality || '').toLowerCase())
    ? String(raw.imageQuality).toLowerCase()
    : 'uncertain';

  const observedSymptoms = Array.isArray(raw?.observedSymptoms)
    ? raw.observedSymptoms.map(s => String(s || '').trim()).filter(Boolean).slice(0, 5)
    : [];

  const hypotheses = Array.isArray(raw?.hypotheses)
    ? raw.hypotheses.slice(0, 3).map(h => {
        const cat = VALID_CATEGORIES.has(h?.category) ? h.category : 'Inconclusive';
        const rawConf = Number(h?.confidence);
        const confidence = Number.isFinite(rawConf) ? Math.max(0, Math.min(1, rawConf)) : 0.35;
        return {
          condition: String(h?.condition || 'Inconclusive assessment').trim().slice(0, 140),
          category: cat,
          visualEvidence: String(h?.visualEvidence || '').trim().slice(0, 420),
          confidence,
          confidenceRationale: String(h?.confidenceRationale || '').trim().slice(0, 300),
        };
      })
    : [];

  const sevLevel = VALID_SEVERITIES.has(raw?.severity?.level) ? raw.severity.level : 'Undetermined';
  const severity = {
    level: sevLevel,
    assessment: String(raw?.severity?.assessment || 'Severity cannot be determined reliably from this image alone.').trim().slice(0, 400),
  };

  const recommendedSteps = Array.isArray(raw?.recommendedSteps)
    ? raw.recommendedSteps.map(s => String(s || '').trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    source: 'gemini',
    model: modelUsed,
    analyzedAt: Date.now(),
    imageQuality: quality,
    plantIdentified: String(raw?.plantIdentified || 'Unidentified specimen').trim().slice(0, 140),
    isHealthyAppearing: Boolean(raw?.isHealthyAppearing),
    summary: String(raw?.summary || '').trim().slice(0, 600),
    observedSymptoms: observedSymptoms.length
      ? observedSymptoms
      : ['No distinct foliar lesions or abnormalities could be clearly resolved in the uploaded image.'],
    hypotheses: hypotheses.length
      ? hypotheses
      : [{
          condition: 'Inconclusive visual assessment',
          category: 'Inconclusive',
          visualEvidence: 'Visible features in the image are insufficient to support a specific pathology hypothesis.',
          confidence: 0.2,
          confidenceRationale: 'Close-up, well-lit inspection of both leaf surfaces is needed.',
        }],
    severity,
    recommendedSteps: recommendedSteps.length
      ? recommendedSteps
      : [
          'Capture a well-lit, sharp close-up of both upper and lower leaf surfaces.',
          'Inspect adjacent plants, stems, and roots for spread or secondary stress.',
        ],
    disclaimer: 'Preliminary AI visual screening only — not a confirmed diagnosis. Verify physically or via agronomic laboratory testing before applying chemical treatments.',
  };
}

async function analyzePlantDisease(body) {
  const { mimeType, base64 } = parseImageInput(body);
  const ctx = sanitizeContext(body.batchContext);

  const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '')
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .trim();
  if (!apiKey) {
    throw httpError('Vision AI service is not configured. Check GEMINI_API_KEY in Settings > Secrets.', 503, 'not_configured');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const modelToUse = (process.env.GEMINI_VISION_MODEL || 'gemini-3.8-flash').trim();

  const systemInstruction = `You are a careful horticultural and plant pathology vision assistant for Hydrobot.AI.
Analyze uploaded plant photos (leaves, herbs, vegetables, fruit trees, shrubs, ornamentals, or hydroponic/soil crops) with scientific accuracy and strict transparency.

CRITICAL RULES:
1. Base your assessment ONLY on what is visibly present in the uploaded image. Never invent symptoms you cannot see.
2. Clearly separate visually observed symptoms (color patterns, necrotic margins, powdery patches, water-soaking, speckling, stippling, webbing, insects, chlorosis pattern, wilting) from AI-generated hypotheses.
3. Never present a prediction as a confirmed diagnosis. Always frame conditions as preliminary hypotheses.
4. If the image is blurry, dark, too far away, obstructed, shows no plant, or shows ambiguous symptoms, set imageQuality to "uncertain" or "unusable", set severity.level to "Undetermined", keep confidence calibrated low (0.1 to 0.45), and state clearly what could not be determined and how to take a better photo.
5. Do NOT blindly assume any optional farm context matches the photo if visual foliage clearly belongs to a different plant species or outdoor tree/shrub — always identify what is actually in the photo first.
6. Provide calibrated confidence estimates between 0.0 and 1.0 with a brief rationale explaining overlapping symptoms or photographic limits.`;

  const contextBlock = ctx
    ? `\n\nOptional operator-selected context (verify visually against the image — do not assume it matches if the photo differs): ${JSON.stringify(ctx)}`
    : '';

  const textPrompt = `Inspect this uploaded image carefully and return a structured JSON plant pathology assessment.${contextBlock}`;

  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: textPrompt },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        throw httpError('Vision AI returned an empty response.', 502, 'empty_response');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw httpError('Vision AI returned an unexpected response format. Please try again.', 502, 'invalid_json');
      }

      return normalizeAnalysis(parsed, modelToUse);
    } catch (error) {
      lastError = error;
      if (error?.isHttpError) break;

      const msg = String(error?.message || '');
      const status = Number(error?.status) || 500;
      const isTransient = status === 503 || msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
      if (isTransient && attempt === 0) {
        await new Promise(r => setTimeout(r, 800));
        continue;
      }
      break;
    }
  }

  const parsedErr = parseGeminiError(lastError);
  if (parsedErr.code === 'provider_auth_error' || parsedErr.code === 'rate_limited') {
    console.warn(`[disease-analyze] ${parsedErr.code} (${parsedErr.status}): ${parsedErr.message}`);
  } else {
    console.error('[disease-analyze] Gemini error:', lastError?.message || lastError);
  }
  throw httpError(parsedErr.message, parsedErr.status, parsedErr.code);
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!verifySameOrigin(req)) {
    res.status(403).json({ error: 'Cross-origin requests are not allowed.', code: 'forbidden_origin' });
    return;
  }

  const rl = checkRateLimit(req);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    res.status(429).json({
      error: 'Too many image analysis requests. Please wait a moment before trying again.',
      code: 'rate_limited',
    });
    return;
  }

  try {
    await verifySupabaseAuthIfConfigured(req);

    let body = req.body;
    if (typeof body === 'string') {
      if (body.length > 8 * 1024 * 1024) throw httpError('Request payload is too large.', 413, 'payload_too_large');
      try { body = JSON.parse(body); } catch { throw httpError('Request body must be valid JSON.', 400, 'bad_request'); }
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw httpError('Request body must be a JSON object.', 400, 'bad_request');
    }

    const result = await analyzePlantDisease(body);
    res.status(200).json(result);
  } catch (error) {
    const parsed = parseGeminiError(error);
    res.status(parsed.status || 500).json({
      error: parsed.message,
      code: parsed.code || 'server_error',
    });
  }
}

handler.analyzePlantDisease = analyzePlantDisease;
handler.parseGeminiError = parseGeminiError;

module.exports = handler;