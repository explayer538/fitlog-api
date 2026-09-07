# FitLog Frontend

This folder contains the React and Vite interface for FitLog.

## Main files

- `src/App.jsx` contains authentication, dashboard, workout form, activity list, and delete confirmation components.
- `src/api.js` handles API requests, JWT storage, automatic token refresh, and sign-out cleanup.
- `src/App.css` contains the responsive bubble-style visual system.
- `vite.config.js` forwards local `/api` requests to Django at `http://127.0.0.1:8000`.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

The complete setup, architecture, API, security notes, and troubleshooting guide are in the root `README.md`.
