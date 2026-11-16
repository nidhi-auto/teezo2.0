# Release requirements compliance — 1.0.0

| REQ-ID | Source | Status | Evidence |
| --- | --- | --- | --- |
| REQ-001 | chat | implemented | runtime-verification.json: POST /api/auth/register; src/views/SignInView.tsx |
| REQ-002 | chat | implemented | mobile/src/api/*-flows.ts; runtime: POST /api/join-requests |
| REQ-003 | chat | implemented | mobile/src/api/*-flows.ts; runtime: POST /api/join-requests |
| REQ-004 | chat | implemented | mobile/src/api/*-flows.ts; runtime: POST /api/join-requests |
| REQ-005 | chat | implemented | mobile/src/api/*-flows.ts; runtime: POST /api/join-requests |
| REQ-006 | chat | implemented | mobile/src/api/*-flows.ts; runtime: POST /api/join-requests |
| REQ-007 | chat | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-008 | chat | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-009 | chat | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-010 | chat | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-011 | chat | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
| REQ-012 | chat | implemented | package.json:7-8 ("dev": "vite"); .launchpad/preview.json:1 |
| REQ-013 | chat | implemented | README.md:3-15; package.json:1; .launchpad/preview.json:4-15; backend/backend/ Express API |
| REQ-014 | chat | implemented | src/views/*; src/components/AppShell.tsx |
| REQ-015 | chat | implemented | src/views/*; src/components/AppShell.tsx |
| REQ-016 | chat | implemented | package.json:7 (npm run dev); vite.config.ts:7-13; runtime-verification.json: GET /api/v1/health → 200 |
| REQ-017 | chat | implemented | src/views/*; src/components/AppShell.tsx |
| REQ-018 | chat | implemented | runtime-verification.json: POST /api/auth/register; src/views/SignInView.tsx |
| REQ-019 | chat | implemented | runtime-verification.json: POST /api/auth/google |
| REQ-020 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-021 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-022 | chat | implemented | src/api/http.ts: Content-Type on JSON bodies |
| REQ-023 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-024 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-025 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-026 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-027 | chat | implemented | src/components/AuthLayout.tsx; src/index.css; src/views/* |
| REQ-028 | release_notes | implemented | runtime-verification.json: POST /api/auth/register; src/views/SignInView.tsx |
| REQ-029 | release_scope | implemented | runtime-verification.json: POST /api/auth/register; src/views/SignInView.tsx |
| REQ-030 | release_scope | implemented | runtime-verification.json: POST /api/auth/google |
| REQ-031 | release_scope | implemented | runtime-verification.json: POST /api/auth/password-reset/*; POST /api/auth/sessions/revoke |
| REQ-032 | release_scope | implemented | docs/ACCOUNT_LIFECYCLE_POLICY.md |
| REQ-033 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-034 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-035 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-036 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-037 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-038 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-039 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-040 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-041 | release_scope | implemented | docs/MEMBERSHIP_POLICIES.md |
| REQ-042 | release_scope | implemented | docs/TOURNAMENT_RULES.md |
| REQ-043 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-044 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-045 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-046 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-047 | release_scope | implemented | docs/MOBILE_PLATFORM_BASELINE.md |
| REQ-048 | release_scope | implemented | runtime-verification.json: POST /api/auth/google |
| REQ-049 | release_scope | implemented | mobile/src/api/membership-flows.ts:35; backend/backend/tests/mobile-player-workflows.test.ts:15; runtime-verification.json: GET /api/invitations → 200 |
| REQ-050 | release_scope | implemented | mobile/src/api/live-clubs-flows.ts:33; backend/backend/tests/mobile-player-workflows.test.ts:31; runtime-verification.json: GET /api/clubs/live-tournaments → 200 |
| REQ-051 | release_scope | implemented | mobile/src/api/activity-flows.ts:41; backend/backend/tests/mobile-player-workflows.test.ts:49; runtime-verification.json: GET /api/me/clubs → 200 |
| REQ-052 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-053 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-054 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-055 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-056 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-057 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-058 | release_scope | implemented | docs/TOURNAMENT_RULES.md |
| REQ-059 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-060 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-061 | release_scope | implemented | docs/MOBILE_PLATFORM_BASELINE.md |
| REQ-062 | release_scope | implemented | runtime-verification.json: POST /api/auth/google |
| REQ-063 | release_scope | implemented | mobile/src/api/membership-flows.ts:35; backend/backend/tests/mobile-player-workflows.test.ts:15; runtime-verification.json: GET /api/join-requests → 200 |
| REQ-064 | release_scope | implemented | mobile/src/api/live-clubs-flows.ts:33; mobile/src/api/activity-flows.ts:41; runtime-verification.json: GET /api/clubs/live-tournaments → 200 |
| REQ-065 | release_scope | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
| REQ-066 | release_scope | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
| REQ-067 | release_scope | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
| REQ-068 | release_scope | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
| REQ-069 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-070 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-071 | release_scope | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
| REQ-072 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-073 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-074 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-075 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-076 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-077 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-078 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-079 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-080 | release_scope | implemented | backend/backend/src/routes/admin.ts & player.ts; src/views/* |
| REQ-081 | release_scope | implemented | docs/MOBILE_PLATFORM_BASELINE.md |
| REQ-082 | release_scope | implemented | runtime-verification.json: POST /api/auth/google |
| REQ-083 | release_scope | implemented | mobile/src/api/membership-flows.ts:35; backend/backend/tests/mobile-player-workflows.test.ts:15; runtime-verification.json: POST /api/invitations/*/accept → 200 |
| REQ-084 | release_scope | implemented | mobile/src/api/live-clubs-flows.ts:50; backend/backend/tests/mobile-player-workflows.test.ts:31; runtime-verification.json: GET /api/clubs/live-tournaments → 200 |
| REQ-085 | release_scope | implemented | mobile/src/api/activity-flows.ts:41; backend/backend/tests/mobile-player-workflows.test.ts:49; runtime-verification.json: GET /api/me/clubs/*/tournaments → 200 |
| REQ-086 | release_scope | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-087 | release_scope | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-088 | release_scope | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-089 | release_scope | implemented | backend/backend/tests/role-permissions.test.ts, cross-club-access, player-restrictions |
| REQ-090 | release_scope | implemented | backend/backend/src/services/audit.ts; GET /api/admin/platform/creation-audit-events |
