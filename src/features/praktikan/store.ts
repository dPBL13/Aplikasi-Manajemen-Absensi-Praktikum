import { useSyncExternalStore } from 'react';
import type { AttendanceRecord, CheckInResult, Session, SessionStatus } from './types';

export const CURRENT_STUDENT_ID = 'praktikan-1';

interface State {
  sessions: Session[];
  attendance: AttendanceRecord[];
}

const sessions: Session[] = [
  { id: 's1', title: 'Pertemuan 1: Pengenalan', course: 'Praktikum PPK', date: '6 Okt 2026', time: '08.00 - 10.00', room: 'Lab 1', status: 'completed' },
  { id: 's2', title: 'Pertemuan 2: Git & Workflow', course: 'Praktikum PPK', date: '13 Okt 2026', time: '08.00 - 10.00', room: 'Lab 1', status: 'completed' },
  { id: 's3', title: 'Pertemuan 3: State Management', course: 'Praktikum PPK', date: '20 Okt 2026', time: '08.00 - 10.00', room: 'Lab 2', status: 'ongoing' },
  { id: 's4', title: 'Pertemuan 4: Testing', course: 'Praktikum PPK', date: '27 Okt 2026', time: '08.00 - 10.00', room: 'Lab 2', status: 'scheduled' },
];

const attendance: AttendanceRecord[] = sessions.map((s) => ({
  sessionId: s.id,
  studentId: CURRENT_STUDENT_ID,
  status: s.id === 's1' ? 'present' : 'not_present',
  checkedInAt: s.id === 's1' ? '08.05' : null,
}));

let state: State = { sessions, attendance };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const getState = () => state;

export function useAttendanceStore(): State {
  return useSyncExternalStore(subscribe, getState, getState);
}

function nowLabel() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}.${p(d.getMinutes())}`;
}

export function checkIn(sessionId: string): CheckInResult {
  const session = state.sessions.find((s) => s.id === sessionId);
  if (!session) return { ok: false, reason: 'not_found' };
  if (session.status === 'scheduled') return { ok: false, reason: 'not_started' };
  if (session.status === 'completed') return { ok: false, reason: 'closed' };

  const rec = state.attendance.find((a) => a.sessionId === sessionId && a.studentId === CURRENT_STUDENT_ID);
  if (rec?.status === 'present') return { ok: false, reason: 'already_present' };

  state = {
    ...state,
    attendance: state.attendance.map((a) =>
      a.sessionId === sessionId && a.studentId === CURRENT_STUDENT_ID
        ? { ...a, status: 'present', checkedInAt: nowLabel() }
        : a,
    ),
  };
  emit();
  return { ok: true };
}

export function devSetSessionStatus(sessionId: string, status: SessionStatus) {
  state = { ...state, sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, status } : s)) };
  emit();
}