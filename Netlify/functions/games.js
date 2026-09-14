import { getStore } from '@netlify/blobs';

const GAMES_KEY = 'games.json';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default async (req) => {
  const store = getStore('toyoware-games');

  // Public: anyone can read the list
  if (req.method === 'GET') {
    const games = (await store.get(GAMES_KEY, { type: 'json' })) || [];
    return json(games);
  }

  // Everything else requires the admin key
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers.get('x-admin-key');
  if (!adminKey || providedKey !== adminKey) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const games = (await store.get(GAMES_KEY, { type: 'json' })) || [];

  if (req.method === 'POST') {
    const body = await req.json();
    if (!body.title || !body.title.trim()) return json({ error: 'Title is required' }, 400);

    const game = {
      id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: body.title.trim(),
      platform: (body.platform || '').trim(),
      size: body.size || '',
      status: body.status || 'downloaded',
      fileUrl: body.fileUrl || '',
      fileName: body.fileName || '',
      added: new Date().toISOString()
    };
    games.unshift(game);
    await store.setJSON(GAMES_KEY, games);
    return json(game, 201);
  }

  if (req.method === 'PUT') {
    const body = await req.json();
    const idx = games.findIndex((g) => g.id === body.id);
    if (idx === -1) return json({ error: 'Not found' }, 404);
    games[idx] = { ...games[idx], ...body };
    await store.setJSON(GAMES_KEY, games);
    return json(games[idx]);
  }

  if (req.method === 'DELETE') {
    const { id } = await req.json();
    const next = games.filter((g) => g.id !== id);
    await store.setJSON(GAMES_KEY, next);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};
