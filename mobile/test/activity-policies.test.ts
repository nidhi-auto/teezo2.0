import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterMemberVisibleTournaments,
  isActivityAccessDeniedError,
  isClosedMemberTournament,
  isLiveMemberTournament,
  isMemberVisibleTournamentStatus,
  sanitizeJoinedClub,
  scopedMemberVisibleTournaments,
  separateJoinedClubRecords,
  tournamentsBelongToClub,
} from '../src/api/activity-policies.ts';
import { MobileApiError } from '../src/api/http.ts';
import type { JoinedClub, Tournament } from '../src/api/types.ts';

function tournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: 't-1',
    clubId: 'club-a',
    name: 'Spring Open',
    status: 'published',
    startsAt: '2026-01-02T00:00:00.000Z',
    endsAt: null,
    maxEntries: null,
    scoringFormat: 'stroke',
    createdByAccountId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function joinedClub(overrides: Partial<JoinedClub> = {}): JoinedClub {
  return {
    id: 'club-a',
    name: 'Club A',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    tournaments: [],
    ...overrides,
  };
}

describe('activity-policies (joined clubs and tournaments access)', () => {
  it('exposes only member-visible tournament statuses including live and closed', () => {
    assert.equal(isMemberVisibleTournamentStatus('published'), true);
    assert.equal(isMemberVisibleTournamentStatus('live'), true);
    assert.equal(isMemberVisibleTournamentStatus('closed'), true);
    assert.equal(isMemberVisibleTournamentStatus('draft'), false);
    assert.equal(isLiveMemberTournament({ status: 'live' }), true);
    assert.equal(isClosedMemberTournament({ status: 'closed' }), true);
  });

  it('filters draft tournaments from joined-club payloads', () => {
    const visible = filterMemberVisibleTournaments([
      tournament({ id: 'pub', status: 'published' }),
      tournament({ id: 'live', status: 'live' }),
      tournament({ id: 'done', status: 'closed' }),
      tournament({ id: 'draft', status: 'draft' }),
    ]);
    assert.deepEqual(
      visible.map((row) => row.id),
      ['pub', 'live', 'done'],
    );
  });

  it('drops tournaments scoped to a different club (permitted access rules)', () => {
    assert.equal(
      tournamentsBelongToClub('club-a', [
        tournament({ clubId: 'club-a' }),
        tournament({ id: 't-2', clubId: 'club-b' }),
      ]),
      false,
    );
    const scoped = scopedMemberVisibleTournaments('club-a', [
      tournament({ id: 'mine', clubId: 'club-a', status: 'live' }),
      tournament({ id: 'other', clubId: 'club-b', status: 'live' }),
      tournament({ id: 'draft', clubId: 'club-a', status: 'draft' }),
    ]);
    assert.deepEqual(
      scoped.map((row) => row.id),
      ['mine'],
    );
  });

  it('keeps multiple club memberships as separate sanitized records', () => {
    const rows = separateJoinedClubRecords([
      joinedClub({
        id: 'club-a',
        tournaments: [tournament({ id: 'a1', clubId: 'club-a', status: 'live' })],
      }),
      joinedClub({
        id: 'club-b',
        name: 'Club B',
        tournaments: [tournament({ id: 'b1', clubId: 'club-b', status: 'closed' })],
      }),
      joinedClub({
        id: 'club-a',
        name: 'Duplicate A',
        tournaments: [tournament({ id: 'a-dup', clubId: 'club-a', status: 'published' })],
      }),
    ]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.id, 'club-a');
    assert.equal(rows[0]?.tournaments.length, 1);
    assert.equal(rows[0]?.tournaments[0]?.id, 'a1');
    assert.equal(rows[1]?.id, 'club-b');
    assert.equal(rows[1]?.tournaments[0]?.status, 'closed');
  });

  it('sanitizes nested tournaments on a single club row', () => {
    const row = sanitizeJoinedClub(
      joinedClub({
        tournaments: [
          tournament({ status: 'live' }),
          tournament({ id: 'hidden', status: 'draft' }),
          tournament({ id: 'wrong-club', clubId: 'club-b', status: 'published' }),
        ],
      }),
    );
    assert.equal(row.tournaments.length, 1);
    assert.equal(row.tournaments[0]?.status, 'live');
  });

  it('maps non-member tournament list failures to access denied (404)', () => {
    const err = new MobileApiError(404, {
      error: { code: 'not_found', message: 'Club not found' },
    }, 'missing');
    assert.equal(isActivityAccessDeniedError(err), true);
    assert.equal(
      isActivityAccessDeniedError(
        new MobileApiError(403, { error: { code: 'forbidden', message: 'nope' } }, 'nope'),
      ),
      false,
    );
  });
});
