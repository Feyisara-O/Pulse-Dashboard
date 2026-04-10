/* ============================================
   PULSE DASHBOARD — app.js (Full Rebuild)
   Dynamic transactions, all pages, localStorage
   ============================================ */

'use strict';

// ── CONSTANTS ──────────────────────────────────
const STORAGE_KEY   = 'pulse-transactions';
const GOAL_KEY      = 'pulse-goal';
const THEME_KEY     = 'pulse-theme';
const DEFAULT_GOAL  = 60000;

const COLORS = [
  '#6c63ff','#22d3a5','#ff9f43','#4fa3e0',
  '#ff5f7e','#a78bfa','#34d399','#f59e0b',
  '#e879f9','#38bdf8','#fb923c','#4ade80'
];

const DEFAULT_TRANSACTIONS = [
  { id: 1,  client: 'Nova Studio',  project: 'Brand Redesign',   date: '2025-03-28', amount: 4200, status: 'paid' },
  { id: 2,  client: 'Kite Agency',  project: 'SEO Campaign',      date: '2025-03-25', amount: 1850, status: 'paid' },
  { id: 3,  client: 'Bloom Store',  project: 'E-commerce UI',     date: '2025-03-22', amount: 3600, status: 'pending' },
  { id: 4,  client: 'Apex Labs',    project: 'Dashboard Build',   date: '2025-03-19', amount: 5500, status: 'paid' },
  { id: 5,  client: 'Drift Co.',    project: 'Mobile App UI',     date: '2025-03-15', amount: 2900, status: 'overdue' },
  { id: 6,  client: 'Echo Systems', project: 'API Integration',   date: '2025-03-12', amount: 1200, status: 'paid' },
  { id: 7,  client: 'Forma Health', project: 'Landing Page',      date: '2025-03-09', amount: 800,  status: 'paid' },
  { id: 8,  client: 'Slate Media',  project: 'Content Dashboard', date: '2025-03-05', amount: 3100, status: 'pending' },
];

// ── STATE ──────────────────────────────────────
let transactions  = [];
let revenueChart  = null;
let splitChart    = null;
let analyticsChart = null;
let activeFilter  = 'all';
let searchQuery   = '';
let goalTarget    = DEFAULT_GOAL;

// ── DOM REFS ───────────────────────────────────
const sidebar         = document.getElementById('sidebar');
const overlay         = document.getElementById('overlay');
const menuBtn         = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebar');
const themeToggle     = document.getElementById('themeToggle');
const themeIcon       = document.getElementById('themeIcon');
const searchInput     = document.getElementById('searchInput');
const refreshPulse    = document.getElementById('refreshPulse');
const pulseContent    = document.getElementById('pulseContent');
const pageTitle       = document.getElementById('pageTitle');
const pageDate        = document.getElementById('pageDate');
const exportBtn       = document.getElementById('exportBtn');
const addTransBtn     = document.getElementById('addTransactionBtn');
const emptyAddBtn     = document.getElementById('emptyAddBtn');
const invoiceAddBtn   = document.getElementById('invoiceAddBtn');
const modalBackdrop   = document.getElementById('modalBackdrop');
const modalClose      = document.getElementById('modalClose');
const modalCancel     = document.getElementById('modalCancel');
const modalSave       = document.getElementById('modalSave');
const filterTabs      = document.getElementById('filterTabs');
const notifBadge      = document.getElementById('notifBadge');

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTransactions();
  loadGoal();
  initTheme();
  initNavigation();
  initSidebar();
  initModal();
  initSearch();
  initExport();
  initFilterTabs();
  initSettings();
  setDate();
  refreshDashboard();
  fetchAIPulse();
});

// ── LOCALSTORAGE ───────────────────────────────
function loadTransactions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  transactions = saved ? JSON.parse(saved) : [...DEFAULT_TRANSACTIONS];
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadGoal() {
  const saved = localStorage.getItem(GOAL_KEY);
  goalTarget = saved ? parseInt(saved) : DEFAULT_GOAL;
}

function saveGoal(val) {
  goalTarget = val;
  localStorage.setItem(GOAL_KEY, val);
}

// ── DATE ───────────────────────────────────────
function setDate() {
  pageDate.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── COLOUR HELPER ─────────────────────────────
function clientColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(n) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k';
  return '$' + n.toLocaleString();
}

// ── METRICS (computed from transactions) ───────
function computeMetrics() {
  const paid    = transactions.filter(t => t.status === 'paid');
  const pending = transactions.filter(t => t.status === 'pending');
  const overdue = transactions.filter(t => t.status === 'overdue');

  const revenue       = paid.reduce((s, t) => s + t.amount, 0);
  const pendingAmount = pending.reduce((s, t) => s + t.amount, 0);
  const overdueAmount = overdue.reduce((s, t) => s + t.amount, 0);
  const clients       = new Set(transactions.map(t => t.client)).size;
  const orders        = transactions.length;

  return { revenue, pendingAmount, overdueAmount, clients, orders, paid, pending, overdue };
}

// ── REFRESH DASHBOARD ─────────────────────────
function refreshDashboard() {
  const m = computeMetrics();
  updateMetricCards(m);
  updateGoalBar(m.revenue);
  renderRevenueChart(m);
  renderSplitChart(m);
  renderTransactionTable();
  updateNotifBadge(m.overdue.length);

  // refresh other pages if they're built
  renderClientsPage();
  renderInvoicesPage();
  renderAnalyticsPage();
}

// ── METRIC CARDS ──────────────────────────────
function updateMetricCards(m) {
  animateCount('metricRevenue',  m.revenue,        true);
  animateCount('metricClients',  m.clients,        false);
  animateCount('metricOrders',   m.orders,         false);
  animateCount('metricExpenses', m.pendingAmount,  true);

  setMetaLabel('metricRevenueChange',  `${m.paid.length} paid transactions`);
  setMetaLabel('metricClientsChange',  `${m.clients} unique client${m.clients !== 1 ? 's' : ''}`);
  setMetaLabel('metricOrdersChange',   `${m.pending.length} pending · ${m.overdue.length} overdue`);
  setMetaLabel('metricExpensesChange', m.overdueAmount > 0 ? `$${m.overdueAmount.toLocaleString()} overdue` : 'No overdue amounts');
}

function setMetaLabel(id, text) {
  const el = document.getElementById(id);
  el.className = 'metric-change';
  el.innerHTML = `<span style="color:var(--text-muted)">${text}</span>`;
}

function animateCount(id, target, isCurrency) {
  const el = document.getElementById(id);
  const duration = 800;
  const startTime = performance.now();

  function update(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const value    = Math.round(target * eased);
    el.textContent = isCurrency ? formatCurrency(value) : value.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ── GOAL BAR ──────────────────────────────────
function updateGoalBar(revenue) {
  const pct = Math.min(Math.round((revenue / goalTarget) * 100), 100);
  document.getElementById('goalPercent').textContent = pct + '%';
  document.getElementById('goalCurrent').textContent = '$' + revenue.toLocaleString() + ' earned';
  document.getElementById('goalTarget').textContent  = 'Target: $' + goalTarget.toLocaleString();
  setTimeout(() => {
    document.getElementById('goalBarFill').style.width = pct + '%';
  }, 200);
}

// ── NOTIFICATION BADGE ─────────────────────────
function updateNotifBadge(overdueCount) {
  notifBadge.textContent = overdueCount;
  notifBadge.classList.toggle('hidden', overdueCount === 0);
}

// ── REVENUE CHART ─────────────────────────────
function renderRevenueChart(m) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChart) revenueChart.destroy();

  // Group paid by month
  const monthMap = {};
  const pendingMap = {};

  transactions.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (t.status === 'paid') {
      monthMap[key] = (monthMap[key] || 0) + t.amount;
    } else if (t.status === 'pending') {
      pendingMap[key] = (pendingMap[key] || 0) + t.amount;
    }
  });

  const allKeys = [...new Set([...Object.keys(monthMap), ...Object.keys(pendingMap)])].sort((a, b) => {
    return new Date('1 ' + a) - new Date('1 ' + b);
  });

  const labels   = allKeys.length ? allKeys : ['No data'];
  const paidData = allKeys.map(k => monthMap[k] || 0);
  const pendData = allKeys.map(k => pendingMap[k] || 0);

  const isDark = document.documentElement.dataset.theme !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#55556a' : '#9999b8';

  const grad1 = ctx.createLinearGradient(0, 0, 0, 220);
  grad1.addColorStop(0, '#6c63ff33');
  grad1.addColorStop(1, '#6c63ff00');

  const grad2 = ctx.createLinearGradient(0, 0, 0, 220);
  grad2.addColorStop(0, '#ff9f4333');
  grad2.addColorStop(1, '#ff9f4300');

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Paid',
          data: paidData,
          borderColor: '#6c63ff',
          backgroundColor: grad1,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#6c63ff',
          pointBorderColor: isDark ? '#1a1a2e' : '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Pending',
          data: pendData,
          borderColor: '#ff9f43',
          backgroundColor: grad2,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#ff9f43',
          pointBorderColor: isDark ? '#1a1a2e' : '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: tooltipStyle(isDark, v => ` $${v.toLocaleString()}`)
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'DM Sans', size: 11 } } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: 'DM Sans', size: 11 },
            callback: v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
          }
        }
      }
    }
  });
}

// ── SPLIT CHART ────────────────────────────────
function renderSplitChart(m) {
  const ctx = document.getElementById('splitChart').getContext('2d');
  if (splitChart) splitChart.destroy();

  const isDark = document.documentElement.dataset.theme !== 'light';

  const split = {
    labels: ['Paid', 'Pending', 'Overdue'],
    values: [
      m.paid.reduce((s, t) => s + t.amount, 0),
      m.pending.reduce((s, t) => s + t.amount, 0),
      m.overdue.reduce((s, t) => s + t.amount, 0),
    ],
    colors: ['#6c63ff', '#ff9f43', '#ff5f7e']
  };

  splitChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: split.labels,
      datasets: [{
        data: split.values,
        backgroundColor: split.colors,
        borderColor: isDark ? '#1a1a2e' : '#fff',
        borderWidth: 3,
        hoverBorderWidth: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: tooltipStyle(isDark, v => ` $${v.toLocaleString()}`)
      }
    }
  });

  // render legend
  const total = split.values.reduce((a, b) => a + b, 0);
  document.getElementById('doughnutLegend').innerHTML = split.labels.map((label, i) => {
    const pct = total > 0 ? Math.round((split.values[i] / total) * 100) : 0;
    return `
      <div class="doughnut-legend-item">
        <div class="doughnut-legend-left">
          <span class="doughnut-dot" style="background:${split.colors[i]}"></span>
          ${label}
        </div>
        <span class="doughnut-legend-val">${pct}%</span>
      </div>`;
  }).join('');
}

// ── TOOLTIP HELPER ────────────────────────────
function tooltipStyle(isDark, labelFn) {
  return {
    backgroundColor: isDark ? '#1f1f38' : '#fff',
    titleColor: isDark ? '#f0f0f8' : '#12121e',
    bodyColor: isDark ? '#8b8ba8' : '#5a5a7a',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    padding: 10,
    callbacks: { label: ctx => labelFn(ctx.parsed.y ?? ctx.parsed) }
  };
}

// ── TRANSACTION TABLE ─────────────────────────
function renderTransactionTable() {
  const tbody     = document.getElementById('transactionBody');
  const emptyEl   = document.getElementById('tableEmpty');

  let filtered = transactions.filter(t => {
    const matchFilter = activeFilter === 'all' || t.status === activeFilter;
    const matchSearch = !searchQuery ||
      t.client.toLowerCase().includes(searchQuery) ||
      t.project.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  // sort newest first
  filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = filtered.map(t => `
    <tr>
      <td>
        <div class="client-cell">
          <div class="client-dot" style="background:${clientColor(t.client)}">${initials(t.client)}</div>
          ${t.client}
        </div>
      </td>
      <td>${t.project}</td>
      <td>${formatDate(t.date)}</td>
      <td class="amount-cell">$${t.amount.toLocaleString()}</td>
      <td><span class="status-badge ${t.status}">${capitalise(t.status)}</span></td>
      <td>
        <button class="delete-btn" data-id="${t.id}" aria-label="Delete transaction">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  // delete listeners
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      transactions = transactions.filter(t => t.id !== id);
      saveTransactions();
      refreshDashboard();
      fetchAIPulse();
    });
  });
}

// ── FILTER TABS ────────────────────────────────
function initFilterTabs() {
  filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderTransactionTable();
    });
  });
}

// ── SEARCH ─────────────────────────────────────
function initSearch() {
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.toLowerCase().trim();
    renderTransactionTable();
  });
}

// ── ANALYTICS PAGE ────────────────────────────
function renderAnalyticsPage() {
  // Revenue by month bar chart
  const ctx = document.getElementById('analyticsChart');
  if (!ctx) return;

  const monthMap = {};
  transactions.filter(t => t.status === 'paid').forEach(t => {
    const key = new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap[key] = (monthMap[key] || 0) + t.amount;
  });

  const labels = Object.keys(monthMap).sort((a, b) => new Date('1 ' + a) - new Date('1 ' + b));
  const values = labels.map(k => monthMap[k]);

  if (analyticsChart) analyticsChart.destroy();

  const isDark = document.documentElement.dataset.theme !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#55556a' : '#9999b8';

  analyticsChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [{
        label: 'Revenue',
        data: values.length ? values : [0],
        backgroundColor: '#6c63ff99',
        borderColor: '#6c63ff',
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: tooltipStyle(isDark, v => ` $${v.toLocaleString()}`)
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'DM Sans', size: 11 } } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: 'DM Sans', size: 11 },
            callback: v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)
          }
        }
      }
    }
  });

  // Top clients
  const clientMap = {};
  transactions.filter(t => t.status === 'paid').forEach(t => {
    clientMap[t.client] = (clientMap[t.client] || 0) + t.amount;
  });

  const topClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxAmount  = topClients[0]?.[1] || 1;

  document.getElementById('topClientsList').innerHTML = topClients.length
    ? topClients.map(([name, amount]) => `
        <div class="top-client-item">
          <div class="client-dot" style="background:${clientColor(name)};width:28px;height:28px;font-size:0.6rem">${initials(name)}</div>
          <div class="top-client-info">
            <div class="top-client-name">${name}</div>
            <div class="top-client-bar-track">
              <div class="top-client-bar-fill" style="width:${Math.round((amount / maxAmount) * 100)}%"></div>
            </div>
          </div>
          <span class="top-client-amount">$${amount.toLocaleString()}</span>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:0.82rem">No paid transactions yet.</p>';

  // Payment health
  const m = computeMetrics();
  document.getElementById('healthStats').innerHTML = [
    { label: 'Paid',    color: '#6c63ff', amount: m.paid.reduce((s,t)=>s+t.amount,0),    count: m.paid.length },
    { label: 'Pending', color: '#ff9f43', amount: m.pending.reduce((s,t)=>s+t.amount,0), count: m.pending.length },
    { label: 'Overdue', color: '#ff5f7e', amount: m.overdue.reduce((s,t)=>s+t.amount,0), count: m.overdue.length },
  ].map(s => `
    <div class="health-stat-item">
      <div class="health-stat-left">
        <span class="health-dot" style="background:${s.color}"></span>
        ${s.label}
      </div>
      <div class="health-stat-right">
        <div class="health-stat-amount">$${s.amount.toLocaleString()}</div>
        <div class="health-stat-count">${s.count} transaction${s.count !== 1 ? 's' : ''}</div>
      </div>
    </div>`).join('');
}

// ── CLIENTS PAGE ──────────────────────────────
function renderClientsPage() {
  const clientMap = {};
  transactions.forEach(t => {
    if (!clientMap[t.client]) {
      clientMap[t.client] = { paid: 0, pending: 0, projects: new Set(), count: 0 };
    }
    if (t.status === 'paid')    clientMap[t.client].paid    += t.amount;
    if (t.status === 'pending') clientMap[t.client].pending += t.amount;
    clientMap[t.client].projects.add(t.project);
    clientMap[t.client].count++;
  });

  const clients = Object.entries(clientMap).sort((a, b) => b[1].paid - a[1].paid);

  document.getElementById('clientsSubheading').textContent = `${clients.length} client${clients.length !== 1 ? 's' : ''}`;

  const grid  = document.getElementById('clientsGrid');
  const empty = document.getElementById('clientsEmpty');

  if (clients.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = clients.map(([name, data]) => `
    <div class="client-card">
      <div class="client-card-avatar" style="background:${clientColor(name)}">${initials(name)}</div>
      <div class="client-card-info">
        <div class="client-card-name">${name}</div>
        <div class="client-card-meta">${data.projects.size} project${data.projects.size !== 1 ? 's' : ''} · ${data.count} transaction${data.count !== 1 ? 's' : ''}</div>
      </div>
      <div class="client-card-stats">
        <div class="client-stat">
          <div class="client-stat-value">$${data.paid.toLocaleString()}</div>
          <span class="client-stat-label">Paid</span>
        </div>
        ${data.pending > 0 ? `
        <div class="client-stat">
          <div class="client-stat-value" style="color:var(--orange)">$${data.pending.toLocaleString()}</div>
          <span class="client-stat-label">Pending</span>
        </div>` : ''}
      </div>
    </div>`).join('');
}

// ── INVOICES PAGE ─────────────────────────────
function renderInvoicesPage() {
  const tbody = document.getElementById('invoiceBody');
  const empty = document.getElementById('invoicesEmpty');
  const sub   = document.getElementById('invoicesSubheading');

  if (!tbody) return;

  sub.textContent = `${transactions.length} invoice${transactions.length !== 1 ? 's' : ''}`;

  if (transactions.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(t => `
    <tr>
      <td>
        <div class="client-cell">
          <div class="client-dot" style="background:${clientColor(t.client)}">${initials(t.client)}</div>
          ${t.client}
        </div>
      </td>
      <td>${t.project}</td>
      <td>${formatDate(t.date)}</td>
      <td class="amount-cell">$${t.amount.toLocaleString()}</td>
      <td><span class="status-badge ${t.status}">${capitalise(t.status)}</span></td>
      <td>
        ${t.status !== 'paid'
          ? `<button class="mark-paid-btn" data-id="${t.id}">Mark Paid</button>`
          : '<span style="color:var(--text-muted);font-size:0.72rem">—</span>'}
      </td>
    </tr>
  `).join('');

  // mark paid listeners
  tbody.querySelectorAll('.mark-paid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const t = transactions.find(t => t.id === id);
      if (t) { t.status = 'paid'; saveTransactions(); refreshDashboard(); fetchAIPulse(); }
    });
  });
}
// ── AI PULSE ──────────────────────────────────
async function fetchAIPulse() {
  refreshPulse.classList.add('spinning');
  pulseContent.innerHTML = `<div class="pulse-loading"><span></span><span></span><span></span></div>`;

  const m = computeMetrics();
  const overdueClients  = m.overdue.map(t => t.client).join(', ') || 'none';
  const pendingAmount   = m.pending.reduce((s, t) => s + t.amount, 0);
  const goalPct         = Math.round((m.revenue / goalTarget) * 100);

  const prompt = `You are a sharp, no-fluff business analyst. Based on these live dashboard metrics, write ONE concise insight sentence (max 30 words) that tells the business owner the single most important thing to act on right now.

Metrics:
- Total paid revenue: $${m.revenue.toLocaleString()}
- Active clients: ${m.clients}
- Total transactions: ${m.orders}
- Overdue payments from: ${overdueClients}
- Pending invoices total: $${pendingAmount.toLocaleString()}
- Overdue total: $${m.overdueAmount.toLocaleString()}
- Monthly goal progress: ${goalPct}% of $${goalTarget.toLocaleString()} target

Write only the insight sentence. No preamble. No labels.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();

    if (text) {
      typewriter(pulseContent, text);
    } else {
      pulseContent.textContent = buildFallbackInsight(m, pendingAmount);
    }
  } catch {
    pulseContent.textContent = buildFallbackInsight(m, pendingAmount);
  } finally {
    refreshPulse.classList.remove('spinning');
  }
}

function buildFallbackInsight(m, pendingAmount) {
  if (m.overdue.length > 0)
    return `You have $${m.overdueAmount.toLocaleString()} overdue from ${m.overdue.length} client${m.overdue.length > 1 ? 's' : ''} — follow up today to protect your cash flow.`;
  if (pendingAmount > 0)
    return `$${pendingAmount.toLocaleString()} in pending invoices — send reminders to convert outstanding payments into revenue.`;
  return `Revenue is looking healthy. Focus on acquiring new clients to keep momentum going.`;
}

function typewriter(el, text) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i++];
    if (i >= text.length) clearInterval(interval);
  }, 22);
}

// ── MODAL ──────────────────────────────────────
function initModal() {
  [addTransBtn, emptyAddBtn, invoiceAddBtn].forEach(btn => {
    btn?.addEventListener('click', openModal);
  });

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModal();
  });
  modalSave.addEventListener('click', saveTransaction);

  // set today as default date
  document.getElementById('formDate').valueAsDate = new Date();
}

function openModal() {
  modalBackdrop.classList.add('open');
  document.getElementById('formClient').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('formError').textContent = '';
  document.getElementById('formClient').value  = '';
  document.getElementById('formProject').value = '';
  document.getElementById('formAmount').value  = '';
  document.getElementById('formDate').valueAsDate = new Date();
  document.getElementById('formStatus').value  = 'paid';
}

function saveTransaction() {
  const client  = document.getElementById('formClient').value.trim();
  const project = document.getElementById('formProject').value.trim();
  const amount  = parseFloat(document.getElementById('formAmount').value);
  const date    = document.getElementById('formDate').value;
  const status  = document.getElementById('formStatus').value;
  const errEl   = document.getElementById('formError');

  if (!client)         { errEl.textContent = 'Client name is required.'; return; }
  if (!project)        { errEl.textContent = 'Project name is required.'; return; }
  if (!amount || amount <= 0) { errEl.textContent = 'Enter a valid amount.'; return; }
  if (!date)           { errEl.textContent = 'Date is required.'; return; }

  const newId = transactions.length ? Math.max(...transactions.map(t => t.id)) + 1 : 1;

  transactions.push({ id: newId, client, project, date, amount, status });
  saveTransactions();
  closeModal();
  refreshDashboard();
  fetchAIPulse();
}

// ── NAVIGATION ────────────────────────────────
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;

      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + page).classList.add('active');

      pageTitle.textContent = item.textContent.trim();

      // re-render page-specific content
      if (page === 'analytics') renderAnalyticsPage();
      if (page === 'clients')   renderClientsPage();
      if (page === 'invoices')  renderInvoicesPage();

      if (window.innerWidth < 1024) closeSidebarFn();
    });
  });
}

// ── SIDEBAR ────────────────────────────────────
function initSidebar() {
  menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  closeSidebarBtn.addEventListener('click', closeSidebarFn);
  overlay.addEventListener('click', closeSidebarFn);
}

function closeSidebarFn() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ── THEME ──────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';

  // sync settings page theme buttons if on that page
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // re-render charts with correct colours
  if (revenueChart || splitChart) {
    const m = computeMetrics();
    renderRevenueChart(m);
    renderSplitChart(m);
  }
  if (analyticsChart) renderAnalyticsPage();
}

// ── SETTINGS ───────────────────────────────────
function initSettings() {
  const goalInput   = document.getElementById('goalInput');
  const saveGoalBtn = document.getElementById('saveGoalBtn');
  const clearBtn    = document.getElementById('clearDataBtn');
  const toast       = document.getElementById('settingsToast');

  goalInput.value = goalTarget;

  saveGoalBtn.addEventListener('click', () => {
    const val = parseInt(goalInput.value);
    if (!val || val <= 0) { showToast(toast, 'Enter a valid goal amount.', true); return; }
    saveGoal(val);
    refreshDashboard();
    showToast(toast, '✓ Goal updated successfully.');
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('This will delete all transactions. Are you sure?')) return;
    transactions = [];
    saveTransactions();
    refreshDashboard();
    fetchAIPulse();
    showToast(toast, '✓ All data cleared.');
  });

  // settings theme buttons
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
      localStorage.setItem(THEME_KEY, btn.dataset.theme);
    });
  });
}

function showToast(el, msg, isError = false) {
  el.textContent = msg;
  el.style.color = isError ? 'var(--red)' : 'var(--green)';
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
// ── EXPORT CSV ────────────────────────────────
function initExport() {
  exportBtn.addEventListener('click', () => {
    const headers = ['Client', 'Project', 'Date', 'Amount', 'Status'];
    const rows    = transactions.map(t =>
      [t.client, t.project, t.date, '$' + t.amount, t.status]
    );
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'pulse-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ── REFRESH PULSE BUTTON ───────────────────────
refreshPulse.addEventListener('click', fetchAIPulse);

// ── UTILITY ────────────────────────────────────
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}