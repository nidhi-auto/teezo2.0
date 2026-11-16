import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sanitizeJoinedClub,
  scopedMemberVisibleTournaments,
  separateJoinedClubRecords,
} from '../src/api/activity-policies.ts';
import {
  filterLiveDiscoveryTournaments,
  visibleLiveDiscoveryClubs,
} from '../src/api/live-clubs-policies.ts';
import type { JoinedClub, LiveTournamentClub, Tournament } from '../src/api/types.ts';

const MANY_CLUB_COUNT = 40;

function tournament(clubId: string, index: number, status: Tournament['status']): Tournament {
  return {
    id: `t-${clubId}-${index}`,
    clubId,
    name: `Event ${index}`,
    status,
    startsAt: '2026-01-02T00:00:00.000Z',
    endsAt: null,
    maxEntries: null,
    scoringFormat: 'stroke',
    createdByAccountId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function joinedClub(index: number): JoinedClub {
  const id = `club-${index}`;
  return {
    id,
    name: `Club ${index}`,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    tournaments: [
      tournament(id, 0, 'published'),
      tournament(id, 1, 'live'),
      tournament(id, 2, 'draft'),
      tournament(id, 3, index % 7 === 0 ? 'published' : 'closed'),
    ],
  };
}

function liveClub(index: number): LiveTournamentClub {
  const id = `club-${index}`;
  const hasLive = index % 4 === 0;
  return {
    id,
    name: `Club ${index}`,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    isMember: index % 11 === 0,
    hasPendingJoinRequest: false,
    hasPendingInvite: false,
    canRequestJoin: true,
    liveTournaments: hasLive
      ? [
          {
            id: `live-${id}`,
            name: 'Live Open',
            startsAt: '2026-01-02T00:00:00.000Z',
            endsAt: null,
            maxEntries: null,
            status: 'live',
          },
          {
            id: `closed-${id}`,
            name: 'Closed',
            startsAt: '2026-01-01T00:00:00.000Z',
            endsAt: '2026-01-03T00:00:00.000Z',
            maxEntries: null,
            status: 'closed',
          },
        ]
      : [
          {
            id: `pub-${id}`,
            name: 'Published only',
            startsAt: '2026-01-02T00:00:00.000Z',
            endsAt: null,
            maxEntries: null,
            status: 'published',
          },
        ],
  };
}

describe('role-scoped client policies at many records', () => {
  it('keeps joined-club tournament scope per club across many memberships', () => {
    const clubs = Array.from({ length: MANY_CLUB_COUNT }, (_, i) => joinedClub(i));
    const sanitized = separateJoinedClubRecords(clubs);
    assert.equal(sanitized.length, MANY_CLUB_COUNT);

    for (const club of sanitized) {
      assert.ok(club.tournaments.every((row) => row.clubId === club.id));
      assert.ok(club.tournaments.every((row) => row.status !== 'draft'));
      const scoped = scopedMemberVisibleTournaments(
        club.id,
        clubs.find((c) => c.id === club.id)!.tournaments,
      );
      assert.deepEqual(
        scoped.map((row) => row.id),
        sanitizeJoinedClub(clubs.find((c) => c.id === club.id)!).tournaments.map((row) => row.id),
      );
    }
  });

  it('live discovery strips non-live rows and hides clubs without live tournaments at scale', () => {
    const payload = Array.from({ length: MANY_CLUB_COUNT }, (_, i) => liveClub(i));
    const visible = visibleLiveDiscoveryClubs(payload);
    const expectedVisible = payload.filter((_, i) => i % 4 === 0).length;
    assert.equal(visible.length, expectedVisible);
    assert.ok(
      visible.every(
        (club) =>
          filterLiveDiscoveryTournaments(club.liveTournaments).length ===
          club.liveTournaments.length,
      ),
    );
    assert.ok(visible.every((club) => club.liveTournaments.every((t) => t.status === 'live')));
  });
});
