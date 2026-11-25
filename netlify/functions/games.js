import { getStore } from '@netlify/blobs';
import { timingSafeEqual } from 'node:crypto';

// Game library API used by games.html and toyoware.html.
//   GET    -> public, returns every game (oldest first)
//   POST   -> admin, adds a game
//   PUT    -> admin, updates a game (body must include its id)
//   DELETE -> admin, removes a game (body: { id })
// Each game is stored as its own JSON blob in the "game-library" store.

const STATUSES = ['downloaded', 'queued', 'available'];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

function isAdmin(req) {
  const expected = process.env.ADMIN_KEY;
  const provided = req.headers.get('x-admin-key') || '';
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Allow only empty, http(s) or site-relative URLs (blocks javascript: and data: URLs).
function cleanUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  return /^(https?:\/\/|\/(?!\/))/i.test(url) && url.length <= 2000 ? url : null;
}

function cleanGame(input) {
  const title = String(input.title || '').trim().slice(0, 200);
  if (!title) return { error: 'Title is required.' };

  const status = STATUSES.includes(input.status) ? input.status : 'available';

  const sizeNum = parseFloat(input.size);
  const size = Number.isFinite(sizeNum) && sizeNum >= 0 ? String(sizeNum) : '';

  const fileUrl = cleanUrl(input.fileUrl);
  if (fileUrl === null) return { error: 'The download link must start with http:// or https://.' };

  const thumbnailUrl = cleanUrl(input.thumbnailUrl);
  if (thumbnailUrl === null) return { error: 'The thumbnail link must start with http:// or https://.' };

  return {
    game: {
      title,
      platform: String(input.platform || '').trim().slice(0, 100),
      size,
      status,
      fileUrl,
      fileName: String(input.fileName || '').trim().slice(0, 300),
      thumbnailUrl
    }
  };
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export default async (req) => {
  const store = getStore('game-library');

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const games = (
      await Promise.all(blobs.map(({ key }) => store.get(key, { type: 'json' })))
    ).filter(Boolean);
    games.sort((a, b) => String(a.added || '').localeCompare(String(b.added || '')));
    return json(games);
  }

  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!isAdmin(req)) return json({ error: 'Incorrect admin key.' }, 401);

  const body = await readBody(req);
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.' }, 400);

  if (req.method === 'DELETE') {
    const id = String(body.id || '');
    if (!id) return json({ error: 'Missing game id.' }, 400);
    await store.delete(id);
    return json({ ok: true });
  }

  const { game, error } = cleanGame(body);
  if (error) return json({ error }, 400);

  if (req.method === 'POST') {
    game.id = `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    game.added = new Date().toISOString();
    await store.setJSON(game.id, game);
    return json(game, 201);
  }

  // PUT
  const id = String(body.id || '');
  const existing = id ? await store.get(id, { type: 'json' }) : null;
  if (!existing) return json({ error: 'Game not found.' }, 404);

  const updated = { ...existing, ...game, id: existing.id, added: existing.added };
  await store.setJSON(id, updated);
  return json(updated);
};
