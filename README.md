# Expense Tracker

A simple expense tracker that runs in the browser and saves your spending on your own device.

**Live demo:** _add your link here after deploying_

## Features
- Add, edit, and delete expenses (amount, category, date, note)
- Monthly total, category breakdown, and a budget meter with warnings at 80% and when over
- Filter by month and category, and search notes
- Export the current view to CSV
- Works on phones, and follows your light or dark setting
- Money is stored as whole centavos to avoid decimal rounding bugs

## Run it
Open `index.html` in your browser. No install needed.

## Project structure
```
index.html        page layout
css/style.css     styles
js/storage.js     saves and loads data (localStorage)
js/chart.js       category bars
js/app.js         forms, filters, list, budget, CSV export
```

## Roadmap
- [x] Phase 1: browser-only tracker
- [ ] Phase 2: backend (Node + Express + database) with user accounts
- [ ] Phase 3: tests, deployment, screenshots

## What I learned
_Write 3 to 4 sentences here when you finish._
