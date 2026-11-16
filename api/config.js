'use strict';

module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const sbUrl = (process.env.SUPABASE_URL || '').trim();
  const sbAnon = (process.env.SUPABASE_ANON_KEY || '').trim();

  const urlOut = sbUrl || 'https://your-project.supabase.co';
  const anonOut = sbAnon || 'your-anon-key';

  const body = `window.SUPABASE_URL = ${JSON.stringify(urlOut)};\nwindow.SUPABASE_ANON_KEY = ${JSON.stringify(anonOut)};\n`;
  res.status(200).send(body);
};
