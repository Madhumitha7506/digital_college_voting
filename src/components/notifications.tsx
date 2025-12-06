import { useEffect } from "react";
import io from "socket.io-client";
import { toast } from "sonner";
import { Bell } from "lucide-react";

const SOCKET_URL = "http://localhost:5000"; // backend socket server

export default function Notifications() {
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("🔔 Connected to notifications socket");
    });

    // ✅ Listen for new notifications from backend
    socket.on("newNotification", (data) => {
      console.log("📢 Notification received:", data);
      toast(
        <div className="flex items-start gap-2">
          <Bell className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">{data.title}</p>
            <p className="text-sm text-muted-foreground">{data.message}</p>
          </div>
        </div>,
        {
          duration: 6000,
        }
      );
    });

    socket.on("disconnect", () => {
      console.warn("🔕 Disconnected from notifications socket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // no UI, just listens in background
}
