import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SettingsPage = () => {
  const [electionDate, setElectionDate] = useState("");
  const [category, setCategory] = useState("voter");
  const [gender, setGender] = useState("male");
  const [name, setName] = useState("");

  useEffect(() => {
    const savedDate = localStorage.getItem("electionDate");
    if (savedDate) setElectionDate(savedDate);
  }, []);

  const handleSave = () => {
    localStorage.setItem("electionDate", electionDate);
    toast.success("Settings saved successfully!");
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-blue-700 font-bold text-lg">
          ⚙️ Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700">Name</label>
          <input
            className="w-full border border-gray-300 rounded-md p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="voter">Voter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-700">Election Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md p-2"
            value={electionDate}
            onChange={(e) => setElectionDate(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} className="mt-4">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};

export default SettingsPage;
