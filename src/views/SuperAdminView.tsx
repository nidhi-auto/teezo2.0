import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/http";
import type { ClubAdminRow, ClubSummary } from "../api/types";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingState } from "../components/LoadingState";
import { StatGrid } from "../components/StatGrid";
import { ViewHeader } from "../components/ViewHeader";

interface SuperAdminViewProps {
  token: string;
}

function asList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "items" in payload && Array.isArray((payload as { items: unknown }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

export function SuperAdminView({ token }: SuperAdminViewProps) {
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [clubAdmins, setClubAdmins] = useState<ClubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clubsPayload, adminsPayload] = await Promise.all([
        apiRequest<unknown>("/api/admin/platform/clubs", { token }),
        apiRequest<unknown>("/api/admin/platform/club-admins", { token }),
      ]);
      setClubs(asList<ClubSummary>(clubsPayload));
      setClubAdmins(asList<ClubAdminRow>(adminsPayload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platform data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <ViewHeader
        title="Platform overview"
        description="Monitor clubs and club administrators across Teezo Golf."
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
              { label: "Clubs", value: clubs.length },
              { label: "Club admins", value: clubAdmins.length },
              { label: "Active clubs", value: clubs.filter((c) => c.status !== "inactive").length },
            ]}
          />

          <section className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Clubs</h3>
            {clubs.length === 0 ? (
              <p className="empty-state">No clubs yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((club) => (
                      <tr key={club.id}>
                        <td>{club.name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{club.id}</td>
                        <td>
                          <span className="badge badge--muted">{club.status ?? "active"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Club administrators</h3>
            {clubAdmins.length === 0 ? (
              <p className="empty-state">No club administrators yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubAdmins.map((admin) => (
                      <tr key={admin.id}>
                        <td>{admin.fullName ?? "—"}</td>
                        <td>{admin.email}</td>
                        <td>
                          <span className="badge badge--muted">{admin.status ?? "active"}</span>
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