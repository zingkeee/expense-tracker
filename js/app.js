const CATS = {
  expense: ['Food', 'Transport', 'Bills', 'Shopping', 'School', 'Health', 'Other'],
  income: ['Allowance', 'Salary', 'Freelance', 'Gift', 'Other']
};
const $ = id => document.getElementById(id);
const peso = c => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(c / 100);
const today = () => new Date().toLocaleDateString('en-CA');           // YYYY-MM-DD, local time
const pad = n => String(n).padStart(2, '0');
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const icon = name => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-' + name); s.append(u); return s; };
const monthLabel = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }); };
const shiftMonth = (ym, d) => { const [y, m] = ym.split('-').map(Number); const t = new Date(y, m - 1 + d, 1); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}`; };

let entries = Store.loadEntries();
let recurring = Store.loadRecurring();   // templates: { id, type, amount, category, note, start, day, skip[] }
let budget = Store.loadBudget();         // centavos, to avoid decimal rounding bugs
let month = today().slice(0, 7), type = 'expense', editingId = null;

function fillCategories(select, list, keepFirst) {
  const first = keepFirst ? select.firstElementChild : null;
  select.replaceChildren(...(first ? [first] : []));
  for (const c of list) { const o = document.createElement('option'); o.value = o.textContent = c; select.append(o); }
}
fillCategories($('category'), CATS.expense);
fillCategories($('filterCategory'), [...new Set([...CATS.expense, ...CATS.income])], true);
$('date').value = today();
$('budget').value = budget ? budget / 100 : '';

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}
function save() { Store.saveEntries(entries); Store.saveRecurring(recurring); }

// ---- repeating entries: create any missing monthly copies up to the current month ----
function materialize() {
  const now = today().slice(0, 7); let changed = false;
  for (const t of recurring) {
    let [y, m] = t.start.slice(0, 7).split('-').map(Number);
    for (;;) {
      const ym = `${y}-${pad(m)}`; if (ym > now) break;
      if (!t.skip.includes(ym) && !entries.some(x => x.recId === t.id && x.date.slice(0, 7) === ym)) {
        const day = Math.min(t.day, new Date(y, m, 0).getDate());   // 31st becomes 28th/30th when needed
        entries.push({ id: uid(), recId: t.id, type: t.type, amount: t.amount, category: t.category, note: t.note, date: `${ym}-${pad(day)}` });
        changed = true;
      }
      if (++m > 12) { m = 1; y++; }
    }
  }
  if (changed) save();
}

// ---- form ----
function resetForm() {
  editingId = null; $('form').reset(); type = 'expense';
  fillCategories($('category'), CATS.expense);
  $('date').value = today();
  $('formTitle').textContent = 'Add entry';
  $('submitBtn').textContent = 'Add expense';
  $('cancelBtn').hidden = true; $('repeatRow').hidden = false;
}
document.querySelectorAll('input[name="type"]').forEach(r => r.addEventListener('change', () => {
  type = r.value; fillCategories($('category'), CATS[type]);
  $('submitBtn').textContent = editingId ? 'Save changes' : 'Add ' + type;
}));

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const amount = Math.round(parseFloat($('amount').value) * 100);
  if (!(amount > 0)) { $('amount').focus(); return; }
  const data = { type, amount, category: $('category').value, date: $('date').value, note: $('note').value.trim() };
  if (editingId) {
    entries = entries.map(x => x.id === editingId ? { ...x, ...data } : x);
    toast('Changes saved');
  } else {
    const entry = { id: uid(), ...data };
    if ($('repeat').checked) {
      const t = { id: uid(), type, amount, category: data.category, note: data.note, start: data.date, day: Number(data.date.slice(8, 10)), skip: [] };
      recurring.push(t); entry.recId = t.id;
    }
    entries.push(entry);
    toast(type === 'income' ? 'Income added' : 'Expense added');
  }
  save(); materialize();
  month = data.date.slice(0, 7);
  resetForm(); render();
});
$('cancelBtn').addEventListener('click', resetForm);

function startEdit(x) {
  editingId = x.id; type = x.type;
  document.querySelector(`input[name="type"][value="${x.type}"]`).checked = true;
  fillCategories($('category'), CATS[x.type]);
  $('amount').value = x.amount / 100; $('category').value = x.category; $('date').value = x.date; $('note').value = x.note;
  $('formTitle').textContent = 'Edit entry'; $('submitBtn').textContent = 'Save changes';
  $('cancelBtn').hidden = false; $('repeatRow').hidden = true;
  $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('amount').focus({ preventScroll: true });
}
function remove(x) {
  if (!confirm(`Delete ${peso(x.amount)} (${x.category})?`)) return;
  if (x.recId) { const t = recurring.find(r => r.id === x.recId); if (t) t.skip.push(x.date.slice(0, 7)); } // don't recreate it
  entries = entries.filter(e => e.id !== x.id);
  if (editingId === x.id) resetForm();
  save(); toast('Entry deleted'); render();
}
function stopRepeat(t) {
  recurring = recurring.filter(r => r.id !== t.id); save();
  toast('Stopped repeating. Past entries are kept.'); render();
}

// ---- budget, month, filters ----
$('budget').addEventListener('change', () => {
  const v = Math.round(parseFloat($('budget').value) * 100);
  budget = v > 0 ? v : 0; Store.saveBudget(budget); render();
});
$('prevMonth').addEventListener('click', () => { month = shiftMonth(month, -1); render(); });
$('nextMonth').addEventListener('click', () => { month = shiftMonth(month, 1); render(); });
$('filterCategory').addEventListener('change', render);
$('search').addEventListener('input', render);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);   // redraw charts in new theme

// ---- CSV ----
const csvCell = v => { let s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
$('exportBtn').addEventListener('click', () => {
  const rows = visibleRows();
  if (!rows.length) { toast('Nothing to export'); return; }
  const lines = ['Date,Type,Category,Note,Amount (PHP)', ...rows.map(x => [x.date, x.type, x.category, x.note, (x.amount / 100).toFixed(2)].map(csvCell).join(','))];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  Object.assign(document.createElement('a'), { href: url, download: `entries-${month}.csv` }).click();
  URL.revokeObjectURL(url);
});

// ---- render ----
function visibleRows() {
  const cat = $('filterCategory').value, q = $('search').value.trim().toLowerCase();
  return entries
    .filter(x => x.date.slice(0, 7) === month)
    .filter(x => !cat || x.category === cat)
    .filter(x => !q || x.note.toLowerCase().includes(q) || x.category.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
}
const sum = (list, t) => list.filter(x => x.type === t).reduce((s, x) => s + x.amount, 0);

function render() {
  $('monthLabel').textContent = monthLabel(month);
  const inMonth = entries.filter(x => x.date.slice(0, 7) === month);
  const spent = sum(inMonth, 'expense'), income = sum(inMonth, 'income'), balance = income - spent;
  $('spent').textContent = peso(spent);
  $('income').textContent = peso(income);
  $('balance').textContent = peso(balance);
  $('balance').className = 'stat' + (balance < 0 ? ' neg' : '');

  const meter = $('meter'), msg = $('budgetMsg');
  meter.className = 'meter'; msg.className = 'budget-msg';
  if (budget > 0) {
    const pct = spent / budget;
    $('meterFill').style.width = Math.min(pct * 100, 100) + '%';
    meter.setAttribute('aria-valuenow', Math.round(Math.min(pct, 1) * 100));
    if (pct > 1) { meter.classList.add('over'); msg.classList.add('over'); msg.textContent = `Over budget by ${peso(spent - budget)}`; }
    else if (pct >= 0.8) { meter.classList.add('warn'); msg.classList.add('warn'); msg.textContent = `${Math.round(pct * 100)}% used. ${peso(budget - spent)} left`; }
    else msg.textContent = `${peso(budget - spent)} left of ${peso(budget)}`;
  } else { $('meterFill').style.width = '0'; msg.textContent = 'Set a monthly budget to track it.'; }

  // list
  const rows = visibleRows(), list = $('list');
  list.replaceChildren(); $('empty').hidden = rows.length > 0;
  for (const x of rows) {
    const li = document.createElement('li'); li.className = 'item';
    const left = document.createElement('div');
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = x.category;
    if (x.recId) tag.append(icon('repeat'));
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = [new Date(x.date + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }), x.note].filter(Boolean).join(': ');
    left.append(tag, meta);
    const amt = document.createElement('div'); amt.className = 'amt' + (x.type === 'income' ? ' ok' : '');
    amt.textContent = (x.type === 'income' ? '+' : '') + peso(x.amount);
    const acts = document.createElement('div'); acts.className = 'acts';
    const edit = document.createElement('button'); edit.className = 'btn small'; edit.append(icon('edit'), 'Edit');
    edit.setAttribute('aria-label', `Edit ${x.category} entry`); edit.addEventListener('click', () => startEdit(x));
    const del = document.createElement('button'); del.className = 'btn small danger'; del.append(icon('trash'), 'Delete');
    del.setAttribute('aria-label', `Delete ${x.category} entry`); del.addEventListener('click', () => remove(x));
    acts.append(edit, del); li.append(left, amt, acts); list.append(li);
  }

  // repeating panel
  $('repeatPanel').hidden = recurring.length === 0;
  const rl = $('repeatList'); rl.replaceChildren();
  for (const t of recurring) {
    const li = document.createElement('li'); li.className = 'item';
    const left = document.createElement('div');
    const tag = document.createElement('span'); tag.className = 'tag'; tag.append(icon('repeat'), t.category);
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = ['Day ' + t.day, t.note].filter(Boolean).join(': ');
    left.append(tag, meta);
    const amt = document.createElement('div'); amt.className = 'amt' + (t.type === 'income' ? ' ok' : ''); amt.textContent = (t.type === 'income' ? '+' : '') + peso(t.amount);
    const acts = document.createElement('div'); acts.className = 'acts';
    const stop = document.createElement('button'); stop.className = 'btn small danger'; stop.textContent = 'Stop repeating';
    stop.setAttribute('aria-label', `Stop repeating ${t.category}`); stop.addEventListener('click', () => stopRepeat(t));
    acts.append(stop); li.append(left, amt, acts); rl.append(li);
  }

  // charts
  const byCat = {};
  for (const x of inMonth) if (x.type === 'expense') byCat[x.category] = (byCat[x.category] || 0) + x.amount;
  const trend = { labels: [], spent: [], income: [] };
  for (let i = 5; i >= 0; i--) {
    const ym = shiftMonth(month, -i), m = entries.filter(x => x.date.slice(0, 7) === ym);
    const [y, mo] = ym.split('-').map(Number);
    trend.labels.push(new Date(y, mo - 1, 1).toLocaleDateString('en-PH', { month: 'short' }));
    trend.spent.push(sum(m, 'expense')); trend.income.push(sum(m, 'income'));
  }
  drawCharts(byCat, trend);
}

materialize();
render();