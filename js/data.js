/* ClientHub demo — seeded sample data (no real clients) */
(function () {
  const H = 3600000, D = 86400000;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const tri = (en, ar, ur) => ({ en, ar, ur });
  const SERVICES = ['webdev', 'web', 'crm', 'crmsetup', 'dm', 'mkt', 'app', 'brand', 'seo', 'smm', 'bot', 'ads', 'voice', 'landing', 'booking'];
  const CITIES = ['riyadh', 'jeddah', 'dammam', 'makkah', 'khobar', 'madinah'];

  function seed() {
    const R = rng(20261121), now = Date.now(), r = (a, b) => a + Math.floor(R() * (b - a + 1));
    const team = [
      { id: 't1', name: tri('Hamza Ali', 'حمزة علي', 'حمزہ علی'), role: 'pm', email: 'hamza@clienthub.demo' },
      { id: 't2', name: tri('Ayesha Raza', 'عائشة رضا', 'عائشہ رضا'), role: 'design', email: 'ayesha@clienthub.demo' },
      { id: 't3', name: tri('Yousef Al-Otaibi', 'يوسف العتيبي', 'یوسف العتیبی'), role: 'dev', email: 'yousef@clienthub.demo' },
      { id: 't4', name: tri('Lina Haddad', 'لينا حداد', 'لینا حداد'), role: 'mkt', email: 'lina@clienthub.demo' },
      { id: 't5', name: tri('Bilal Ahmed', 'بلال أحمد', 'بلال احمد'), role: 'dev', email: 'bilal@clienthub.demo' },
      { id: 't6', name: tri('Maha Al-Saud', 'مها السعود', 'مہا السعود'), role: 'support', email: 'maha@clienthub.demo' },
    ];
    const clients = [
      ['c1', tri('Rehman Dental Clinic', 'عيادة الرحمن لطب الأسنان', 'رحمان ڈینٹل کلینک'), tri('Dr. Ahmed Al-Rehman', 'د. أحمد الرحمن', 'ڈاکٹر احمد الرحمن'), 'health', 'jeddah'],
      ['c2', tri('Al-Rehman Co.', 'شركة الرحمن', 'الرحمن کمپنی'), tri('Abdulrahman Al-Shehri', 'عبدالرحمن الشهري', 'عبدالرحمن الشہری'), 'trade', 'riyadh'],
      ['c3', tri('Bright Tech', 'برايت تك', 'برائٹ ٹیک'), tri('Sara Khan', 'سارة خان', 'سارہ خان'), 'tech', 'riyadh'],
      ['c4', tri('Saudi Home', 'البيت السعودي', 'سعودی ہوم'), tri('Ahmed Al-Fahad', 'أحمد الفهد', 'احمد الفہد'), 'realestate', 'jeddah'],
      ['c5', tri('Riyadh Properties', 'عقارات الرياض', 'ریاض پراپرٹیز'), tri('Omar Ali', 'عمر علي', 'عمر علی'), 'realestate', 'riyadh'],
      ['c6', tri('Smart Education', 'التعليم الذكي', 'اسمارٹ ایجوکیشن'), tri('Fatimah Al-Zahrani', 'فاطمة الزهراني', 'فاطمہ الزہرانی'), 'edu', 'dammam'],
      ['c7', tri('Jeddah Bites', 'لقمة جدة', 'جدہ بائٹس'), tri('Khalid Al-Harbi', 'خالد الحربي', 'خالد الحربی'), 'food', 'jeddah'],
      ['c8', tri('Noor Beauty Lounge', 'صالون نور للتجميل', 'نور بیوٹی لاؤنج'), tri('Noura Al-Qahtani', 'نورة القحطاني', 'نورہ القحطانی'), 'beauty', 'riyadh'],
      ['c9', tri('Al Waha Travel', 'الواحة للسفر', 'الواحہ ٹریول'), tri('Faisal Al-Otaibi', 'فيصل العتيبي', 'فیصل العتیبی'), 'travel', 'makkah'],
      ['c10', tri('Desert Fit Gym', 'نادي ديزرت فِت', 'ڈیزرٹ فٹ جم'), tri('Turki Al-Ghamdi', 'تركي الغامدي', 'ترکی الغامدی'), 'fitness', 'khobar'],
      ['c11', tri('Najd Auto Care', 'نجد للعناية بالسيارات', 'نجد آٹو کیئر'), tri('Saad Al-Dosari', 'سعد الدوسري', 'سعد الدوسری'), 'auto', 'riyadh'],
      ['c12', tri('Hijaz Legal', 'حجاز للمحاماة', 'حجاز لیگل'), tri('Reem Al-Saeed', 'ريم السعيد', 'ریم السعید'), 'legal', 'jeddah'],
    ].map(([id, name, contact, industry, city], i) => ({ id, name, contact, industry, city, phone: '+966 5' + r(0, 9) + ' ' + r(100, 999) + ' ' + r(1000, 9999), email: 'contact@' + name.en.toLowerCase().replace(/[^a-z]/g, '') + '.demo', since: now - r(20, 400) * D, color: ['#7c3aed', '#2563eb', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#f97316', '#0891b2', '#4f46e5'][i] }));

    // [id, client, service, progress, status, dueDays, budget, lead]
    const P = [
      ['p1', 'c1', 'webdev', 75, 'progress', 9, 18000, 't3'], ['p2', 'c1', 'crmsetup', 45, 'progress', 21, 22000, 't5'], ['p3', 'c1', 'mkt', 60, 'progress', 14, 9500, 't4'],
      ['p4', 'c2', 'web', 75, 'progress', 6, 15000, 't3'], ['p5', 'c3', 'crm', 45, 'progress', 13, 32000, 't5'], ['p6', 'c4', 'dm', 60, 'hold', 20, 12000, 't4'],
      ['p7', 'c5', 'app', 0, 'notstarted', 37, 28000, 't2'], ['p8', 'c6', 'brand', 90, 'progress', 4, 8500, 't2'], ['p9', 'c7', 'smm', 55, 'progress', 16, 6000, 't4'],
      ['p10', 'c7', 'booking', 30, 'hold', 30, 14000, 't5'], ['p11', 'c8', 'bot', 80, 'progress', 5, 11000, 't3'], ['p12', 'c9', 'ads', 35, 'progress', 18, 7500, 't4'],
      ['p13', 'c10', 'landing', 0, 'notstarted', 25, 4500, 't2'], ['p14', 'c11', 'seo', 50, 'progress', 40, 9000, 't4'], ['p15', 'c12', 'voice', 0, 'notstarted', 45, 19000, 't3'],
      ['p16', 'c5', 'crmsetup', 20, 'hold', 28, 16000, 't5'], ['p17', 'c9', 'webdev', 0, 'notstarted', 50, 17000, 't3'], ['p18', 'c3', 'seo', 40, 'hold', 33, 8000, 't4'],
      ['p19', 'c2', 'brand', 100, 'done', -6, 7000, 't2'], ['p20', 'c4', 'web', 100, 'done', -12, 16000, 't3'], ['p21', 'c6', 'webdev', 100, 'done', -3, 21000, 't5'],
      ['p22', 'c8', 'smm', 100, 'done', -18, 5500, 't4'], ['p23', 'c10', 'app', 100, 'done', -9, 26000, 't2'], ['p24', 'c11', 'landing', 100, 'done', -22, 4000, 't3'],
      ['p25', 'c12', 'brand', 100, 'done', -15, 6500, 't2'], ['p26', 'c1', 'brand', 100, 'done', -26, 6000, 't2'], ['p27', 'c3', 'landing', 100, 'done', -2, 4500, 't3'],
    ];
    const projects = P.map(([id, cid, svc, progress, status, due, budget, lead]) => ({ id, cid, svc, progress, status, due: now + due * D + r(0, 8) * H, budget, lead, start: now - r(20, 75) * D, done: status === 'done' ? now + due * D : null }));

    // tasks: [title key, project, assignee, status, dueDays, priority]
    const T = [
      ['tk.home', 'p1', 't2', 'done', -2, 'high'], ['tk.booking', 'p1', 't3', 'doing', 3, 'high'], ['tk.qa', 'p1', 't6', 'todo', 7, 'med'], ['tk.content', 'p1', 't4', 'review', 1, 'med'],
      ['tk.import', 'p2', 't5', 'doing', 5, 'high'], ['tk.train', 'p2', 't1', 'todo', 15, 'low'], ['tk.pipeline', 'p2', 't5', 'todo', 9, 'med'],
      ['tk.adsCopy', 'p3', 't4', 'review', 2, 'med'], ['tk.creatives', 'p3', 't2', 'doing', 4, 'high'],
      ['tk.mobile', 'p4', 't3', 'doing', 2, 'high'], ['tk.speed', 'p4', 't3', 'todo', 5, 'med'], ['tk.seoMeta', 'p4', 't4', 'todo', 6, 'low'],
      ['tk.dashboard', 'p5', 't5', 'doing', 6, 'high'], ['tk.api', 'p5', 't3', 'todo', 10, 'high'], ['tk.reports', 'p5', 't5', 'todo', 12, 'med'],
      ['tk.calendar', 'p6', 't4', 'todo', 8, 'med'], ['tk.wireframes', 'p7', 't2', 'todo', 14, 'med'], ['tk.logo', 'p8', 't2', 'review', 1, 'high'], ['tk.guide', 'p8', 't2', 'doing', 3, 'med'],
      ['tk.calendar', 'p9', 't4', 'doing', 2, 'med'], ['tk.reels', 'p9', 't2', 'todo', 4, 'low'], ['tk.flows', 'p11', 't3', 'review', 0, 'high'], ['tk.arabic', 'p11', 't6', 'doing', 2, 'med'],
      ['tk.keywords', 'p12', 't4', 'doing', 3, 'med'], ['tk.audit', 'p14', 't4', 'done', -4, 'med'], ['tk.backlinks', 'p14', 't4', 'todo', 11, 'low'], ['tk.script', 'p15', 't3', 'todo', 16, 'med'],
      ['tk.wireframes', 'p13', 't2', 'todo', 6, 'low'], ['tk.import', 'p16', 't5', 'todo', 13, 'med'], ['tk.kickoff', 'p17', 't1', 'todo', 4, 'med'], ['tk.keywords', 'p18', 't4', 'todo', 9, 'low'],
      ['tk.launch', 'p21', 't3', 'done', -3, 'high'], ['tk.handover', 'p20', 't1', 'done', -11, 'med'], ['tk.report', 'p22', 't4', 'done', -17, 'low'], ['tk.store', 'p23', 't5', 'done', -9, 'high'], ['tk.invoice', 'p27', 't6', 'done', -2, 'low'],
      ['tk.kickoff', 'p10', 't1', 'review', 2, 'low'], ['tk.qa', 'p11', 't6', 'todo', 4, 'med'],
    ];
    const tasks = T.map(([k, pid, who, status, due, pri], i) => ({ id: 'k' + (i + 1), k, pid, who, status, due: now + due * D, pri }));

    const files = [
      ['Clinic_Design_Final.pdf', 'p1', 2.0, 26, 't2', true], ['CRM_Training_Guide.pdf', 'p2', 4.0, 27, 't5', false], ['Marketing_Plan.docx', 'p3', 1.5, 28, 't4', true],
      ['Homepage_v3.fig', 'p4', 6.2, 30, 't2', false], ['Brand_Guidelines.pdf', 'p8', 8.4, 31, 't2', false], ['CRM_Data_Map.xlsx', 'p5', 0.6, 33, 't5', true],
      ['Content_Calendar_Nov.xlsx', 'p9', 0.4, 35, 't4', true], ['Chatbot_Flows.pdf', 'p11', 1.1, 36, 't3', false], ['Ad_Creatives.zip', 'p12', 24.5, 40, 't2', true],
      ['SEO_Audit_Report.pdf', 'p14', 3.3, 44, 't4', true], ['Sitemap.png', 'p7', 0.9, 46, 't2', false], ['Logo_Pack.zip', 'p19', 12.2, 60, 't2', true],
    ].map(([name, pid, mb, h, by, ok], i) => ({ id: 'f' + (i + 1), name, pid, cid: projects.find(p => p.id === pid).cid, size: mb, at: now - h * H * 1.2, by, approved: ok }));

    // invoices: [client, project, amount, issuedDaysAgo, dueDays, status]
    const I = [
      ['c1', 'p1', 9000, 20, -6, 'paid'], ['c1', 'p2', 11000, 6, 8, 'pending'], ['c1', 'p3', 4750, 3, 12, 'pending'],
      ['c2', 'p4', 7500, 18, -4, 'paid'], ['c2', 'p19', 7000, 30, -16, 'paid'], ['c3', 'p5', 16000, 12, 2, 'pending'], ['c3', 'p27', 4500, 9, -2, 'paid'],
      ['c4', 'p20', 8000, 26, -12, 'paid'], ['c4', 'p6', 6000, 22, -8, 'overdue'], ['c5', 'p16', 8000, 15, -1, 'overdue'], ['c6', 'p21', 10500, 14, -3, 'paid'], ['c6', 'p8', 4250, 5, 10, 'pending'],
      ['c7', 'p9', 3000, 16, -2, 'paid'], ['c8', 'p11', 5500, 8, 6, 'pending'], ['c8', 'p22', 5500, 24, -10, 'paid'], ['c9', 'p12', 3750, 11, 3, 'pending'],
      ['c10', 'p23', 13000, 19, -5, 'paid'], ['c11', 'p24', 4000, 28, -14, 'paid'], ['c11', 'p14', 4500, 4, 11, 'pending'], ['c12', 'p25', 6500, 21, -7, 'paid'],
      ['c2', 'p4', 7500, 50, -36, 'paid'], ['c10', 'p23', 13000, 48, -34, 'paid'], ['c6', 'p21', 10500, 55, -41, 'paid'], ['c3', 'p5', 16000, 62, -48, 'paid'], ['c9', 'p12', 3750, 44, -30, 'paid'],
    ];
    const invoices = I.map(([cid, pid, amount, ago, due, status], i) => ({ id: 'INV-' + (1001 + i), cid, pid, amount, issued: now - ago * D, due: now + due * D, status, paidAt: status === 'paid' ? now - (ago - r(2, 10)) * D : null }));

    const m = (from, ago, en, ar, ur) => ({ from, at: now - ago, t: tri(en, ar, ur) });
    const threads = [
      { cid: 'c4', unread: 2, msgs: [m('me', 30 * H, 'Hi Ahmed, the campaign landing page is ready for your review.', 'مرحباً أحمد، صفحة الحملة جاهزة لمراجعتك.', 'ہیلو احمد، کیمپین لینڈنگ پیج آپ کے ریویو کے لیے تیار ہے۔'), m('client', 3 * H, 'Thanks! Looks good overall.', 'شكراً! تبدو جيدة بشكل عام.', 'شکریہ! مجموعی طور پر اچھا ہے۔'), m('client', 25 * 60000, 'Can you share the final design files?', 'هل يمكنكم مشاركة ملفات التصميم النهائية؟', 'کیا آپ فائنل ڈیزائن فائلز شیئر کر سکتے ہیں؟')] },
      { cid: 'c3', unread: 1, msgs: [m('me', 26 * H, 'Sara, we pushed the new dashboard to staging.', 'سارة، رفعنا لوحة التحكم الجديدة على بيئة الاختبار.', 'سارہ، نیا ڈیش بورڈ اسٹیجنگ پر ڈال دیا ہے۔'), m('client', 2.4 * H, 'The website is looking great!', 'الموقع يبدو رائعاً!', 'ویب سائٹ بہت اچھی لگ رہی ہے!')] },
      { cid: 'c5', unread: 0, msgs: [m('client', 28 * H, 'When will the next update be ready?', 'متى سيكون التحديث القادم جاهزاً؟', 'اگلی اپڈیٹ کب تک تیار ہوگی؟')] },
      { cid: 'c1', unread: 0, msgs: [m('me', 50 * H, 'Dr. Ahmed, the booking page design is uploaded to your portal.', 'د. أحمد، تم رفع تصميم صفحة الحجز في بوابتك.', 'ڈاکٹر احمد، بکنگ پیج کا ڈیزائن آپ کے پورٹل پر اپلوڈ کر دیا ہے۔'), m('client', 46 * H, 'Great, I approved it. Can patients book on WhatsApp too?', 'ممتاز، وافقت عليه. هل يمكن للمرضى الحجز عبر واتساب أيضاً؟', 'زبردست، میں نے منظور کر دیا۔ کیا مریض واٹس ایپ پر بھی بکنگ کر سکیں گے؟'), m('me', 45 * H, 'Yes — WhatsApp booking is part of the CRM setup phase.', 'نعم — الحجز عبر واتساب ضمن مرحلة إعداد نظام CRM.', 'جی ہاں — واٹس ایپ بکنگ CRM سیٹ اپ والے مرحلے میں شامل ہے۔')] },
      { cid: 'c7', unread: 0, msgs: [m('client', 70 * H, 'Please add the new lunch menu to this week’s posts.', 'يرجى إضافة قائمة الغداء الجديدة لمنشورات هذا الأسبوع.', 'براہ کرم اس ہفتے کی پوسٹس میں نیا لنچ مینو شامل کریں۔'), m('me', 68 * H, 'Done ✅ Scheduled for Thursday and Friday.', 'تم ✅ مجدولة يوم الخميس والجمعة.', 'ہو گیا ✅ جمعرات اور جمعہ کے لیے شیڈول ہے۔')] },
      { cid: 'c8', unread: 0, msgs: [m('client', 96 * H, 'Can the chatbot answer in English and Arabic?', 'هل يستطيع الشات بوت الرد بالعربية والإنجليزية؟', 'کیا چیٹ بوٹ انگریزی اور عربی دونوں میں جواب دے سکتا ہے؟'), m('me', 95 * H, 'Yes, both — and it hands over to your team for bookings.', 'نعم، باللغتين — ويحوّل الحجوزات لفريقك.', 'جی، دونوں میں — اور بکنگ کے لیے آپ کی ٹیم کو منتقل کر دیتا ہے۔')] },
    ];
    const tickets = [
      { id: 'TK-208', cid: 'c4', subj: 'tks.form', pri: 'high', status: 'open', at: now - 5 * H, who: 't6' },
      { id: 'TK-207', cid: 'c1', subj: 'tks.email', pri: 'med', status: 'open', at: now - 20 * H, who: 't3' },
      { id: 'TK-206', cid: 'c7', subj: 'tks.menu', pri: 'low', status: 'open', at: now - 30 * H, who: 't4' },
      { id: 'TK-205', cid: 'c10', subj: 'tks.app', pri: 'high', status: 'resolved', at: now - 52 * H, who: 't5' },
      { id: 'TK-204', cid: 'c3', subj: 'tks.access', pri: 'med', status: 'resolved', at: now - 80 * H, who: 't6' },
    ];
    const proposals = [
      { id: 'PR-31', cid: 'c5', svc: 'crm', amount: 24000, status: 'sent', at: now - 2 * D, text: '' },
      { id: 'PR-30', cid: 'c9', svc: 'bot', amount: 9500, status: 'accepted', at: now - 6 * D, text: '' },
      { id: 'PR-29', cid: 'c11', svc: 'smm', amount: 5000, status: 'draft', at: now - 9 * D, text: '' },
    ];
    const activity = [
      { k: 'act.msg', v: { c: 'c4' }, at: now - 2 * 60000, ic: 'message' },
      { k: 'act.files', v: { c: 'c1' }, at: now - 10 * 60000, ic: 'file' },
      { k: 'act.paid', v: { c: 'c3', amt: 4500 }, at: now - H, ic: 'card' },
      { k: 'act.milestone', v: { c: 'c6' }, at: now - 3 * H, ic: 'flag' },
      { k: 'act.approved', v: { c: 'c1' }, at: now - 46 * H, ic: 'check' },
    ];
    return { v: 1, seededAt: now, team, clients, projects, tasks, files, invoices, threads, tickets, proposals, activity, notifs: [
      { k: 'act.msg', v: { c: 'c4' }, at: now - 2 * 60000, read: false }, { k: 'act.paid', v: { c: 'c3', amt: 4500 }, at: now - H, read: false }, { k: 'act.files', v: { c: 'c1' }, at: now - 10 * 60000, read: false },
    ], aiLog: [] };
  }
  window.SEED = { seed, SERVICES, CITIES };
})();
