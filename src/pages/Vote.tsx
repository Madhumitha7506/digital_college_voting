import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Candidate {
  Id: number;
  Name: string;
  Position: string;
  Manifesto?: string;
  PhotoUrl?: string;
}

const Vote = () => {
  const [candidates, setCandidates] = useState<Record<string, Candidate[]>>({});
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, Candidate | null>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch candidates
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in first.");
          navigate("/login");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/candidates`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch candidates");

        // ✅ Group by position
        const grouped = data.reduce((acc: Record<string, Candidate[]>, c: Candidate) => {
          if (!acc[c.Position]) acc[c.Position] = [];
          acc[c.Position].push(c);
          return acc;
        }, {});

        setCandidates(grouped);
      } catch (error: any) {
        console.error("Error fetching candidates:", error);
        toast.error(error.message || "Failed to load candidates");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [navigate]);

  // ✅ Handle candidate selection
  const handleSelect = (position: string, candidate: Candidate) => {
    setSelectedCandidates((prev) => ({
      ...prev,
      [position]: candidate,
    }));
  };

  // ✅ Handle vote submission
  const handleSubmit = async () => {
    const votes = Object.entries(selectedCandidates).map(([position, candidate]) => ({
      position,
      candidateId: candidate?.Id,
    }));

    if (votes.length === 0 || votes.some((v) => !v.candidateId)) {
      toast.error("Please select a candidate for each position before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to vote.");
        navigate("/login");
        return;
      }

      const payload = { votes };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to submit votes");

      toast.success("✅ Your votes have been submitted successfully!");
      navigate("/results");
    } catch (error: any) {
      console.error("Vote submission error:", error);
      toast.error(error.message || "Failed to submit votes");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-muted-foreground">
        Loading candidates...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Vote for Your Candidate</h1>

        {Object.keys(candidates).length === 0 ? (
          <p className="text-center text-muted-foreground">No candidates available yet.</p>
        ) : (
          Object.entries(candidates).map(([position, candidateList]) => (
            <Card key={position} className="mb-6">
              <CardHeader>
                <CardTitle className="capitalize text-xl font-semibold text-primary">
                  {position}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {candidateList.map((candidate) => {
                  const isSelected = selectedCandidates[position]?.Id === candidate.Id;
                  return (
                    <div
                      key={candidate.Id}
                      onClick={() => handleSelect(position, candidate)}
                      className={`flex flex-col items-center p-4 border rounded-2xl cursor-pointer transition ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <img
                        src={candidate.PhotoUrl || "https://via.placeholder.com/100"}
                        alt={candidate.Name}
                        className="w-20 h-20 rounded-full object-cover mb-3 border border-primary/30"
                      />
                      <h3 className="font-semibold text-lg">{candidate.Name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{candidate.Position}</p>
                      <p className="text-xs text-center text-muted-foreground">{candidate.Manifesto}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}

        <div className="text-center mt-6">
          <Button
            onClick={handleSubmit}
            className="px-6 py-2 text-lg font-semibold"
            disabled={loading}
          >
            Submit Vote
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Vote;
