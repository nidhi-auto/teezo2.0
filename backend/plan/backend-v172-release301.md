# Backend Plan — Teezo 2.0 Release 1.0.0

**Project version:** 172  
**Release lock:** 301  
**Frontend tag:** proj-172-rel-301-R190 (`7aced66c`)  
**Hosting mode:** None (With Server Only) — local Express + local PostgreSQL  
**API root:** `backend/backend/` (extend in place; no parallel stack)  
**UI root:** `.` (repo-root Vite + React SPA)  
**Mobile:** `mobile/` — API clients only (no backend duplication)

## Goal

Evolve the preview Express API and in-memory store (described in Client Link history on `main`) into a **production-shaped local backend** that satisfies release 1.0.0: persistent PostgreSQL data, server-enforced RBAC, full authentication lifecycle (email/password, Google linking, password reset, expiring/revocable sessions), club membership and tournament workflows, creation audit metadata, and clean removal of preview-only auth and demo data—while the repo-root web app and mobile clients call the same existing `/api/*` paths.

## Assumptions

1. **Code sync:** Lock workspace may not yet contain the Client Link commits (`backend/backend/`, `src/`, `mobile/`). Implementation assumes checking out or merging that history before executing this plan.
2. **Auth:** Express routes `POST /api/auth/register`, `POST /api/auth/sign-in`, and `POST /api/auth/google` constitute **existing production auth** for this product. **Amazon Cognito is N/A** unless a future REQ explicitly mandates migration.
3. **Policy durations:** Invitation TTL and join-request re-application waiting periods are **configuration placeholders** (env or `membership_policies` table) until stakeholders approve values (REQ-041, REQ-058).
4. **Account lifecycle:** REQ-032 deactivation/retention is **documentation + schema hooks** (status flags, no destructive purge) until policy is approved.
5. **No file uploads** in UI → object storage N/A.
6. **Empty database after migrations** — no seed scripts inserting business rows; Super Admin bootstrap via one-time env-gated migration or first-run CLI only if REQ explicitly requires (otherwise accounts created only through app flows).

## Existing API inventory

*(From Client Link / intended `backend/backend` tree — verify after sync.)*

| Method | Path | Handler area | Primary models | Auth |
|--------|------|--------------|----------------|------|
| POST | `/api/auth/register` | `routes/auth.ts` | `accounts`, `password_credentials` | Public |
| POST | `/api/auth/sign-in` | `routes/auth.ts` | `accounts`, `sessions` | Public |
| POST | `/api/auth/google` | `routes/auth.ts` | `accounts`, `google_identities` | Public |
| POST | `/api/preview/demo-session` | `app.ts` | `sessions` | Public — **remove in fresh-start** |
| GET | `/api/golf-suggestions` | `routes/golf-suggestions.ts` | (none) | Public — optional keep |
| GET | `/api/admin/platform/club-admins` | `routes/admin.ts` | `accounts` | Bearer + `platform:admin` |
| POST | `/api/admin/platform/club-admins` | `routes/admin.ts` | `accounts` | Bearer + `platform:admin` |
| PATCH | `/api/admin/platform/club-admins/:accountId` | `routes/admin.ts` | `accounts` | Bearer + `platform:admin` |
| GET | `/api/admin/platform/clubs` | `routes/admin.ts` | `clubs` | Bearer + `platform:admin` |
| GET | `/api/admin/clubs/:clubId/players` | `routes/admin.ts` | `accounts`, `memberships` | Bearer + `club:admin_read` |
| POST | `/api/admin/clubs/:clubId/players` | `routes/admin.ts` | `accounts`, `memberships` | Bearer + `membership:manage` |
| PATCH | `/api/admin/clubs/:clubId/players/:accountId` | `routes/admin.ts` | `accounts` | Bearer + `membership:manage` |
| GET | `/api/admin/clubs/:clubId/tournaments` | `routes/admin.ts` | `tournaments` | Bearer + `club:admin_read` |
| POST | `/api/admin/clubs/:clubId/tournaments` | `routes/admin.ts` | `tournaments` | Bearer + `tournament:manage` |
| PATCH | `/api/admin/clubs/:clubId/tournaments/:id` | `routes/admin.ts` | `tournaments` | Bearer + `tournament:manage` |
| POST | `/api/admin/clubs/:clubId/tournaments/:id/publish` | `routes/admin.ts` | `tournaments` | Bearer + `tournament:manage` |
| POST | `/api/admin/clubs/:clubId/tournaments/:id/go-live` | `routes/admin.ts` | `tournaments` | Bearer + `tournament:manage` |
| POST | `/api/admin/clubs/:clubId/tournaments/:id/close` | `routes/admin.ts` | `tournaments` | Bearer + `tournament:manage` |
| POST | `/api/admin/clubs/:clubId/invitations` | `routes/admin.ts` | `invitations` | Bearer + `membership:manage` |
| GET | `/api/admin/clubs/:clubId/invitations` | `routes/admin.ts` | `invitations` | Bearer + `club:admin_read` |
| GET | `/api/admin/clubs/:clubId/join-requests` | `routes/admin.ts` | `join_requests` | Bearer + `club:admin_read` |
| POST | `/api/admin/clubs/:clubId/join-requests/:id/approve` | `routes/admin.ts` | `join_requests`, `memberships` | Bearer + `membership:manage` |
| POST | `/api/admin/clubs/:clubId/join-requests/:id/reject` | `routes/admin.ts` | `join_requests` | Bearer + `club:admin_read` |
| GET | `/api/me/clubs` | `routes/player.ts` | `memberships`, `clubs` | Bearer + player |
| GET | `/api/me/clubs/:clubId/tournaments` | `routes/player.ts` | `tournaments` | Bearer + member |
| GET | `/api/join-requests` | `routes/player.ts` | `join_requests` | Bearer + `player:self_service` |
| POST | `/api/join-requests` | `routes/player.ts` | `join_requests` | Bearer + `player:self_service` |
| GET | `/api/invitations` | `routes/player.ts` | `invitations` | Bearer + `player:self_service` |
| POST | `/api/invitations/:id/accept` | `routes/player.ts` | `invitations`, `memberships` | Bearer + `player:self_service` |
| POST | `/api/invitations/:id/decline` | `routes/player.ts` | `invitations` | Bearer + `player:self_service` |
| GET | `/api/clubs/live-tournaments` | `routes/player.ts` | `clubs`, `tournaments` | Bearer + player |

**Gap (planned):** `POST /api/auth/password-reset/request`, `POST /api/auth/password-reset/confirm`, `POST /api/auth/sessions/revoke`, `GET /api/admin/audit/creation-events` (Super Admin only).

## Frontend call inventory

| # | Screen / component | Action | Endpoint | Disposition |
|---|-------------------|--------|----------|-------------|
| 1 | `AuthMethodsPanel` / future register form | register | POST `/api/auth/register` | **extend** (wire real form; remove demo-only) |
| 2 | Sign-in (email/password) | auth | POST `/api/auth/sign-in` | **extend** |
| 3 | Sign-in (Google) | auth | POST `/api/auth/google` | **extend** |
| 4 | `App.tsx` demo personas | auth | POST `/api/preview/demo-session` | **delete** — replace with 1–3 |
| 5 | `SuperAdminView` club admins | list | GET `/api/admin/platform/club-admins` | **reuse** |
| 6 | Super Admin create/edit club admin | create/update | POST/PATCH `/api/admin/platform/club-admins` | **reuse** |
| 7 | Super Admin platform clubs | list | GET `/api/admin/platform/clubs` | **reuse** |
| 8 | Super Admin club drill-down | list | GET `/api/admin/clubs/:clubId/players|tournaments` | **reuse** |
| 9 | `ClubAdminView` roster | list/create/update | GET/POST/PATCH `/api/admin/clubs/:clubId/players` | **reuse** |
| 10 | Club Admin tournaments CRUD + lifecycle | CRUD + transitions | POST/PATCH + publish/go-live/close | **reuse** |
| 11 | Club Admin invitations | create/list | POST/GET `/api/admin/clubs/:clubId/invitations` | **reuse** |
| 12 | Club Admin join queue | list/approve/reject | GET + approve/reject join-requests | **reuse** |
| 13 | `PlayerView` my clubs | list | GET `/api/me/clubs` | **reuse** |
| 14 | Player club tournaments | list | GET `/api/me/clubs/:clubId/tournaments` | **reuse** |
| 15 | Player join requests | list/submit | GET/POST `/api/join-requests` | **reuse** |
| 16 | Player invitations | list/accept/decline | GET + POST accept/decline | **reuse** / **extend** if accept routes missing |
| 17 | Player live discovery | list | GET `/api/clubs/live-tournaments` | **reuse** |
| 18 | `GolfSuggestionsPanel` | search | GET `/api/golf-suggestions` | **reuse** (optional) |
| 19 | Password reset UI (new) | request/confirm | POST reset endpoints | **new (justify)** — REQ-031 |
| 20 | Mobile `PlayerAuthClient` | register/sign-in/google | `/api/auth/*` | **reuse** |
| 21 | Mobile membership/live/activity clients | various | player + admin paths above | **reuse** |

## Schema change plan

| Entity | Disposition | Notes / FKs |
|--------|-------------|-------------|
| `accounts` | **extend** | `id`, `email` (unique), `role`, `status`, `full_name`, `created_at`, `created_by_account_id`, `deactivated_at` |
| `password_credentials` | **new (justify)** | `account_id` → `accounts.id`, `salt`, `hash` — separate table, never expose in API |
| `google_identities` | **new (justify)** | `account_id`, `google_sub` (unique), `verified_email` |
| `sessions` | **new (justify)** | `id`, `account_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at` |
| `password_reset_tokens` | **new (justify)** | `account_id`, `token_hash`, `expires_at`, `used_at` — REQ-031 |
| `clubs` | **reuse/extend** | `name`, `status`, timestamps |
| `club_admin_assignments` | **new (justify)** | `account_id` → Club Admin, `club_id` — many-to-many for assigned clubs |
| `memberships` | **new (justify)** | `account_id`, `club_id`, unique pair; `joined_at` |
| `invitations` | **new (justify)** | `club_id`, `invitee_email`, `status`, `expires_at`, `created_by_account_id` |
| `join_requests` | **new (justify)** | `account_id`, `club_id`, `status`, `rejected_at`, `reapply_after` |
| `tournaments` | **new (justify)** | `club_id`, scoring/entry/dates, `lifecycle_state`, audit fields |
| `creation_audit_events` | **new (justify)** | polymorphic `entity_type`, `entity_id`, `created_at`, `creator_account_id` — REQ-065–068, 090 |

Mirror in `backend/backend/.launchpad/schema-changes.json` at implementation time.

**Migrations:** Use `backend/backend/migrations/` (e.g. `node-pg-migrate` or Drizzle/Knex — pick one and standardize). No seed files with demo business data.

## Target folders (ordered implementation steps)

### Phase 0 — Preview artifact removal (mandatory)

| File / area | Action | Reason |
|-------------|--------|--------|
| `POST /api/preview/demo-session` | delete route | Preview login bypass |
| `src/demo-personas.ts` usage in `App.tsx` | replace | Wire real auth UI (REQ-029, REQ-030) |
| `MemoryStore` as sole persistence | replace | Real DB (fresh-start) |
| Any `DUMMY:`, `MOCK_AUTH`, in-memory demo arrays in `src/` | delete/wire | fresh-start |
| `seedDemoStore`, `seedScaledPlatformStore` in runtime | restrict to **test-only** fixtures | No production seeds |

Produce **Preview artifact removal report** table before DB wiring.

### Phase 1 — Persistence + shared utilities

1. Add `backend/backend/src/db/pg-pool.ts`, `repositories/*` replacing `memory-store.ts` calls.
2. Consolidate `backend/backend/src/utils/` — config, errors, validation, pagination, logging.
3. Migrate `authenticate`, `requirePermission`, `authorize` to load account from DB.
4. Update all route handlers to repositories (preserve paths and response shapes mobile/web already expect).

### Phase 2 — Authentication lifecycle (REQ-029, 030, 031)

1. Keep scrypt password module; ensure no plaintext in DB or logs.
2. Implement password reset: request (rate-limited, opaque token email stub or log in local dev), confirm with new hash.
3. Sessions: configurable TTL (`SESSION_TTL_SECONDS`), `POST /api/auth/sessions/revoke` (and revoke-all for account).
4. Google: retain verified-email linking; reject duplicate email (409).
5. Automated tests: duplicate email, hash verification, reset flow, expired/revoked session → 401.

### Phase 3 — Authorization & cross-club boundaries (REQ-033–036, 052–054, 086–088)

1. Port existing permission matrix to middleware (already in chat history).
2. Ensure every admin read/write includes `clubId` scope checks.
3. Super Admin platform routes gated by `platform:admin`.
4. Expand automated HTTP tests for cross-club denial and player admin denial (retain existing test files).

### Phase 4 — Membership & invitations (REQ-037–040, 055–057, 072–076)

1. Invitation expiry from config; status transitions `pending` → `accepted`/`declined`/`expired`.
2. Join request re-application: enforce `reapply_after` from rejection timestamp.
3. Multi-club memberships: no cross-club side effects on accept/approve/remove.
4. Player invitation accept/decline routes if not present in synced tree.

### Phase 5 — Tournaments (REQ-042–046, 058–060, 077–080)

1. Document tournament rules in `docs/TOURNAMENT_RULES.md` (REQ-042, 058) — no invented scoring engine values.
2. Lifecycle: draft → published → live → closed with invalid transition guards.
3. Live listing filter: only clubs with at least one `live` tournament.
4. Player participation eligibility: member + entry limits + dates (server-side).

### Phase 6 — Audit (REQ-065–068, 071, 090)

1. On create Club Admin, Player (admin workflow), Tournament — insert `creation_audit_events`.
2. `GET /api/admin/platform/creation-audit-events` — Super Admin only.
3. Client cannot set `created_by_account_id` / `created_at` in body.

### Phase 7 — Policy documentation (REQ-032, 041, 047, 061, 081)

1. `docs/ACCOUNT_LIFECYCLE_POLICY.md` — deactivation vs deletion, audit retention placeholders.
2. `docs/MEMBERSHIP_POLICIES.md` — invitation TTL and re-application (TBD values).
3. `docs/MOBILE_PLATFORM_BASELINE.md` — iOS/Android minimums (align mobile README).
4. No implementation of unspecified retention/deletion automation.

### Phase 8 — Integration UI + flow verification

1. Replace demo sign-in with register/sign-in forms calling `/api/auth/*`.
2. Keep role-based views; ensure `apiRequest` sends `Authorization` and JSON content-type.
3. Update `backend/backend/.launchpad/flow-verification.json` and `flow-verification.md` so every REQ-001–REQ-090 appears on at least one journey.
4. Write `backend/backend/.launchpad/release-requirements-compliance.md` with Implemented / N/A / Deferred per REQ.

### Phase 9 — Verify

- `cd backend/backend && npm run test` (all suites).
- `npm run build` at repo root (web).
- `cd mobile && npm run test:access` (policy tests).

## Auth and session notes

- **Keep** Express email/password + Google `POST` exchange; issue Bearer tokens backed by `sessions` table.
- **Remove** preview demo session in production paths.
- **Role assignment** at register: `player` regardless of sign-in method; Club Admin / Super Admin created only via admin workflows.
- **Env vars (names only):** `DATABASE_URL`, `SESSION_TTL_SECONDS`, `PASSWORD_RESET_TTL_SECONDS`, `INVITE_TTL_SECONDS`, `JOIN_REAPPLY_WAIT_SECONDS`, `GOOGLE_CLIENT_ID` (optional verify), `PORT`, `CORS_ORIGIN`.
- **`.env.example`:** `backend/backend/.env.example`, repo root `.env.example` for `VITE_API_BASE_URL` if needed.

## Network (local)

- CORS: allow Vite origin (`http://localhost:5173`).
- Helmet or minimal security headers.
- Rate limit on auth and password-reset routes.
- **Infrastructure:** N/A — local.

## Compute (local)

- Node.js **22.x** Express in `backend/backend/` (`npm run dev`, `preview-dev.ts` for combined preview or single `server.ts`).
- **Infrastructure:** N/A — local process.

## Storage

**N/A — no uploads** in web or mobile product UI for this release.

## Database (local)

- PostgreSQL 17+ via `DATABASE_URL`.
- Migrations only; empty DB after migrate.
- Test suite may use ephemeral DB or transaction rollbacks per test file.

## Deployment considerations

- **Mode:** None (With Server Only) — no `deploy.sh`, no CloudFormation, no Cognito.
- Frontend: `launchpad-frontend/local.md` — Vite dev + `npm run build`.
- Optional Docker Compose for Postgres in `backend/docker-compose.yml` (dev convenience only).

## Unified deploy script

**N/A** — local-only hosting mode.

## Release requirements compliance (plan mapping)

| REQ | Plan disposition |
|-----|------------------|
| REQ-001, 018, 029 | Phase 2 + UI auth |
| REQ-002–004, 063, 083 | Mobile clients reuse APIs; backend Phase 4 |
| REQ-005–006, 084, 050, 064 | Phase 4–5 APIs; mobile unchanged |
| REQ-007–011, 086–090 | Phases 1–6 tests + audit |
| REQ-012–017, 020–027 | UI/FE — N/A backend except proxy/CORS |
| REQ-019, 030 | Phase 2 |
| REQ-028 | Epic umbrella — covered by Phases 2–7 |
| REQ-031 | Phase 2 (new endpoints) |
| REQ-032, 041, 042, 058 | Phase 7 docs only |
| REQ-033–040, 043–046, 052–060, 069–080 | Phases 3–6 |
| REQ-047, 061, 081 | Phase 7 docs |
| REQ-048, 062, 082 | Mobile sign-in — Phase 2 API |
| REQ-049–051, 085 | Mobile — API reuse Phase 4–5 |
| REQ-065–068, 071 | Phase 6 |

## Risks

1. **Sparse lock checkout** — implementation must sync Client Link `main` before applying migrations.
2. **Path stability** — mobile clients depend on non-versioned `/api/...` paths; do not introduce parallel `/api/v1` duplicates without adapter layer.
3. **Policy TBD** — invitation/re-application durations block final QA until configured.
4. **Password reset email** — local dev may log tokens; production needs provider (document only in plan).

## Backend Components Coverage Report

| Component | Application (planned files) | Infrastructure |
|-----------|----------------------------|----------------|
| **Auth** | `src/auth/*`, `src/http/routes/auth.ts`, `sessions`, reset tokens | N/A — existing Express auth (not Cognito) |
| **Network** | `src/http/middleware/cors.ts`, `rate-limit.ts`, helmet | N/A — local |
| **Compute** | `src/http/app.ts`, `server.ts`, `preview-dev.ts` | N/A — local Express |
| **Storage** | — | N/A — no uploads |
| **Database** | `migrations/*`, `src/db/*`, `repositories/*` | N/A — local PostgreSQL |
| **Frontend Hosting** | Repo root Vite (`package.json`, `vite.config.ts`) | N/A — local (`npm run dev` / `build`) |

---

*Plan mode deliverable. Code phase (`code_auto` / `code_pr`) continues with `.cursor/skills/launchpad-backend/code.md` and `hosting/server-local.md` without regenerating this document unless scope changes.*