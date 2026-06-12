// ORION — Proxy Groq API
// La clé GROQ_API_KEY reste côté serveur, jamais exposée au client

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(500).json({ error: 'Clé Groq non configurée' });

  try {
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => body += chunk);
      req.on('end', resolve);
      req.on('error', reject);
    });

    const { messages, pseudo } = JSON.parse(body);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Tu es ORION BOT, un assistant intégré dans ORION Messenger, une app de chat P2P.
Tu es fun, concis et utile. Réponds en français sauf si on te parle dans une autre langue.
Tes réponses sont courtes (2-4 phrases max sauf si on demande plus).
L'utilisateur s'appelle ${pseudo || 'Joueur'}.
Tu peux aider avec : questions générales, traductions, calculs, blagues, conseils, code, etc.`
          },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erreur Groq' });
    }

    const answer = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas de réponse.';
    return res.status(200).json({ answer });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
