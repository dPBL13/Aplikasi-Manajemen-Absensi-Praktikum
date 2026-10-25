export type SessionStatus = 'scheduled' | 'ongoing' | 'completed';
export type AttendanceStatus = 'not_present' | 'present';

export interface Session {
  id: string;
  title: string;
  course: string;
  date: string; 
  time: string; 
  room: string;
  status: SessionStatus;
}

export interface AttendanceRecord {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  checkedInAt: string | null; 
}

export type CheckInResult =
  | { ok: true }
  | { ok: false; reason: 'not_started' | 'closed' | 'already_present' | 'not_found' };