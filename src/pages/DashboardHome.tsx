import { useEffect, useState } from "react";
import maleAvatar from "@/assets/male.png";
import femaleAvatar from "@/assets/female.png";
import everyVoteBanner from "@/assets/everyvote.png";
import { Card } from "@/components/ui/card";

const DashboardHome = () => {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  useEffect(() => {
    const electionDate = localStorage.getItem("electionDate") || "2025-12-10";
    const diff =
      Math.ceil(
        (new Date(electionDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      ) || 0;
    setDaysLeft(diff);
  }, []);

  // 🔹 Safely pick display fields from whatever backend sends
  const displayName =
    user?.fullName || user?.name || user?.full_name || "Student";

  const studentId = user?.studentId || user?.student_id || "N/A";
  const email = user?.email || "N/A";

  return (
    <div className="flex flex-col items-center w-full space-y-6">
      {/* Top banner with days left */}
      <div className="w-full bg-blue-100 text-blue-700 text-lg font-semibold py-3 rounded-lg text-center shadow-sm">
        {daysLeft && daysLeft > 0 ? (
          <>
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left until Election
            Day! 🗳️
          </>
        ) : daysLeft === 0 ? (
          <>It’s Election Day! Your vote, your voice! 🗳️</>
        ) : (
          <>Election has ended. Thank you for participating! 🎉</>
        )}
      </div>

      {/* Welcome card */}
      <Card className="w-full max-w-5xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <img
            src={user?.gender === "female" ? femaleAvatar : maleAvatar}
            alt="User Avatar"
            className="w-20 h-20 rounded-full border border-gray-300 shadow-sm object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-blue-700">
              Welcome {displayName}!!
            </h2>
            <p className="text-green-600 font-semibold">
              Your vote! Your choice!!!
            </p>
            <div className="text-sm mt-2 text-gray-600 space-y-1">
              <p>
                <strong>Student ID:</strong> {studentId}
              </p>
              <p>
                <strong>Email:</strong> {email}
              </p>
            </div>
          </div>
        </div>
        <p className="text-blue-600 font-medium text-right mt-4 sm:mt-0">
          “Every voice matters — make yours count!” 🗳️
        </p>
      </Card>

      {/* Big banner image */}
      <div className="w-full max-w-6xl">
        <img
          src={everyVoteBanner}
          alt="Every Vote Counts"
          className="
            rounded-2xl shadow-md w-full
            h-[560px] md:h-[640px] 
            object-cover
          "
        />
      </div>
    </div>
  );
};

export default DashboardHome;
