import { useState } from "react";
import { registerUser } from "@/api/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRegister = async (formData: any) => {
    try {
      setLoading(true);
      await registerUser(formData);
      toast.success("Registration successful! You can now log in.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return { handleRegister, loading };
};
