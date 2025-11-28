import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CandidateResult {
  Id: number;
  Name: string;
  Position: string;
  PhotoUrl: string;
  VoteCount: number;
}

const Results = () => {
  const [results, setResults] = useState<Record<string, CandidateResult[]>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to view results.");
          navigate("/login");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/votes/results`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to fetch results");

        // ✅ Group candidates by position
        const grouped = data.reduce((acc: Record<string, CandidateResult[]>, candidate: CandidateResult) => {
          if (!acc[candidate.Position]) acc[candidate.Position] = [];
          acc[candidate.Position].push(candidate);
          return acc;
        }, {});

        setResults(grouped);
      } catch (error: any) {
        console.error("Error fetching results:", error);
        toast.error(error.message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-muted-foreground">
        Loading results...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Election Results
          </h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {Object.keys(results).length === 0 ? (
          <p className="text-center text-muted-foreground mt-10">
            No results available yet. Voting may still be in progress.
          </p>
        ) : (
          Object.entries(results).map(([position, candidates]) => (
            <Card key={position}>
              <CardHeader>
                <CardTitle className="capitalize text-xl font-semibold text-primary">
                  {position}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.Id}
                    className="flex flex-col items-center bg-card p-4 rounded-2xl shadow hover:shadow-lg transition"
                  >
                    <img
                      src={candidate.PhotoUrl}
                      alt={candidate.Name}
                      className="w-20 h-20 rounded-full object-cover mb-3 border border-primary/30"
                    />
                    <h3 className="font-semibold text-lg">{candidate.Name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{candidate.Position}</p>
                    <span className="text-2xl font-bold text-primary">
                      🗳 {candidate.VoteCount}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Results;
