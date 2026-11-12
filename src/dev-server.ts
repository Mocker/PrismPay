import { createServer } from 'node:http';
import app from './index.ts';

const port = Number(process.env.PORT || 8787);

const server = createServer(async (req, res) => {
  try {
    const url = `http://localhost:${port}${req.url || '/'}`;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(', '));
    }

    const fetchReq = new Request(url, {
      method: req.method || 'GET',
      headers,
      body:
        req.method && req.method !== 'GET' && req.method !== 'HEAD'
          ? bodyBuffer
          : undefined,
    });

    const fetchRes = await app.fetch(fetchReq, {
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
      PAYPAL_ENV: process.env.PAYPAL_ENV || 'sandbox',
      AI_API_KEY: process.env.AI_API_KEY,
      AI_MODEL: process.env.AI_MODEL,
      AI_BASE_URL: process.env.AI_BASE_URL,
    });

    res.statusCode = fetchRes.status;
    fetchRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });
    const resBuffer = Buffer.from(await fetchRes.arrayBuffer());
    res.end(resBuffer);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`PrismPay server listening on http://localhost:${port}`);
});
