import { useEffect } from "react";
import { useRealtime } from "../../context/RealtimeContext";
import { useAuth } from "../../context/AuthContext";

export function UserSessionBridge() {
  const { socket } = useRealtime();
  const { updateUser } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleUserUpdate = (payload) => {
      if (payload) {
        updateUser(payload);
      }
    };

    socket.on("user_updated", handleUserUpdate);
    return () => {
      socket.off("user_updated", handleUserUpdate);
    };
  }, [socket, updateUser]);

  return null;
}

