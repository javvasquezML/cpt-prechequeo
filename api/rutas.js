const { list } = require('@vercel/blob');

const APP_PASS = process.env.APP_PASSWORD;
const BLOB_KEY = 'rutas.csv';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const pass = req.headers['x-app-password'];
  if (!APP_PASS || pass !== APP_PASS) return res.status(401).json({ error: 'No autorizado' });

  try {
    const { blobs } = await list({ prefix: BLOB_KEY, token: process.env.CSV_READ_WRITE_TOKEN });
    if (!blobs.length) return res.status(404).json({ error: 'No hay CSV cargado aún' });

    // El blob es público — se puede leer directamente con fetch
    const resp = await fetch(blobs[0].url);
    if (!resp.ok) return res.status(500).json({ error: `HTTP ${resp.status} al leer CSV` });

    const csv = await resp.text();
    return res.status(200).json({ csv, uploadedAt: blobs[0].uploadedAt });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
