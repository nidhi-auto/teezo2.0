import { mobileRequest, type MobileHttpOptions } from './http.ts';
import { joinRequestForClub } from './membership-policies.ts';
import { PlayerMembershipClient } from './membership-client.ts';
import type {
  ClubSummary,
  Invitation,
  JoinRequest,
  JoinedClub,
  Membership,
} from './types.ts';

/**
 * Player mobile invitation + join-request handling (Release 1.0.0 / #194 / #209).
 * Composes membership APIs with joined-club reads so accept/approve outcomes show in the club view.
 * Club Admin approve/reject remains web-only.
 */
export type PlayerMembershipState = {
  invitations: Invitation[];
  joinRequests: JoinRequest[];
  joinedClubs: JoinedClub[];
};

export class PlayerMembershipFlowsClient {
  readonly membership: PlayerMembershipClient;

  constructor(private readonly http: MobileHttpOptions) {
    this.membership = new PlayerMembershipClient(http);
  }

  withToken(accessToken: string): PlayerMembershipFlowsClient {
    return new PlayerMembershipFlowsClient({ ...this.http, accessToken });
  }

  /** Invitations inbox, own join-request rows, and current memberships in one refresh. */
  async getMembershipState(): Promise<PlayerMembershipState> {
    const [invitations, joinRequests, joinedClubs] = await Promise.all([
      this.membership.listInvitations(),
      this.membership.listJoinRequests(),
      this.listJoinedClubs(),
    ]);
    return { invitations, joinRequests, joinedClubs };
  }

  async acceptInvitation(invitationId: string): Promise<{
    invitation: Invitation;
    membership: Membership;
    joinedClubs: JoinedClub[];
  }> {
    const { invitation, membership } = await this.membership.acceptInvitation(invitationId);
    const joinedClubs = await this.listJoinedClubs();
    return { invitation, membership, joinedClubs };
  }

  async declineInvitation(invitationId: string): Promise<{ invitation: Invitation }> {
    const invitation = await this.membership.declineInvitation(invitationId);
    return { invitation };
  }

  async submitJoinRequest(clubId: string): Promise<{
    created: boolean;
    status: number;
    club: ClubSummary;
    joinRequest: JoinRequest;
  }> {
    return this.membership.submitJoinRequest(clubId);
  }

  /** `pending` | `approved` | `rejected` for one club, or `null` if none submitted. */
  async getJoinRequestStatusForClub(clubId: string): Promise<JoinRequest | null> {
    const joinRequests = await this.membership.listJoinRequests();
    return joinRequestForClub(joinRequests, clubId) ?? null;
  }

  isMemberOfClub(joinedClubs: JoinedClub[], clubId: string): boolean {
    return joinedClubs.some((club) => club.id === clubId);
  }

  private async listJoinedClubs(): Promise<JoinedClub[]> {
    const { data } = await mobileRequest<{ clubs: JoinedClub[] }>(this.http, 'GET', '/api/me/clubs');
    return data.clubs;
  }
}
