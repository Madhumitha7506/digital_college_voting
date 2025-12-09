// src/pages/Results.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";
import { toast } from "sonner";

interface ResultRow {
  CandidateId: number;
  Name: string;
  Position: string;
  Gender?: string;
  TotalVotes: number;
}

interface ResultsStatus {
  published: boolean;
  publishedAt?: string | null;
}

const formatPosition = (pos: string) =>
  pos.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getAvatar = (gender?: string) =>
  gender && gender.toLowerCase() === "female" ? femaleAvatar : maleAvatar;

const Results = () => {
  const [status, setStatus] = useState<ResultsStatus | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in again.");
        return;
      }

      const [statusRes, resultsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/results-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/votes/results`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statusData = await statusRes.json();
      const resultsData = await resultsRes.json();

      if (!statusRes.ok) throw new Error(statusData.error || "Failed to load status");
      if (!resultsRes.ok) throw new Error(resultsData.error || "Failed to load results");

      setStatus(statusData);
      // resultsData is exactly sp_GetResults recordset:
      // CandidateId, Name, Position, Gender, TotalVotes
      setRows(resultsData as ResultRow[]);
    } catch (err: any) {
      console.error("Results load error:", err);
      toast.error(err.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
        Loading results…
      </div>
    );
  }

  const positions = Array.from(new Set(rows.map((r) => r.Position)));
  const totalPositions = positions.length;
  const totalCandidates = rows.length;
  const totalVotesCast = rows.reduce((sum, r) => sum + (r.TotalVotes || 0), 0);

  // Build winner + others for each position
  const perPosition = positions.map((pos) => {
    const list = rows.filter((r) => r.Position === pos);
    const sorted = [...list].sort((a, b) => (b.TotalVotes || 0) - (a.TotalVotes || 0));

    const totalForPos = sorted.reduce((s, r) => s + (r.TotalVotes || 0), 0);
    const winner = sorted[0];
    const others = sorted.slice(1);
    const tie =
      sorted.length > 1 &&
      (sorted[0].TotalVotes || 0) === (sorted[1].TotalVotes || 0) &&
      (sorted[0].TotalVotes || 0) > 0;

    return { pos, totalForPos, winner, others, tie };
  });

  const published = status?.published;
  const publishedAtText =
    status?.publishedAt &&
    new Date(status.publishedAt).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="space-y-6">
      {/* Header / Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-700 flex flex-col gap-1">
            <span>Final Election Results 🏆</span>
            {published && publishedAtText && (
              <span className="text-xs font-normal text-gray-500">
                Officially announced at: {publishedAtText} 📜
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Total Positions</p>
            <p className="text-xl font-semibold">{totalPositions}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Candidates</p>
            <p className="text-xl font-semibold">{totalCandidates}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Votes Cast</p>
            <p className="text-xl font-semibold">{totalVotesCast}</p>
          </div>
        </CardContent>
      </Card>

      {/* If admin has not published yet -> simple banner for everyone */}
      {!published && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4 text-sm text-orange-800">
            <p className="font-semibold">
              📊 Results are being recorded but are not yet officially announced.
            </p>
            <p>
              The admin has not published the final winners. Please check back later for the
              official announcement.
            </p>
          </CardContent>
        </Card>
      )}

      {/* If published, show winners by position */}
      {published &&
        perPosition.map(({ pos, totalForPos, winner, others, tie }) => (
          <Card key={pos}>
            <CardHeader>
              <CardTitle className="text-blue-700 text-lg">
                {formatPosition(pos)} –{" "}
                <span className="font-semibold text-green-700">Winner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row justify-between gap-4">
              {/* Winner block */}
              <div className="flex items-center gap-4">
                {winner && winner.TotalVotes > 0 ? (
                  <>
                    <img
                      src={getAvatar(winner.Gender)}
                      alt={winner.Name}
                      className="w-20 h-20 rounded-full border object-cover"
                    />
                    <div>
                      <p className="font-semibold text-base">{winner.Name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {winner.Gender || ""}
                      </p>
                      <p className="mt-1 text-sm">
                        Total votes:{" "}
                        <span className="font-semibold">{winner.TotalVotes}</span>
                      </p>
                      {tie && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠ Tie at the top for this position.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No votes recorded yet for this position.
                  </p>
                )}
              </div>

              {/* Other candidates list */}
              <div className="text-xs text-right text-gray-600 md:w-1/3">
                <p className="font-semibold mb-1">Other candidates:</p>
                {others.length === 0 ? (
                  <p>No other candidates.</p>
                ) : (
                  <ul className="space-y-1">
                    {others.map((c) => (
                      <li key={c.CandidateId}>
                        {c.Name} –{" "}
                        <span className="font-semibold">{c.TotalVotes}</span> votes
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default Results;
