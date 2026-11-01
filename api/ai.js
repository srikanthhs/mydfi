// AI helper for the app. The Gemini key lives only in Vercel (GEMINI_API_KEY),
// so phones never see it. Two jobs: tidy a visit note, write a weekly summary.
// Tried in order; the first that Google accepts is used (older model names get retired)
// Fast models first. Each try gets a time limit; on a missing model or a timeout the next one is tried.
const MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash'];
const TRY_MS = 15000;

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
    let r, j, model;
    for (model of MODELS) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), TRY_MS);
      try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: PROMPTS[task](text) }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
        }),
        signal: ctl.signal
      });
      j = await r.json().catch(() => ({}));
      } catch (e) {
        console.error('Gemini timeout or network error', model, e.name);
        r = null; continue; // too slow: try the next model
      } finally { clearTimeout(timer); }
      if (r.status !== 404) break; // model name not available: try the next one
    }
    if (!r) return res.status(504).json({ error: 'AI took too long to answer. Try again.' });
    if (!r.ok) {
      if (r.status === 429) return res.status(429).json({ error: 'AI daily free limit reached. Try again later.' });
      const why = String((j.error && j.error.message) || r.statusText || '').slice(0, 200);
      console.error('Gemini error', model, r.status, why);
      return res.status(502).json({ error: `AI service error (${r.status}): ${why}` });
    }
    const out = ((j.candidates || [])[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    if (!out) return res.status(502).json({ error: 'AI gave no answer. Try again.' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach the AI service.' });
  }
};
