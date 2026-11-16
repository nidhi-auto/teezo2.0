import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/http";
import type { InvitationRow, JoinRequestRow, PlayerRow, TournamentRow } from "../api/types";
import { loadActiveClubId, saveActiveClubId } from "../auth/session";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingState } from "../components/LoadingState";
import { StatGrid } from "../components/StatGrid";
import { ViewHeader } from "../components/ViewHeader";

interface ClubAdminViewProps {
  token: string;
}

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "items" in payload && Array.isArray((payload as { items: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

export function ClubAdminView({ token }: ClubAdminViewProps) {
  const [clubId, setClubId] = useState(loadActiveClubId);
  const [clubIdInput, setClubIdInput] = useState(loadActiveClubId);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!clubId) {
      setPlayers([]);
      setTournaments([]);
      setInvitations([]);
      setJoinRequests([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const base = `/api/admin/clubs/${encodeURIComponent(clubId)}`;
      const [playersPayload, tournamentsPayload, invitationsPayload, joinPayload] = await Promise.all([
        apiRequest<unknown>(`${base}/players`, { token }),
        apiRequest<unknown>(`${base}/tournaments`, { token }),
        apiRequest<unknown>(`${base}/invitations`, { token }),
        apiRequest<unknown>(`${base}/join-requests`, { token }),
      ]);
      setPlayers(asList<PlayerRow>(playersPayload));
      setTournaments(asList<TournamentRow>(tournamentsPayload));
      setInvitations(asList<InvitationRow>(invitationsPayload));
      setJoinRequests(asList<JoinRequestRow>(joinPayload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load club workspace");
    } finally {
      setLoading(false);
    }
  }, [clubId, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function applyClubContext(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = clubIdInput.trim();
    setClubId(trimmed);
    saveActiveClubId(trimmed);
  }

  const liveTournaments = tournaments.filter((t) => t.lifecycleState === "live").length;

  return (
    <>
      <ViewHeader
        title="Club workspace"
        description="Roster, tournaments, invitations, and join requests for your assigned club."
        actions={
          <button type="button" className="btn btn--ghost" disabled={!clubId} onClick={() => void refresh()}>
            Refresh
          </button>
        }
      />

      <form onSubmit={applyClubContext} className="card" style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
        <div className="field" style={{ flex: "1 1 240px" }}>
          <label htmlFor="clubId">Club ID</label>
          <input
            id="clubId"
            name="clubId"
            placeholder="Paste club UUID from platform"
            value={clubIdInput}
            onChange={(e) => setClubIdInput(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn--primary">
          Load club
        </button>
      </form>

      {error ? <ErrorBanner message={error} /> : null}

      {!clubId ? (
        <p className="empty-state">Enter a club ID to load admin tools.</p>
      ) : loading ? (
        <LoadingState />
      ) : (
        <>
          <StatGrid
            items={[
              { label: "Players", value: players.length },
              { label: "Tournaments", value: tournaments.length },
              { label: "Live", value: liveTournaments, hint: "Published live events" },
              { label: "Join queue", value: joinRequests.length },
            ]}
          />

          <SectionTable title="Players" empty="No players in roster." columns={["Email", "Name", "Status"]} rowCount={players.length}>
            {players.map((p) => (
              <tr key={p.accountId}>
                <td>{p.email}</td>
                <td>{p.fullName ?? "—"}</td>
                <td>
                  <span className="badge badge--muted">{p.status ?? "active"}</span>
                </td>
              </tr>
            ))}
          </SectionTable>

          <SectionTable title="Tournaments" empty="No tournaments yet." columns={["Name", "State"]} rowCount={tournaments.length}>
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
          </SectionTable>

          <SectionTable title="Invitations" empty="No pending invitations." columns={["Email", "Status"]} rowCount={invitations.length}>
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.inviteeEmail}</td>
                <td>
                  <span className="badge badge--muted">{inv.status}</span>
                </td>
              </tr>
            ))}
          </SectionTable>

          <SectionTable title="Join requests" empty="Join queue is empty." columns={["Request", "Status"]} rowCount={joinRequests.length}>
            {joinRequests.map((jr) => (
              <tr key={jr.id}>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{jr.id}</td>
                <td>
                  <span className="badge badge--muted">{jr.status}</span>
                </td>
              </tr>
            ))}
          </SectionTable>
        </>
      )}
    </>
  );
}

function SectionTable({
  title,
  empty,
  columns,
  children,
  rowCount,
}: {
  title: string;
  empty: string;
  columns: string[];
  children: React.ReactNode;
  rowCount: number;
}) {
  const hasRows = rowCount > 0;

  return (
    <section className="card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{title}</h3>
      {!hasRows ? (
        <p className="empty-state">{empty}</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}