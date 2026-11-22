// Saves and loads data in the browser (localStorage). Phase 2 replaces this with API calls.
const Store = {
  loadExpenses() {
    try { return JSON.parse(localStorage.getItem('et.expenses')) || []; } catch (e) { return []; }
  },
  saveExpenses(list) {
    try { localStorage.setItem('et.expenses', JSON.stringify(list)); } catch (e) { console.error('Could not save', e); }
  },
  loadBudget() {
    try { return Number(localStorage.getItem('et.budget')) || 0; } catch (e) { return 0; }
  },
  saveBudget(centavos) {
    try { localStorage.setItem('et.budget', String(centavos)); } catch (e) { console.error('Could not save', e); }
  }
};
