import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { ENV } from "../config/env";
import { useAuth } from "./AuthContext";

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      return;
    }

    const nextSocket = io(ENV.API_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  const value = useMemo(
    () => ({
      socket,
    }),
    [socket]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return ctx;
}

