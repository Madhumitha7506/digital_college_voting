import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    student_id: "",
    email: "",
    phone: "",
    gender: "male",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Map frontend fields → backend expected fields
      const payload = {
        name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        gender: formData.gender,
        student_id: formData.student_id,
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // 🔹 Save values for Dashboard greeting
      localStorage.setItem("registered_name", formData.full_name);
      localStorage.setItem("registered_student_id", formData.student_id);
      localStorage.setItem("registered_email", formData.email);

      toast.success("✅ Registration successful! You can now log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="max-w-md w-full shadow-xl p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Student Registration 🗳️
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Student ID"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              placeholder="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {/* Gender Selector */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              >
                <option value="male">Male 👨</option>
                <option value="female">Female 👩</option>
              </select>
            </div>

            <Input
              placeholder="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button
              type="submit"
              className="w-full bg-primary text-white mt-2"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className="text-primary hover:underline cursor-pointer"
              >
                Login here
              </span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
