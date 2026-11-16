import { PlayerActivityClient } from './activity-client.ts';
import {
  isActivityAccessDeniedError,
  sanitizeJoinedClub,
  scopedMemberVisibleTournaments,
  separateJoinedClubRecords,
} from './activity-policies.ts';
import type { MobileHttpOptions } from './http.ts';
import type { JoinRequest, JoinedClub, Tournament } from './types.ts';

/**
 * Player mobile joined-club and tournament views (Release 1.0.0 / #196 / #210).
 * Sanitizes member-visible tournament states and keeps each membership as its own club record.
 */
export type PlayerJoinedClubsView = {
  clubs: JoinedClub[];
};

export type PlayerClubTournamentsView = {
  club: JoinedClub;
  tournaments: Tournament[];
};

export type PlayerActivityView = {
  clubs: JoinedClub[];
  joinRequests: JoinRequest[];
};

export class PlayerActivityFlowsClient {
  readonly activity: PlayerActivityClient;

  constructor(private readonly http: MobileHttpOptions) {
    this.activity = new PlayerActivityClient(http);
  }

  withToken(accessToken: string): PlayerActivityFlowsClient {
    return new PlayerActivityFlowsClient({ ...this.http, accessToken });
  }

  /** All joined clubs with member-visible tournaments — one record per membership. */
  async getJoinedClubsView(): Promise<PlayerJoinedClubsView> {
    const clubs = await this.activity.listJoinedClubs();
    return { clubs: separateJoinedClubRecords(clubs) };
  }

  /**
   * Tournaments for a single joined club. Non-members receive `404` from the server;
   * use {@link isActivityAccessDeniedError} in UI error handling.
   */
  async getClubTournamentsView(clubId: string): Promise<PlayerClubTournamentsView> {
    const { club, tournaments } = await this.activity.listTournamentsForClub(clubId);
    const visible = scopedMemberVisibleTournaments(club.id, tournaments);
    return {
      club: sanitizeJoinedClub({ ...club, tournaments: visible }),
      tournaments: visible,
    };
  }

  /** Combined home read: joined clubs (nested tournaments) plus own join-request inbox. */
  async getActivityView(): Promise<PlayerActivityView> {
    const snapshot = await this.activity.getActivitySnapshot();
    return {
      clubs: separateJoinedClubRecords(snapshot.clubs),
      joinRequests: snapshot.joinRequests,
    };
  }

  isMemberOfClub(clubs: JoinedClub[], clubId: string): boolean {
    return clubs.some((club) => club.id === clubId);
  }

  isAccessDenied(error: unknown): boolean {
    return isActivityAccessDeniedError(error);
  }
}
