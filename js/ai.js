/* ClientHub AI — /api/chat (Gemini → Groq). Returns null on failure; app.js supplies rule-based fallbacks. */
(function () {
  const AI = { live: null };
  async function post(body) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 22000);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
      if (!r.ok) throw new Error('http'); const j = await r.json(); if (!j || j.fallback || !j.data) throw new Error('fallback');
      AI.live = true; return j.data;
    } finally { clearTimeout(to); }
  }
  AI.health = async () => { try { const j = await (await fetch('/api/health')).json(); AI.live = !!j.ai; } catch (e) { AI.live = false; } return AI.live; };
  AI.portal = async (history, info, lang, agency) => { try { const d = await post({ mode: 'portal', lang, agency, info, messages: history.slice(-10) }); return { reply: String(d.reply), action: d.action || 'none' }; } catch (e) { return null; } };
  const msg = mode => async (info, lang, agency, messages) => { try { const d = await post({ mode, lang, agency, info, messages }); return d.message ? String(d.message) : null; } catch (e) { return null; } };
  AI.reply = msg('reply'); AI.proposal = msg('proposal'); AI.update = msg('update');
  AI.toLatin = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  window.AI = AI;
})();
