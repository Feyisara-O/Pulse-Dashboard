/* ============================================
   PULSE DASHBOARD — JavaScript
   Stack: Vanilla JS, Chart.js, Claude API
   ============================================ */

'use strict';

// ── DATA ENGINE ────────────────────────────────
const DATA = {
  7: {
    revenue: 12480,
    revenueChange: +18.4,
    clients: 24,
    clientsChange: +4.3,
    orders: 87,
    ordersChange: -2.1,
    expenses: 3240,
    expensesChange: +6.7,
    goal: { current: 12480, target: 18000 },
    chartLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    chartRevenue: [1200, 1900, 1400, 2100, 1800, 2400, 1680],
    chartExpenses: [420, 380, 510, 440, 390, 620, 480],
    split: {
      labels: ['Freelance', 'Products', 'Consulting', 'Other'],
      values: [5400, 3200, 2800, 1080],
      colors: ['#6c63ff', '#22d3a5', '#ff9f43', '#4fa3e0']
    }
  },
  30: {
    revenue: 48620,
    revenueChange: +22.1,
    clients: 31,
    clientsChange: +12.5,
    orders: 312,
    ordersChange: -5.8,
    expenses: 11200,
    expensesChange: +3.2,
    goal: { current: 48620, target: 60000 },
    chartLabels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'],
    chartRevenue: [10200, 13400, 11800, 13220],
    chartExpenses: [2400, 3100, 2800, 2900],
    split: {
      labels: ['Freelance', 'Products', 'Consulting', 'Other'],
      values: [21000, 12400, 10800, 4420],
      colors: ['#6c63ff', '#22d3a5', '#ff9f43', '#4fa3e0']
    }
  },
  90: {
    revenue: 134500,
    revenueChange: +31.7,
    clients: 47,
    clientsChange: +28.9,
    orders: 890,
    ordersChange: +14.2,
    expenses: 32400,
    expensesChange: -8.1,
    goal: { current: 134500, target: 150000 },
    chartLabels: ['Jan', 'Feb', 'Mar'],
    chartRevenue: [38000, 44200, 52300],
    chartExpenses: [9800, 10600, 12000],
    split: {
      labels: ['Freelance', 'Products', 'Consulting', 'Other'],
      values: [58000, 36000, 28000, 12500],
      colors: ['#6c63ff', '#22d3a5', '#ff9f43', '#4fa3e0']
    }
  }
};

const TRANSACTIONS = [
  { client: 'Nova Studio',   initials: 'NS', color: '#6c63ff', project: 'Brand Redesign',     date: 'Mar 28, 2025', amount: 4200,  status: 'paid' },
  { client: 'Kite Agency',   initials: 'KA', color: '#22d3a5', project: 'SEO Campaign',        date: 'Mar 25, 2025', amount: 1850,  status: 'paid' },
  { client: 'Bloom Store',   initials: 'BS', color: '#ff9f43', project: 'E-commerce UI',       date: 'Mar 22, 2025', amount: 3600,  status: 'pending' },
  { client: 'Apex Labs',     initials: 'AL', color: '#4fa3e0', project: 'Dashboard Build',     date: 'Mar 19, 2025', amount: 5500,  status: 'paid' },
  { client: 'Drift Co.',     initials: 'DC', color: '#ff5f7e', project: 'Mobile App UI',       date: 'Mar 15, 2025', amount: 2900,  status: 'overdue' },
  { client: 'Echo Systems',  initials: 'ES', color: '#a78bfa', project: 'API Integration',     date: 'Mar 12, 2025', amount: 1200,  status: 'paid' },
  { client: 'Forma Health',  initials: 'FH', color: '#34d399', project: 'Landing Page',        date: 'Mar 09, 2025', amount: 800,   status: 'paid' },
  { client: 'Slate Media',   initials: 'SM', color: '#f59e0b', project: 'Content Dashboard',   date: 'Mar 05, 2025', amount: 3100,  status: 'pending' },
];

// ── STATE ──────────────────────────────────────
let revenueChart = null;
let splitChart = null;
let currentPeriod = 30;

// ── DOM REFS ───────────────────────────────────
const sidebar      = document.getElementById('sidebar');
const overlay      = document.getElementById('overlay');
const menuBtn      = document.getElementById('menuBtn');
const closeSidebar = document.getElementById('closeSidebar');
const themeToggle  = document.getElementById('themeToggle');
const themeIcon    = document.getElementById('themeIcon');
const dateFilter   = document.getElementById('dateFilter');
const exportBtn    = document.getElementById('exportBtn');
const refreshPulse = document.getElementById('refreshPulse');
const pulseContent = document.getElementById('pulseContent');
const pageTitle    = document.getElementById('pageTitle');
const pageDate     = document.getElementById('pageDate');

// ── INIT ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setDate();
  loadDashboard(currentPeriod);
  renderTransactions();
  initNavigation();
  initSidebar();
  initTheme();
  initDateFilter();
  initExport();
  fetchAIPulse();
});

// ── DATE ───────────────────────────────────────
function setDate() {
  const now = new Date();
  pageDate.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── LOAD DASHBOARD ────────────────────────────
function loadDashboard(period) {
  const d = DATA[period];
  animateMetrics(d);
  updateGoal(d.goal);
  renderCharts(d);
  document.getElementById('chartSubtitle').textContent =
    period === 7 ? 'Last 7 days' : period === 30 ? 'Last 30 days' : 'Last 90 days';
}

// ── ANIMATE METRIC NUMBERS ────────────────────
function animateMetrics(d) {
  animateCount('metricRevenue', d.revenue, true);
  animateCount('metricClients', d.clients, false);
  animateCount('metricOrders', d.orders, false);
  animateCount('metricExpenses', d.expenses, true);

  setChange('metricRevenueChange', d.revenueChange);
  setChange('metricClientsChange', d.clientsChange);
  setChange('metricOrdersChange', d.ordersChange, true);
  setChange('metricExpensesChange', d.expensesChange);
}

function animateCount(id, target, isCurrency) {
  const el = document.getElementById(id);
  const start = 0;
  const duration = 900;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (target - start) * eased);
    el.textContent = isCurrency ? formatCurrency(value) : value.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function formatCurrency(n) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k';
  return '$' + n.toLocaleString();
}

function setChange(id, change, invertPositive = false) {
  const el = document.getElementById(id);
  const isPositive = invertPositive ? change <= 0 : change >= 0;
  const arrow = isPositive
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
  el.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
  el.innerHTML = `${arrow}<span>${change >= 0 ? '+' : ''}${change}%</span> vs last period`;
}

// ── GOAL BAR ──────────────────────────────────
function updateGoal(goal) {
  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
  document.getElementById('goalPercent').textContent = pct + '%';
  document.getElementById('goalCurrent').textContent = '$' + goal.current.toLocaleString() + ' earned';
  document.getElementById('goalTarget').textContent  = 'Target: $' + goal.target.toLocaleString();
  setTimeout(() => {
    document.getElementById('goalBarFill').style.width = pct + '%';
  }, 200);
}

// ── CHARTS ────────────────────────────────────
function renderCharts(d) {
  renderRevenueChart(d);
  renderSplitChart(d.split);
}

function renderRevenueChart(d) {
  const ctx = document.getElementById('revenueChart').getContext('2d');

  if (revenueChart) revenueChart.destroy();

  const isDark = document.documentElement.dataset.theme !== 'light';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickColor = isDark ? '#55556a' : '#9999b8';

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.chartLabels,
      datasets: [
        {
          label: 'Revenue',
          data: d.chartRevenue,
          borderColor: '#6c63ff',
          backgroundColor: createGradient(ctx, '#6c63ff'),
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#6c63ff',
          pointBorderColor: isDark ? '#1a1a2e' : '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Expenses',
          data: d.chartExpenses,
          borderColor: '#ff5f7e',
          backgroundColor: createGradient(ctx, '#ff5f7e'),
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#ff5f7e',
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
        tooltip: {
          backgroundColor: isDark ? '#1f1f38' : '#fff',
          titleColor: isDark ? '#f0f0f8' : '#12121e',
          bodyColor: isDark ? '#8b8ba8' : '#5a5a7a',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'DM Sans', size: 11 } }
        },
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

function renderSplitChart(split) {
  const ctx = document.getElementById('splitChart').getContext('2d');

  if (splitChart) splitChart.destroy();

  const isDark = document.documentElement.dataset.theme !== 'light';

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
        tooltip: {
          backgroundColor: isDark ? '#1f1f38' : '#fff',
          titleColor: isDark ? '#f0f0f8' : '#12121e',
          bodyColor: isDark ? '#8b8ba8' : '#5a5a7a',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` $${ctx.parsed.toLocaleString()}`
          }
        }
      }
    }
  });

  renderDoughnutLegend(split);
}

function renderDoughnutLegend(split) {
  const total = split.values.reduce((a, b) => a + b, 0);
  const container = document.getElementById('doughnutLegend');
  container.innerHTML = split.labels.map((label, i) => {
    const pct = Math.round((split.values[i] / total) * 100);
    return `
      <div class="doughnut-legend-item">
        <div class="doughnut-legend-left">
          <span class="doughnut-dot" style="background:${split.colors[i]}"></span>
          ${label}
        </div>
        <span class="doughnut-legend-val">${pct}%</span>
      </div>
    `;
  }).join('');
}

function createGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, color + '33');
  gradient.addColorStop(1, color + '00');
  return gradient;
}

// ── TRANSACTIONS TABLE ────────────────────────
function renderTransactions() {
  const tbody = document.getElementById('transactionBody');
  tbody.innerHTML = TRANSACTIONS.map(t => `
    <tr>
      <td>
        <div class="client-cell">
          <div class="client-dot" style="background:${t.color}">${t.initials}</div>
          ${t.client}
        </div>
      </td>
      <td>${t.project}</td>
      <td>${t.date}</td>
      <td class="amount-cell">$${t.amount.toLocaleString()}</td>
      <td><span class="status-badge ${t.status}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span></td>
    </tr>
  `).join('');
}

// ── AI PULSE ──────────────────────────────────
async function fetchAIPulse() {
  refreshPulse.classList.add('spinning');
  pulseContent.innerHTML = `<div class="pulse-loading"><span></span><span></span><span></span></div>`;

  const d = DATA[currentPeriod];
  const period = currentPeriod === 7 ? 'last 7 days' : currentPeriod === 30 ? 'last 30 days' : 'last 90 days';
  const overdueClients = TRANSACTIONS.filter(t => t.status === 'overdue').map(t => t.client).join(', ');
  const pendingAmount = TRANSACTIONS.filter(t => t.status === 'pending').reduce((a, t) => a + t.amount, 0);

  const prompt = `You are a sharp, no-fluff business analyst. Based on these dashboard metrics for the ${period}, write ONE concise insight sentence (max 30 words) that tells the business owner the single most important thing to act on right now.

Metrics:
- Revenue: $${d.revenue.toLocaleString()} (${d.revenueChange >= 0 ? '+' : ''}${d.revenueChange}% vs prev period)
- Active clients: ${d.clients} (${d.clientsChange >= 0 ? '+' : ''}${d.clientsChange}%)
- Orders: ${d.orders} (${d.ordersChange >= 0 ? '+' : ''}${d.ordersChange}%)
- Expenses: $${d.expenses.toLocaleString()} (${d.expensesChange >= 0 ? '+' : ''}${d.expensesChange}%)
- Overdue payments from: ${overdueClients || 'none'}
- Pending invoices total: $${pendingAmount.toLocaleString()}
- Goal progress: ${Math.round((d.goal.current / d.goal.target) * 100)}% of $${d.goal.target.toLocaleString()} target

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
      typewriterEffect(pulseContent, text);
    } else {
      pulseContent.textContent = 'Unable to generate insight. Check your connection.';
    }
  } catch (err) {
    pulseContent.textContent = 'Revenue is up — but chase that $' +
      TRANSACTIONS.filter(t => t.status === 'pending').reduce((a, t) => a + t.amount, 0).toLocaleString() +
      ' in pending invoices before end of month.';
  } finally {
    refreshPulse.classList.remove('spinning');
  }
}

function typewriterEffect(el, text) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 22);
}

// ── NAVIGATION ────────────────────────────────
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + page).classList.add('active');

      pageTitle.textContent = item.textContent.trim();

      if (window.innerWidth <= 768) closeSidebarMenu();
    });
  });
}

// ── SIDEBAR (mobile) ──────────────────────────
function initSidebar() {
  menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  closeSidebar.addEventListener('click', closeSidebarMenu);
  overlay.addEventListener('click', closeSidebarMenu);
}

function closeSidebarMenu() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ── THEME ─────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('pulse-theme') || 'dark';
  applyTheme(saved);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('pulse-theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (revenueChart || splitChart) {
    const d = DATA[currentPeriod];
    renderCharts(d);
  }
}

// ── DATE FILTER ───────────────────────────────
function initDateFilter() {
  dateFilter.addEventListener('change', () => {
    currentPeriod = parseInt(dateFilter.value);
    loadDashboard(currentPeriod);
    fetchAIPulse();
  });
}

// ── EXPORT CSV ────────────────────────────────
function initExport() {
  exportBtn.addEventListener('click', () => {
    const headers = ['Client', 'Project', 'Date', 'Amount', 'Status'];
    const rows = TRANSACTIONS.map(t =>
      [t.client, t.project, t.date, '$' + t.amount, t.status]
    );

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulse-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ── REFRESH PULSE ─────────────────────────────
refreshPulse.addEventListener('click', fetchAIPulse);
