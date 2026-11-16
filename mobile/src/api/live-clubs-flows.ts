import { PlayerLiveClubsClient } from './live-clubs-client.ts';
import {
  liveClubJoinAction,
  pendingInvitationForClub,
  visibleLiveDiscoveryClubs,
  type LiveClubJoinAction,
} from './live-clubs-policies.ts';
import type { MobileHttpOptions } from './http.ts';
import type { Invitation, JoinRequest, JoinedClub, LiveTournamentClub } from './types.ts';

/**
 * Player mobile live-club browse and join (Release 1.0.0 / #195 / #210).
 * Composes live discovery with membership controls; closed tournaments never appear as live browse rows.
 */
export type LiveClubsDiscoveryState = {
  clubs: LiveTournamentClub[];
  invitations: Invitation[];
  joinRequests: JoinRequest[];
};

export class PlayerLiveClubsFlowsClient {
  readonly liveClubs: PlayerLiveClubsClient;

  constructor(private readonly http: MobileHttpOptions) {
    this.liveClubs = new PlayerLiveClubsClient(http);
  }

  withToken(accessToken: string): PlayerLiveClubsFlowsClient {
    return new PlayerLiveClubsFlowsClient({ ...this.http, accessToken });
  }

  /** Browse rows (live tournaments only) plus inbox data for join CTAs. */
  async getDiscoveryState(): Promise<LiveClubsDiscoveryState> {
    const [rawClubs, invitations, joinRequests] = await Promise.all([
      this.liveClubs.listClubsWithLiveTournaments(),
      this.liveClubs.membership.listInvitations(),
      this.liveClubs.membership.listJoinRequests(),
    ]);
    return {
      clubs: visibleLiveDiscoveryClubs(rawClubs),
      invitations,
      joinRequests,
    };
  }

  joinActionForClub(club: LiveTournamentClub, invitations: Invitation[]): LiveClubJoinAction {
    return liveClubJoinAction(club, invitations);
  }

  /** Submit join request from browse, then refresh listing and joined clubs. */
  async requestJoinFromListing(clubId: string): Promise<{
    created: boolean;
    status: number;
    joinRequest: JoinRequest;
    discovery: LiveClubsDiscoveryState;
    joinedClubs: JoinedClub[];
  }> {
    const result = await this.liveClubs.requestJoinFromLiveListing(clubId);
    const [discovery, joinedClubs] = await Promise.all([
      this.getDiscoveryState(),
      this.liveClubs.listJoinedClubs(),
    ]);
    return {
      created: result.created,
      status: result.status,
      joinRequest: result.joinRequest,
      discovery,
      joinedClubs,
    };
  }

  /** Accept a pending invite tied to a club on the live listing, then refresh. */
  async acceptInvitationForLiveClub(clubId: string): Promise<{
    invitation: Invitation;
    discovery: LiveClubsDiscoveryState;
    joinedClubs: JoinedClub[];
  }> {
    const invitations = await this.liveClubs.membership.listInvitations();
    const invitation = pendingInvitationForClub(invitations, clubId);
    if (!invitation) {
      throw new Error(`No pending invitation for club ${clubId}`);
    }
    const { invitation: acceptedInvitation } = await this.liveClubs.membership.acceptInvitation(
      invitation.id,
    );
    const [discovery, joinedClubs] = await Promise.all([
      this.getDiscoveryState(),
      this.liveClubs.listJoinedClubs(),
    ]);
    return { invitation: acceptedInvitation, discovery, joinedClubs };
  }
}
