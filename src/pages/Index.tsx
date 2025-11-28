import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Vote, Shield, Users, BarChart3 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  // ✅ Auto-redirect logged-in users
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 text-foreground">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Vote className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">E-Voting System</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button onClick={() => navigate("/register")}>Register</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            Secure Digital Voting Platform
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Exercise your democratic right with our secure, transparent, and user-friendly voting system.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")}>
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/results")}
            >
              View Results
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-primary" />}
            title="Secure & Verified"
            description="OTP verification ensures one vote per student with complete security."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-secondary" />}
            title="Easy to Use"
            description="Intuitive interface makes voting simple and accessible for everyone."
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8 text-accent" />}
            title="Real-time Results"
            description="Watch live vote counts and see results as they happen."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground border-t border-border mt-16">
        <p>© {new Date().getFullYear()} E-Voting System. All rights reserved.</p>
      </footer>
    </div>
  );
};

// ✅ Small helper for feature blocks
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="bg-card p-6 rounded-lg border border-border text-center shadow-sm hover:shadow-md transition-all">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
