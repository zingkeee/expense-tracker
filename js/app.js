const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'School', 'Health', 'Other'];
const $ = id => document.getElementById(id);
const peso = c => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(c / 100);
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

let expenses = Store.loadExpenses();
let budget = Store.loadBudget();   // stored in centavos to avoid decimal rounding bugs
let editingId = null;

// ---- setup ----
for (const c of CATEGORIES) for (const id of ['category', 'filterCategory']) {
  const o = document.createElement('option'); o.value = o.textContent = c; $(id).append(o);
}
$('date').value = today();
$('month').value = today().slice(0, 7);
$('budget').value = budget ? budget / 100 : '';

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---- add / edit ----
function resetForm() {
  editingId = null;
  $('form').reset();
  $('date').value = today();
  $('formTitle').textContent = 'Add expense';
  $('submitBtn').textContent = 'Add expense';
  $('cancelBtn').hidden = true;
}

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const amount = Math.round(parseFloat($('amount').value) * 100);
  if (!(amount > 0)) { $('amount').focus(); return; }
  const data = { amount, category: $('category').value, date: $('date').value, note: $('note').value.trim() };
  if (editingId) {
    expenses = expenses.map(x => x.id === editingId ? { ...x, ...data } : x);
    toast('Changes saved');
  } else {
    expenses.push({ id: uid(), ...data });
    toast('Expense added');
  }
  Store.saveExpenses(expenses);
  $('month').value = data.date.slice(0, 7); // jump to the month you just added to
  resetForm();
  render();
});

$('cancelBtn').addEventListener('click', resetForm);

function startEdit(x) {
  editingId = x.id;
  $('amount').value = x.amount / 100;
  $('category').value = x.category;
  $('date').value = x.date;
  $('note').value = x.note;
  $('formTitle').textContent = 'Edit expense';
  $('submitBtn').textContent = 'Save changes';
  $('cancelBtn').hidden = false;
  $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('amount').focus({ preventScroll: true });
}

function remove(x) {
  if (!confirm(`Delete ${peso(x.amount)} for ${x.category}?`)) return;
  expenses = expenses.filter(e => e.id !== x.id);
  Store.saveExpenses(expenses);
  if (editingId === x.id) resetForm();
  toast('Expense deleted');
  render();
}

// ---- budget ----
$('budget').addEventListener('change', () => {
  const v = Math.round(parseFloat($('budget').value) * 100);
  budget = v > 0 ? v : 0;
  Store.saveBudget(budget);
  render();
});

// ---- filters ----
for (const id of ['month', 'filterCategory']) $(id).addEventListener('change', render);
$('search').addEventListener('input', render);

// ---- CSV export ----
function csvCell(v) {
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;           // stops spreadsheet formula injection
  return '"' + s.replace(/"/g, '""') + '"';
}
$('exportBtn').addEventListener('click', () => {
  const rows = visibleRows();
  if (!rows.length) { toast('Nothing to export'); return; }
  const lines = ['Date,Category,Note,Amount (PHP)',
    ...rows.map(x => [x.date, x.category, x.note, (x.amount / 100).toFixed(2)].map(csvCell).join(','))];
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `expenses-${$('month').value}.csv` });
  a.click(); URL.revokeObjectURL(url);
});

// ---- render ----
function visibleRows() {
  const month = $('month').value, cat = $('filterCategory').value, q = $('search').value.trim().toLowerCase();
  return expenses
    .filter(x => x.date.slice(0, 7) === month)
    .filter(x => !cat || x.category === cat)
    .filter(x => !q || x.note.toLowerCase().includes(q) || x.category.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function render() {
  const month = $('month').value;
  const inMonth = expenses.filter(x => x.date.slice(0, 7) === month);
  const total = inMonth.reduce((s, x) => s + x.amount, 0);
  $('total').textContent = peso(total);

  // budget meter
  const meter = $('meter'), msg = $('budgetMsg');
  meter.className = 'meter'; msg.className = 'budget-msg';
  if (budget > 0) {
    const pct = total / budget;
    $('meterFill').style.width = Math.min(pct * 100, 100) + '%';
    meter.setAttribute('aria-valuenow', Math.round(Math.min(pct, 1) * 100));
    if (pct > 1) { meter.classList.add('over'); msg.classList.add('over'); msg.textContent = `Over budget by ${peso(total - budget)}`; }
    else if (pct >= 0.8) { meter.classList.add('warn'); msg.classList.add('warn'); msg.textContent = `${Math.round(pct * 100)}% used. ${peso(budget - total)} left`; }
    else msg.textContent = `${peso(budget - total)} left of ${peso(budget)}`;
  } else {
    $('meterFill').style.width = '0';
    msg.textContent = 'Set a monthly budget to track it.';
  }

  // category bars
  const byCat = {};
  for (const x of inMonth) byCat[x.category] = (byCat[x.category] || 0) + x.amount;
  renderBars($('bars'), byCat, peso);

  // list
  const rows = visibleRows(), list = $('list');
  list.replaceChildren();
  $('empty').hidden = rows.length > 0;
  for (const x of rows) {
    const li = document.createElement('li'); li.className = 'item';
    const left = document.createElement('div');
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = x.category;
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = [new Date(x.date + 'T00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }), x.note].filter(Boolean).join(': ');
    left.append(tag, meta);
    const amt = document.createElement('div'); amt.className = 'amt'; amt.textContent = peso(x.amount);
    const acts = document.createElement('div'); acts.className = 'acts';
    const edit = document.createElement('button'); edit.className = 'btn small'; edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${x.category} expense`);
    edit.addEventListener('click', () => startEdit(x));
    const del = document.createElement('button'); del.className = 'btn small danger'; del.textContent = 'Delete';
    del.setAttribute('aria-label', `Delete ${x.category} expense`);
    del.addEventListener('click', () => remove(x));
    acts.append(edit, del);
    li.append(left, amt, acts);
    list.append(li);
  }
}

render();
