// ORION — Serveur Signaling WebRTC
// Rôle : mettre deux pairs en contact pour démarrer WebRTC
// Les messages NE transitent JAMAIS par ce serveur
// Données en mémoire, TTL 60s, auto-purge

const rooms = new Map(); // roomId -> { peers: Map<peerId, {sdp,candidates,ts}> }

function purge() {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    for (const [peerId, peer] of room.peers) {
      if (now - peer.ts > 60000) room.peers.delete(peerId);
    }
    if (room.peers.size === 0) rooms.delete(roomId);
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  purge();

  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action');
  const roomId = url.searchParams.get('room');
  const peerId = url.searchParams.get('peer');

  if (!roomId || !peerId) {
    return res.status(400).json({ error: 'room et peer requis' });
  }

  if (!rooms.has(roomId)) rooms.set(roomId, { peers: new Map() });
  const room = rooms.get(roomId);

  // POST — envoyer SDP offer/answer ou ICE candidates
  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        room.peers.set(peerId, { ...data, ts: Date.now() });
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(400).json({ error: 'JSON invalide' });
      }
    });
    return;
  }

  // GET — récupérer les peers dans la room (sauf soi-même)
  if (method === 'GET') {
    if (action === 'poll') {
      const others = [];
      for (const [id, data] of room.peers) {
        if (id !== peerId) others.push({ peerId: id, ...data });
      }
      return res.status(200).json({ peers: others, roomSize: room.peers.size });
    }
    if (action === 'join') {
      room.peers.set(peerId, { ts: Date.now(), joined: true });
      return res.status(200).json({ ok: true, roomSize: room.peers.size });
    }
    if (action === 'leave') {
      room.peers.delete(peerId);
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(404).json({ error: 'Action inconnue' });
}
