# merchant-panel

Merchant-facing frontend for the Shopify B2B Platform. React + Vite scaffold (still on the default Vite template UI).

## Stack

- React 19
- Vite 8
- Oxlint (linting)

## Structure

```
index.html
src/
  main.jsx      # React entry point
  App.jsx       # Root component
  App.css
  index.css
  assets/
public/
  favicon.svg
  icons.svg
vite.config.js
.oxlintrc.json  # Oxlint config
```

## Commands

```bash
npm install
npm run dev       # vite dev server
npm run build      # vite build
npm run preview    # preview production build
npm run lint       # oxlint
```

## Environment variables (`.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_API_URL` | Base URL of the [backend-api](../backend-api/CLAUDE.md) service this panel talks to |

Only variables prefixed `VITE_` are exposed to client-side code (Vite convention).

## Notes for future work

- App currently ships with default Vite/React boilerplate — no B2B merchant features implemented yet.
- Talks to `backend-api` via `VITE_BACKEND_API_URL`; no API client/service layer exists yet.
