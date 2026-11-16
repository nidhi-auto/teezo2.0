import { mobileRequest, type MobileHttpOptions } from './http.ts';
import type { ClubSummary, Invitation, JoinRequest, Membership } from './types.ts';

/**
 * Player mobile membership HTTP surface (#194 / #209). Calls the same invitation and join-request
 * APIs as web; Club Admin approve/reject stays on web only. For combined inbox + club-view refresh,
 * use {@link PlayerMembershipFlowsClient} in `./membership-flows.ts`.
 */
export class PlayerMembershipClient {
  constructor(private readonly http: MobileHttpOptions) {}

  withToken(accessToken: string): PlayerMembershipClient {
    return new PlayerMembershipClient({ ...this.http, accessToken });
  }

  /** Pending invitations for this Player mailbox (expired rows omitted by the server). */
  async listInvitations(): Promise<Invitation[]> {
    const { data } = await mobileRequest<{ invitations: Invitation[] }>(
      this.http,
      'GET',
      '/api/invitations',
    );
    return data.invitations;
  }

  async acceptInvitation(invitationId: string): Promise<{ invitation: Invitation; membership: Membership }> {
    const { data } = await mobileRequest<{ invitation: Invitation; membership: Membership }>(
      this.http,
      'POST',
      `/api/invitations/${encodeURIComponent(invitationId)}/accept`,
      {},
    );
    return data;
  }

  async declineInvitation(invitationId: string): Promise<Invitation> {
    const { data } = await mobileRequest<{ invitation: Invitation }>(
      this.http,
      'POST',
      `/api/invitations/${encodeURIComponent(invitationId)}/decline`,
      {},
    );
    return data.invitation;
  }

  /** Own join requests across pending / approved / rejected. */
  async listJoinRequests(): Promise<JoinRequest[]> {
    const { data } = await mobileRequest<{ joinRequests: JoinRequest[] }>(
      this.http,
      'GET',
      '/api/join-requests',
    );
    return data.joinRequests;
  }

  async submitJoinRequest(clubId: string): Promise<{
    created: boolean;
    status: number;
    club: ClubSummary;
    joinRequest: JoinRequest;
  }> {
    const { status, data } = await mobileRequest<{
      created: boolean;
      club: ClubSummary;
      joinRequest: JoinRequest;
    }>(this.http, 'POST', '/api/join-requests', { clubId });
    return { status, ...data };
  }
}
