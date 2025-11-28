import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Feedback = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      toast.error("Please select a rating before submitting.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, suggestion }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to submit feedback");

      toast.success("Thank you for your feedback!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Feedback submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-center">
              <Label className="text-lg">How was your voting experience?</Label>
              <div className="flex justify-center space-x-3 mt-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={rating === num ? "default" : "outline"}
                    onClick={() => setRating(num)}
                    className="rounded-full w-10 h-10"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestion">Suggestions (optional)</Label>
              <Textarea
                id="suggestion"
                placeholder="What could we improve?"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
