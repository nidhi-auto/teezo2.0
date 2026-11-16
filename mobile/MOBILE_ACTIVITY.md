# Player mobile — joined clubs, tournaments, and request status

Approved delivery for Teezo 2.0 (Backlog **#196** / accepted **#210**). Native Player views read the
**same** server APIs as web (#191/#194). Tournament administration and Super Admin features are out
of scope.

Machine clients:

- [`src/api/activity-client.ts`](./src/api/activity-client.ts) — HTTP wrappers
- [`src/api/activity-flows.ts`](./src/api/activity-flows.ts) — joined-club and tournament views (Release **1.0.0**)
- [`src/api/activity-policies.ts`](./src/api/activity-policies.ts) — member-visible tournament states and access helpers

---

## 1. Flows

| Action | Mobile client | HTTP |
| --- | --- | --- |
| View joined clubs (+ nested tournaments) | `listJoinedClubs()` | `GET /api/me/clubs` |
| View tournaments for one club | `listTournamentsForClub(clubId)` | `GET /api/me/clubs/:clubId/tournaments` |
| View join-request status | `listJoinRequestStatus()` | `GET /api/join-requests` |
| Combined activity read | `getActivitySnapshot()` | both of the above |
| Sanitized joined-club list | `getJoinedClubsView()` on flows client | `GET /api/me/clubs` (client filter) |
| Sanitized tournaments for one club | `getClubTournamentsView(clubId)` | `GET /api/me/clubs/:clubId/tournaments` |
| Mobile home (clubs + requests) | `getActivityView()` | `GET /api/me/clubs` + `GET /api/join-requests` |

The flows client strips **draft** tournaments and rows whose `clubId` does not match the club
record so Players never see Club Admin–only or cross-club data in UI even if a stale payload slips through.

---

## 2. Multi-club and visibility

- Each membership is a **separate** club object — never merged across clubs.
- Nested / club-scoped tournaments always carry that club’s `clubId`.
- Non-members get `404` for another club’s tournament list (no probing).
- Join-request rows are limited to the authenticated Player’s own requests.
- Tournament `status` and join-request `status` come from the server only (`published` / `live` /
  `closed` for member-visible tournaments; drafts stay Club Admin–only).

---

## 3. Out of scope

- Creating or managing tournaments
- Club Admin player management
- Super Admin features
- Non-player mobile clients

## Revision

| Date | Change |
| --- | --- |
| 2026-11-02 | #196: activity mobile client |
| 2026-11-02 | #210: accept joined-club / tournament views with live browse |
| 2026-11-03 | Release 1.0.0: `PlayerActivityFlowsClient` + member-visible tournament/access policy helpers |
