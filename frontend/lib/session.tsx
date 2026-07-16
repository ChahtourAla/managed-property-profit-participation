'use client';

import * as React from 'react';

import { demoUsers, type AppRole, type DemoUser } from '@/lib/role-config';

type SessionState = DemoUser & {
  accessToken: string;
};

type SessionContextValue = {
  session: SessionState;
  ready: boolean;
  setRoleSession: (role: AppRole, email?: string) => void;
  signOut: () => void;
};

const STORAGE_KEY = 'easycoin.demo.session';

const buildSession = (role: AppRole, email?: string): SessionState => {
  const user = demoUsers[role];
  return {
    ...user,
    email: email?.trim() || user.email,
    accessToken: `demo-${role.toLowerCase()}-token`,
  };
};

const defaultSession = buildSession('EASYCOIN');

const SessionContext = React.createContext<SessionContextValue | undefined>(
  undefined
);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<SessionState>(defaultSession);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSession));
        setSession(defaultSession);
        setReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SessionState> | null;
      if (parsed && parsed.role && parsed.role in demoUsers) {
        const role = parsed.role as AppRole;
        const nextSession = buildSession(role, parsed.email);
        setSession(nextSession);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      } else {
        setSession(defaultSession);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSession));
      }
    } catch {
      setSession(defaultSession);
    } finally {
      setReady(true);
    }
  }, []);

  const setRoleSession = React.useCallback((role: AppRole, email?: string) => {
    const nextSession = buildSession(role, email);
    setSession(nextSession);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(defaultSession);
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      ready,
      setRoleSession,
      signOut,
    }),
    [ready, session, setRoleSession, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function getDemoSession(role: AppRole, email?: string) {
  return buildSession(role, email);
}
