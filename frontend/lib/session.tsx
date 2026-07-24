'use client';

import * as React from 'react';

import {
  demoUsers,
  localDamlParties,
  type AppRole,
  type DemoUser,
} from '@/lib/role-config';
import {
  BackendApiError,
  getMe,
  signin,
  signup,
  type BackendAuthUser,
} from '@/lib/backend-api';

type SessionState = DemoUser & {
  accessToken: string;
};

type SessionContextValue = {
  session: SessionState;
  ready: boolean;
  setRoleSession: (role: AppRole, email?: string) => void;
  signInWithBackend: (
    role: AppRole,
    email: string,
    password: string
  ) => Promise<SessionState>;
  signUpWithBackend: (
    role: AppRole,
    email: string,
    password: string,
    fullName?: string
  ) => Promise<SessionState>;
  signOut: () => void;
};

export const SESSION_STORAGE_KEY = 'easycoin.demo.session';
const PARTY_COUNTER_KEY = 'easycoin.party.counters';

type PartyCounterState = Partial<Record<AppRole, number>>;

const getPartyCounterState = (): PartyCounterState => {
  try {
    const raw = window.localStorage.getItem(PARTY_COUNTER_KEY);
    return raw ? (JSON.parse(raw) as PartyCounterState) : {};
  } catch {
    return {};
  }
};

const setPartyCounterState = (state: PartyCounterState) => {
  window.localStorage.setItem(PARTY_COUNTER_KEY, JSON.stringify(state));
};

const nextPartyId = (role: AppRole) => {
  const counters = getPartyCounterState();
  const nextCount = (counters[role] ?? 0) + 1;
  counters[role] = nextCount;
  setPartyCounterState(counters);

  const predefinedParties: Partial<Record<AppRole, string[]>> = {
    OWNER: [localDamlParties.owner],
    EASYCOIN: [localDamlParties.easycoin],
    INVESTOR: [
      localDamlParties.investor1,
      localDamlParties.investor2,
      localDamlParties.investor3,
      localDamlParties.investor4,
    ],
    AUDITOR: [localDamlParties.auditor],
    PAYMENT_VERIFIER: [localDamlParties.paymentVerifier],
    LEGAL_ADMIN: [localDamlParties.legalAdmin],
  };

  const party = predefinedParties[role]?.[nextCount - 1];
  if (party) return party;

  return `Party::${role}${nextCount}`;
};

const buildSessionFromUser = (
  user: BackendAuthUser,
  accessToken: string
): SessionState => {
  const demoUser = demoUsers[user.role as AppRole] ?? demoUsers.EASYCOIN;

  return {
    role: user.role as AppRole,
    name: user.fullName?.trim() || demoUser.name,
    email: user.email,
    initials: demoUser.initials,
    partyId: user.partyId || demoUser.partyId,
    accessToken,
  };
};

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

  const persistSession = React.useCallback((nextSession: SessionState) => {
    setSession(nextSession);
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  React.useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) {
          setSession(defaultSession);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<SessionState> | null;
        if (parsed && parsed.role && parsed.role in demoUsers) {
          const role = parsed.role as AppRole;
          if (parsed.accessToken && !parsed.accessToken.startsWith('demo-')) {
            try {
              const me = await getMe(parsed.accessToken);
              const nextSession = buildSessionFromUser(
                me.user,
                parsed.accessToken
              );
              persistSession(nextSession);
              return;
            } catch {
              window.localStorage.removeItem(SESSION_STORAGE_KEY);
              setSession(defaultSession);
              return;
            }
          }

          const nextSession = buildSession(role, parsed.email);
          persistSession(nextSession);
          return;
        }

        setSession(defaultSession);
        persistSession(defaultSession);
      } catch {
        setSession(defaultSession);
      } finally {
        setReady(true);
      }
    };

    void hydrate();
  }, [persistSession]);

  const setRoleSession = React.useCallback((role: AppRole, email?: string) => {
    const nextSession = buildSession(role, email);
    persistSession(nextSession);
  }, [persistSession]);

  const signInWithBackend = React.useCallback(
    async (role: AppRole, email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const response = await signin(normalizedEmail, password);
        const nextSession = buildSessionFromUser(
          response.user,
          response.accessToken
        );
        persistSession(nextSession);
        return nextSession;
      } catch (error) {
        const status =
          error instanceof BackendApiError ? error.status : undefined;

        if (status !== 401) {
          throw error;
        }

        let lastError: unknown = error;

        for (let attempt = 0; attempt < 5; attempt += 1) {
          try {
            const response = await signup({
              email: normalizedEmail,
              password,
              fullName: demoUsers[role].name,
              role,
              partyId: nextPartyId(role),
            });

            const nextSession = buildSessionFromUser(
              response.user,
              response.accessToken
            );
            persistSession(nextSession);
            return nextSession;
          } catch (signupError) {
            lastError = signupError;
            if (
              !(signupError instanceof BackendApiError) ||
              signupError.status !== 409
            ) {
              throw signupError;
            }
          }
        }

        throw lastError;
      }
    },
    [persistSession]
  );

  const signUpWithBackend = React.useCallback(
    async (
      role: AppRole,
      email: string,
      password: string,
      fullName?: string
    ) => {
      const normalizedEmail = email.trim().toLowerCase();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const response = await signup({
            email: normalizedEmail,
            password,
            fullName: fullName?.trim() || demoUsers[role].name,
            role,
            partyId: nextPartyId(role),
          });

          const nextSession = buildSessionFromUser(
            response.user,
            response.accessToken
          );
          persistSession(nextSession);
          return nextSession;
        } catch (error) {
          if (!(error instanceof BackendApiError) || error.status !== 409) {
            throw error;
          }
        }
      }

      throw new BackendApiError(409, 'Unable to generate a unique party ID');
    },
    [persistSession]
  );

  const signOut = React.useCallback(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(defaultSession);
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      ready,
      setRoleSession,
      signInWithBackend,
      signUpWithBackend,
      signOut,
    }),
    [
      ready,
      session,
      setRoleSession,
      signInWithBackend,
      signUpWithBackend,
      signOut,
    ]
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
