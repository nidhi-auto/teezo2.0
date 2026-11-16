# Tournament rules

Shared lifecycle and visibility rules for web, API, and Player mobile (REQ-042, REQ-058, REQ-077–080).

## Lifecycle states

| State | Club Admin | Player member | Player discovery (`/api/clubs/live-tournaments`) |
| --- | --- | --- | --- |
| `draft` | Full manage | Hidden | Excluded |
| `published` | Manage + publish transitions | Visible; **open for new entries** | Excluded unless also `live` |
| `live` | Manage + close | Visible; **entries closed** | Included |
| `closed` | Read-only archive | Visible (history) | Excluded |

Valid transitions are enforced server-side: `draft` → `published` → `live` → `closed`. Invalid jumps return **400**.

## Discovery vs membership views

- **Live discovery** lists only clubs with ≥1 tournament in `live` state; nested rows are `status: live` only (see mobile `live-clubs-policies.ts`).
- **Joined club activity** shows `published`, `live`, and `closed` for members; `draft` is never exposed to Players (`activity-policies.ts`).

## Entry eligibility

- New tournament entries are allowed only while status is **`published`** and the Player is a **member** of the hosting club.
- When a tournament moves to **`live`**, new entries are rejected (existing entries, if any, are out of scope for scoring engine detail in this release).
- `entryLimit`, `startsAt`, and `endsAt` are enforced on the server when entry endpoints exist; mobile uses policy helpers for UX only.

## Cross-club boundaries

- Tournament reads and writes are always scoped by `clubId`. Club Admins may only manage tournaments for assigned clubs.
- Players may list tournaments only for clubs where they hold membership (`GET /api/me/clubs/:clubId/tournaments` → **404** when not a member).

## Scoring

- Scoring format and live leaderboard behavior are **not** specified for Release 1.0.0; `scoringFormat` is stored for future use without client-side calculation.