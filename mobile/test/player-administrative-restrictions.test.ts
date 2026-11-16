import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertPlayerMobilePathAllowed,
  isAdministrativeApiPath,
  PLAYER_MOBILE_HTTP_PATHS,
} from '../src/api/player-access-policies.ts';
import {
  isLiveListingJoinEligible,
  visibleLiveDiscoveryClubs,
} from '../src/api/live-clubs-policies.ts';
import {
  filterMemberVisibleTournaments,
  isActivityAccessDeniedError,
} from '../src/api/activity-policies.ts';
import { MobileApiError } from '../src/api/http.ts';
import type { LiveTournamentClub } from '../src/api/types.ts';

describe('Player administrative restrictions (mobile)', () => {
  it('treats admin API prefixes as administrative-only', () => {
    assert.equal(isAdministrativeApiPath('/api/admin/clubs/club-a/tournaments'), true);
    assert.equal(isAdministrativeApiPath('/api/me/clubs'), false);
    assert.equal(isAdministrativeApiPath('/api/clubs/live-tournaments'), false);
  });

  it('documents Player mobile HTTP paths without admin routes', () => {
    for (const path of PLAYER_MOBILE_HTTP_PATHS) {
      assert.doesNotThrow(() => assertPlayerMobilePathAllowed(path), path);
    }
    assert.throws(() => assertPlayerMobilePathAllowed('/api/admin/clubs/club-a/players'));
  });

  it('supports permitted live-tournament browse rows (non-admin discovery)', () => {
    const rows = visibleLiveDiscoveryClubs([
      {
        id: 'club-b',
        name: 'Club Beta',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        isMember: false,
        hasPendingJoinRequest: false,
        hasPendingInvite: false,
        canRequestJoin: true,
        liveTournaments: [
          {
            id: 'live-1',
            name: 'Live Open',
            startsAt: '2026-01-02T00:00:00.000Z',
            endsAt: null,
            maxEntries: null,
            status: 'live',
          },
        ],
      } satisfies LiveTournamentClub,
    ]);
    assert.equal(rows.length, 1);
    assert.equal(isLiveListingJoinEligible(rows[0]!), true);
  });

  it('supports joined-club tournament views without draft admin rows', () => {
    const visible = filterMemberVisibleTournaments([
      { id: 'pub', clubId: 'club-a', name: 'Open', status: 'published', startsAt: '', endsAt: null, maxEntries: null, scoringFormat: 'stroke', createdByAccountId: null, createdAt: '' },
      { id: 'draft', clubId: 'club-a', name: 'Hidden', status: 'draft', startsAt: '', endsAt: null, maxEntries: null, scoringFormat: 'stroke', createdByAccountId: null, createdAt: '' },
    ]);
    assert.deepEqual(
      visible.map((t) => t.id),
      ['pub'],
    );
  });

  it('maps non-member tournament API failures to access denied', () => {
    const err = new MobileApiError(404, { error: { code: 'not_found', message: 'Club not found.' } }, 'Club not found.');
    assert.equal(isActivityAccessDeniedError(err), true);
  });
});
