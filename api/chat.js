// api/chat.js - Fashion AI プロキシ
// 画像あり → Grok Vision / テキストのみ → Claude

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  const GROK_KEY      = process.env.GROK_API_KEY;

  try {
    const body = req.body || {};
    const hasImage = body.messages?.some(m =>
      Array.isArray(m.content) && m.content.some(c => c.type === 'image')
    );

    // ── 画像あり → Grok Vision ──
    if (hasImage && GROK_KEY) {
      const userMsg = body.messages?.[body.messages.length - 1];
      const contentParts = Array.isArray(userMsg?.content) ? userMsg.content : [];

      const grokContent = contentParts.map(c => {
        if (c.type === 'image') {
          return {
            type: 'image_url',
            image_url: {
              url: `data:${c.source?.media_type || 'image/jpeg'};base64,${c.source?.data}`,
              detail: 'high',
            },
          };
        }
        return { type: 'text', text: c.text || '' };
      });

      const messages = [];
      if (body.system) messages.push({ role: 'system', content: body.system });
      messages.push({ role: 'user', content: grokContent });

      const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-reasoning',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!grokRes.ok) {
        const e = await grokRes.json().catch(() => ({}));
        return res.status(grokRes.status).json({ error: e.error?.message || 'Grok API Error' });
      }

      const grokData = await grokRes.json();
      const text = grokData.choices?.[0]?.message?.content || '';

      // Anthropic形式に変換して返す
      return res.status(200).json({
        content: [{ type: 'text', text }],
        model: 'grok-2-vision-latest',
      });
    }

    // ── テキストのみ → Claude ──
    if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY が未設定です' });

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await claudeRes.json();
    return res.status(claudeRes.status).json(data);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message || '内部エラー' });
  }
};
