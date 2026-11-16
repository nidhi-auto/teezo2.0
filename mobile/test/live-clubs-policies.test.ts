import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  filterLiveDiscoveryTournaments,
  isLiveListingJoinEligible,
  isParticipationOpportunityStatus,
  isTournamentOpenForEntry,
  liveClubJoinAction,
  visibleLiveDiscoveryClubs,
} from '../src/api/live-clubs-policies.ts';
import type { Invitation, LiveTournamentClub } from '../src/api/types.ts';

function club(overrides: Partial<LiveTournamentClub> = {}): LiveTournamentClub {
  return {
    id: 'club-1',
    name: 'Test Club',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    isMember: false,
    hasPendingJoinRequest: false,
    hasPendingInvite: false,
    canRequestJoin: true,
    liveTournaments: [
      {
        id: 't-1',
        name: 'Live Open',
        startsAt: '2026-01-02T00:00:00.000Z',
        endsAt: null,
        maxEntries: null,
        status: 'live',
      },
    ],
    ...overrides,
  };
}

describe('live-clubs-policies', () => {
  it('filters non-live tournaments from discovery rows', () => {
    const rows = filterLiveDiscoveryTournaments([
      {
        id: 'a',
        name: 'Live',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: null,
        maxEntries: null,
        status: 'live',
      },
      {
        id: 'b',
        name: 'Closed',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: null,
        maxEntries: null,
        status: 'closed' as 'live',
      },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, 'a');
  });

  it('drops clubs with no live tournaments after sanitization', () => {
    const visible = visibleLiveDiscoveryClubs([
      club({
        liveTournaments: [
          {
            id: 'closed-only',
            name: 'Done',
            startsAt: '2026-01-01T00:00:00.000Z',
            endsAt: null,
            maxEntries: null,
            status: 'closed' as 'live',
          },
        ],
      }),
      club({ id: 'club-2' }),
    ]);
    assert.equal(visible.length, 1);
    assert.equal(visible[0]?.id, 'club-2');
  });

  it('treats only published tournaments as open entry opportunities', () => {
    assert.equal(isTournamentOpenForEntry({ status: 'published' }), true);
    assert.equal(isTournamentOpenForEntry({ status: 'live' }), false);
    assert.equal(isTournamentOpenForEntry({ status: 'closed' }), false);
    assert.equal(isParticipationOpportunityStatus('closed'), false);
  });

  it('join eligibility requires invite or canRequestJoin and excludes members', () => {
    assert.equal(isLiveListingJoinEligible(club()), true);
    assert.equal(isLiveListingJoinEligible(club({ canRequestJoin: false, hasPendingInvite: true })), true);
    assert.equal(
      isLiveListingJoinEligible(club({ canRequestJoin: false, hasPendingInvite: false })),
      false,
    );
    assert.equal(isLiveListingJoinEligible(club({ isMember: true })), false);
  });

  it('maps join actions consistently with server hints', () => {
    const invitations: Invitation[] = [];
    assert.equal(liveClubJoinAction(club({ isMember: true }), invitations), 'member');
    assert.equal(liveClubJoinAction(club({ hasPendingJoinRequest: true }), invitations), 'pending_request');
    assert.equal(liveClubJoinAction(club({ hasPendingInvite: true }), invitations), 'accept_invite');
    assert.equal(liveClubJoinAction(club({ canRequestJoin: true }), invitations), 'request_join');
    assert.equal(
      liveClubJoinAction(club({ canRequestJoin: false, hasPendingInvite: false }), invitations),
      'unavailable',
    );
  });
});
