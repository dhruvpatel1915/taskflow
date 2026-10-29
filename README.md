# Taskflow: Kanban Project Board

A fast, accessible Kanban board built with **vanilla JavaScript (ES modules) and Vite**, with zero runtime dependencies.

**Live demo:** _add your GitHub Pages link here_

## Features
- Drag and drop cards between columns, with exact ordering inside a column
- Move buttons and keyboard support (Tab, Enter) for touch and accessibility
- Create, edit and delete tasks in a native `<dialog>`; **Undo** after deleting
- Live search and priority filter; overdue detection with a dashboard of stats
- Light and dark themes (follows system setting, remembers your choice)
- Data saved in `localStorage`; fully responsive (swipeable columns on mobile)
- Shortcuts: `N` new task, `/` focus search

## Engineering highlights
- **Predictable state:** a small observable store; all changes go through one module
- **Pure logic separated from the DOM:** `lib.js` and `store.js` are unit tested
- **Secure rendering:** DOM is built with `textContent`, never `innerHTML`
- **Accessible:** semantic landmarks, labelled controls, focus states, live-region toasts, `prefers-reduced-motion`
- **CI/CD:** GitHub Actions runs tests, builds and deploys to GitHub Pages on every push

## Project structure
```
src/
├── main.js    app wiring and rendering
├── store.js   observable store + persistence
├── lib.js     pure helpers (filter, stats, dates, seed data)
├── ui.js      DOM helper, toast, task dialog
└── style.css  design tokens, light/dark themes, responsive layout
tests/         Vitest unit tests
```

## Getting started
```bash
npm install
npm run dev      # start dev server
npm test         # run unit tests
npm run build    # production build in dist/
```

## Deploy (GitHub Pages)
1. Push to the `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` publishes the site.

## Ideas for next steps
TypeScript migration, import/export JSON, multiple boards, end-to-end tests with Playwright.

## Author
Dhruv Patel | MSc IT
