import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { dummySessions } from '@/data/sessions';
import type { PracticumSession } from '@/types/session';
import { formatClock } from '@/utils/format-clock';

type SessionContextValue = {
  sessions: PracticumSession[];
  getSession: (id: string) => PracticumSession | undefined;
  openSession: (id: string) => boolean;
  closeSession: (id: string, note?: string) => boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<PracticumSession[]>(dummySessions);

  const value = useMemo<SessionContextValue>(() => {
    const getSession = (id: string) => sessions.find((session) => session.id === id);

    const openSession = (id: string) => {
      const session = getSession(id);

      if (!session || session.status !== 'belum-dibuka') {
        return false;
      }

      const openedAt = formatClock();

      setSessions((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, status: 'berlangsung', openedAt } : item,
        ),
      );
      return true;
    };

    const closeSession = (id: string, note?: string) => {
      const session = getSession(id);

      if (!session || session.status !== 'berlangsung') {
        return false;
      }

      const closedAt = formatClock();
      const closingNote = note?.trim();

      setSessions((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'selesai',
                closedAt,
                closingNote: closingNote || undefined,
              }
            : item,
        ),
      );
      return true;
    };

    return { sessions, getSession, openSession, closeSession };
  }, [sessions]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessions() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSessions harus digunakan di dalam SessionProvider.');
  }

  return context;
}
