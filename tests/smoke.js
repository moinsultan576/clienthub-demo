// Smoke tests: node tests/smoke.js [baseUrl]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:4176/';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 860 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.route('https://formsubmit.co/**', r => r.fulfill({ status: 200, body: '{"success":"true"}', contentType: 'application/json' }));
  await p.goto(BASE); await p.evaluate(() => localStorage.clear()); await p.reload();
  for (const l of ['en', 'ar', 'ur']) { await p.evaluate(l => localStorage.setItem('clienthub_prefs', JSON.stringify({ lang: l })), l); await p.reload(); ok(await p.locator('html').getAttribute('dir') === (l === 'en' ? 'ltr' : 'rtl') && await p.locator('.hero h1').isVisible() && await p.locator('.fcard').count() === 8, 'landing renders in ' + l); }
  await p.evaluate(() => localStorage.setItem('clienthub_prefs', JSON.stringify({ lang: 'en' }))); await p.reload();
  // contact form
  let sent = p.waitForRequest(r => r.url().includes('formsubmit.co'));
  await p.click('[data-form=contact] button[type=submit]'); ok(await p.locator('[data-form=contact] .invalid').count() === 2, 'contact form validates');
  await p.fill('[data-form=contact] [name=name]', 'Lead Test'); await p.fill('[data-form=contact] [name=whatsapp]', '0500000000'); await p.click('[data-form=contact] button[type=submit]');
  ok((await sent).postDataJSON().name === 'Lead Test', 'contact form → email');
  // start gate → portal
  await p.click('.hctas [data-act=startPortal]'); await p.waitForSelector('[data-form=start]');
  await p.click('[data-form=start] button[type=submit]'); ok(await p.locator('[data-form=start] .invalid').count() === 2, 'start gate validates');
  sent = p.waitForRequest(r => r.url().includes('formsubmit.co'));
  await p.fill('[data-form=start] [name=name]', 'Demo Visitor'); await p.fill('[data-form=start] [name=email]', 'v@example.com'); await p.click('[data-form=start] button[type=submit]');
  ok((await sent).postDataJSON().email === 'v@example.com' && await p.locator('.welcome h1').isVisible() && (await p.locator('.welcome h1').textContent()).includes('Dr. Ahmed'), 'start gate → client portal (Dr. Ahmed)');
  // portal: approve file, pay invoice, message, AI
  await p.click('[data-act=approveFile] >> nth=0'); ok(await p.evaluate(() => window.__CH.D.files.find(f => f.id === 'f2').approved), 'client approves file');
  await p.click('.duebox [data-act=pay]'); await p.click('[data-act=confirmPay]'); ok(await p.evaluate(() => window.__CH.D.invoices.find(i => i.id === 'INV-1002').status === 'paid'), 'client demo payment');
  await p.keyboard.press('Escape');
  await p.click('.ptabs a[href$="/messages"]'); await p.fill('[data-form=pmsg] input', 'Hello from the portal'); await p.press('[data-form=pmsg] input', 'Enter');
  ok(await p.evaluate(() => window.__CH.D.threads.find(t => t.cid === 'c1').unread === 1), 'client message reaches agency inbox');
  await p.click('.aifab'); await p.click('.wchips button >> nth=0'); await p.waitForFunction(() => document.querySelectorAll('.wm.bot:not(.typing)').length >= 2, null, { timeout: 30000 });
  ok((await p.locator('.wm.bot:not(.typing)').nth(1).textContent()).includes('Website Development'), 'AI assistant answers project status (fallback)');
  await p.fill('.wcomp input', 'do I have any invoice due?'); await p.press('.wcomp input', 'Enter'); await p.waitForFunction(() => document.querySelectorAll('.wm.bot:not(.typing)').length >= 3, null, { timeout: 30000 });
  ok((await p.locator('.wm.bot:not(.typing)').nth(2).textContent()).includes('INV-1003'), 'AI assistant answers invoices');
  await p.click('[data-act=paiClose]');
  await p.click('.ptabs a[href$="/overview"]'); await p.selectOption('[data-act=pclient]', 'c3'); await p.waitForTimeout(200); ok((await p.locator('.welcome h1').textContent()).includes('Sara'), 'switch client in portal');
  // admin dashboard reflects portal actions
  await p.goto(BASE + '#/app/dashboard'); ok(await p.locator('.kpi').count() === 4 && await p.locator('.chart').count() >= 3, 'dashboard KPIs + charts');
  ok((await p.locator('.alist').textContent()).includes('Payment received from Rehman Dental Clinic'), 'portal payment shows in Recent Activities');
  for (const k of ['deadlines', 'clients', 'payments', 'active']) { await p.click(`[data-act=dtab][data-v=${k}]`); }
  ok(await p.locator('.tbl tbody tr').count() > 0, 'dashboard tabs');
  for (const pg of ['clients', 'projects', 'tasks', 'messages', 'files', 'invoices', 'proposals', 'tickets', 'team', 'reports', 'settings']) { await p.goto(BASE + '#/app/' + pg); ok(await p.locator('.phead h1').isVisible(), 'page ' + pg); }
  // projects
  await p.goto(BASE + '#/app/projects'); await p.click('[data-act=addProject]'); await p.selectOption('[data-form=project] [name=svc]', 'seo'); await p.click('[data-form=project] button[type=submit]');
  ok(await p.evaluate(() => window.__CH.D.projects[0].svc === 'seo'), 'add project');
  await p.click('.tbl tbody tr >> nth=1'); await p.selectOption('[data-act=pstatus]', 'done'); ok(await p.evaluate(() => window.__CH.D.projects[1].status === 'done' && window.__CH.D.projects[1].progress === 100), 'project status → done');
  await p.keyboard.press('Escape');
  // tasks drag
  await p.goto(BASE + '#/app/tasks'); const id = await p.locator('.kcol[data-col=todo] .kcard').first().getAttribute('data-id');
  const from = await p.locator(`.kcard[data-id="${id}"] .kc-t b`).boundingBox(), to = await p.locator('.kcol[data-col=review]').boundingBox();
  await p.mouse.move(from.x + 10, from.y + 5); await p.mouse.down(); await p.mouse.move(to.x + 60, to.y + 40, { steps: 8 }); await p.mouse.up();
  ok(await p.evaluate(id => window.__CH.D.tasks.find(k => k.id === id).status === 'review', id), 'kanban drag to Review');
  await p.selectOption(`[data-act=kmove][data-id="${id}"]`, 'done'); ok(await p.evaluate(id => window.__CH.D.tasks.find(k => k.id === id).status === 'done', id), 'kanban status menu');
  // messages AI reply
  await p.goto(BASE + '#/app/messages'); await p.click('.ichat >> nth=0'); await p.click('[data-act=aiReply]'); await p.waitForFunction(() => document.querySelector('.mcomp input').value.length > 10, null, { timeout: 30000 });
  await p.press('.mcomp input', 'Enter'); ok(await p.locator('.msg.me').count() > 0, 'AI reply draft + send');
  // weekly update
  await p.goto(BASE + '#/app/clients'); await p.click('[data-act=weekly] >> nth=0'); await p.waitForSelector('.draft textarea', { timeout: 30000 }); ok((await p.inputValue('.draft textarea')).includes('%'), 'AI weekly update draft');
  await p.keyboard.press('Escape');
  // proposals
  await p.goto(BASE + '#/app/proposals'); await p.click('[data-act=addProposal]'); await p.click('[data-form=proposal] button[type=submit]'); await p.waitForSelector('#po-text', { timeout: 30000 });
  await p.click('[data-act=savePo]'); ok(await p.evaluate(() => window.__CH.D.proposals[0].text.length > 50), 'AI proposal saved');
  await p.click('[data-act=poStatus][data-v=accepted]'); await p.click('[data-act=poProject] >> nth=0'); ok(await p.evaluate(() => window.__CH.D.proposals.some(x => x.project)), 'proposal → project');
  // invoices
  await p.goto(BASE + '#/app/invoices'); await p.click('[data-act=addInvoice]'); await p.click('[data-form=invoice] button[type=submit]'); ok(await p.evaluate(() => window.__CH.D.invoices[0].id === 'INV-1026'), 'create invoice');
  await p.click('[data-act=markPaid] >> nth=0'); ok(await p.evaluate(() => window.__CH.D.invoices[0].status === 'paid'), 'mark invoice paid');
  await p.click('[data-act=invView] >> nth=0'); ok(await p.locator('.inv').isVisible(), 'invoice view'); await p.keyboard.press('Escape');
  // tickets, team, files, reports
  await p.goto(BASE + '#/app/tickets'); await p.click('[data-act=resolve] >> nth=0'); ok(await p.evaluate(() => window.__CH.D.tickets[0].status === 'resolved'), 'resolve ticket');
  await p.goto(BASE + '#/app/files'); await p.setInputFiles('[data-act=upload]', { name: 'Test_Brief.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x'.repeat(2000)) }); ok(await p.evaluate(() => window.__CH.D.files[0].name === 'Test_Brief.pdf'), 'upload file');
  await p.goto(BASE + '#/app/reports'); const dl = p.waitForEvent('download'); await p.click('[data-act=export][data-v=invoices]'); ok(!!(await dl), 'CSV export');
  await p.fill('.top .search input', 'rehman'); ok(await p.locator('#sres.open button').count() > 0, 'global search');
  await p.click('[data-act=theme]'); ok(await p.locator('html').getAttribute('data-theme') === 'dark', 'theme toggle'); await p.click('[data-act=theme]');
  await p.click('[data-act=menu][data-id=user]'); await p.click('.ddm [data-act=logout]'); ok(await p.locator('.hero').isVisible(), 'logout');
  for (const w of [360, 390, 768]) for (const l of ['en', 'ar', 'ur']) {
    const m = await b.newContext({ viewport: { width: w, height: 800 } }); const q = await m.newPage(); q.on('pageerror', e => errs.push(e.message));
    await q.goto(BASE); await q.evaluate(l => { localStorage.setItem('clienthub_prefs', JSON.stringify({ lang: l })); localStorage.setItem('clienthub_user', JSON.stringify({ name: 'A Very Long Visitor Name', email: 'a@b.co' })); }, l);
    const bad = [];
    for (const h of ['', '#/app/dashboard', '#/app/clients', '#/app/projects', '#/app/messages', '#/app/files', '#/app/invoices', '#/app/proposals', '#/app/tickets', '#/app/team', '#/app/reports', '#/app/settings', '#/portal/c1/overview', '#/portal/c1/projects', '#/portal/c1/files', '#/portal/c1/invoices', '#/portal/c1/messages']) {
      await q.goto(BASE + h); await q.reload(); await q.waitForTimeout(100); const o = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) bad.push(h + ':' + o);
    }
    await q.goto(BASE + '#/app/tasks'); await q.reload(); const o2 = await q.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o2 > 0) bad.push('tasks:' + o2);
    ok(!bad.length, `no overflow ${w}px ${l} ${bad.join(' ')}`); await m.close();
  }
  ok(!errs.length, 'no JS errors ' + errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
