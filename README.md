# Expense Tracker

Track income and spending, set a monthly budget, and see where your money goes. Everything runs in the browser and is saved on your own device.

**Live demo:** https://zingkeee.github.io/expense-tracker/

## Features
- Add, edit, and delete **expenses and income**
- **Repeat every month** for things like rent, subscriptions, or allowance
- Monthly summary: spent, income, balance, and a **budget meter** (warns at 80% and when over)
- **Charts** (Chart.js): spending by category, plus income vs spending for the last 6 months
- Month switcher, category filter, and note search
- Export the current view to **CSV**
- Responsive glass-style design that follows your light or dark setting
- Money is stored as whole centavos to avoid decimal rounding bugs

## Run it
Open `index.html` in your browser. No install needed (charts load from a CDN, so you need internet for them).

## Project structure
```
index.html        layout and icons
css/style.css     styles (design tokens at the top)
js/storage.js     saves and loads data (localStorage)
js/charts.js      Chart.js charts
js/app.js         forms, repeating entries, filters, list, budget, CSV
```

## Design
Designed with the UI UX Pro Max skill: glassmorphism style, trust blue with green and red for income and spending, sorted horizontal bars for categories and a line chart for trends.

## Roadmap
- [x] Phase 1: browser-only tracker, with income, repeating entries, and charts
- [ ] Phase 2: backend (Node + Express + database) with user accounts
- [ ] Phase 3: tests and deployment

## What I learned
_Write 3 to 4 sentences here._