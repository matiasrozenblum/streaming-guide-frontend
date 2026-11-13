"use client";
import { createContext, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";
import { setAuthToken } from "@/services/authToken";

const SessionContext = createContext<{ session: unknown; status: string }>({
  session: null,
  status: "loading",
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Mirror the token outside React so code that is not a component — the
  // analytics queue, for one — can attach it without a round trip of its own.
  const accessToken =
    (session as { accessToken?: string } | null)?.accessToken ?? null;
  useEffect(() => {
    setAuthToken(accessToken);
  }, [accessToken]);

  return (
    <SessionContext.Provider value={{ session, status }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useContext(SessionContext);
}
