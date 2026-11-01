// AI helper for the app. The Gemini key lives only in Vercel (GEMINI_API_KEY),
// so phones never see it. Two jobs: tidy a visit note, write a weekly summary.
const MODEL = 'gemini-2.5-flash';

const PROMPTS = {
  notes: text =>
    'You help a government field inspection officer in Mayiladuthurai District, Tamil Nadu.\n' +
    'Rewrite the rough note below as a clear, short inspection remark: what was seen, and what action is needed.\n' +
    'Rules: keep the SAME language as the note (Tamil stays Tamil, English stays English, mixed may become clean English with Tamil names kept). ' +
    'Keep every fact, name, number and place. Do not invent anything. Fix spelling and grammar. ' +
    'Plain text only, no headings, no markdown, at most 6 short sentences.\n\nNote:\n' + text,
  weekly: text =>
    'You write for the District Collector\'s office, Mayiladuthurai District, Tamil Nadu.\n' +
    'From last week\'s field inspection data below, write a short summary in simple English: ' +
    'one line on overall activity, then the top 3 problems seen (with places), then which places need a revisit. ' +
    'Use only the data given; do not invent numbers or places. Plain text, short lines starting with "• " for the lists, no markdown, under 120 words.\n\nData:\n' + text
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: `AI is not set up yet: GEMINI_API_KEY is missing for the ${process.env.VERCEL_ENV || 'current'} environment on Vercel.` });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  const task = body && body.task;
  const text = String((body && body.text) || '').trim().slice(0, 12000);
  if (!PROMPTS[task] || !text) return res.status(400).json({ error: 'Nothing to send.' });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPTS[task](text) }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } }
      })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const busy = r.status === 429;
      return res.status(busy ? 429 : 502).json({ error: busy ? 'AI daily free limit reached. Try again later.' : 'AI service error.' });
    }
    const out = ((j.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    if (!out) return res.status(502).json({ error: 'AI gave no answer. Try again.' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the AI service.' });
  }
};
