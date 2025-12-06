import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";

interface ResultRow {
  CandidateId: number;
  Name: string;
  Position: string;
  Gender?: string;
  PhotoUrl?: string;
  TotalVotes: number;
}

const Results = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getAvatarSrc = (r: ResultRow) => {
    if (r.PhotoUrl && r.PhotoUrl.trim() !== "") return r.PhotoUrl;
    if (r.Gender && r.Gender.toLowerCase() === "female") return femaleAvatar;
    return maleAvatar;
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to view results.");
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/votes/results`, // 👈 IMPORTANT
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load results");
        }

        setResults(data);
      } catch (err: any) {
        console.error("Error loading results:", err);
        toast.error(err.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Group by position for display
  const grouped = results.reduce(
    (acc: Record<string, ResultRow[]>, row) => {
      if (!acc[row.Position]) acc[row.Position] = [];
      acc[row.Position].push(row);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading results...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        No votes have been recorded yet.
      </div>
    );
  }

  // Find the max votes to scale simple bars
  const maxVotes = Math.max(...results.map((r) => r.TotalVotes || 0), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        Live Election Results 🗳️
      </h1>

      {Object.entries(grouped).map(([position, rows]) => (
        <Card key={position} className="mb-4">
          <CardHeader>
            <CardTitle className="capitalize text-lg text-blue-700">
              {position.replace(/_/g, " ")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((r) => {
              const barWidth = `${(r.TotalVotes / maxVotes) * 100}%`;
              return (
                <div
                  key={r.CandidateId}
                  className="flex items-center gap-4 border rounded-lg p-3 bg-white"
                >
                  <img
                    src={getAvatarSrc(r)}
                    alt={r.Name}
                    className="w-14 h-14 rounded-full object-cover border"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{r.Name}</h3>
                      <span className="font-bold text-blue-700">
                        {r.TotalVotes} vote{r.TotalVotes === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="mt-2 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Results;
