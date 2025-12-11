// src/pages/Feedback.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import feedbackBanner from "@/assets/feedback1.png";

type YesNo = "yes" | "no" | "";
type Motivation = "more" | "less" | "same" | "";

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [isRegisteredVoter, setIsRegisteredVoter] = useState<YesNo>("");
  const [candidateSatisfaction, setCandidateSatisfaction] =
    useState<number | null>(null);
  const [processTrust, setProcessTrust] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<Motivation>("");
  const [submitting, setSubmitting] = useState(false);

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Check if this voter already submitted feedback
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/feedback/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          // 404 / 400 etc – just assume no feedback yet
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.hasFeedback) {
          setAlreadySubmitted(true);
        }
      } catch (err) {
        console.error("Feedback check error:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExisting();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alreadySubmitted) {
      toast.error("You have already submitted feedback. Thank you!");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter your feedback in the text box.");
      return;
    }

    if (!isRegisteredVoter) {
      toast.error("Please answer: Are you a registered voter?");
      return;
    }

    if (candidateSatisfaction == null) {
      toast.error(
        "Please rate how satisfied you are with candidates' positions on key issues."
      );
      return;
    }

    if (processTrust == null) {
      toast.error("Please rate how much you trust the election process.");
      return;
    }

    if (!motivation) {
      toast.error(
        "Please choose how motivated you are compared to previous elections."
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to submit feedback.");
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          // keep "rating" for backwards compatibility; same as candidate satisfaction
          rating: candidateSatisfaction,
          isRegisteredVoter,
          candidateSatisfaction,
          processTrust,
          motivation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit feedback");

      toast.success("✅ Thank you! Your feedback has been submitted.");
      setAlreadySubmitted(true);
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">
        Loading feedback form...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-700 flex items-center justify-between">
            <span>Share Your Feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <img
            src={feedbackBanner}
            alt="Feedback"
            className="w-full max-h-60 object-cover rounded-xl mb-6"
          />

          {alreadySubmitted ? (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
              ✅ You have already submitted your feedback for this election.
              Thank you for sharing your thoughts!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Q1: Registered voter? */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  1. Are you a registered voter?
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={isRegisteredVoter === "yes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRegisteredVoter("yes")}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={isRegisteredVoter === "no" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsRegisteredVoter("no")}
                  >
                    No
                  </Button>
                </div>
              </div>

              {/* Q2: Satisfaction with candidates */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  2. How satisfied are you with the candidates&apos; positions
                  on key issues? (1 = Very dissatisfied, 5 = Very satisfied)
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={
                        candidateSatisfaction === n ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCandidateSatisfaction(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Q3: Trust in process */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  3. How much do you trust the integrity of the election
                  process? (1 = Do not trust at all, 5 = Completely trust)
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={processTrust === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProcessTrust(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Q4: Motivation vs previous elections */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  4. How motivated are you to vote compared to previous
                  elections?
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={motivation === "more" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMotivation("more")}
                  >
                    More motivated
                  </Button>
                  <Button
                    type="button"
                    variant={motivation === "same" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMotivation("same")}
                  >
                    About the same
                  </Button>
                  <Button
                    type="button"
                    variant={motivation === "less" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMotivation("less")}
                  >
                    Less motivated
                  </Button>
                </div>
              </div>

              {/* Suggestion text box */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  5. Any comments or suggestions about your voting experience?
                </p>
                <Textarea
                  placeholder="Tell us about your voting experience..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                />
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
