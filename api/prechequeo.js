const { put, list, head } = require('@vercel/blob');

const APP_PASS = process.env.APP_PASSWORD;
const BLOB_KEY = 'registros.json';

async function leerRegistros() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY, token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!blobs.length) return [];
    const info = await head(blobs[0].url);
    const resp = await fetch(info.downloadUrl);
    return resp.ok ? await resp.json() : [];
  } catch (_) { return []; }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-password');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pass = req.headers['x-app-password'];
  if (!APP_PASS || pass !== APP_PASS) return res.status(401).json({ error: 'No autorizado' });

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
        access: 'private', addRandomSuffix: false, allowOverwrite: true,
        contentType: 'application/json',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return res.status(200).json({ ok: true, id: reg.id });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'GET') {
    try {
      const registros = await leerRegistros();
      return res.status(200).json({ registros });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};

module.exports.config = { api: { bodyParser: false } };
