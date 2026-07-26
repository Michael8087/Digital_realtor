export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { system, messages } = req.body || {};
  if (!system || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Missing system or messages' });
    return;
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages
      })
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Upstream request failed' });
  }
}
