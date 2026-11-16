'use strict';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 15;
const rateBuckets = new Map();

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
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)) };
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

function parseCsvList(raw) {
  return String(raw || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

function isEmailAllowedByServerAllowlist(email) {
  const allowedEmails = parseCsvList(process.env.ALLOWED_SIGNUP_EMAILS);
  const allowedDomains = parseCsvList(process.env.ALLOWED_SIGNUP_DOMAINS);
  if (!allowedEmails.length && !allowedDomains.length) return { configured: false, allowed: true };

  const normalized = String(email || '').trim().toLowerCase();
  const domain = normalized.includes('@') ? normalized.split('@').pop() : '';
  const emailMatch = allowedEmails.includes(normalized);
  const domainMatch = Boolean(domain && allowedDomains.includes(domain));
  return { configured: true, allowed: emailMatch || domainMatch };
}

module.exports = async function handler(req, res) {
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
    res.status(429).json({ error: 'Too many registration attempts. Please wait a moment before trying again.', code: 'rate_limited' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 8192) {
      res.status(413).json({ error: 'Request payload is too large.', code: 'payload_too_large' });
      return;
    }
    try { body = JSON.parse(body); } catch {
      res.status(400).json({ error: 'Request body must be valid JSON.', code: 'bad_request' });
      return;
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ error: 'Request body must be a JSON object.', code: 'bad_request' });
    return;
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.', code: 'invalid_email' });
    return;
  }

  const allowlist = isEmailAllowedByServerAllowlist(email);
  if (allowlist.configured && !allowlist.allowed) {
    res.status(403).json({
      allowed: false,
      code: 'email_not_approved',
      error: 'Access restricted: This email address is not approved for registration.',
    });
    return;
  }

  const sbUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const sbAnon = (process.env.SUPABASE_ANON_KEY || '').trim();
  if (!sbUrl || !sbAnon || sbUrl === 'https://your-project.supabase.co' || sbAnon === 'your-anon-key') {
    res.status(503).json({
      allowed: false,
      supabaseConfigured: false,
      code: 'supabase_not_configured',
      error: 'Registration is unavailable because Supabase authentication is not configured in this environment.',
    });
    return;
  }

  try {
    const resp = await fetch(`${sbUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: { apikey: sbAnon },
    });
    if (resp.ok) {
      const settings = await resp.json().catch(() => null);
      if (settings && settings.disable_signup === true) {
        res.status(403).json({
          allowed: false,
          supabaseConfigured: true,
          signupDisabled: true,
          code: 'signup_disabled',
          error: 'Public registration is disabled. Only invited or pre-approved accounts can sign in.',
        });
        return;
      }
    }
  } catch (e) {
    console.warn('Unable to inspect Supabase auth settings:', e?.message || e);
  }

  res.status(200).json({
    allowed: true,
    supabaseConfigured: true,
    allowlistEnforced: allowlist.configured,
  });
};
