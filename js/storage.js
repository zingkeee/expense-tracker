// Saves and loads data in the browser (localStorage). Phase 2 replaces this with API calls.
const Store = {
  _get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; } },
  _set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error('Could not save', e); } },
  loadEntries() { return this._get('et.expenses', []).map(x => ({ type: 'expense', ...x })); }, // old entries default to expense
  saveEntries(list) { this._set('et.expenses', list); },
  loadRecurring() { return this._get('et.recurring', []); },
  saveRecurring(list) { this._set('et.recurring', list); },
  loadBudget() { return Number(this._get('et.budget', 0)) || 0; },
  saveBudget(centavos) { this._set('et.budget', centavos); }
};