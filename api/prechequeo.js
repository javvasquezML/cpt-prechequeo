// api/prechequeo.js — Vercel Serverless Function
// POST: guarda un registro de pre-chequeo
// GET:  devuelve todos los registros (historial)

const { kv } = require('@vercel/kv');

const APP_PASS = process.env.APP_PASSWORD;
const KEY = 'prechequeo:registros';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const pass = req.headers['x-app-password'];
  if (!APP_PASS || pass !== APP_PASS) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'POST') {
    try {
      const reg = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      reg.id = Date.now().toString();
      await kv.lpush(KEY, JSON.stringify(reg));
      // Mantener solo los últimos 500 registros
      await kv.ltrim(KEY, 0, 499);
      return res.status(200).json({ ok: true, id: reg.id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const items = await kv.lrange(KEY, 0, 499);
      const registros = items.map(i => typeof i === 'string' ? JSON.parse(i) : i);
      return res.status(200).json({ registros });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
