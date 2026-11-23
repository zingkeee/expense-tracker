// Chart.js drawing. Colors come from CSS variables so charts follow light/dark mode.
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let catChart, trendChart;

const valueLabels = { // writes the amount at the end of each bar so the chart never relies on color alone
  id: 'valueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save(); ctx.fillStyle = cssVar('--fg'); ctx.font = '700 12px Manrope, sans-serif'; ctx.textBaseline = 'middle';
    chart.getDatasetMeta(0).data.forEach((bar, i) => ctx.fillText(peso(chart.data.datasets[0].data[i]), bar.x + 8, bar.y));
    ctx.restore();
  }
};

function drawCharts(byCat, trend) {
  if (!window.Chart) { $('chartNote').textContent = 'Charts need an internet connection to load.'; return; }
  $('chartNote').textContent = '';
  const fg = cssVar('--fg'), grid = cssVar('--grid');
  Chart.defaults.font.family = 'Manrope, system-ui, sans-serif';
  Chart.defaults.color = cssVar('--muted');
  catChart?.destroy(); trendChart?.destroy();

  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  $('catEmpty').hidden = rows.length > 0;
  $('catWrap').hidden = rows.length === 0;
  if (rows.length) {
    $('catWrap').style.height = rows.length * 40 + 16 + 'px';
    $('catCanvas').setAttribute('aria-label', 'Spending by category: ' + rows.map(r => `${r[0]} ${peso(r[1])}`).join(', '));
    catChart = new Chart($('catCanvas'), {
      type: 'bar',
      data: { labels: rows.map(r => r[0]), datasets: [{ data: rows.map(r => r[1]), backgroundColor: cssVar('--bar'), borderRadius: 6, barThickness: 18 }] },
      options: {
        indexAxis: 'y', maintainAspectRatio: false, animation: { duration: 250 }, layout: { padding: { right: innerWidth < 480 ? 74 : 90 } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => peso(c.parsed.x) } } },
        scales: { x: { display: false, beginAtZero: true }, y: { grid: { display: false }, border: { display: false }, ticks: { color: fg } } }
      },
      plugins: [valueLabels]
    });
  }

  $('trendCanvas').setAttribute('aria-label', 'Last 6 months. ' + trend.labels.map((l, i) => `${l}: spent ${peso(trend.spent[i])}, income ${peso(trend.income[i])}`).join('; '));
  trendChart = new Chart($('trendCanvas'), {
    type: 'line',
    data: { labels: trend.labels, datasets: [
      { label: 'Spent', data: trend.spent, borderColor: cssVar('--bad'), backgroundColor: cssVar('--bad'), tension: .3, pointRadius: 4 },
      { label: 'Income', data: trend.income, borderColor: cssVar('--ok'), backgroundColor: cssVar('--ok'), borderDash: [6, 4], tension: .3, pointRadius: 4, pointStyle: 'rectRot' }
    ] },
    options: {
      maintainAspectRatio: false, animation: { duration: 250 },
      plugins: { legend: { labels: { color: fg, usePointStyle: true } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${peso(c.parsed.y)}` } } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: grid }, ticks: { callback: v => '₱' + (v / 100 >= 1000 ? +(v / 100000).toFixed(1) + 'k' : v / 100) } } }
    }
  });
}