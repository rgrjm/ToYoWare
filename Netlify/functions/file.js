import { getStore } from '@netlify/blobs';

// Rough safety cap so one huge upload can't blow past the function payload limit.
const MAX_BYTES = 5.5 * 1024 * 1024; // ~5.5MB

export default async (req) => {
  const store = getStore('toyoware-files');

  // Public: anyone can download, given a key
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (!key) return new Response('Missing key', { status: 400 });

    const meta = await store.getMetadata(key);
    if (!meta) return new Response('Not found', { status: 404 });

    const data = await store.get(key, { type: 'arrayBuffer' });
    if (!data) return new Response('Not found', { status: 404 });

    return new Response(data, {
      headers: {
        'Content-Type': meta.metadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${meta.metadata?.filename || 'download'}"`
      }
    });
  }

  // Upload requires the admin key
  if (req.method === 'POST') {
    const adminKey = process.env.ADMIN_KEY;
    const providedKey = req.headers.get('x-admin-key');
    if (!adminKey || providedKey !== adminKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { filename, contentType, dataBase64 } = await req.json();
    if (!filename || !dataBase64) {
      return new Response(JSON.stringify({ error: 'Missing filename or file data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.byteLength > MAX_BYTES) {
      return new Response(JSON.stringify({ error: 'File too large for direct upload (max ~5.5MB). Link to external hosting instead.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fileKey = 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    await store.set(fileKey, buffer, {
      metadata: { filename, contentType: contentType || 'application/octet-stream' }
    });

    return new Response(
      JSON.stringify({ key: fileKey, url: '/.netlify/functions/file?key=' + fileKey, filename }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response('Method not allowed', { status: 405 });
};
