/* ════════════════════════════════════════════════════════════════════
   ROXTAM GRAPHIX — Web App
   --------------------------------------------------------------------
   Frontend for the Roxtam Graphix business system.
   Data lives in the Google Sheet (single source of truth); this app
   reads/writes it through the Apps Script API (backend/Code.gs).
   Works in: desktop browser, phone browser, and the Reddit Devvit app.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── Config / API URL ─────────────────────────────────────────────── */
const CFG = window.ROXTAM_CONFIG || { apiUrl: '', apiKey: '' };
const LS_URL_KEY = 'roxtam_api_url';
const LS_KEY_KEY = 'roxtam_api_key';

function apiUrl() {
  try { return localStorage.getItem(LS_URL_KEY) || CFG.apiUrl || ''; }
  catch (e) { return CFG.apiUrl || ''; }
}
function apiKey() {
  try { return localStorage.getItem(LS_KEY_KEY) || CFG.apiKey || ''; }
  catch (e) { return CFG.apiKey || ''; }
}
function setApiUrl(u) {
  CFG.apiUrl = u;
  try { localStorage.setItem(LS_URL_KEY, u); } catch (e) {}
}
function setApiKey(k) {
  CFG.apiKey = k;
  try { localStorage.setItem(LS_KEY_KEY, k); } catch (e) {}
}

/* ── API layer ────────────────────────────────────────────────────── */
const cache = {};
function api(action, payload, opts) {
  opts = opts || {};
  const url = apiUrl();
  if (!url) return Promise.reject(new Error('NOT_CONNECTED'));
  const ck = action + ':' + JSON.stringify(payload || {});
  if (!opts.noCache && cache[ck] && (Date.now() - cache[ck].t) < 30000) {
    return Promise.resolve(cache[ck].data);
  }
  const body = { action: action, payload: payload || {} };
  const key = apiKey();
  if (key) body.key = key;
  return fetch(url, {
    method: 'POST',
    // text/plain avoids CORS preflight — Apps Script parses the JSON body
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  }).then(function (r) {
    if (!r.ok) throw new Error('Network error (HTTP ' + r.status + ')');
    return r.json();
  }).then(function (res) {
    if (!res.ok) throw new Error(res.error || 'API error');
    if (!opts.noCache) { cache[ck] = { t: Date.now(), data: res.data }; }
    return res.data;
  }).catch(function (err) {
    if (err && err.message === 'NOT_CONNECTED') {
      showConnect();
      throw err;
    }
    throw err;
  });
}
function invalidate(action) {
  Object.keys(cache).forEach(function (k) {
    if (k.indexOf(action + ':') === 0) delete cache[k];
  });
}

/* ── Utilities ────────────────────────────────────────────────────── */
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function tzs(n) {
  const v = Math.round(Number(n) || 0);
  return 'TZS ' + v.toLocaleString('en-US');
}
function fmtDate(d) {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return String(d);
  return x.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][x.getMonth()] + ' ' + x.getFullYear();
}
function fmtMonth(d) {
  if (!d) return '';
  const x = new Date(d);
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][x.getMonth()] + ' ' + x.getFullYear();
}
function dateInput(d) {
  const x = d ? new Date(d) : new Date();
  const p = function (n) { return String(n).padStart(2, '0'); };
  return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate());
}
function monthKey(d) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
}
function badge(text, kind) {
  return '<span class="badge b-' + (kind || 'gray') + '">' + esc(text) + '</span>';
}
function statusBadge(s) {
  const map = { Paid: 'green', Partial: 'gold', Unpaid: 'red', Overdue: 'red', Refunded: 'gray',
    Completed: 'green', 'In Progress': 'blue', Pending: 'gold', Cancelled: 'red', 'On Hold': 'orange' };
  return badge(s, map[s] || 'gray');
}
function toast(msg, type) {
  const box = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(function () { t.remove(); }, 3600);
}
function spinner() {
  return '<div class="loading"><div class="spinner"></div><p>Loading…</p></div>';
}
function empty(msg) {
  return '<div class="empty"><div class="big">📭</div><p>' + esc(msg || 'Nothing here yet.') + '</p></div>';
}
function errorBox(msg) {
  return '<div class="error-box">⚠️ ' + esc(msg) + '</div>';
}

/* ── Icons (inline SVG, minimal set) ──────────────────────────────── */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/><path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="M9 12h6M9 16h4"/></svg>',
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5A5 5 0 0 1 21 19"/></svg>',
  attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9 15l2 2 4-4"/></svg>',
  worker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/><path d="M12 14v3M10.5 15.5L12 17l1.5-1.5"/></svg>',
  expenses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M3 9h18"/></svg>',
  commissions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.7 7.1 18.2l.9-5.5-4-3.9L9.5 8z"/></svg>',
  services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16M6 12h12M8 19h8"/><circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/></svg>',
  invoice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z"/><path d="M9 8h6M9 12h6"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3h14v18l-2.3-1.7L14.5 21l-2.5-1.8L9.5 21l-2.2-1.7L5 21z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.3 3a7 7 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 3h5l.3-3a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z"/></svg>'
};

/* ── Navigation ───────────────────────────────────────────────────── */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { id: 'orders', label: 'Orders', icon: ICONS.orders },
  { id: 'customers', label: 'Customers', icon: ICONS.customers },
  { id: 'attendance', label: 'Attendance', icon: ICONS.attendance },
  { id: 'worker', label: 'Worker Payments', icon: ICONS.worker },
  { id: 'expenses', label: 'Expenses', icon: ICONS.expenses },
  { id: 'commissions', label: 'Commissions', icon: ICONS.commissions },
  { id: 'services', label: 'Services', icon: ICONS.services },
  { id: 'reports', label: 'Reports', icon: ICONS.reports },
  { id: 'invoice', label: 'Invoices', icon: ICONS.invoice },
  { id: 'receipt', label: 'Receipts', icon: ICONS.receipt },
  { id: 'settings', label: 'Settings', icon: ICONS.settings }
];
const TITLES = {};
NAV.forEach(function (n) { TITLES[n.id] = n.label; });

let currentPage = 'dashboard';
const pageState = { orders: { q: '', status: '', pay: '', rate: '', service: '', from: '', to: '' },
                    attendance: { m: monthKey(new Date()) },
                    reports: { type: 'daily' },
                    invoice: { id: '' }, receipt: { id: '' } };

function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map(function (n) {
    return '<a href="#/' + n.id + '" data-page="' + n.id + '">' + n.icon + '<span>' + esc(n.label) + '</span></a>';
  }).join('');
  nav.querySelectorAll('a').forEach(function (a) {
    a.onclick = function (e) { e.preventDefault(); navigate(a.dataset.page); };
  });

  const bottom = document.getElementById('bottom-nav');
  const tabs = [
    { id: 'dashboard', label: 'Home' },
    { id: 'orders', label: 'Orders' },
    { id: 'attendance', label: 'Attendance' }
  ];
  bottom.innerHTML = tabs.map(function (t) {
    return '<button data-page="' + t.id + '">' + ICONS[t.id] + '<span>' + t.label + '</span></button>';
  }).join('') + '<button id="fab-add" class="fab" aria-label="New order">＋</button>' +
    '<button id="more-btn">' + ICONS.settings + '<span>More</span></button>';
  bottom.querySelectorAll('button[data-page]').forEach(function (b) {
    b.onclick = function () { navigate(b.dataset.page); };
  });
}

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('#nav a').forEach(function (a) {
    a.classList.toggle('active', a.dataset.page === page);
  });
  document.querySelectorAll('#bottom-nav button[data-page]').forEach(function (b) {
    b.classList.toggle('active', b.dataset.page === page);
  });
  document.getElementById('page-title').textContent = TITLES[page] || 'Roxtam Graphix';
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('drawer-overlay').classList.add('hidden');
  renderPage(page);
  try { location.hash = '#/' + page; } catch (e) {}
}

/* ── Router ───────────────────────────────────────────────────────── */
window.addEventListener('hashchange', function () {
  const page = (location.hash || '').replace('#/', '') || 'dashboard';
  if (NAV.some(function (n) { return n.id === page; })) navigate(page);
});

/* ── Page render dispatch ─────────────────────────────────────────── */
function renderPage(page) {
  const view = document.getElementById('view');
  view.innerHTML = spinner();
  const fns = {
    dashboard: renderDashboard, orders: renderOrders, customers: renderCustomers,
    attendance: renderAttendance, worker: renderWorker, expenses: renderExpenses,
    commissions: renderCommissions, services: renderServices, reports: renderReports,
    invoice: renderInvoice, receipt: renderReceipt, settings: renderSettings
  };
  Promise.resolve().then(function () {
    try { fns[page](); } catch (e) { view.innerHTML = errorBox(e.message); }
  });
}

/* ── Modal / confirm ──────────────────────────────────────────────── */
function openModal(title, html, wide) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal').classList.toggle('wide', !!wide);
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}
function confirmDialog(message, okLabel, onOk, danger) {
  openModal('Confirm',
    '<p style="margin:0 0 18px">' + esc(message) + '</p>' +
    '<div class="form-actions"><button class="btn" id="confirm-cancel">Cancel</button>' +
    '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" id="confirm-ok">' + esc(okLabel || 'OK') + '</button></div>');
  document.getElementById('confirm-cancel').onclick = closeModal;
  document.getElementById('confirm-ok').onclick = function () { closeModal(); onOk(); };
}

/* ── Connect screen ───────────────────────────────────────────────── */
function showConnect() {
  const view = document.getElementById('view');
  view.innerHTML =
    '<div class="card connect-card">' +
    '<h2>Connect to your Google Sheet</h2>' +
    '<p class="muted">The app reads and writes your existing Roxtam Graphix spreadsheet through a small API. Set it up once:</p>' +
    '<ol>' +
    '<li>Open your spreadsheet → Extensions → Apps Script</li>' +
    '<li>Paste the code from <b>webapp/backend/Code.gs</b> and Save</li>' +
    '<li>Deploy → New deployment → Web app → Execute as: <b>Me</b>, Access: <b>Anyone</b></li>' +
    '<li>Copy the Web app URL (ends with /exec) and paste it below</li>' +
    '</ol>' +
    '<div class="field"><label>Apps Script Web App URL</label>' +
    '<input id="conn-url" type="text" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(apiUrl()) + '"></div>' +
    '<div class="field" style="margin-top:10px"><label>API Key (optional)</label>' +
    '<input id="conn-key" type="text" placeholder="Leave empty if you did not set ROXTAM_API_KEY" value="' + esc(apiKey()) + '"></div>' +
    '<div class="form-actions"><button class="btn btn-primary" id="conn-save">Connect &amp; Test</button></div>' +
    '<div id="conn-msg"></div></div>';
  document.getElementById('conn-save').onclick = function () {
    const u = document.getElementById('conn-url').value.trim();
    const k = document.getElementById('conn-key').value.trim();
    const msg = document.getElementById('conn-msg');
    if (!u) { msg.innerHTML = errorBox('Please paste the Web App URL.'); return; }
    setApiUrl(u); setApiKey(k);
    msg.innerHTML = spinner();
    api('getSettings', {}, { noCache: true }).then(function (s) {
      msg.innerHTML = '<div class="error-box" style="background:#E2F7EF;border-color:#7ed6b8;color:#008060">✅ Connected to «' + esc(s.business.name || 'Roxtam Graphix') + '». Loading…</div>';
      setTimeout(function () { navigate('dashboard'); }, 600);
    }).catch(function (err) {
      msg.innerHTML = errorBox('Could not connect: ' + err.message + '<br>Check the URL and that the deployment has access "Anyone".');
    });
  };
}

/* ════════════════════════════════════════════════════════════════════
   PAGES
   ════════════════════════════════════════════════════════════════════ */

/* ── Dashboard ────────────────────────────────────────────────────── */
function renderDashboard() {
  const view = document.getElementById('view');
  api('getDashboard').then(function (d) {
    const s = d.sales, p = d.profit, w = d.worker;
    const kpis = [
      ['TODAY\'S SALES', tzs(s.today), s.todayOrders + ' orders'],
      ['TODAY\'S PROFIT', tzs(s.todayProfit), tzs(s.todayExpenses) + ' expenses'],
      ['THIS WEEK', tzs(s.week), ''],
      ['THIS MONTH', tzs(s.month), ''],
      ['TOTAL SALES', tzs(s.total), s.totalOrders + ' orders'],
      ['OUTSTANDING', tzs(d.outstanding), 'customer balances'],
      ['NET PROFIT (MTD)', tzs(p.netProfit), ''],
      ['ELIGIBLE PROFIT (MTD)', tzs(p.eligibleProfit), '']
    ];
    view.innerHTML =
      '<div class="grid kpi-grid">' + kpis.map(function (k) {
        return '<div class="card kpi"><div class="label">' + esc(k[0]) + '</div>' +
          '<div class="value">' + esc(k[1]) + '</div><div class="sub">' + esc(k[2]) + '</div></div>';
      }).join('') + '</div>' +

      '<h3 class="section-title">Worker — ' + (w ? fmtMonth(w.month) : 'this month') + '</h3>' +
      '<div class="grid kpi-grid">' + (w ? [
        ['DAYS REPORTED', String(w.days), ''],
        ['WORKER SHARE', tzs(w.share), 'Completed orders only'],
        ['TRANSPORT', tzs(w.transport), ''],
        ['TOTAL DUE', tzs(w.totalDue), 'Due ' + fmtDate(w.dueDate)],
        ['AMOUNT PAID', tzs(w.paid), ''],
        ['BALANCE', tzs(w.balance), statusBadge(w.status)]
      ] : [['WORKER', '—', 'No month row yet — go to Worker Payments']]).map(function (k) {
        return '<div class="card kpi"><div class="label">' + esc(k[0]) + '</div>' +
          '<div class="value">' + esc(k[1]) + '</div><div class="sub">' + esc(k[2]) + '</div></div>';
      }).join('') + '</div>' +

      '<h3 class="section-title">Sales &amp; profit</h3>' +
      '<div class="grid cols-2">' +
      '<div class="card chart-card"><h3>Sales — last 30 days</h3><div class="chart-box">' +
        svgLine(d.charts.daily.map(function (x) { return x.label; }),
          [{ name: 'Sales', color: '#E17055', values: d.charts.daily.map(function (x) { return x.sales; }) },
           { name: 'Profit', color: '#00B894', values: d.charts.daily.map(function (x) { return x.profit; }) }]) +
        '</div><div class="legend"><span><i style="background:#E17055"></i>Sales</span><span><i style="background:#00B894"></i>Profit</span></div></div>' +
      '<div class="card chart-card"><h3>Orders by status</h3><div class="chart-box">' +
        svgDoughnut([['Pending', d.orderStatuses.Pending || 0, '#FDCB6E'],
          ['In Progress', d.orderStatuses['In Progress'] || 0, '#0984E3'],
          ['Completed', d.orderStatuses.Completed || 0, '#00B894'],
          ['Cancelled', d.orderStatuses.Cancelled || 0, '#D63031']]) + '</div></div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-top:14px">' +
      '<div class="card chart-card"><h3>Monthly revenue</h3><div class="chart-box">' +
        svgBars(d.charts.monthly.map(function (x) { return x.label; }),
          [{ name: 'Revenue', color: '#2D3436', values: d.charts.monthly.map(function (x) { return x.revenue; }) }]) + '</div></div>' +
      '<div class="card chart-card"><h3>Payment status</h3><div class="chart-box">' +
        svgDoughnut([['Paid', d.paymentStatuses.Paid || 0, '#00B894'],
          ['Partial', d.paymentStatuses.Partial || 0, '#FDCB6E'],
          ['Unpaid', d.paymentStatuses.Unpaid || 0, '#D63031'],
          ['Overdue', d.paymentStatuses.Overdue || 0, '#E17055']]) + '</div></div>' +
      '</div>' +

      '<div class="grid cols-2" style="margin-top:14px">' +
      '<div class="card chart-card"><h3>Sales by service (top 12)</h3><div class="chart-box">' +
        svgBarsH(d.charts.serviceSales) + '</div></div>' +
      '<div class="card chart-card"><h3>Worker costs by month (share + transport)</h3><div class="chart-box">' +
        svgBars(d.charts.monthly.map(function (x) { return x.label; }),
          [{ name: 'Worker cost', color: '#6C5CE7', values: d.charts.monthly.map(function (x) { return x.workerCost; }) }]) +
        '</div></div>' +
      '</div>';
  }).catch(function (err) {
    view.innerHTML = errorBox('Could not load dashboard: ' + err.message) +
      '<button class="btn" onclick="renderPage(\'dashboard\')">Retry</button>';
  });
}

/* ── Orders ───────────────────────────────────────────────────────── */
function renderOrders() {
  const view = document.getElementById('view');
  Promise.all([api('listOrders'), api('getSettings')]).then(function (r) {
    const orders = r[0], settings = r[1];
    const st = pageState.orders;
    const svcs = settings.lists.services;
    let list = orders;
    if (st.q) {
      const q = st.q.toLowerCase();
      list = list.filter(function (o) {
        return [o.id, o.customer, o.phone, o.email, o.service, o.description].join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }
    if (st.status) list = list.filter(function (o) { return o.orderStatus === st.status; });
    if (st.pay) list = list.filter(function (o) { return o.payStatus === st.pay; });
    if (st.rate) list = list.filter(function (o) { return o.shareRate === st.rate; });
    if (st.service) list = list.filter(function (o) { return o.service === st.service; });
    if (st.from || st.to) {
      const f = st.from ? new Date(st.from) : null, t = st.to ? new Date(st.to) : null;
      list = list.filter(function (o) {
        if (!o.date) return false;
        const d = new Date(o.date);
        if (f && d < f) return false;
        if (t && d > new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59)) return false;
        return true;
      });
    }

    const statuses = settings.lists.orderStatuses;
    const pays = ['Paid', 'Partial', 'Unpaid', 'Overdue', 'Refunded'];
    const rates = settings.lists.shareTypes.map(function (x) { return x.label; });

    view.innerHTML =
      '<div class="toolbar">' +
      '<div class="search"><input id="q" placeholder="Search order ID, customer, phone, service…" value="' + esc(st.q) + '"></div>' +
      '<select id="f-status"><option value="">All statuses</option>' + statuses.map(function (x) { return '<option' + (st.status === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select id="f-pay"><option value="">All payments</option>' + pays.map(function (x) { return '<option' + (st.pay === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select id="f-rate"><option value="">All rates</option>' + rates.map(function (x) { return '<option' + (st.rate === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select id="f-service"><option value="">All services</option>' + svcs.map(function (x) { return '<option' + (st.service === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<input type="date" id="f-from" value="' + esc(st.from) + '" title="From">' +
      '<input type="date" id="f-to" value="' + esc(st.to) + '" title="To">' +
      '<button class="btn btn-primary" id="new-order">+ New Order</button>' +
      '</div>' +
      '<div id="orders-list">' + ordersTable(list) + '</div>';

    document.getElementById('new-order').onclick = openOrderForm;
    document.getElementById('q').oninput = function () { st.q = this.value; refreshOrdersList(); };
    ['f-status', 'f-pay', 'f-rate', 'f-service', 'f-from', 'f-to'].forEach(function (id) {
      document.getElementById(id).onchange = function () {
        st.status = document.getElementById('f-status').value;
        st.pay = document.getElementById('f-pay').value;
        st.rate = document.getElementById('f-rate').value;
        st.service = document.getElementById('f-service').value;
        st.from = document.getElementById('f-from').value;
        st.to = document.getElementById('f-to').value;
        refreshOrdersList();
      };
    });
  }).catch(function (err) {
    view.innerHTML = errorBox('Could not load orders: ' + err.message);
  });
}

function refreshOrdersList() {
  const box = document.getElementById('orders-list');
  if (!box) return;
  box.innerHTML = spinner();
  Promise.all([api('listOrders', {}, { noCache: true }), api('getSettings')]).then(function (r) {
    const orders = r[0], st = pageState.orders;
    let list = orders;
    if (st.q) {
      const q = st.q.toLowerCase();
      list = list.filter(function (o) {
        return [o.id, o.customer, o.phone, o.email, o.service, o.description].join(' ').toLowerCase().indexOf(q) !== -1;
      });
    }
    if (st.status) list = list.filter(function (o) { return o.orderStatus === st.status; });
    if (st.pay) list = list.filter(function (o) { return o.payStatus === st.pay; });
    if (st.rate) list = list.filter(function (o) { return o.shareRate === st.rate; });
    if (st.service) list = list.filter(function (o) { return o.service === st.service; });
    if (st.from || st.to) {
      const f = st.from ? new Date(st.from) : null, t = st.to ? new Date(st.to) : null;
      list = list.filter(function (o) {
        if (!o.date) return false;
        const d = new Date(o.date);
        if (f && d < f) return false;
        if (t && d > new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59)) return false;
        return true;
      });
    }
    box.innerHTML = ordersTable(list);
    bindOrdersTable();
  });
}

function ordersTable(list) {
  if (!list.length) return empty('No orders match.');
  const rows = list.map(function (o) {
    return '<tr data-row="' + o.row + '">' +
      '<td><b>' + esc(o.id) + '</b><div class="muted" style="font-size:11px">' + fmtDate(o.date) + '</div></td>' +
      '<td>' + esc(o.customer) + '</td>' +
      '<td>' + esc(o.service) + '</td>' +
      '<td class="num">' + tzs(o.total) + '</td>' +
      '<td class="num">' + tzs(o.paid) + '</td>' +
      '<td class="num">' + tzs(o.balance) + '</td>' +
      '<td>' + statusBadge(o.payStatus) + '</td>' +
      '<td>' + statusBadge(o.orderStatus) + '</td>' +
      '<td class="num">' + tzs(o.workerShare) + '</td>' +
      '<td><div class="actions">' +
      '<button class="icon-btn" data-act="view" title="View">👁</button>' +
      '<button class="icon-btn" data-act="edit" title="Edit">✎</button>' +
      '<button class="icon-btn" data-act="del" title="Delete">🗑</button>' +
      '</div></td></tr>';
  }).join('');
  return '<div class="card table-wrap"><table class="tbl"><thead><tr>' +
    '<th>Order</th><th>Customer</th><th>Service</th><th class="num">Total</th>' +
    '<th class="num">Paid</th><th class="num">Balance</th><th>Payment</th><th>Status</th>' +
    '<th class="num">Worker Share</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function bindOrdersTable() {
  document.querySelectorAll('#orders-list tbody tr').forEach(function (tr) {
    tr.onclick = function (e) {
      if (e.target.closest('button')) return;
      showOrderDetail(Number(tr.dataset.row));
    };
    tr.querySelector('[data-act="view"]').onclick = function () { showOrderDetail(Number(tr.dataset.row)); };
    tr.querySelector('[data-act="edit"]').onclick = function () { openOrderForm(Number(tr.dataset.row)); };
    tr.querySelector('[data-act="del"]').onclick = function () { deleteOrderFlow(Number(tr.dataset.row)); };
  });
}

function shareRateOptions(settings, current) {
  return settings.lists.shareTypes.map(function (x) {
    return '<option value="' + esc(x.label) + '"' + (current === x.label ? ' selected' : '') + '>' + esc(x.label) +
      (x.rate > 0 ? ' (' + Math.round(x.rate * 100) + '%)' : '') + '</option>';
  }).join('');
}

function orderFormHTML(settings, o) {
  o = o || {};
  const customers = settings.customers || [];
  const svcs = settings.lists.services;
  const statuses = settings.lists.orderStatuses;
  return '<div class="form-grid">' +
    '<div class="field"><label>Customer Name <span class="req">*</span></label>' +
    '<input id="of-customer" list="customer-list" value="' + esc(o.customer || '') + '" placeholder="Type or pick existing…">' +
    '<datalist id="customer-list">' + customers.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></div>' +
    '<div class="field"><label>Phone</label><input id="of-phone" value="' + esc(o.phone || '') + '"></div>' +
    '<div class="field"><label>Email</label><input id="of-email" type="email" value="' + esc(o.email || '') + '"></div>' +
    '<div class="field"><label>Date</label><input id="of-date" type="date" value="' + dateInput(o.date || new Date()) + '"></div>' +
    '<div class="field"><label>Service <span class="req">*</span></label>' +
    '<select id="of-service"><option value="">— Select —</option>' +
    svcs.map(function (x) { return '<option value="' + esc(x) + '"' + (o.service === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Description</label><input id="of-desc" value="' + esc(o.description || '') + '"></div>' +
    '<div class="field"><label>Quantity <span class="req">*</span></label><input id="of-qty" type="number" min="1" step="1" value="' + (o.qty || 1) + '"></div>' +
    '<div class="field"><label>Unit Price (TZS) <span class="req">*</span></label><input id="of-price" type="number" min="0" step="any" value="' + (o.unitPrice || '') + '"></div>' +
    '<div class="field"><label>Discount (TZS)</label><input id="of-disc" type="number" min="0" step="any" value="' + (o.discount || 0) + '"></div>' +
    '<div class="field"><label>Amount Paid (TZS)</label><input id="of-paid" type="number" min="0" step="any" value="' + (o.paid || 0) + '"></div>' +
    '<div class="field"><label>Order Status</label><select id="of-status">' +
    statuses.map(function (x) { return '<option value="' + esc(x) + '"' + ((o.orderStatus || 'Pending') === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Direct Expense (TZS)</label><input id="of-dexp" type="number" min="0" step="any" value="' + (o.directExpense || 0) + '"></div>' +
    '<div class="field"><label>Commission (TZS)</label><input id="of-comm" type="number" min="0" step="any" value="' + (o.commission || 0) + '"></div>' +
    '<div class="field full"><label>Worker Share Rate <span class="req">*</span></label>' +
    '<select id="of-rate">' + shareRateOptions(settings, o.shareRate || settings.defaultRate) + '</select></div>' +
    '<div class="field full"><label>Notes</label><textarea id="of-notes">' + esc(o.notes || '') + '</textarea></div>' +
    '</div>' +
    '<div class="card" style="margin-top:14px;background:var(--light)"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
    '<div><div class="muted" style="font-size:11px">SUBTOTAL</div><b id="calc-sub">TZS 0</b></div>' +
    '<div><div class="muted" style="font-size:11px">TOTAL</div><b id="calc-total">TZS 0</b></div>' +
    '<div><div class="muted" style="font-size:11px">BALANCE</div><b id="calc-bal">TZS 0</b></div>' +
    '<div><div class="muted" style="font-size:11px">WORKER SHARE (preview)</div><b id="calc-share">TZS 0</b></div>' +
    '</div></div>' +
    '<div id="form-err"></div>' +
    '<div class="form-actions"><button class="btn" id="of-cancel">Cancel</button>' +
    '<button class="btn btn-primary" id="of-save">' + (o.row ? 'Save Changes' : 'Save Order') + '</button></div>';
}

function bindOrderCalc(settings) {
  const read = function (id) { return document.getElementById(id).value; };
  const calc = function () {
    const qty = Number(read('of-qty')) || 0;
    const price = Number(read('of-price')) || 0;
    const disc = Number(read('of-disc')) || 0;
    const paid = Number(read('of-paid')) || 0;
    const sub = qty * price;
    const total = Math.max(0, sub - disc);
    const bal = Math.max(0, total - paid);
    const rateLabel = read('of-rate');
    const st = settings.lists.shareTypes.filter(function (x) { return x.label === rateLabel; });
    const share = Math.round(total * (st.length ? st[0].rate : 0));
    document.getElementById('calc-sub').textContent = tzs(sub);
    document.getElementById('calc-total').textContent = tzs(total);
    document.getElementById('calc-bal').textContent = tzs(bal);
    document.getElementById('calc-share').textContent = tzs(share);
  };
  ['of-qty', 'of-price', 'of-disc', 'of-paid', 'of-rate'].forEach(function (id) {
    document.getElementById(id).oninput = calc;
  });
  calc();
}

function openOrderForm(row) {
  Promise.all([api('getSettings'), api('getReport', { type: 'customers' })]).then(function (r) {
    const settings = r[0];
    settings.customers = r[1].map(function (c) { return c.name; });
    settings.defaultRate = settings.lists.shareTypes.length ? settings.lists.shareTypes[0].label : '';
    let order = null;
    const proceed = function () {
      openModal(order ? 'Edit Order ' + order.id : 'New Order', orderFormHTML(settings, order), true);
      document.getElementById('of-cancel').onclick = closeModal;
      bindOrderCalc(settings);
      document.getElementById('of-save').onclick = function () {
        const errBox = document.getElementById('form-err');
        const payload = {
          row: order ? order.row : undefined,
          customer: document.getElementById('of-customer').value,
          phone: document.getElementById('of-phone').value,
          email: document.getElementById('of-email').value,
          date: document.getElementById('of-date').value,
          service: document.getElementById('of-service').value,
          description: document.getElementById('of-desc').value,
          qty: document.getElementById('of-qty').value,
          unitPrice: document.getElementById('of-price').value,
          discount: document.getElementById('of-disc').value,
          paid: document.getElementById('of-paid').value,
          orderStatus: document.getElementById('of-status').value,
          directExpense: document.getElementById('of-dexp').value,
          commission: document.getElementById('of-comm').value,
          shareRate: document.getElementById('of-rate').value,
          notes: document.getElementById('of-notes').value
        };
        const btn = document.getElementById('of-save');
        btn.disabled = true; btn.textContent = 'Saving…';
        const act = order ? 'updateOrder' : 'createOrder';
        api(act, payload, { noCache: true }).then(function (res) {
          invalidate('listOrders'); invalidate('getDashboard'); invalidate('getReport'); invalidate('getWorkerPayments');
          closeModal();
          toast(res.message || 'Order saved.', 'ok');
          const o = res.order;
          if (o) {
            confirmDialog(
              'Order ' + o.id + ' saved successfully.\n\nOrder Total: ' + tzs(o.total) +
              '\nWorker Share Rate: ' + o.shareRate +
              '\nWorker Share: ' + tzs(o.workerShare) + '\n\nGenerate an invoice for this order?',
              'Generate Invoice', function () { pageState.invoice.id = o.id; navigate('invoice'); }, false);
          } else if (currentPage === 'orders') { renderOrders(); }
        }).catch(function (err) {
          btn.disabled = false; btn.textContent = order ? 'Save Changes' : 'Save Order';
          errBox.innerHTML = errorBox(err.message);
        });
      };
    };
    if (row) {
      api('listOrders', {}, { noCache: true }).then(function (orders) {
        order = orders.filter(function (o) { return o.row === row; })[0];
        proceed();
      });
    } else { proceed(); }
  }).catch(function (err) { toast(err.message, 'err'); });
}

function showOrderDetail(row) {
  api('listOrders', {}, { noCache: true }).then(function (orders) {
    const o = orders.filter(function (x) { return x.row === row; })[0];
    if (!o) { toast('Order not found.', 'err'); return; }
    openModal('Order ' + o.id,
      '<div class="grid cols-2" style="grid-template-columns:1fr 1fr">' +
      '<div><h4>Order</h4><p class="muted">' + fmtDate(o.date) + '<br>' + statusBadge(o.orderStatus) + ' ' + statusBadge(o.payStatus) + '</p></div>' +
      '<div><h4>Customer</h4><p class="muted">' + esc(o.customer) + '<br>' + esc(o.phone) + '<br>' + esc(o.email) + '</p></div>' +
      '<div><h4>Service</h4><p class="muted">' + esc(o.service) + '<br>' + esc(o.description) + '<br>Qty ' + o.qty + ' × ' + tzs(o.unitPrice) + '<br>Discount ' + tzs(o.discount) + '</p></div>' +
      '<div><h4>Financial</h4><p class="muted">Total <b>' + tzs(o.total) + '</b><br>Paid ' + tzs(o.paid) + '<br>Balance ' + tzs(o.balance) + '<br>Direct exp ' + tzs(o.directExpense) + ' · Commission ' + tzs(o.commission) + '<br>Eligible profit ' + tzs(o.profit) + '</p></div>' +
      '<div><h4>Worker</h4><p class="muted">Julieth Johnson<br>Rate: ' + esc(o.shareRate) + '<br>Share: <b>' + tzs(o.workerShare) + '</b></p></div>' +
      '<div><h4>Notes</h4><p class="muted">' + esc(o.notes || '—') + '</p></div>' +
      '</div>' +
      '<div class="form-actions">' +
      '<button class="btn" id="od-inv">🧾 Invoice</button>' +
      '<button class="btn" id="od-rcp">🧾 Receipt</button>' +
      '<button class="btn" id="od-print">🖨 Print</button>' +
      '<button class="btn" id="od-edit">✎ Edit</button>' +
      '<button class="btn btn-danger" id="od-del">🗑 Delete</button>' +
      '</div>', true);
    document.getElementById('od-inv').onclick = function () { closeModal(); pageState.invoice.id = o.id; navigate('invoice'); };
    document.getElementById('od-rcp').onclick = function () { closeModal(); pageState.receipt.id = o.id; navigate('receipt'); };
    document.getElementById('od-print').onclick = function () { closeModal(); printOrder(o); };
    document.getElementById('od-edit').onclick = function () { closeModal(); openOrderForm(o.row); };
    document.getElementById('od-del').onclick = function () { closeModal(); deleteOrderFlow(o.row); };
  });
}

function deleteOrderFlow(row) {
  confirmDialog('Are you sure you want to delete this order? It will be archived to the "Archive" sheet.', 'Delete Order', function () {
    api('deleteOrder', { row: row }, { noCache: true }).then(function (res) {
      invalidate('listOrders'); invalidate('getDashboard'); invalidate('getReport');
      toast(res.message, 'ok');
      if (currentPage === 'orders') renderOrders();
    }).catch(function (err) { toast('Delete failed: ' + err.message, 'err'); });
  }, true);
}

function printOrder(o) {
  const w = window.open('', '_blank');
  if (!w) { toast('Please allow pop-ups to print.', 'err'); return; }
  w.document.write(
    '<html><head><title>Order ' + esc(o.id) + '</title>' +
    '<style>body{font-family:Arial,sans-serif;padding:24px;font-size:13px} table{width:100%;border-collapse:collapse;margin:12px 0} td,th{border:1px solid #ccc;padding:6px 9px;text-align:left} h2{margin:0} .muted{color:#666}</style></head><body>' +
    '<h2>ROXTAM GRAPHIX — Order ' + esc(o.id) + '</h2>' +
    '<p class="muted">' + fmtDate(o.date) + ' · ' + esc(o.orderStatus) + ' · ' + esc(o.payStatus) + '</p>' +
    '<table><tr><th>Customer</th><td>' + esc(o.customer) + ' · ' + esc(o.phone) + ' · ' + esc(o.email) + '</td></tr>' +
    '<tr><th>Service</th><td>' + esc(o.service) + ' — ' + esc(o.description) + '</td></tr>' +
    '<tr><th>Quantity</th><td>' + o.qty + ' × ' + tzs(o.unitPrice) + '</td></tr>' +
    '<tr><th>Total</th><td>' + tzs(o.total) + '</td></tr>' +
    '<tr><th>Paid</th><td>' + tzs(o.paid) + '</td></tr>' +
    '<tr><th>Balance</th><td>' + tzs(o.balance) + '</td></tr>' +
    '<tr><th>Worker Share</th><td>' + esc(o.shareRate) + ' → ' + tzs(o.workerShare) + '</td></tr></table>' +
    '<script>window.onload=function(){window.print()}<\/script></body></html>');
  w.document.close();
}

/* ── Customers ────────────────────────────────────────────────────── */
function renderCustomers() {
  const view = document.getElementById('view');
  api('getReport', { type: 'customers' }).then(function (customers) {
    if (!customers.length) { view.innerHTML = empty('No customers yet — add an order first.'); return; }
    view.innerHTML =
      '<div class="card table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Customer</th><th>Phone</th><th>Orders</th><th class="num">Total Sales</th>' +
      '<th class="num">Paid</th><th class="num">Balance</th><th>Last Order</th></tr></thead><tbody>' +
      customers.map(function (c) {
        return '<tr data-cust="' + esc(c.name) + '"><td><b>' + esc(c.name) + '</b><div class="muted" style="font-size:11px">' + esc(c.email) + '</div></td>' +
          '<td>' + esc(c.phone) + '</td><td class="num">' + c.orders + '</td>' +
          '<td class="num">' + tzs(c.sales) + '</td><td class="num">' + tzs(c.paid) + '</td>' +
          '<td class="num">' + tzs(c.balance) + '</td><td>' + fmtDate(c.lastOrder) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    view.querySelectorAll('tbody tr').forEach(function (tr) {
      tr.onclick = function () {
        const name = tr.dataset.cust;
        api('listOrders').then(function (orders) {
          const mine = orders.filter(function (o) { return o.customer === name; });
          openModal('Orders — ' + name,
            '<div class="card table-wrap" style="border:none;box-shadow:none">' + ordersTable(mine) + '</div>', true);
          document.querySelectorAll('#modal tbody tr').forEach(function (mtr) {
            mtr.onclick = function () { const r = Number(mtr.dataset.row); closeModal(); showOrderDetail(r); };
          });
        });
      };
    });
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

/* ── Attendance ───────────────────────────────────────────────────── */
function renderAttendance() {
  const view = document.getElementById('view');
  const mk = pageState.attendance.m;
  const m = new Date(Number(mk.split('-')[0]), Number(mk.split('-')[1]) - 1, 1);
  const fee = null;
  api('getAttendance', {}).then(function (rows) {
    const byKey = {};
    rows.forEach(function (r) { byKey[r.dateKey] = r.present; });
    const year = m.getFullYear(), month = m.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const todayKey = dateInput(new Date());
    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const yes = !!byKey[key];
      const isToday = key === todayKey;
      cells += '<div class="att-day' + (yes ? ' yes' : '') + (isToday ? ' today' : '') + '" data-key="' + key + '">' +
        '<div class="d">' + ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(year, month, d).getDay()] + '</div>' +
        '<div class="n">' + d + '</div>' + (yes ? '<div style="font-size:10px;color:#008060;font-weight:700">✓</div>' : '<div style="font-size:10px;color:transparent">·</div>') +
        '</div>';
    }
    const reported = rows.filter(function (r) { return r.present && r.dateKey.indexOf(mk) === 0; }).length;
    api('getSettings').then(function (settings) {
      const fee = settings.financial.transportFee;
      view.innerHTML =
        '<div class="toolbar">' +
        '<button class="btn" id="att-prev">← Prev</button>' +
        '<b style="font-size:15px;min-width:120px;text-align:center">' + fmtMonth(m) + '</b>' +
        '<button class="btn" id="att-next">Next →</button>' +
        '<span class="chip on" id="att-sum">' + reported + ' days · ' + tzs(reported * fee) + '</span>' +
        '<button class="btn" id="att-today">Today</button>' +
        '</div>' +
        '<div class="card"><div class="att-grid">' + cells + '</div></div>' +
        '<p class="muted" style="margin-top:10px;font-size:12px">Tap a day to mark Julieth Johnson present (transport = ' + tzs(fee) + '/day). Marked days go green and update Worker Payments automatically.</p>';
      document.getElementById('att-prev').onclick = function () {
        pageState.attendance.m = monthKey(new Date(year, month - 1, 1)); renderAttendance();
      };
      document.getElementById('att-next').onclick = function () {
        pageState.attendance.m = monthKey(new Date(year, month + 1, 1)); renderAttendance();
      };
      document.getElementById('att-today').onclick = function () {
        pageState.attendance.m = monthKey(new Date()); renderAttendance();
      };
      view.querySelectorAll('.att-day').forEach(function (el) {
        el.onclick = function () {
          const key = el.dataset.key;
          const currently = el.classList.contains('yes');
          el.classList.toggle('yes');
          el.querySelector('.n');
          el.innerHTML = el.innerHTML.replace(/✓|·/, '');
          const lbl = document.createElement('div');
          lbl.style.cssText = 'font-size:10px;font-weight:700;color:#008060';
          lbl.textContent = currently ? '·' : '✓';
          if (!currently) { lbl.style.color = '#008060'; } else { lbl.style.cssText = 'font-size:10px;color:transparent'; }
          el.appendChild(lbl);
          api('setAttendance', { date: key, present: !currently }, { noCache: true }).then(function () {
            invalidate('getAttendance'); invalidate('getWorkerPayments'); invalidate('getDashboard');
            const days = reported + (currently ? -1 : 1);
            document.getElementById('att-sum').textContent = days + ' days · ' + tzs(Math.max(0, days) * fee);
          }).catch(function (err) {
            toast('Could not update attendance: ' + err.message, 'err');
            el.classList.toggle('yes');
            renderAttendance();
          });
        };
      });
    });
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

/* ── Worker Payments ──────────────────────────────────────────────── */
function renderWorker() {
  const view = document.getElementById('view');
  api('getWorkerPayments').then(function (rows) {
    view.innerHTML =
      '<div class="toolbar"><span class="muted">Julieth Johnson — paid on the 1st of each month. Only Completed orders count towards the share.</span>' +
      '<button class="btn" id="wp-add">+ Add 3 months</button></div>' +
      '<div class="card table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Month</th><th class="num">Days</th><th class="num">Transport</th><th class="num">Worker Share</th>' +
      '<th class="num">Total Due</th><th class="num">Amount Paid</th><th class="num">Balance</th><th>Status</th><th>Due Date</th></tr></thead><tbody>' +
      rows.map(function (w) {
        return '<tr data-row="' + w.row + '"><td><b>' + fmtMonth(w.month) + '</b></td>' +
          '<td class="num">' + w.daysReported + '</td>' +
          '<td class="num">' + tzs(w.transportFee) + '</td>' +
          '<td class="num">' + tzs(w.workerShare) + '</td>' +
          '<td class="num"><b>' + tzs(w.totalDue) + '</b></td>' +
          '<td class="num"><div style="display:flex;gap:6px;justify-content:flex-end;align-items:center">' +
          '<input type="number" min="0" step="any" class="wp-paid" data-row="' + w.row + '" value="' + w.amountPaid + '" style="width:110px;padding:6px 9px;border:1px solid #d4d9de;border-radius:7px;text-align:right">' +
          '<button class="btn btn-sm wp-save" data-row="' + w.row + '">Save</button></div></td>' +
          '<td class="num">' + tzs(w.balance) + '</td>' +
          '<td>' + statusBadge(w.status) + '</td>' +
          '<td>' + fmtDate(w.dueDate) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="muted" style="margin-top:10px;font-size:12px">Enter what you paid on the 1st → status updates automatically (Paid / Partial / Pending).</p>';

    document.getElementById('wp-add').onclick = function () {
      api('addWorkerMonths', { count: 3 }, { noCache: true }).then(function () {
        invalidate('getWorkerPayments'); toast('Added 3 more months.', 'ok'); renderWorker();
      }).catch(function (err) { toast(err.message, 'err'); });
    };
    view.querySelectorAll('.wp-save').forEach(function (btn) {
      btn.onclick = function () {
        const row = Number(btn.dataset.row);
        const val = view.querySelector('.wp-paid[data-row="' + row + '"]').value;
        api('saveWorkerPayment', { row: row, amountPaid: val }, { noCache: true }).then(function () {
          invalidate('getWorkerPayments'); invalidate('getDashboard'); invalidate('getReport');
          toast('Payment saved.', 'ok'); renderWorker();
        }).catch(function (err) { toast(err.message, 'err'); });
      };
    });
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

/* ── Expenses ─────────────────────────────────────────────────────── */
function renderExpenses() {
  const view = document.getElementById('view');
  Promise.all([api('listExpenses'), api('getSettings')]).then(function (r) {
    const rows = r[0], settings = r[1];
    const cats = settings.lists.paymentMethods;
    view.innerHTML =
      '<div class="toolbar"><button class="btn btn-primary" id="ex-add">+ Add Expense</button>' +
      '<span class="muted">Total: <b id="ex-total">' + tzs(rows.reduce(function (s, x) { return s + x.amount; }, 0)) + '</b></span></div>' +
      '<div class="card table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Date</th><th>Category</th><th>Description</th><th class="num">Amount</th><th>Method</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (e) {
        return '<tr><td>' + fmtDate(e.date) + '</td><td>' + esc(e.category) + '</td><td>' + esc(e.description) + '</td>' +
          '<td class="num">' + tzs(e.amount) + '</td><td>' + esc(e.method) + '</td>' +
          '<td><div class="actions"><button class="icon-btn" data-row="' + e.row + '" data-act="edit">✎</button>' +
          '<button class="icon-btn" data-row="' + e.row + '" data-act="del">🗑</button></div></td></tr>';
      }).join('') : '<tr><td colspan="6">' + empty('No expenses yet.') + '</td></tr>') +
      '</tbody></table></div>';
    document.getElementById('ex-add').onclick = function () { expenseForm(); };
    view.querySelectorAll('[data-act="edit"]').forEach(function (b) {
      b.onclick = function () { expenseForm(Number(b.dataset.row)); };
    });
    view.querySelectorAll('[data-act="del"]').forEach(function (b) {
      b.onclick = function () {
        confirmDialog('Are you sure you want to delete this expense?', 'Delete', function () {
          api('deleteExpense', { row: Number(b.dataset.row) }, { noCache: true }).then(function () {
            invalidate('listExpenses'); invalidate('getDashboard'); invalidate('getReport');
            toast('Expense deleted.', 'ok'); renderExpenses();
          });
        }, true);
      };
    });
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

function expenseForm(row) {
  Promise.all([api('listExpenses', {}, { noCache: true }), api('getSettings')]).then(function (r) {
    const e = row ? r[0].filter(function (x) { return x.row === row; })[0] : null;
    const settings = r[1];
    const cats = ['Printing', 'Internet', 'Transport', 'Commission', 'Materials', 'Software', 'Equipment',
      'Electricity', 'Rent', 'Marketing', 'Stationery', 'Maintenance', 'Subscriptions',
      'Professional Fees', 'Taxes', 'Other', 'Salary'];
    openModal(e ? 'Edit Expense' : 'Add Expense',
      '<div class="form-grid">' +
      '<div class="field"><label>Date</label><input id="ef-date" type="date" value="' + dateInput(e ? e.date : new Date()) + '"></div>' +
      '<div class="field"><label>Category</label><select id="ef-cat">' + cats.map(function (c) {
        return '<option' + (e && e.category === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field full"><label>Description</label><input id="ef-desc" value="' + esc(e ? e.description : '') + '"></div>' +
      '<div class="field"><label>Amount (TZS) <span class="req">*</span></label><input id="ef-amt" type="number" min="0" step="any" value="' + (e ? e.amount : '') + '"></div>' +
      '<div class="field"><label>Payment Method</label><select id="ef-method">' +
      (settings.lists.paymentMethods || ['Cash']).map(function (m) {
        return '<option' + (e && e.method === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field full"><label>Notes</label><input id="ef-notes" value="' + esc(e ? e.notes : '') + '"></div>' +
      '</div><div id="ef-err"></div>' +
      '<div class="form-actions"><button class="btn" id="ef-cancel">Cancel</button>' +
      '<button class="btn btn-primary" id="ef-save">' + (e ? 'Save Changes' : 'Add Expense') + '</button></div>');
    document.getElementById('ef-cancel').onclick = closeModal;
    document.getElementById('ef-save').onclick = function () {
      const payload = { row: e ? e.row : undefined, date: document.getElementById('ef-date').value,
        category: document.getElementById('ef-cat').value, description: document.getElementById('ef-desc').value,
        amount: document.getElementById('ef-amt').value, method: document.getElementById('ef-method').value,
        notes: document.getElementById('ef-notes').value };
      api(e ? 'updateExpense' : 'addExpense', payload, { noCache: true }).then(function (res) {
        invalidate('listExpenses'); invalidate('getDashboard'); invalidate('getReport');
        closeModal(); toast(res.message, 'ok'); renderExpenses();
      }).catch(function (err) { document.getElementById('ef-err').innerHTML = errorBox(err.message); });
    };
  });
}

/* ── Commissions ──────────────────────────────────────────────────── */
function renderCommissions() {
  const view = document.getElementById('view');
  api('listCommissions').then(function (rows) {
    view.innerHTML =
      '<div class="toolbar"><button class="btn btn-primary" id="cm-add">+ Add Commission</button>' +
      '<span class="muted">Referral commissions paid on orders.</span></div>' +
      '<div class="card table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Date</th><th>Order</th><th>Referrer</th><th>Type</th><th class="num">Rate</th>' +
      '<th class="num">Order Total</th><th class="num">Amount</th><th>Paid</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (c) {
        return '<tr><td>' + fmtDate(c.date) + '</td><td>' + esc(c.orderId) + '</td><td>' + esc(c.name) + '</td>' +
          '<td>' + esc(c.type) + '</td><td class="num">' + (c.type === 'Percentage' ? Math.round(c.rate * 100) + '%' : tzs(c.rate)) + '</td>' +
          '<td class="num">' + tzs(c.total) + '</td><td class="num">' + tzs(c.amount) + '</td>' +
          '<td>' + badge(c.paid === 'Yes' ? 'Paid' : 'No', c.paid === 'Yes' ? 'green' : 'gray') + '</td>' +
          '<td><div class="actions"><button class="icon-btn" data-row="' + c.row + '" data-act="edit">✎</button>' +
          '<button class="icon-btn" data-row="' + c.row + '" data-act="del">🗑</button></div></td></tr>';
      }).join('') : '<tr><td colspan="9">' + empty('No commissions yet.') + '</td></tr>') +
      '</tbody></table></div>';
    document.getElementById('cm-add').onclick = function () { commissionForm(); };
    view.querySelectorAll('[data-act="edit"]').forEach(function (b) {
      b.onclick = function () { commissionForm(Number(b.dataset.row)); };
    });
    view.querySelectorAll('[data-act="del"]').forEach(function (b) {
      b.onclick = function () {
        confirmDialog('Are you sure you want to delete this commission?', 'Delete', function () {
          api('deleteCommission', { row: Number(b.dataset.row) }, { noCache: true }).then(function () {
            invalidate('listCommissions'); invalidate('getDashboard'); invalidate('getReport');
            toast('Commission deleted.', 'ok'); renderCommissions();
          });
        }, true);
      };
    });
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

function commissionForm(row) {
  Promise.all([api('listCommissions', {}, { noCache: true }), api('listOrders')]).then(function (r) {
    const c = row ? r[0].filter(function (x) { return x.row === row; })[0] : null;
    const orders = r[1];
    openModal(c ? 'Edit Commission' : 'Add Commission',
      '<div class="form-grid">' +
      '<div class="field"><label>Date</label><input id="cf-date" type="date" value="' + dateInput(c ? c.date : new Date()) + '"></div>' +
      '<div class="field"><label>Order ID</label><select id="cf-order"><option value="">— None —</option>' +
      orders.map(function (o) { return '<option value="' + esc(o.id) + '"' + (c && c.orderId === o.id ? ' selected' : '') + '>' + esc(o.id) + ' — ' + esc(o.customer) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Referrer Name <span class="req">*</span></label><input id="cf-name" value="' + esc(c ? c.name : '') + '"></div>' +
      '<div class="field"><label>Referrer Phone</label><input id="cf-phone" value="' + esc(c ? c.phone : '') + '"></div>' +
      '<div class="field"><label>Type</label><select id="cf-type"><option' + (!c || c.type === 'Percentage' ? ' selected' : '') + '>Percentage</option><option' + (c && c.type === 'Fixed Amount' ? ' selected' : '') + '>Fixed Amount</option></select></div>' +
      '<div class="field"><label>Rate / Amount</label><input id="cf-rate" type="number" min="0" step="any" value="' + (c ? c.rate : '') + '" placeholder="0.1 = 10% or 50000 fixed"></div>' +
      '<div class="field"><label>Paid</label><select id="cf-paid"><option' + (c && c.paid === 'Yes' ? ' selected' : '') + '>Yes</option><option' + (!c || c.paid !== 'Yes' ? ' selected' : '') + '>No</option></select></div>' +
      '<div class="field full"><label>Notes</label><input id="cf-notes" value="' + esc(c ? c.notes : '') + '"></div>' +
      '</div><div id="cf-err"></div>' +
      '<div class="form-actions"><button class="btn" id="cf-cancel">Cancel</button>' +
      '<button class="btn btn-primary" id="cf-save">' + (c ? 'Save Changes' : 'Add Commission') + '</button></div>');
    document.getElementById('cf-cancel').onclick = closeModal;
    document.getElementById('cf-save').onclick = function () {
      const payload = { row: c ? c.row : undefined, date: document.getElementById('cf-date').value,
        orderId: document.getElementById('cf-order').value, name: document.getElementById('cf-name').value,
        phone: document.getElementById('cf-phone').value, type: document.getElementById('cf-type').value,
        rate: document.getElementById('cf-rate').value, paid: document.getElementById('cf-paid').value,
        notes: document.getElementById('cf-notes').value };
      api(c ? 'updateCommission' : 'addCommission', payload, { noCache: true }).then(function (res) {
        invalidate('listCommissions'); invalidate('getDashboard'); invalidate('getReport');
        closeModal(); toast(res.message, 'ok'); renderCommissions();
      }).catch(function (err) { document.getElementById('cf-err').innerHTML = errorBox(err.message); });
    };
  });
}

/* ── Services (dropdown management) ───────────────────────────────── */
function renderServices() {
  const view = document.getElementById('view');
  api('getSettings').then(function (settings) {
    const renderList = function (title, items, listName) {
      return '<div class="card" style="margin-bottom:14px"><h3>' + esc(title) + '</h3>' +
        '<div style="margin:10px 0">' + items.map(function (it, i) {
          return '<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">' +
            '<span style="flex:1">' + esc(it) + '</span>' +
            '<button class="btn btn-sm srv-ren" data-list="' + listName + '" data-idx="' + i + '" data-val="' + esc(it) + '">Rename</button>' +
            '<button class="btn btn-sm btn-danger srv-del" data-list="' + listName + '" data-idx="' + i + '" data-val="' + esc(it) + '">Delete</button></div>';
        }).join('') + '</div>' +
        '<div style="display:flex;gap:8px"><input id="srv-add-' + listName + '" placeholder="New item…" style="flex:1;padding:8px 11px;border:1px solid #d4d9de;border-radius:8px">' +
        '<button class="btn btn-primary btn-sm srv-add" data-list="' + listName + '">Add</button></div></div>';
    };
    view.innerHTML =
      '<p class="muted">These lists feed the dropdowns in the Orders form. Changes are saved to the Settings sheet (and its named ranges).</p>' +
      '<div class="grid cols-2">' +
      renderList('Services', settings.lists.services, 'services') +
      renderList('Order Statuses', settings.lists.orderStatuses, 'statuses') +
      renderList('Payment Methods', settings.lists.paymentMethods, 'payMethods') +
      '<div class="card"><h3>Worker Share Rates</h3><p class="muted" style="font-size:12px">' +
      settings.lists.shareTypes.map(function (x) { return esc(x.label) + ' — ' + Math.round(x.rate * 100) + '%'; }).join('<br>') +
      '<br><br>Edit the % values in <b>Settings → Worker</b>.</p></div>' +
      '</div>';

    view.querySelectorAll('.srv-add').forEach(function (b) {
      b.onclick = function () {
        const listName = b.dataset.list;
        const val = document.getElementById('srv-add-' + listName).value.trim();
        if (!val) return;
        api('addList', { list: listName, value: val }, { noCache: true }).then(function () {
          invalidate('getSettings'); toast('Added to ' + listName + '.', 'ok'); renderServices();
        }).catch(function (err) { toast(err.message, 'err'); });
      };
    });
    view.querySelectorAll('.srv-ren').forEach(function (b) {
      b.onclick = function () {
        const newVal = prompt('Rename «' + b.dataset.val + '» to:', b.dataset.val);
        if (newVal === null || !newVal.trim()) return;
        api('renameList', { list: b.dataset.list, index: Number(b.dataset.idx), value: newVal.trim() }, { noCache: true }).then(function () {
          invalidate('getSettings'); toast('Renamed.', 'ok'); renderServices();
        }).catch(function (err) { toast(err.message, 'err'); });
      };
    });
    view.querySelectorAll('.srv-del').forEach(function (b) {
      b.onclick = function () {
        confirmDialog('Delete «' + b.dataset.val + '» from this list? Existing orders keep their stored value.', 'Delete', function () {
          api('deleteList', { list: b.dataset.list, index: Number(b.dataset.idx) }, { noCache: true }).then(function () {
            invalidate('getSettings'); toast('Deleted.', 'ok'); renderServices();
          }).catch(function (err) { toast(err.message, 'err'); });
        }, true);
      };
    });
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

/* ── Reports ──────────────────────────────────────────────────────── */
const REPORT_TABS = [
  ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['yearly', 'Yearly'],
  ['pnl', 'Profit & Loss'], ['outstanding', 'Outstanding'], ['customers', 'Customers'], ['services', 'Services']
];

function renderReports() {
  const view = document.getElementById('view');
  const type = pageState.reports.type;
  api('getReport', { type: type }).then(function (data) {
    let html = '<div class="toolbar">' + REPORT_TABS.map(function (t) {
      return '<button class="chip' + (t[0] === type ? ' on' : '') + '" data-type="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '<span style="flex:1"></span><button class="btn" id="rep-print">🖨 Print</button></div>';

    if (type === 'daily') {
      html += reportTable(['Date', 'Orders', 'Sales', 'Expenses', 'Profit', 'Collected'], data.map(function (r) {
        return [fmtDate(r.date), r.orders, tzs(r.sales), tzs(r.expenses), tzs(r.profit), tzs(r.collected)];
      }));
    } else if (type === 'weekly') {
      html += reportTable(['Week', 'Orders', 'Sales', 'Expenses', 'Profit', 'Collected'], data.map(function (r) {
        return [fmtDate(r.weekStart) + ' – ' + fmtDate(r.weekEnd), r.orders, tzs(r.sales), tzs(r.expenses), tzs(r.profit), tzs(r.collected)];
      }));
    } else if (type === 'monthly') {
      html += reportTable(['Month', 'Orders', 'Sales', 'Direct Exp', 'Commissions', 'Biz Exp', 'Eligible Profit', 'Worker Share', 'Transport', 'Net Profit'], data.map(function (r) {
        return [fmtMonth(r.month), r.orders, tzs(r.sales), tzs(r.directExpenses), tzs(r.commissions), tzs(r.bizExpenses), tzs(r.eligibleProfit), tzs(r.workerShare), tzs(r.transport), tzs(r.netProfit)];
      }));
    } else if (type === 'yearly') {
      html += reportTable(['Year', 'Orders', 'Sales', 'Direct Exp', 'Commissions', 'Biz Exp', 'Eligible Profit', 'Worker Share'], data.map(function (r) {
        return [r.year, r.orders, tzs(r.sales), tzs(r.directExpenses), tzs(r.commissions), tzs(r.bizExpenses), tzs(r.eligibleProfit), tzs(r.workerShare)];
      }));
    } else if (type === 'pnl') {
      const r = data;
      const rows = [['Revenue', tzs(r.revenue)], ['Direct Order Expenses', tzs(r.directExpenses)],
        ['Commissions', tzs(r.commissions)], ['Business Expenses', tzs(r.bizExpenses)],
        ['Worker Share (cost)', tzs(r.workerShare)], ['Worker Transport (cost)', tzs(r.transport)],
        ['Eligible Profit', tzs(r.eligibleProfit)], ['Total Costs', tzs(r.totalCosts)],
        ['NET PROFIT', tzs(r.netProfit)]];
      html += '<div class="card" style="max-width:560px;margin:0 auto"><h3 style="margin-bottom:12px">Profit &amp; Loss — ' + fmtMonth(r.month) + '</h3>' +
        rows.map(function (x) {
          const isBold = x[0] === 'NET PROFIT' || x[0] === 'Revenue';
          return '<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);' + (isBold ? 'font-weight:800;font-size:15px' : '') + '">' +
            '<span>' + esc(x[0]) + '</span><span>' + esc(x[1]) + '</span></div>';
        }).join('') + '</div>';
    } else if (type === 'outstanding') {
      html += data.length ? reportTable(['Order', 'Customer', 'Phone', 'Service', 'Total', 'Paid', 'Balance', 'Status'],
        data.map(function (o) { return [o.id, o.customer, o.phone, o.service, tzs(o.total), tzs(o.paid), tzs(o.balance), o.payStatus]; }))
        : empty('No outstanding balances. 🎉');
    } else if (type === 'customers') {
      html += reportTable(['Customer', 'Phone', 'Email', 'Orders', 'Sales', 'Paid', 'Balance', 'Last Order'],
        data.map(function (c) { return [c.name, c.phone, c.email, c.orders, tzs(c.sales), tzs(c.paid), tzs(c.balance), fmtDate(c.lastOrder)]; }));
    } else if (type === 'services') {
      html += reportTable(['Service', 'Orders', 'Revenue', 'Avg Order'], data.map(function (s) {
        return [s.name, s.orders, tzs(s.revenue), tzs(s.avg)];
      }));
    }
    view.innerHTML = html;
    view.querySelectorAll('[data-type]').forEach(function (b) {
      b.onclick = function () { pageState.reports.type = b.dataset.type; renderReports(); };
    });
    document.getElementById('rep-print').onclick = function () { window.print(); };
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

function reportTable(headers, rows) {
  return '<div class="card table-wrap"><table class="tbl"><thead><tr>' +
    headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr>' + r.map(function (c, i) {
        return '<td' + (i > 0 && typeof c === 'string' && c.indexOf('TZS') === 0 ? ' class="num"' : '') + '>' + esc(c) + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
}

/* ── Invoices & Receipts ──────────────────────────────────────────── */
function renderDoc(kind) {
  const view = document.getElementById('view');
  const id = kind === 'invoice' ? pageState.invoice.id : pageState.receipt.id;
  Promise.all([api('listOrders'), api('getSettings')]).then(function (r) {
    const orders = r[0], settings = r[1];
    const opts = orders.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === id ? ' selected' : '') + '>' + esc(o.id) + ' — ' + esc(o.customer) + '</option>'; }).join('');
    view.innerHTML =
      '<div class="toolbar" style="justify-content:center"><select id="doc-select" style="max-width:340px">' +
      '<option value="">— Select Order ID —</option>' + opts + '</select></div>' +
      '<div id="doc-area">' + (id ? docHTML(kind, orders.filter(function (o) { return o.id === id; })[0], settings) : empty('Select an order to generate the ' + kind + '.')) + '</div>';
    document.getElementById('doc-select').onchange = function () {
      if (kind === 'invoice') pageState.invoice.id = this.value; else pageState.receipt.id = this.value;
      renderDoc(kind);
    };
    const printBtn = document.getElementById('doc-print');
    if (printBtn) printBtn.onclick = function () { window.print(); };
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

function renderInvoice() { renderDoc('invoice'); }
function renderReceipt() { renderDoc('receipt'); }

function docHTML(kind, o, settings) {
  if (!o) return empty('Order not found.');
  const b = settings.business;
  const head = '<div class="doc-head"><div style="display:flex;gap:12px;align-items:center">' +
    '<img src="logo.png" alt="logo" style="width:54px;height:54px;background:#fff;border-radius:10px;padding:4px;object-fit:contain">' +
    '<div><div class="doc-title">' + esc(b.name || 'ROXTAM GRAPHIX') + '</div>' +
    '<div class="muted" style="font-size:12px">' + esc(b.address || '') + '</div>' +
    '<div class="muted" style="font-size:12px">' + esc(b.phone || '') + (b.email ? ' · ' + esc(b.email) : '') + '</div></div></div>' +
    '<div class="doc-meta">' + (kind === 'invoice' ? 'INVOICE' : 'PAYMENT RECEIPT') + '<br><b>' + esc(o.id) + '</b><br>' + fmtDate(new Date()) + '</div></div>';
  const customer = '<table><tr><th colspan="2">' + (kind === 'invoice' ? 'BILL TO' : 'RECEIVED FROM') + '</th></tr>' +
    '<tr><td>Customer</td><td>' + esc(o.customer) + '</td></tr>' +
    '<tr><td>Phone</td><td>' + esc(o.phone) + '</td></tr>' +
    '<tr><td>Email</td><td>' + esc(o.email) + '</td></tr>' +
    '<tr><td>Order ID</td><td>' + esc(o.id) + '</td></tr>' +
    '<tr><td>Date</td><td>' + fmtDate(o.date) + '</td></tr>' +
    '<tr><td>Payment Status</td><td>' + esc(o.payStatus) + '</td></tr></table>';
  let body = '';
  if (kind === 'invoice') {
    body = '<table><tr><th>Service</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Discount</th><th>Total</th></tr>' +
      '<tr><td>' + esc(o.service) + '</td><td>' + esc(o.description) + '</td><td>' + o.qty + '</td>' +
      '<td>' + tzs(o.unitPrice) + '</td><td>' + tzs(o.discount) + '</td><td><b>' + tzs(o.total) + '</b></td></tr></table>' +
      '<div class="totals"><span>Subtotal: ' + tzs(o.qty * o.unitPrice) + '</span>' +
      '<span>Discount: ' + tzs(o.discount) + '</span>' +
      '<span class="grand">GRAND TOTAL: ' + tzs(o.total) + '</span>' +
      '<span>Amount Paid: ' + tzs(o.paid) + '</span>' +
      '<span>Balance Due: ' + tzs(o.balance) + '</span></div>';
  } else {
    body = '<table><tr><th>Order Total</th><td>' + tzs(o.total) + '</td></tr>' +
      '<tr><th>Amount Paid</th><td>' + tzs(o.paid) + '</td></tr>' +
      '<tr><th>Payment Method</th><td>_______________</td></tr>' +
      '<tr><th>Remaining Balance</th><td>' + tzs(o.balance) + '</td></tr></table>' +
      '<p style="margin-top:26px">Received by: _________________________ &nbsp;&nbsp;&nbsp; Signature: _________________</p>';
  }
  return '<div class="doc">' + head + customer + body +
    '<div class="foot">Thank you for choosing ' + esc(b.name || 'Roxtam Graphix') + '! — ' + esc(b.phone || '') + '</div></div>' +
    '<div class="doc-actions"><button class="btn btn-primary" id="doc-print">🖨 Print ' + (kind === 'invoice' ? 'Invoice' : 'Receipt') + '</button></div>';
}

/* ── Settings ─────────────────────────────────────────────────────── */
function renderSettings() {
  const view = document.getElementById('view');
  api('getSettings').then(function (settings) {
    const b = settings.business, f = settings.financial;
    view.innerHTML =
      '<div class="grid cols-2">' +
      '<div class="card"><h3>Business Information</h3>' +
      '<div class="form-grid" style="margin-top:10px">' +
      '<div class="field"><label>Business Name</label><input id="st-name" value="' + esc(b.name) + '"></div>' +
      '<div class="field"><label>Phone</label><input id="st-phone" value="' + esc(b.phone) + '"></div>' +
      '<div class="field"><label>Email</label><input id="st-email" value="' + esc(b.email) + '"></div>' +
      '<div class="field"><label>Address</label><input id="st-address" value="' + esc(b.address) + '"></div>' +
      '<div class="field"><label>Website</label><input id="st-website" value="' + esc(b.website) + '"></div>' +
      '<div class="field"><label>Social Media</label><input id="st-social" value="' + esc(b.social) + '"></div>' +
      '</div></div>' +
      '<div class="card"><h3>Worker — Julieth Johnson</h3>' +
      '<div class="form-grid" style="margin-top:10px">' +
      '<div class="field"><label>Worker Name</label><input value="Julieth Johnson" disabled></div>' +
      '<div class="field"><label>Rate — I was present (%)</label><input id="st-present" type="number" step="0.01" min="0" max="1" value="' + f.ratePresent + '"></div>' +
      '<div class="field"><label>Rate — I was absent (%)</label><input id="st-absent" type="number" step="0.01" min="0" max="1" value="' + f.rateAbsent + '"></div>' +
      '<div class="field"><label>Daily Transport Fee (TZS)</label><input id="st-fee" type="number" step="any" min="0" value="' + f.transportFee + '"></div>' +
      '</div><p class="muted" style="font-size:12px;margin-top:10px">Changing rates affects NEW orders and future months. Existing orders keep their stored rate (they store the chosen label, and the % is looked up live).</p></div>' +
      '</div>' +
      '<div class="card" style="margin-top:14px"><h3>Connection</h3>' +
      '<p class="muted" style="font-size:12px">API URL: <b id="st-url">' + esc(apiUrl() || 'not set') + '</b><br>Data lives in your Google Sheet — this app never stores a copy.</p>' +
      '<div class="form-actions"><button class="btn" id="st-change-url">Change API URL</button>' +
      '<button class="btn btn-primary" id="st-save">Save Settings</button></div></div>' +
      '<div id="st-msg"></div>';
    document.getElementById('st-save').onclick = function () {
      api('updateSettings', {
        business: { name: document.getElementById('st-name').value, phone: document.getElementById('st-phone').value,
          email: document.getElementById('st-email').value, address: document.getElementById('st-address').value,
          website: document.getElementById('st-website').value, social: document.getElementById('st-social').value },
        financial: { ratePresent: Number(document.getElementById('st-present').value) || 0,
          rateAbsent: Number(document.getElementById('st-absent').value) || 0,
          transportFee: Number(document.getElementById('st-fee').value) || 0 }
      }, { noCache: true }).then(function () {
        invalidate('getSettings'); invalidate('getDashboard'); invalidate('getReport');
        toast('Settings saved to the Google Sheet.', 'ok');
      }).catch(function (err) { document.getElementById('st-msg').innerHTML = errorBox(err.message); });
    };
    document.getElementById('st-change-url').onclick = function () { showConnect(); };
  }).catch(function (err) { view.innerHTML = errorBox(err.message); });
}

/* ════════════════════════════════════════════════════════════════════
   SVG CHARTS (no external libraries — works in browser & Reddit iframe)
   ════════════════════════════════════════════════════════════════════ */
function svgLine(labels, series, W, H) {
  W = W || 640; H = H || 220;
  const pad = { l: 46, r: 12, t: 14, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  let max = 1;
  series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
  const x = function (i) { return pad.l + (labels.length <= 1 ? iw / 2 : (i * iw) / (labels.length - 1)); };
  const y = function (v) { return pad.t + ih - (v / max) * ih; };
  const path = function (vals) {
    return vals.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
  };
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const v = (max / ticks) * t;
    const yy = y(v);
    s += '<line x1="' + pad.l + '" y1="' + yy + '" x2="' + (W - pad.r) + '" y2="' + yy + '" stroke="#EDF0F3" stroke-width="1"/>';
    s += '<text x="' + (pad.l - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="9" fill="#8b979d">' + fmtK(v) + '</text>';
  }
  series.forEach(function (sr) {
    s += '<path d="' + path(sr.values) + '" fill="none" stroke="' + sr.color + '" stroke-width="2.2" stroke-linejoin="round"/>';
  });
  const step = Math.max(1, Math.ceil(labels.length / 8));
  labels.forEach(function (lb, i) {
    if (i % step !== 0 && i !== labels.length - 1) return;
    s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="9" fill="#8b979d">' + esc(lb) + '</text>';
  });
  return s + '</svg>';
}
function svgBars(labels, series, W, H) {
  W = W || 640; H = H || 220;
  const pad = { l: 46, r: 12, t: 14, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  let max = 1;
  series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
  const n = labels.length;
  const group = iw / n;
  const bw = Math.min(26, (group * 0.62) / series.length);
  const y = function (v) { return pad.t + ih - (v / max) * ih; };
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const v = (max / ticks) * t;
    const yy = y(v);
    s += '<line x1="' + pad.l + '" y1="' + yy + '" x2="' + (W - pad.r) + '" y2="' + yy + '" stroke="#EDF0F3" stroke-width="1"/>';
    s += '<text x="' + (pad.l - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="9" fill="#8b979d">' + fmtK(v) + '</text>';
  }
  series.forEach(function (sr, si) {
    sr.values.forEach(function (v, i) {
      const cx = pad.l + group * i + group / 2 + (si - (series.length - 1) / 2) * (bw + 2);
      const h = Math.max(0, ih - (y(v) - pad.t));
      s += '<rect x="' + (cx - bw / 2) + '" y="' + y(v) + '" width="' + bw + '" height="' + h + '" rx="3" fill="' + sr.color + '">' +
        '<title>' + esc(labels[i]) + ': ' + fmtK(v) + '</title></rect>';
    });
  });
  const step = Math.max(1, Math.ceil(n / 10));
  labels.forEach(function (lb, i) {
    if (i % step !== 0 && i !== n - 1) return;
    s += '<text x="' + (pad.l + group * i + group / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="9" fill="#8b979d">' + esc(lb) + '</text>';
  });
  return s + '</svg>';
}
function svgBarsH(items, W, H) {
  W = W || 640; H = H || Math.max(180, items.length * 26 + 20);
  const pad = { l: 128, r: 46, t: 8, b: 8 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  let max = 1;
  items.forEach(function (it) { if (it.value > max) max = it.value; });
  const bh = Math.min(20, ih / items.length - 4);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  items.forEach(function (it, i) {
    const yy = pad.t + (i * ih) / items.length + 2;
    const w = (it.value / max) * iw;
    s += '<text x="' + (pad.l - 8) + '" y="' + (yy + bh / 2 + 4) + '" text-anchor="end" font-size="10" fill="#5b6b76">' + esc(String(it.name).slice(0, 18)) + '</text>';
    s += '<rect x="' + pad.l + '" y="' + yy + '" width="' + Math.max(w, 2) + '" height="' + bh + '" rx="3" fill="#E17055">' +
      '<title>' + esc(it.name) + ': ' + fmtK(it.value) + '</title></rect>';
    s += '<text x="' + (pad.l + Math.max(w, 2) + 6) + '" y="' + (yy + bh / 2 + 4) + '" font-size="9" fill="#8b979d">' + fmtK(it.value) + '</text>';
  });
  return s + '</svg>';
}
function svgDoughnut(items, W, H) {
  W = W || 220; H = H || 220;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 14, r = R * 0.62;
  const total = items.reduce(function (s, x) { return s + (x[1] || 0); }, 0);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
  if (total <= 0) {
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#EEF1F4" stroke-width="' + (R - r) + '"/>';
  } else {
    let angle = -Math.PI / 2;
    items.forEach(function (it) {
      const v = it[1] || 0;
      if (v <= 0) return;
      const a2 = angle + (v / total) * Math.PI * 2;
      const large = (a2 - angle) > Math.PI ? 1 : 0;
      const p = function (a, rad) { return (cx + rad * Math.cos(a)).toFixed(2) + ' ' + (cy + rad * Math.sin(a)).toFixed(2); };
      s += '<path d="M' + p(angle, R) + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p(a2, R) +
        ' L' + p(a2, r) + ' A' + r + ' ' + r + ' 0 ' + large + ' 0 ' + p(angle, r) + ' Z" fill="' + it[2] + '">' +
        '<title>' + esc(it[0]) + ': ' + fmtK(v) + '</title></path>';
      angle = a2;
    });
  }
  s += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="17" font-weight="700" fill="#2D3436">' + fmtK(total) + '</text>';
  s += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="9" fill="#8b979d">TOTAL</text>';
  const legend = '<div class="legend">' + items.map(function (it) {
    return '<span><i style="background:' + it[2] + '"></i>' + esc(it[0]) + ' (' + fmtK(it[1] || 0) + ')</span>';
  }).join('') + '</div>';
  return s + '</svg>' + legend;
}
function fmtK(v) {
  v = Math.round(v);
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(v);
}

/* ════════════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  buildNav();
  document.getElementById('menu-btn').onclick = function () {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('drawer-overlay').classList.remove('hidden');
  };
  document.getElementById('drawer-overlay').onclick = function () {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('drawer-overlay').classList.add('hidden');
  };
  document.getElementById('more-btn').onclick = function () {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('drawer-overlay').classList.remove('hidden');
  };
  document.getElementById('fab-add').onclick = function () { openOrderForm(); };
  document.getElementById('quick-add').onclick = function () { openOrderForm(); };
  document.getElementById('modal-close').onclick = closeModal;
  document.getElementById('modal-overlay').onclick = function (e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  };
  document.getElementById('conn-status').onclick = function () { showConnect(); };

  if (!apiUrl()) { showConnect(); return; }
  api('getSettings', {}, { noCache: true }).then(function (s) {
    const st = document.getElementById('conn-status');
    st.dataset.state = 'ok';
    document.getElementById('conn-text').textContent = 'Connected — ' + (s.business.name || 'Google Sheet');
  }).catch(function () {
    const st = document.getElementById('conn-status');
    st.dataset.state = 'err';
    document.getElementById('conn-text').textContent = 'Connection failed — tap to fix';
  });

  const page = (location.hash || '').replace('#/', '') || 'dashboard';
  navigate(NAV.some(function (n) { return n.id === page; }) ? page : 'dashboard');
});
