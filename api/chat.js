// ClientHub demo — AI endpoint (Gemini first, Groq fallback). Keys come only from Vercel env vars.
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const LANG = { en: 'English', ar: 'Arabic (Saudi-friendly Modern Standard Arabic)', ur: 'Urdu (Urdu script)' };

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 40;
  const arr = (hits.get(ip) || []).filter(t => now - t < win);
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

function clip(s, n) { return String(s == null ? '' : s).slice(0, n); }

function buildPrompt(body) {
  const lang = LANG[body.lang] ? body.lang : 'en';
  const L = LANG[lang];
  const mode = body.mode;
  const agency = clip(body.agency || 'ClientHub Studio', 60);
  const info = clip(JSON.stringify(body.info || {}), 3500);
  if (mode === 'portal') {
    const sys = `You are the AI assistant inside the client portal of the agency "${agency}" (live demo with sample data, Saudi Arabia, amounts in SAR).
You talk to the client described in the data below. Reply in the same language the client writes in (English, Arabic or Urdu); if unclear use ${L}. Friendly and short (max 70 words), like a chat.
Answer ONLY from this client's data (projects, progress, due dates, invoices, files, open tasks). Never invent dates, amounts or promises. If something is not in the data, say the team will confirm and offer to send a message to the project manager.
Never ask for card numbers, passwords or ID numbers. Do not mention JSON, ids or internal fields.
Client data: ${info}
Return strict JSON only: {"reply": string, "action": "none"|"message_team"|"open_invoices"|"open_files"|"open_projects"}`;
    const msgs = (Array.isArray(body.messages) ? body.messages : []).slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: clip(m.text, 500) })).filter(m => m.text);
    return { sys, msgs };
  }
  if (mode === 'reply') {
    const conv = (Array.isArray(body.messages) ? body.messages : []).slice(-6).map(m => `${m.role === 'agent' ? 'Agency' : 'Client'}: ${clip(m.text, 400)}`).join('\n');
    return { sys: `You are a project manager at the digital agency "${agency}" (Saudi Arabia). Suggest the next reply to the client in ${L}. Max 60 words, professional and warm, answer the last message using only the project data given; do not invent dates or facts — if unknown, say you will confirm today. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: `Client data: ${info}\nConversation:\n${conv}\nWrite the agency's next reply.` }] };
  }
  if (mode === 'proposal') return { sys: `You write short project proposals for the digital agency "${agency}" (Saudi Arabia, prices in SAR). Write in ${L}. Use only the given client, service, budget and timeline; do not invent case studies, client counts or guarantees. Structure: greeting line, 1-2 sentence understanding of the need, "Scope" with 4-5 short bullet lines starting with "- ", "Timeline", "Investment" with the given amount, a one-line next step. Max 170 words. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: 'Proposal details: ' + info }] };
  if (mode === 'update') return { sys: `You write the weekly project update a digital agency "${agency}" sends to a client on WhatsApp/email. Write in ${L}. Max 90 words: greeting with the contact's first name, progress of each project with %, what was done, what is next, any invoice due (only if given), friendly closing. One emoji max. Use only the data given. Return strict JSON only: {"message": string}`, msgs: [{ role: 'user', text: 'Client data: ' + info }] };
  return null;
}

function parseJSON(txt) {
  if (!txt) return null;
  let t = String(txt).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}

async function timed(url, opts, ms) {
  const c = new AbortController(); const id = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); } finally { clearTimeout(id); }
}

async function gemini(p) {
  const key = process.env.GEMINI_API_KEY; if (!key) return null;
  const contents = p.msgs.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
  if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  for (const model of GEMINI_MODELS) {
    for (const thinking of [true, false]) {
      const gen = { temperature: 0.5, responseMimeType: 'application/json', maxOutputTokens: 2048 };
      if (thinking) gen.thinkingConfig = { thinkingLevel: 'low' };
      try {
        const r = await timed(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: p.sys }] }, contents, generationConfig: gen }),
        }, 9000);
        if (r.status === 400 && thinking) continue; // retry same model without thinkingConfig
        if (!r.ok) { console.warn('gemini', model, r.status, (await r.text()).slice(0, 200)); break; } // → next model
        const j = await r.json();
        const txt = (j.candidates?.[0]?.content?.parts || []).filter(x => !x.thought).map(x => x.text || '').join('');
        const data = parseJSON(txt);
        if (data) return { data, provider: 'gemini', model };
        console.warn('gemini', model, 'unparsed', j.candidates?.[0]?.finishReason, txt.slice(0, 200));
        break;
      } catch (e) { console.warn('gemini', model, 'error', e && e.name); break; }
    }
  }
  return null;
}

async function groq(p) {
  const key = process.env.GROQ_API_KEY; if (!key) return null;
  try {
    const messages = [{ role: 'system', content: p.sys }, ...p.msgs.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))];
    const r = await timed('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: GROQ_MODEL, messages, temperature: 0.5, max_tokens: 1200, response_format: { type: 'json_object' } }),
    }, 12000);
    if (!r.ok) return null;
    const j = await r.json();
    const data = parseJSON(j.choices?.[0]?.message?.content);
    return data ? { data, provider: 'groq', model: GROQ_MODEL } : null;
  } catch (e) { return null; }
}

function clean(mode, d) {
  if (mode === 'portal') {
    const acts = ['none', 'message_team', 'open_invoices', 'open_files', 'open_projects'];
    const out = { reply: clip(d.reply || d.message || '', 1200), action: acts.includes(d.action) ? d.action : 'none' };
    return out.reply ? out : null;
  }
  return d.message ? { message: clip(d.message, 1600) } : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ error: 'method' })); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  res.setHeader('Content-Type', 'application/json');
  if (limited(ip)) return res.end(JSON.stringify({ fallback: true, reason: 'rate' }));
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};
  const p = buildPrompt(body);
  if (!p) return res.end(JSON.stringify({ fallback: true, reason: 'mode' }));
  const out = (await gemini(p)) || (await groq(p));
  const data = out && clean(body.mode, out.data);
  if (!data) return res.end(JSON.stringify({ fallback: true }));
  return res.end(JSON.stringify({ data, provider: out.provider }));
};
