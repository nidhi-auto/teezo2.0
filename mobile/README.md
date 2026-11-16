# Player mobile

Native Player application workspace for Teezo 2.0. Club Admin and Super Admin clients are not
delivered here.

## Platform baseline (Backlog #192 / #207 / #228)

Approved OS floors live in:

- [`docs/MOBILE_PLATFORM_BASELINE.md`](../docs/MOBILE_PLATFORM_BASELINE.md) — human-readable policy
- [`platform-baseline.json`](./platform-baseline.json) — values for app config and CI

| Platform | Minimum |
| --- | --- |
| iOS | 15.1+ |
| Android | 10 / API 29+ |

Build and test scope must not target OS versions below these floors. When the Expo / React Native
app is added under this folder, wire `deploymentTarget` / `minSdkVersion` from
`platform-baseline.json` and keep the unit check in `backend/backend/test/mobile-platform-baseline.test.ts`
green.

## Authentication on mobile (Backlog #193 / #208)

Email/password + Google via the shared auth API; Club Admin / Super Admin refused at sign-in:

- [`MOBILE_AUTH.md`](./MOBILE_AUTH.md)
- [`src/api/auth-client.ts`](./src/api/auth-client.ts)

Verified by `backend/backend/test/mobile-auth-client-api.test.ts`.

## Membership on mobile (Backlog #194 / #209)

Invitations and join requests use the shared server APIs — same expiry and re-apply rules as web:

- [`MOBILE_MEMBERSHIP.md`](./MOBILE_MEMBERSHIP.md)
- [`src/api/membership-client.ts`](./src/api/membership-client.ts)
- [`src/api/membership-flows.ts`](./src/api/membership-flows.ts) — accept/decline/submit/track with joined-club refresh (Release 1.0.0)

Verified by `backend/backend/test/mobile-membership-client-api.test.ts`. Club Admin approve/reject
remains web-only.

## Live-tournament clubs on mobile (Backlog #195 / #210)

Browse clubs with live tournaments and join via existing membership controls:

- [`MOBILE_LIVE_TOURNAMENTS.md`](./MOBILE_LIVE_TOURNAMENTS.md)
- [`src/api/live-clubs-client.ts`](./src/api/live-clubs-client.ts)
- [`src/api/live-clubs-flows.ts`](./src/api/live-clubs-flows.ts) — browse/join with listing refresh (Release 1.0.0)
- [`src/api/live-clubs-policies.ts`](./src/api/live-clubs-policies.ts) — live-only browse and entry eligibility

Verified by `backend/backend/test/mobile-live-clubs-client-api.test.ts` and
`mobile/test/live-clubs-policies.test.ts` (`node --experimental-strip-types --test mobile/test/live-clubs-policies.test.ts`).
Tournament create/manage stays off mobile.

## My activity on mobile (Backlog #196 / #210)

Joined clubs, per-club tournaments, and join-request status:

- [`MOBILE_ACTIVITY.md`](./MOBILE_ACTIVITY.md)
- [`src/api/activity-client.ts`](./src/api/activity-client.ts)
- [`src/api/activity-flows.ts`](./src/api/activity-flows.ts) — joined clubs and per-club tournaments (Release 1.0.0)
- [`src/api/activity-policies.ts`](./src/api/activity-policies.ts) — live/closed/published visibility and 404 access rules

Verified by `backend/backend/test/mobile-activity-client-api.test.ts` and
`mobile/test/activity-policies.test.ts` (`npm run test:access` from `mobile/`).
