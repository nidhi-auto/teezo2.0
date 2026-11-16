import { mobileRequest, type MobileHttpOptions } from './http.ts';
import { PlayerMembershipClient } from './membership-client.ts';
import type { ClubSummary, JoinRequest, JoinedClub, Tournament } from './types.ts';

export type PlayerActivitySnapshot = {
  clubs: JoinedClub[];
  joinRequests: JoinRequest[];
};

/**
 * Player mobile “my activity” views (#196 / #210): joined clubs, tournaments per club, and
 * join-request status. Server remains source of truth; Club Admin / Super Admin surfaces are not included.
 * For sanitized joined-club / tournament views (Release 1.0.0), use {@link PlayerActivityFlowsClient}
 * in `./activity-flows.ts`.
 */
export class PlayerActivityClient {
  readonly membership: PlayerMembershipClient;

  constructor(private readonly http: MobileHttpOptions) {
    this.membership = new PlayerMembershipClient(http);
  }

  withToken(accessToken: string): PlayerActivityClient {
    return new PlayerActivityClient({ ...this.http, accessToken });
  }

  /** All clubs this Player belongs to — one record each (no merge across clubs). */
  async listJoinedClubs(): Promise<JoinedClub[]> {
    const { data } = await mobileRequest<{ clubs: JoinedClub[] }>(this.http, 'GET', '/api/me/clubs');
    return data.clubs;
  }

  /** Member-visible tournaments for one joined club (`404` if not a member). */
  async listTournamentsForClub(clubId: string): Promise<{ club: ClubSummary; tournaments: Tournament[] }> {
    const { data } = await mobileRequest<{ club: ClubSummary; tournaments: Tournament[] }>(
      this.http,
      'GET',
      `/api/me/clubs/${encodeURIComponent(clubId)}/tournaments`,
    );
    return data;
  }

  /** Own join requests with server statuses: pending | approved | rejected. */
  async listJoinRequestStatus(): Promise<JoinRequest[]> {
    return this.membership.listJoinRequests();
  }

  /** Single read for mobile home: clubs+tournaments plus request inbox. */
  async getActivitySnapshot(): Promise<PlayerActivitySnapshot> {
    const [clubs, joinRequests] = await Promise.all([
      this.listJoinedClubs(),
      this.listJoinRequestStatus(),
    ]);
    return { clubs, joinRequests };
  }
}
