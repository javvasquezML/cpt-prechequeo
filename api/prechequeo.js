const { put, list, del } = require('@vercel/blob');

const APP_PASS = process.env.APP_PASSWORD;
const ADMIN_PASS = process.env.ADMIN_PASSWORD;
// Guardamos en el store público (CSV_READ_WRITE_TOKEN) con nombre difícil de adivinar
const BLOB_KEY = 'prechequeo-registros-interno.json';

async function leerRegistros() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY, token: process.env.CSV_READ_WRITE_TOKEN });
    if (!blobs.length) return [];
    // Forzar bypass del CDN con parámetro único
    const resp = await fetch(blobs[0].url + '?t=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) return [];
    return await resp.json();
  } catch (_) { return []; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-password');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pass = req.headers['x-app-password'];
  const isAdmin = ADMIN_PASS && pass === ADMIN_PASS;
  const isNormal = APP_PASS && pass === APP_PASS;
  if (!isAdmin && !isNormal) return res.status(401).json({ error: 'No autorizado' });

  if (req.method === 'POST') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString();
      const reg = JSON.parse(body);
      reg.id = Date.now().toString();
      const registros = await leerRegistros();
      registros.unshift(reg);
      await put(BLOB_KEY, JSON.stringify(registros.slice(0, 500)), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
        token: process.env.CSV_READ_WRITE_TOKEN,
      });
      return res.status(200).json({ ok: true, id: reg.id });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'GET') {
    try {
      const registros = await leerRegistros();
      return res.status(200).json({ registros, isAdmin });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'DELETE') {
    if (!isAdmin) return res.status(403).json({ error: 'Se requiere contraseña de administrador' });
    try {
      const { blobs } = await list({ prefix: BLOB_KEY, token: process.env.CSV_READ_WRITE_TOKEN });
      if (blobs.length) await del(blobs[0].url, { token: process.env.CSV_READ_WRITE_TOKEN });
      return res.status(200).json({ ok: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};

module.exports.config = { api: { bodyParser: false } };
