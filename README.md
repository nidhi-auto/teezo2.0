# Teezo Golf 2.0

Club administration, player membership, and tournament workflows for Teezo Golf.

| Surface | Path | Entry |
| --- | --- | --- |
| Web (LaunchPad preview) | `/` (repo root) | `npm install && npm run dev` |
| Express API | `backend/backend/` | `npm run dev --prefix backend/backend` (port **3001**) |
| Player mobile API clients | `mobile/` | `mobile/src/api/` — see `mobile/README.md` |

## Local development

```bash
npm install
cd backend/backend && npm install && cd ../..
cd mobile && npm install && cd ..
npm run dev:stack
```

Preview Desktop uses root `package.json` (`npm run dev` → Vite only) and `.launchpad/preview.json`. Run the API separately with `npm run dev --prefix backend/backend`, or use `npm run dev:stack` for both.

- Vite: http://localhost:5173 (proxies `/api` to the API)
- API health: http://localhost:3001/api/v1/health

Seeded sign-in users (non-production): `super@teezo.local`, `clubadmin@teezo.local`, `player@teezo.local` — password `password123`.

## Tests

```bash
cd backend/backend && npm test
cd mobile && npm test
```

Compliance and flow verification artifacts: `backend/.launchpad/`.