// src/pages/Feedback.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter your feedback.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to submit feedback.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            rating, // can be null
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");

      toast.success("✅ Thank you! Your feedback has been submitted.");
      setMessage("");
      setRating(null);
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-700">
            Share Your Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Tell us about your voting experience..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Rating (optional):
              </span>
              {[1, 2, 3, 4, 5].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={rating === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRating(n)}
                >
                  {n}
                </Button>
              ))}
              {rating !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRating(null)}
                >
                  Clear
                </Button>
              )}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
