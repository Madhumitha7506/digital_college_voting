// src/pages/Settings.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Profile {
  fullName: string;
  email: string;
  phone?: string;
  studentId?: string;
}

type Role = "admin" | "voter";

const SettingsPage = () => {
  const [role, setRole] = useState<Role | null>(null);

  // voter profile
  const [profile, setProfile] = useState<Profile>({
    fullName: "",
    email: "",
    phone: "",
    studentId: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // election date (admin can edit, voters just see it)
  const [electionDate, setElectionDate] = useState<string>("");
  const [loadingDate, setLoadingDate] = useState(false);
  const [savingDate, setSavingDate] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL;

  /* --------------------------------------------------
     Get role from localStorage (user object)
     -------------------------------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      setRole("voter");
      return;
    }
    try {
      const u = JSON.parse(raw);
      const r: Role = u.role === "admin" ? "admin" : "voter";
      setRole(r);
    } catch {
      setRole("voter");
    }
  }, []);

  /* --------------------------------------------------
     Load profile (voter only)
     -------------------------------------------------- */
  useEffect(() => {
    if (role !== "voter") return; // ⛔ admin never calls profile API

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${apiBase}/settings/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load profile");
        }

        setProfile({
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          studentId: data.studentId ?? "",
        });
      } catch (err: any) {
        console.error("Profile load error:", err);
        toast.error(err.message || "Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [role, apiBase]);

  /* --------------------------------------------------
     Load election date (both admin & voter)
     -------------------------------------------------- */
  useEffect(() => {
    const fetchElectionDate = async () => {
      try {
        setLoadingDate(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${apiBase}/settings/election-date`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load election date");
        }

        if (data.electionDate) {
          // store only YYYY-MM-DD part
          const d = (data.electionDate as string).slice(0, 10);
          setElectionDate(d);
          localStorage.setItem("electionDate", d);
        } else {
          setElectionDate("");
        }
      } catch (err: any) {
        console.error("Election date load error:", err);
        toast.error(err.message || "Failed to load election date");
      } finally {
        setLoadingDate(false);
      }
    };

    fetchElectionDate();
  }, [apiBase]);

  /* --------------------------------------------------
     Save voter profile
     -------------------------------------------------- */
  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${apiBase}/settings/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      toast.success("Profile updated successfully.");
    } catch (err: any) {
      console.error("Profile save error:", err);
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* --------------------------------------------------
     Save election date (admin only)
     -------------------------------------------------- */
  const handleElectionDateSave = async () => {
    try {
      if (!electionDate) {
        toast.error("Please pick a date first.");
        return;
      }

      setSavingDate(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${apiBase}/settings/election-date`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ electionDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save election date");

      localStorage.setItem("electionDate", electionDate);
      toast.success("Election date saved successfully.");
    } catch (err: any) {
      console.error("Election date save error:", err);
      toast.error(err.message || "Failed to save election date");
    } finally {
      setSavingDate(false);
    }
  };

  /* --------------------------------------------------
     Render
     -------------------------------------------------- */
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Voter profile section */}
      {role === "voter" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingProfile ? (
              <p className="text-sm text-muted-foreground">
                Loading profile...
              </p>
            ) : (
              <>
                <Input
                  placeholder="Full name"
                  value={profile.fullName}
                  onChange={(e) =>
                    setProfile({ ...profile, fullName: e.target.value })
                  }
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
                <Input
                  placeholder="Student ID"
                  value={profile.studentId}
                  onChange={(e) =>
                    setProfile({ ...profile, studentId: e.target.value })
                  }
                />
                <Button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className="mt-2"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Election date section (admin can edit, voters just see it) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Election Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingDate ? (
            <p className="text-sm text-muted-foreground">
              Loading election date...
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Election Date
                </label>
                <Input
                  type="date"
                  value={electionDate || ""}
                  onChange={(e) => setElectionDate(e.target.value)}
                  disabled={role !== "admin"}
                />
                {role !== "admin" && (
                  <p className="text-xs text-muted-foreground">
                    Only the Admin can change the election date.
                  </p>
                )}
              </div>

              {role === "admin" && (
                <Button
                  onClick={handleElectionDateSave}
                  disabled={savingDate}
                  className="mt-2"
                >
                  {savingDate ? "Saving..." : "Save Election Date"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
