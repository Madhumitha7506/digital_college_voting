import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, User, Vote } from "lucide-react";

interface User {
  id: number;
  fullName: string;
  email: string;
  studentId: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-xl">Dashboard</CardTitle>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <User className="w-10 h-10 text-primary" />
            <h2 className="text-lg font-semibold">
              Welcome, {user?.fullName || "Student"}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">ID: {user?.studentId}</p>
          </div>

          <div className="flex justify-center mt-6">
            <Button onClick={() => navigate("/vote")}>
              <Vote className="w-4 h-4 mr-2" /> Go to Voting Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
