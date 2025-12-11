// src/pages/Admin.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ResultsStatus {
  published: boolean;
  publishedAt?: string | null;
}

interface PositionRow {
  Position: string;
  TotalVotes: number;
}

interface GenderRow {
  Gender: string;
  TotalVotes: number;
}

interface AdminStats {
  totalVoters: number;
  totalCandidates: number;
  totalVotes: number;
  turnoutPercent: number;
  votesByPosition: PositionRow[];
  votesByGender: GenderRow[];
}

const Admin = () => {
  const [status, setStatus] = useState<ResultsStatus | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL;

  /* ================================
     Load publish/unpublish status
     ================================ */
  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/results-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load status");
      setStatus(data);
    } catch (err: any) {
      console.error("Error loading results status:", err);
      toast.error(err.message || "Failed to load results status");
    } finally {
      setLoadingStatus(false);
    }
  };

  /* ================================
     Load stats for admin dashboard
     ================================ */
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const raw = await res.json();
      if (!res.ok) throw new Error(raw.error || "Failed to load stats");

      // Backend may return:
      // - raw.votesByPosition
      // - raw.byPosition
      // - raw.positionStats
      const rawPos =
        raw.votesByPosition || raw.byPosition || raw.positionStats || [];

      const votesByPosition: PositionRow[] = (rawPos as any[]).map((row) => ({
        Position: row.Position,
        // accept several possible property names from SQL
        TotalVotes: row.TotalVotes ?? row.Votes ?? row.VoteCount ?? 0,
      }));

      const rawGender =
        raw.votesByGender || raw.byGender || raw.genderStats || [];

      const votesByGender: GenderRow[] = (rawGender as any[]).map((row) => ({
        Gender: row.Gender,
        TotalVotes: row.TotalVotes ?? row.Votes ?? row.VoteCount ?? 0,
      }));

      const normalized: AdminStats = {
        totalVoters: raw.totalVoters ?? 0,
        totalCandidates: raw.totalCandidates ?? 0,
        totalVotes: raw.totalVotes ?? 0,
        turnoutPercent: raw.turnoutPercent ?? 0,
        votesByPosition,
        votesByGender,
      };

      setStats(normalized);
    } catch (err: any) {
      console.error("Admin stats error:", err);
      toast.error(err.message || "Failed to load admin stats");
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, []);

  /* ================================
     Publish / Unpublish handlers
     ================================ */
  const handlePublish = async () => {
    try {
      setPublishing(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/publish-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish results");

      toast.success("✅ Results published / announced successfully!");
      await fetchStatus();
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err.message || "Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setUnpublishing(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase}/admin/unpublish-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to unpublish results");

      toast.success("✅ Results are now hidden from students.");
      await fetchStatus();
    } catch (err: any) {
      console.error("Unpublish error:", err);
      toast.error(err.message || "Failed to unpublish results");
    } finally {
      setUnpublishing(false);
    }
  };

  /* ================================
     CSV report download
     ================================ */
  const downloadReport = async (type: "candidates" | "turnout") => {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in as admin to download reports.");
        return;
      }

      const res = await fetch(`${apiBase}/admin/report/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Report download error:", text);
        throw new Error(text || "Failed to download report");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "candidates"
          ? "candidate_report.csv"
          : "turnout_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("📄 Report download started.");
    } catch (err: any) {
      console.error("Report download error:", err);
      toast.error(err.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  /* ================================
     Render
     ================================ */
  if (loadingStatus && loadingStats) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
        Loading admin controls...
      </div>
    );
  }

  const positionData: PositionRow[] = stats?.votesByPosition || [];
  const maxVotes =
    positionData.length > 0
      ? Math.max(...positionData.map((r) => r.TotalVotes || 0), 1)
      : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* PUBLISH / UNPUBLISH SECTION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-700">
            Admin Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-blue-50 text-sm text-blue-800">
            <p className="font-semibold mb-1">
              📢 Publish / Unpublish Final Election Results
            </p>

            {status?.published ? (
              <p>
                Results are currently{" "}
                <strong>marked as published</strong>. Students can see the
                winners and vote counts on the Results page.
              </p>
            ) : (
              <p>
                Results are currently{" "}
                <strong>hidden from students.</strong> They will only see the{" "}
                “results not yet announced” message.
              </p>
            )}

            {status?.publishedAt && (
              <p className="mt-1 text-xs text-blue-700">
                Last published at:{" "}
                {new Date(status.publishedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing
                ? "Publishing..."
                : status?.published
                ? "Re-Publish / Announce Again"
                : "Publish Final Results"}
            </Button>

            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={unpublishing || !status?.published}
            >
              {unpublishing ? "Unpublishing..." : "Unpublish / Hide Results"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* STATS + SIMPLE GRAPH */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Election Stats Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingStats && (
            <p className="text-sm text-muted-foreground">Loading stats...</p>
          )}

          {stats && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border">
                  <p className="text-xs text-muted-foreground">
                    Total Registered Voters
                  </p>
                  <p className="text-2xl font-bold">{stats.totalVoters}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border">
                  <p className="text-xs text-muted-foreground">
                    Total Candidates
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.totalCandidates}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border">
                  <p className="text-xs text-muted-foreground">
                    Total Votes Cast
                  </p>
                  <p className="text-2xl font-bold">{stats.totalVotes}</p>
                  <p className="text-xs text-green-700 mt-1">
                    Turnout: {stats.turnoutPercent}%
                  </p>
                </div>
              </div>

              {/* Position-wise bar graph */}
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">
                  Votes by Position (simple bar graph)
                </p>

                {positionData.length === 0 || maxVotes === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No votes recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {positionData.map((row) => {
                      const width = `${Math.round(
                        (row.TotalVotes / maxVotes) * 100
                      )}%`;
                      return (
                        <div key={row.Position}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize">
                              {row.Position.replace(/_/g, " ")}
                            </span>
                            <span>{row.TotalVotes} votes</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-2 bg-blue-500"
                              style={{ width }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {!loadingStats && !stats && (
            <p className="text-sm text-muted-foreground">
              Stats could not be loaded (check if you are logged in as admin,
              and backend /api/admin/stats is working).
            </p>
          )}
        </CardContent>
      </Card>

      {/* REPORT DOWNLOADS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Reports & Exports
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => downloadReport("candidates")}
            disabled={downloading}
          >
            {downloading ? "Preparing..." : "Download Candidate-wise Report"}
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadReport("turnout")}
            disabled={downloading}
          >
            {downloading ? "Preparing..." : "Download Turnout Stats Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
