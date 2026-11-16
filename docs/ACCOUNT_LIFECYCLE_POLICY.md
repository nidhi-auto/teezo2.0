# Account lifecycle policy

Placeholder product policy for REQ-032 (deactivation vs deletion). **No automated purge** ships in
Release 1.0.0 until stakeholders approve retention durations.

## Account status

| Status | Meaning |
| --- | --- |
| `active` | May sign in and use Player self-service APIs |
| `deactivated` | Sign-in refused; existing sessions should expire or be revoked |

## Deactivation

- Triggered only via administrative workflows (Super Admin / future ops tools), not Player self-service.
- `deactivated_at` records when status changed; account row is retained for audit.
- Deactivated accounts do not appear in Club Admin roster create flows as active members.

## Deletion

- **Not implemented** in Release 1.0.0. Hard delete and GDPR erasure flows require a separate decision.
- Schema retains `accounts` and related foreign keys; referential integrity blocks silent removal.

## Audit and retention

- `creation_audit_events` and session/auth logs are retained for investigation (REQ-065–068, REQ-090).
- Retention windows (days/months) are **TBD** — document-only until configured in env or policy tables.

## Password reset and sessions

- Password reset tokens are single-use with configurable TTL (`PASSWORD_RESET_TTL_SECONDS`).
- Sessions are expiring and revocable (`SESSION_TTL_SECONDS`); revoked sessions return **401**.