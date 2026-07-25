// api/upload.js — guarda el CSV en Vercel Blob
const { put } = require('@vercel/blob');

const UPLOAD_PASS = process.env.APP_PASSWORD;
const BLOB_KEY = 'prechequeo/rutas.csv';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-upload-password');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const pass = req.headers['x-upload-password'];
  if (!UPLOAD_PASS || pass !== UPLOAD_PASS) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    await put(BLOB_KEY, body, { access: 'public', addRandomSuffix: false, contentType: 'text/plain' });
    return res.status(200).json({ ok: true, uploadedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
