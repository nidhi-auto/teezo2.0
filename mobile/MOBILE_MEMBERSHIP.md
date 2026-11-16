# Player mobile — invitations and join requests

Approved delivery for Teezo 2.0 (Backlog **#194** / accepted **#209**). The native Player app uses
the **same** membership APIs and policies as web on iOS and Android. Club Admin review stays on the
web application.

Machine clients:

- [`src/api/membership-client.ts`](./src/api/membership-client.ts) — HTTP wrappers
- [`src/api/membership-flows.ts`](./src/api/membership-flows.ts) — Player invitation/join-request handling (Release **1.0.0**)
- [`src/api/membership-policies.ts`](./src/api/membership-policies.ts) — shared TTL/re-apply constants and policy error helpers

---

## 1. Flows (Player only)

| Action | Mobile client | HTTP |
| --- | --- | --- |
| View invitations | `listInvitations()` | `GET /api/invitations` |
| Accept invitation | `acceptInvitation(id)` | `POST /api/invitations/:id/accept` |
| Decline invitation | `declineInvitation(id)` | `POST /api/invitations/:id/decline` |
| Submit join request | `submitJoinRequest(clubId)` | `POST /api/join-requests` |
| Track request status | `listJoinRequests()` | `GET /api/join-requests` |
| Combined mobile membership read | `getMembershipState()` | `GET /api/invitations` + `GET /api/join-requests` + `GET /api/me/clubs` |
| Accept + refresh club view | `acceptInvitation(id)` on flows client | accept + `GET /api/me/clubs` |
| Per-club request status | `getJoinRequestStatusForClub(clubId)` | `GET /api/join-requests` (client filter) |

Statuses for join requests: `pending` | `approved` | `rejected` (server source of truth).

A Player may hold memberships in **multiple** clubs; each invitation or join request is club-scoped.

---

## 2. Shared server rules (unchanged)

Documented in [`../docs/MEMBERSHIP_POLICIES.md`](../docs/MEMBERSHIP_POLICIES.md):

- Invitation TTL **7 days** (`INVITE_TTL_SECONDS`); expired invites leave the inbox and cannot be
  accepted or declined.
- After rejection, re-apply wait **7 days** (`JOIN_REAPPLY_SECONDS`).
- Membership is created only on invite **accept** or Club Admin **approve** — never by listing,
  pending submit, expiry, or a blocked re-apply.
- Pending join re-submit is idempotent (`created: false`).

Mobile does **not** implement Club Admin approve/reject endpoints.

### Policy errors on mobile

When accept, decline, or submit fails, map `MobileApiError.code` with
[`membership-policies.ts`](./src/api/membership-policies.ts):

| Code | Mobile UX |
| --- | --- |
| `invitation_expired` | Invite no longer valid; remove from inbox on next refresh (server also omits expired rows). |
| `invitation_not_pending` | Invite already handled; refresh inbox. |
| `join_reapply_blocked` | Show re-apply wait (`JOIN_REAPPLY_SECONDS`, **7 days** after rejection). |
| `already_club_member` | Show member state; club appears in `joinedClubs` after refresh. |

Local helper `isInvitationAcceptEligible()` mirrors expiry for rows already on screen; the server
remains authoritative on accept.

---

## 3. Client identity

Requests from this module send:

- `User-Agent: Teezo-Player-Mobile/1.0 (iOS; Android)` (overridable per platform build)
- `X-Teezo-Client: player-mobile`

OS floors remain iOS 15.1+ and Android API 29+ ([`docs/MOBILE_PLATFORM_BASELINE.md`](../docs/MOBILE_PLATFORM_BASELINE.md)).

---

## 4. Notifications

Invitation **delivery** remains email (existing Club Admin invite path). Mobile discovers pending
invites via `GET /api/invitations` after sign-in. Push notifications are out of this story.

---

## 5. Out of scope

- Club Admin / Super Admin mobile clients
- Club Admin approval screens and invitation-management screens on mobile
- Changing invite TTL or re-apply durations

## Revision

| Date | Change |
| --- | --- |
| 2026-11-02 | #194: Player mobile membership client |
| 2026-11-02 | #209: accept invite/decline/join/track flows; membership only after accept or approve |
| 2026-11-03 | Release 1.0.0: `PlayerMembershipFlowsClient` + policy helpers for mobile invitation/join-request handling |
