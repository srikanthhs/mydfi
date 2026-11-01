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
    'Use only the data given; do not invent numbers or places. Plain text, short lines starting with "• " for the lists, no markdown, under 120 words.\n\nData:\n' + text,
  agenda: text =>
    'You prepare the agenda for the District Collector\'s monthly review meeting with Heads of Departments (HODs), Mayiladuthurai District, Tamil Nadu.\n' +
    'From the field inspection facts below, write ACTIONABLE agenda points, grouped by department, most serious departments first.\n' +
    'Rules:\n' +
    '- Use ONLY the facts given. Never invent places, numbers, names or issues.\n' +
    '- Each item: the problem in one short line, the place, days pending (number from the facts, or "-"), a concrete action the HOD must take, who is responsible (e.g. "HOD, <department>", or the other department involved), and a deadline date (YYYY-MM-DD) counted from Today: overdue or urgent = 7 days, high = 15 days, others = 30 days.\n' +
    '- Put overdue issues first. Merge duplicates. At most 6 items per department, at most 15 departments.\n' +
    '- In "general", list short cross-cutting points (e.g. departments with no field visits, repeated problems across villages). At most 6.\n' +
    '- Write all text values in the LANGUAGE given at the top (Tamil or English). Keep place and department names as given.\n' +
    'Reply with JSON only, exactly this shape:\n' +
    '{"title": string, "summary": string (one or two sentences), "departments": [{"name": string, "items": [{"issue": string, "place": string, "days_pending": string, "action": string, "responsible": string, "deadline": string}]}], "general": [string]}\n\nFacts:\n' + text
};
PROMPTS.agenda_dept = text =>
  'You prepare action points for ONE department for the District Collector\'s review meeting with Heads of Departments (HODs), Mayiladuthurai District, Tamil Nadu.\n' +
  'Below are ALL field inspection visit notes and open issues for this department. Turn them into a COMPLETE list of actionable agenda points.\n' +
  'Rules:\n' +
  '- Go through EVERY visit and issue. Every problem, shortfall, pending work, complaint or follow-up mentioned must become an action point. Do not leave any out.\n' +
  '- Merge only true duplicates (same problem at the same place). Different places are separate points.\n' +
  '- Skip only visits that report everything is fine and need no action.\n' +
  '- Use ONLY the facts given. Never invent places, numbers, names or problems.\n' +
  '- Each point: issue (one short line), place, days_pending (days since the visit or issue was raised, as a number, from Today), action (a concrete step the HOD must order), responsible ("HOD, <department>" or the other department named in the facts), deadline (YYYY-MM-DD from Today: overdue or urgent = 7 days, needs coordination = 15 days, others = 30 days).\n' +
  '- Order: overdue issues first, then coordination needs, then the rest by days pending (oldest first).\n' +
  '- Write issue, action and responsible in the LANGUAGE given at the top. Keep place names as given.\n' +
  'Reply with JSON only: {"items": [{"issue": string, "place": string, "days_pending": string, "action": string, "responsible": string, "deadline": string}]}\n\nFacts:\n' + text;
const JSON_TASKS = { agenda: true, agenda_dept: true };
const TRY_MS_BY_TASK = { agenda: 28000, agenda_dept: 28000 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: `AI is not set up yet: GEMINI_API_KEY is missing for the ${process.env.VERCEL_ENV || 'current'} environment on Vercel.` });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  const task = body && body.task;
  const text = String((body && body.text) || '').trim().slice(0, 24000);
  if (!PROMPTS[task] || !text) return res.status(400).json({ error: 'Nothing to send.' });

  try {
    let r, j, model;
    for (model of MODELS) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), TRY_MS_BY_TASK[task] || TRY_MS);
      try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: PROMPTS[task](text) }] }],
          generationConfig: Object.assign({ temperature: 0.3, maxOutputTokens: JSON_TASKS[task] ? 8192 : 2048 }, JSON_TASKS[task] ? { responseMimeType: 'application/json' } : {})
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
