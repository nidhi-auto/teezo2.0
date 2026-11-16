import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/http";
import type { ClubSummary, InvitationRow, JoinRequestRow, TournamentRow } from "../api/types";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingState } from "../components/LoadingState";
import { StatGrid } from "../components/StatGrid";
import { ViewHeader } from "../components/ViewHeader";

interface PlayerViewProps {
  token: string;
}

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "items" in payload && Array.isArray((payload as { items: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

export function PlayerView({ token }: PlayerViewProps) {
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestRow[]>([]);
  const [liveFeed, setLiveFeed] = useState<{ clubName?: string; tournamentName?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTournaments = useCallback(
    async (clubId: string) => {
      if (!clubId) {
        setTournaments([]);
        return;
      }
      const tournamentsPayload = await apiRequest<unknown>(
        `/api/me/clubs/${encodeURIComponent(clubId)}/tournaments`,
        { token },
      );
      setTournaments(asList<TournamentRow>(tournamentsPayload));
    },
    [token],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clubsPayload, invitationsPayload, joinPayload, livePayload] = await Promise.all([
        apiRequest<unknown>("/api/me/clubs", { token }),
        apiRequest<unknown>("/api/invitations", { token }),
        apiRequest<unknown>("/api/join-requests", { token }),
        apiRequest<unknown>("/api/clubs/live-tournaments", { token }),
      ]);

      const clubList = asList<ClubSummary>(clubsPayload);
      setClubs(clubList);
      setInvitations(asList<InvitationRow>(invitationsPayload));
      setJoinRequests(asList<JoinRequestRow>(joinPayload));
      setLiveFeed(asList(livePayload));

      const activeClub = selectedClubId || clubList[0]?.id || "";
      if (activeClub !== selectedClubId) {
        setSelectedClubId(activeClub);
      }
      await loadTournaments(activeClub);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load player dashboard");
    } finally {
      setLoading(false);
    }
  }, [loadTournaments, selectedClubId, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedClubId || loading) return;
    void loadTournaments(selectedClubId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load tournaments");
    });
  }, [loadTournaments, loading, selectedClubId]);

  return (
    <>
      <ViewHeader
        title="Player home"
        description="Your memberships, invitations, and live tournament discovery."
        actions={
          <button type="button" className="btn btn--ghost" onClick={() => void refresh()}>
            Refresh
          </button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <StatGrid
            items={[
              { label: "My clubs", value: clubs.length },
              { label: "Invitations", value: invitations.length },
              { label: "Join requests", value: joinRequests.length },
              { label: "Live now", value: liveFeed.length },
            ]}
          />

          {clubs.length > 0 ? (
            <div className="field" style={{ marginBottom: "1rem", maxWidth: 360 }}>
              <label htmlFor="playerClub">Club</label>
              <select id="playerClub" value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Club tournaments</h3>
            {tournaments.length === 0 ? (
              <p className="empty-state">No tournaments for this club.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>
                          <span className={`badge ${t.lifecycleState === "live" ? "badge--live" : "badge--muted"}`}>
                            {t.lifecycleState ?? "draft"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Live tournaments</h3>
            {liveFeed.length === 0 ? (
              <p className="empty-state">Nothing live right now — check back on tournament day.</p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {liveFeed.map((row, index) => (
                  <li key={`${row.clubName ?? "club"}-${row.tournamentName ?? index}`}>
                    <strong>{row.tournamentName ?? "Tournament"}</strong>
                    {row.clubName ? ` · ${row.clubName}` : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Invitations</h3>
            {invitations.length === 0 ? (
              <p className="empty-state">No invitations.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.inviteeEmail}</td>
                        <td>
                          <span className="badge badge--muted">{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Join requests</h3>
            {joinRequests.length === 0 ? (
              <p className="empty-state">You have not submitted join requests.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joinRequests.map((jr) => (
                      <tr key={jr.id}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{jr.id}</td>
                        <td>
                          <span className="badge badge--muted">{jr.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}