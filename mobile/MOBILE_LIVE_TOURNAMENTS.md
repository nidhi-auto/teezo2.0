# Player mobile — browse and join live-tournament clubs

Approved delivery for Teezo 2.0 (Backlog **#195** / accepted **#210**). Discovery and joining use
the **same** server APIs and rules as web (#189/#190/#206). Creating or managing tournaments on
mobile is out of scope.

Machine clients:

- [`src/api/live-clubs-client.ts`](./src/api/live-clubs-client.ts) — HTTP wrappers
- [`src/api/live-clubs-flows.ts`](./src/api/live-clubs-flows.ts) — browse, join, and refresh (Release **1.0.0**)
- [`src/api/live-clubs-policies.ts`](./src/api/live-clubs-policies.ts) — live-only discovery and entry eligibility helpers

Joined-club tournament lists also use [`activity-client.ts`](./src/api/activity-client.ts)
([`MOBILE_ACTIVITY.md`](./MOBILE_ACTIVITY.md)).

---

## 1. Flows

| Action | Mobile client | HTTP |
| --- | --- | --- |
| Browse clubs with live tournaments | `listClubsWithLiveTournaments()` | `GET /api/clubs/live-tournaments` |
| Combined browse + join inbox | `getDiscoveryState()` | `GET /api/clubs/live-tournaments` + invitations + join-requests |
| Select eligible club → join request | `requestJoinFromLiveListing(clubId)` or flows `requestJoinFromListing(clubId)` | `POST /api/join-requests` |
| Accept pending invite (alternate) | `membership.acceptInvitation(id)` or flows `acceptInvitationForLiveClub(clubId)` | `POST /api/invitations/:id/accept` |
| Mobile join CTA from browse row | `joinActionForClub(club, invitations)` | client policy on server hints |
| Reflect membership / view joined clubs | `listJoinedClubs()` | `GET /api/me/clubs` |
| View tournaments for a joined club | `PlayerActivityClient.listTournamentsForClub` | `GET /api/me/clubs/:clubId/tournaments` |
| Enter tournament (after membership) | `enterTournament(id)` | `POST /api/tournaments/:id/entries` |

Browse rows include `canRequestJoin`, `hasPendingInvite`, `isMember`, and nested `liveTournaments`
(`status: "live"` only). The flows client runs `visibleLiveDiscoveryClubs()` so **`closed`** (or other
non-live) tournament rows never appear as live browse opportunities even if a stale payload slips through.

Member-visible tournament lists may include `published`, `live`, or `closed`; only **`published`**
counts as an open **entry** opportunity (`isTournamentOpenForEntry`). Live discovery tournaments are
for deciding which club to join — not for new entries while `live`.

---

## 2. Membership controls (unchanged)

- **No auto-membership** from the live listing.
- Eligible clubs: `canRequestJoin === true` → join request; or accept a pending invite.
- Club Admin approve/reject stays on **web**.
- After approve/accept, `listJoinedClubs()` shows the club (separate records per club).

See [`MOBILE_MEMBERSHIP.md`](./MOBILE_MEMBERSHIP.md) and
[`../backend/backend/MEMBERSHIP_POLICIES.md`](../backend/backend/MEMBERSHIP_POLICIES.md).

---

## 3. Tournament entry limits and dates

Per [`../backend/backend/TOURNAMENT_POLICIES.md`](../backend/backend/TOURNAMENT_POLICIES.md):

- Live listing is for **club discovery**; the listed tournaments are already `live`.
- New entries are accepted only while the tournament is **`published`** (members, optional
  `maxEntries`, date rules).
- **`live` freezes new entries** — `enterTournament` on a live event is refused by the server.

---

## 4. Out of scope

- Creating, editing, publishing, or closing tournaments on mobile
- Club Admin / Super Admin mobile clients or management functions
- Scoring / results

## Revision

| Date | Change |
| --- | --- |
| 2026-11-02 | #195: live-clubs mobile client |
| 2026-11-02 | #210: accept browse/join/view joined clubs & tournaments; no admin surface |
| 2026-11-03 | Release 1.0.0: `PlayerLiveClubsFlowsClient` + discovery/join eligibility helpers |
