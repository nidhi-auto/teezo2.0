# Membership policies

Server and mobile share invitation and join-request rules (REQ-037–040, REQ-055–057, REQ-072–076).

## Configuration

| Policy | Env / constant | Default (local) | Notes |
| --- | --- | --- | --- |
| Invitation TTL | `INVITE_TTL_SECONDS` / mobile `INVITE_TTL_SECONDS` | 7 days | Pending invites past expiry cannot be accepted |
| Re-apply after rejection | `JOIN_REAPPLY_WAIT_SECONDS` / mobile `JOIN_REAPPLY_SECONDS` | Configurable per deploy | Mobile UX uses 7-day mirror until stakeholders finalize |

Durations remain **configuration placeholders** until product approves final values (REQ-041, REQ-058).

## Rules

1. **Membership creation** happens only when a Player **accepts an invitation** or a Club Admin **approves** a join request — never from browse, pending submit alone, or expired invite handling.
2. **Invitation statuses:** `pending` → `accepted` | `declined` | `expired`.
3. **Join request statuses:** `pending` → `approved` | `rejected`. After rejection, `reapply_after` blocks new submits until the wait elapses (HTTP **429** `Reapply not allowed yet`).
4. **Multi-club:** Memberships are club-scoped; accept/approve on club A has no side effects on club B.
5. **Club Admin approve/reject** requires `membership:manage` on the target club; Player mobile never calls admin routes.

## Stable error codes (mobile mapping)

See [`mobile/src/api/membership-policies.ts`](../mobile/src/api/membership-policies.ts):

| Code | Meaning |
| --- | --- |
| `invitation_expired` | Invite past TTL |
| `invitation_not_pending` | Already handled |
| `join_reapply_blocked` | Within re-apply wait |
| `already_club_member` | Duplicate membership |