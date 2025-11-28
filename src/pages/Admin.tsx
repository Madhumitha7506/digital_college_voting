import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Admin = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch admin stats");

      setStats(data);
    } catch (err: any) {
      toast.error(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Loading admin dashboard...</p>;
  }

  if (!stats) {
    return <p className="text-center mt-10 text-red-500">Failed to load admin data.</p>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <Button onClick={fetchStats}>🔄 Refresh</Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center bg-white shadow-sm">
            <p className="text-lg font-semibold">Total Voters</p>
            <p className="text-3xl font-bold">{stats.totalVoters}</p>
          </div>
          <div className="p-4 border rounded-lg text-center bg-white shadow-sm">
            <p className="text-lg font-semibold">Candidates</p>
            <p className="text-3xl font-bold">{stats.totalCandidates}</p>
          </div>
          <div className="p-4 border rounded-lg text-center bg-white shadow-sm">
            <p className="text-lg font-semibold">Votes Cast</p>
            <p className="text-3xl font-bold">{stats.totalVotes}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
