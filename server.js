import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 8000);

const SERVICE_KEY = process.env.SERVICE_KEY || '';
const API_URL = process.env.API_URL || '';

if (!SERVICE_KEY) console.warn('[warn] SERVICE_KEY is empty — /api/funeral will fail');
if (!API_URL) console.warn('[warn] API_URL is empty — /api/funeral will fail. Set it in .env');

app.get('/api/funeral', async (req, res) => {
  if (!SERVICE_KEY || !API_URL) {
    return res.status(500).json({
      error: 'Server is missing SERVICE_KEY or API_URL. See .env.example.',
    });
  }
  try {
    const url = new URL(API_URL);
    url.searchParams.set('serviceKey', SERVICE_KEY);
    url.searchParams.set('pageNo', String(req.query.pageNo || '1'));
    url.searchParams.set('numOfRows', String(req.query.numOfRows || '300'));
    url.searchParams.set('apiType', 'JSON');
    if (req.query.ctpv) url.searchParams.set('ctpv', String(req.query.ctpv));

    const r = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const text = await r.text();

    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.status(502).json({
        error: 'Upstream returned non-JSON',
        status: r.status,
        rawPreview: text.slice(0, 500),
      });
    }
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.use(express.static(__dirname, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
