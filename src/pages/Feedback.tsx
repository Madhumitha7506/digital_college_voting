import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import feedbackBanner from "@/assets/feedback1.png";
import { toast } from "sonner";

const Feedback = () => {
  const [form, setForm] = useState({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    q5: "",
  });

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        rating: Math.round((form.q1 + form.q2 + form.q3 + form.q4) / 4),
        suggestions: form.q5,
      };
      const res = await fetch(`${import.meta.env.VITE_API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send feedback");
      toast.success("Thanks for your feedback!");
      setForm({ q1: 0, q2: 0, q3: 0, q4: 0, q5: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const questions = [
    "How satisfied are you with the candidates' positions on key issues?",
    "Which issue is most important to you in this election?",
    "How much do you trust the integrity of the election process?",
    "Are you a registered voter?",
  ];

  const renderStars = (key: keyof typeof form) =>
    [1, 2, 3, 4, 5].map((val) => (
      <span
        key={val}
        onClick={() => setForm({ ...form, [key]: val })}
        className={`cursor-pointer text-2xl ${
          (form as any)[key] >= val ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));

  return (
    <div className="space-y-6">
      <img
        src={feedbackBanner}
        alt="Feedback Banner"
        className="w-full h-64 object-cover rounded-xl shadow-md"
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-700 font-bold text-lg">
            Help us improve the next election!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q, i) => (
            <div key={i}>
              <p className="font-medium text-gray-700 mb-1">{q}</p>
              <div>{renderStars(`q${i + 1}` as keyof typeof form)}</div>
            </div>
          ))}
          <div>
            <p className="font-medium text-gray-700 mb-1">
              What recommendations do you have to improve voter participation or the election process?
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-2 focus:ring-blue-400"
              value={form.q5}
              onChange={(e) => setForm({ ...form, q5: e.target.value })}
            />
          </div>
          <Button onClick={handleSubmit} className="mt-4">
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
