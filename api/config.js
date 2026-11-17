'use strict';

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
  const allowedEmails = (process.env.ALLOWED_SIGNUP_EMAILS || '').trim();
  const allowedDomains = (process.env.ALLOWED_SIGNUP_DOMAINS || '').trim();

  res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    allowedEmails,
    allowedDomains,
  });
};
