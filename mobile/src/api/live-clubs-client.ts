import { mobileRequest, type MobileHttpOptions } from './http.ts';
import { PlayerMembershipClient } from './membership-client.ts';
import type {
  JoinedClub,
  LiveTournamentClub,
  Tournament,
  TournamentEntry,
} from './types.ts';

/**
 * Player mobile live-tournament discovery and participation (#195 / #210).
 * Browse → select eligible club → join via membership controls; view joined clubs; entry uses
 * published-only rules. Does not create or manage tournaments or expose Club Admin / Super Admin APIs.
 * For combined browse + join refresh, use {@link PlayerLiveClubsFlowsClient} in `./live-clubs-flows.ts`.
 */
export class PlayerLiveClubsClient {
  readonly membership: PlayerMembershipClient;

  constructor(private readonly http: MobileHttpOptions) {
    this.membership = new PlayerMembershipClient(http);
  }

  withToken(accessToken: string): PlayerLiveClubsClient {
    return new PlayerLiveClubsClient({ ...this.http, accessToken });
  }

  /** Clubs that currently have ≥1 `live` tournament, with join hints. */
  async listClubsWithLiveTournaments(): Promise<LiveTournamentClub[]> {
    const { data } = await mobileRequest<{ clubs: LiveTournamentClub[] }>(
      this.http,
      'GET',
      '/api/clubs/live-tournaments',
    );
    return data.clubs;
  }

  /**
   * Select an eligible club from the live listing and request membership.
   * Never auto-joins — same `POST /api/join-requests` path as web.
   */
  async requestJoinFromLiveListing(clubId: string) {
    return this.membership.submitJoinRequest(clubId);
  }

  /** Joined clubs (unmerged) with member-visible tournaments — reflects membership after approve/invite. */
  async listJoinedClubs(): Promise<JoinedClub[]> {
    const { data } = await mobileRequest<{ clubs: JoinedClub[] }>(this.http, 'GET', '/api/me/clubs');
    return data.clubs;
  }

  /**
   * Enter a tournament. Server allows only while `published` (members, cap, dates);
   * `live` freezes new entries per #187/#190.
   */
  async enterTournament(tournamentId: string): Promise<{
    status: number;
    created: boolean;
    entry: TournamentEntry;
    tournament: Tournament;
  }> {
    const { status, data } = await mobileRequest<{
      created: boolean;
      entry: TournamentEntry;
      tournament: Tournament;
    }>(this.http, 'POST', `/api/tournaments/${encodeURIComponent(tournamentId)}/entries`, {});
    return { status, ...data };
  }
}
