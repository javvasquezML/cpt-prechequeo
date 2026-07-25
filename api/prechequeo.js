// api/prechequeo.js — Vercel Serverless Function
// POST: guarda un registro de pre-chequeo
// GET:  devuelve todos los registros (historial)

const { put, head, getDownloadUrl } = require('@vercel/blob');

const APP_PASS = process.env.APP_PASSWORD;
const BLOB_KEY = 'prechequeo/registros.json';

async function leerRegistros() {
  try {
    const info = await head(BLOB_KEY);
    const resp = await fetch(info.downloadUrl);
    return await resp.json();
  } catch (_) {
    return [];
  }
}

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
      const registros = await leerRegistros();
      registros.unshift(reg);
      const recientes = registros.slice(0, 500);
      await put(BLOB_KEY, JSON.stringify(recientes), { access: 'public', addRandomSuffix: false });
      return res.status(200).json({ ok: true, id: reg.id });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const registros = await leerRegistros();
      return res.status(200).json({ registros });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
