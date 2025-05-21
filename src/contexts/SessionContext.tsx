'use client';
import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

const SessionContext = createContext<{ session: any, status: string }>({ session: null, status: 'loading' });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  return (
    <SessionContext.Provider value={{ session, status }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  return useContext(SessionContext);
}