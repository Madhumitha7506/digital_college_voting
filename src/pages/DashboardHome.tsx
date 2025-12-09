// src/pages/DashboardHome.tsx
import { useEffect, useState } from "react";
import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";
import everyVoteBanner from "@/assets/everyvote.png";
import { Card } from "@/components/ui/card";

const DashboardHome = () => {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [electionDate, setElectionDate] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL;

  /* Load user from localStorage */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  /* Load election date from backend (then cache in localStorage) */
  useEffect(() => {
    const fetchElectionDate = async () => {
      const token = localStorage.getItem("token");

      try {
        if (token) {
          const res = await fetch(`${apiBase}/settings/election-date`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await res.json();
          if (res.ok && data.electionDate) {
            const d = (data.electionDate as string).slice(0, 10);
            setElectionDate(d);
            localStorage.setItem("electionDate", d);
            return;
          }
        }

        // Fallback to localStorage if API fails
        const stored = localStorage.getItem("electionDate");
        if (stored) {
          setElectionDate(stored);
        } else {
          setElectionDate(null);
        }
      } catch {
        const stored = localStorage.getItem("electionDate");
        if (stored) setElectionDate(stored);
      }
    };

    fetchElectionDate();
  }, [apiBase]);

  /* Compute daysLeft whenever electionDate changes */
  useEffect(() => {
    if (!electionDate) {
      setDaysLeft(null);
      return;
    }

    const today = new Date();
    const target = new Date(`${electionDate}T00:00:00`);
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    setDaysLeft(diffDays);
  }, [electionDate]);

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      {/* TOP BANNER */}
      <div className="w-full bg-blue-100 text-blue-700 text-lg font-semibold py-3 rounded-lg text-center shadow-sm">
        {electionDate ? (
          daysLeft !== null && daysLeft > 0 ? (
            <>
              {daysLeft} {daysLeft === 1 ? "day" : "days"} left until Election
              Day! 🗳️
            </>
          ) : daysLeft === 0 ? (
            <>It’s Election Day! Your vote, your voice! 🗳️</>
          ) : (
            <>Election has ended. Thank you for participating! 🎉</>
          )
        ) : (
          <>Election date has not been set by the Admin yet.</>
        )}
      </div>

      {/* WELCOME CARD */}
      <Card className="w-full max-w-4xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <img
            src={user?.gender === "female" ? femaleAvatar : maleAvatar}
            alt="User Avatar"
            className="w-20 h-20 rounded-full border border-gray-300 shadow-sm object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-blue-700">
              Welcome {user?.fullName || "Student"}!!
            </h2>
            <p className="text-green-600 font-semibold">
              Your vote! Your choice!!!
            </p>
            <div className="text-sm mt-2 text-gray-600">
              <p>
                <strong>Student ID:</strong> {user?.studentId || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || "N/A"}
              </p>
            </div>
          </div>
        </div>
        <p className="text-blue-600 font-medium text-right mt-4 sm:mt-0">
          “Every voice matters — make yours count!” 🗳️
        </p>
      </Card>

      {/* (For admin you also have the live vote notifications card below this,
          which you already wired up earlier.) */}

      <div className="w-full max-w-5xl">
        <img
          src={everyVoteBanner}
          alt="Every Vote Counts"
          className="rounded-2xl shadow-md w-full h-[480px] object-cover"
        />
      </div>
    </div>
  );
};

export default DashboardHome;
