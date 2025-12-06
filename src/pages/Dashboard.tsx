import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  BarChart,
  Settings,
  LogOut,
  MessageSquare,
  CheckSquare, // 👈 NEW icon for Vote
} from "lucide-react";
import DashboardHome from "./DashboardHome";
import Candidates from "./Candidates";
import Results from "./Results";
import Feedback from "./Feedback";
import SettingsPage from "./Settings";
import VotePage from "./Vote"; // 👈 NEW import
import { toast } from "sonner";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!");
    navigate("/"); // Back to main landing page
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <DashboardHome />;
      case "candidates":
        return <Candidates />;
      case "vote":                          // 👈 NEW
        return <VotePage />;                // 👈 NEW
      case "results":
        return <Results />;
      case "feedback":
        return <Feedback />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-60 bg-blue-50 border-r border-blue-100 p-5 flex flex-col gap-3">
        <SidebarItem
          icon={<Home size={18} />}
          text="Home"
          active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
        />
        <SidebarItem
          icon={<Users size={18} />}
          text="Candidates"
          active={activeTab === "candidates"}
          onClick={() => setActiveTab("candidates")}
        />
        {/* 👇 NEW Vote item */}
        <SidebarItem
          icon={<CheckSquare size={18} />}
          text="Vote"
          active={activeTab === "vote"}
          onClick={() => setActiveTab("vote")}
        />
        <SidebarItem
          icon={<BarChart size={18} />}
          text="Results"
          active={activeTab === "results"}
          onClick={() => setActiveTab("results")}
        />
        <SidebarItem
          icon={<MessageSquare size={18} />}
          text="Feedback"
          active={activeTab === "feedback"}
          onClick={() => setActiveTab("feedback")}
        />
        <SidebarItem
          icon={<Settings size={18} />}
          text="Settings"
          active={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
        <div className="mt-auto">
          <SidebarItem
            icon={<LogOut size={18} />}
            text="Logout"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">{renderContent()}</div>
    </div>
  );
};

function SidebarItem({
  icon,
  text,
  active,
  onClick,
}: {
  icon: any;
  text: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-left transition-all duration-150 ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-blue-700 hover:bg-blue-100"
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </button>
  );
}

export default Dashboard;
