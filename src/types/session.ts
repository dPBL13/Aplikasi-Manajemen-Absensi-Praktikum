export type SessionStatus = 'belum-dibuka' | 'berlangsung' | 'selesai';

export interface Participant {
  id: string;
  name: string;
  nim: string;
  /** Jam praktikan tercatat hadir, contoh: "08:12". */
  checkInAt?: string;
}

export interface PracticumSession {
  id: string;
  courseName: string;
  classGroup: string;
  room: string;
  dayLabel: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  asprakName: string;
  status: SessionStatus;
  /** Jam sesi dibuka oleh Asprak, contoh: "08:00". */
  openedAt?: string;
  /** Jam sesi ditutup oleh Asprak, contoh: "10:02". */
  closedAt?: string;
  /** Catatan opsional yang diisi Asprak saat menutup sesi. */
  closingNote?: string;
  participants: Participant[];
}
