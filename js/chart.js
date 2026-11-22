// Draws the "Where it went" bars. totals = { Food: 12000, ... } in centavos.
function renderBars(el, totals, format) {
  el.replaceChildren();
  const rows = Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!rows.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Nothing spent yet this month.';
    el.append(p);
    return;
  }
  const max = rows[0][1];
  for (const [name, value] of rows) {
    const row = document.createElement('div'); row.className = 'bar-row';
    const label = document.createElement('span'); label.textContent = name;
    const track = document.createElement('div'); track.className = 'bar-track';
    const fill = document.createElement('div'); fill.className = 'bar-fill';
    fill.style.width = (value / max * 100) + '%';
    track.append(fill);
    const amt = document.createElement('span'); amt.textContent = format(value);
    row.append(label, track, amt);
    el.append(row);
  }
}
