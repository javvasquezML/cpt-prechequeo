const { put } = require('@vercel/blob');

const UPLOAD_PASS = process.env.APP_PASSWORD;
const BLOB_KEY = 'prechequeo/rutas.csv';

function leerBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk.toString());
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-upload-password');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const pass = req.headers['x-upload-password'];
  if (!UPLOAD_PASS || pass !== UPLOAD_PASS) return res.status(401).json({ error: 'No autorizado' });

  try {
    const body = await leerBody(req);
    if (!body || body.length < 10) return res.status(400).json({ error: 'Archivo vacío' });
    await put(BLOB_KEY, body, { access: 'private', addRandomSuffix: false, contentType: 'text/plain; charset=utf-8' });
    return res.status(200).json({ ok: true, uploadedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports.config = { api: { bodyParser: false } };
