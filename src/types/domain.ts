/**
 * KANONIKAL DOMAIN MODEL — satu-satunya sumber tipe data aplikasi.
 *
 * Aturan:
 * - Semua layar dan service WAJIB memakai tipe dari file ini.
 * - Jangan membuat tipe duplikat di folder fitur.
 * - Nama field memakai bahasa Inggris, nilai enum memakai bahasa Indonesia
 *   agar konsisten dengan teks UI.
 *
 * Detail arsitektur & panduan integrasi: lihat AI_CONTEXT.md di root repo.
 */

/** Status sesi praktikum. Urutan alur: belum-dibuka -> berlangsung -> selesai. */
export type SessionStatus = 'belum-dibuka' | 'berlangsung' | 'selesai';

/** Status pengajuan izin praktikan. */
export type PermitStatus = 'menunggu' | 'diterima' | 'ditolak';

/**
 * Kategori hasil klasifikasi AI untuk alasan izin.
 * `belum-diklasifikasi` dipakai bila API AI belum dipanggil / gagal.
 */
export type PermitCategory =
  | 'sakit'
  | 'acara-kampus'
  | 'keluarga'
  | 'lainnya'
  | 'belum-diklasifikasi';

/** Kelas praktikum (FR-05). Satu kelas punya satu jadwal tetap + satu daftar peserta. */
export interface PracticumClass {
  id: string;
  /** Nama mata kuliah/praktikum, contoh: "Praktikum Pemrograman Mobile". */
  courseName: string;
  /** Kode kelas/mata kuliah, contoh: "IF-301". */
  code: string;
  /** Kelompok kelas, contoh: "Kelas A". */
  classGroup: string;
  /** Ruang default kelas, contoh: "Lab Komputer 3". */
  room: string;
  /** Nama asisten praktikum penanggung jawab. */
  asprakName: string;
  description?: string;
  /** ISO date string, contoh: "2026-10-20T09:00:00.000Z". */
  createdAt: string;
  /** Daftar peserta terdaftar (FR-06). */
  participants: Participant[];
}

/** Peserta terdaftar pada sebuah kelas (FR-06). */
export interface Participant {
  id: string;
  classId: string;
  name: string;
  nim: string;
}

/**
 * Peserta pada konteks satu sesi. `checkInAt` adalah catatan presensi
 * (null/undefined = belum hadir) — inilah data yang dipakai FR-12 & FR-13.
 */
export interface SessionParticipant extends Participant {
  /** Jam presensi format 24 jam, contoh: "08:12". */
  checkInAt?: string;
}

/** Sesi praktikum (FR-07, FR-08). */
export interface PracticumSession {
  id: string;
  /** Relasi ke PracticumClass.id. */
  classId: string;
  /** Denormalisasi dari kelas agar daftar sesi tidak perlu join. */
  courseName: string;
  classGroup: string;
  room: string;
  dayLabel: string;
  /** Tanggal yang sudah diformat untuk UI, contoh: "26 Oktober 2026". */
  dateLabel: string;
  /** Jam mulai "HH:MM". */
  startTime: string;
  /** Jam selesai "HH:MM". */
  endTime: string;
  asprakName: string;
  status: SessionStatus;
  openedAt?: string;
  closedAt?: string;
  closingNote?: string;
  /** Salinan daftar peserta kelas + jam presensi pada sesi ini. */
  participants: SessionParticipant[];
}

/** Pengajuan izin praktikan + hasil klasifikasi AI (FR-16 – FR-21). */
export interface Permit {
  id: string;
  sessionId: string;
  classId: string;
  participantId: string;
  participantName: string;
  nim: string;
  courseName: string;
  /** Alasan ketidakhadiran yang ditulis praktikan. */
  reason: string;
  /** ISO date string. */
  submittedAt: string;
  /** Hasil klasifikasi API AI (FR-17/FR-18, milik modul Backend). */
  aiCategory: PermitCategory;
  /** Nilai 0–1, null bila belum diklasifikasi. */
  aiConfidence: number | null;
  /** Nama model AI yang dipakai, contoh: "llm-classifier-v1". */
  aiModel?: string;
  status: PermitStatus;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
}

/** Bentuk state global yang dibaca UI (lihat src/services). */
export interface AppData {
  classes: PracticumClass[];
  sessions: PracticumSession[];
  permits: Permit[];
}
