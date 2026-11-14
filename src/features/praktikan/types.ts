import type { Participant, PracticumSession, SessionStatus } from '@/types/session';

export type { Participant, PracticumSession, SessionStatus };

/**
 * Status presensi praktikan pada suatu sesi.
 */
export type AttendanceStatus = 'hadir' | 'belum-hadir' | 'izin';

/**
 * Catatan riwayat presensi pribadi praktikan (FR-14).
 */
export interface AttendanceRecord {
  id: string;
  sessionId: string;
  sessionTitle: string;
  courseName: string;
  classGroup: string;
  room: string;
  dateLabel: string;
  timeLabel: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  status: AttendanceStatus;
  checkInAt?: string; // Format jam, contoh: "08:15"
  notes?: string;
}

/**
 * Status pengajuan izin praktikan (FR-21).
 * Nilai baku: 'menunggu' | 'diterima' | 'ditolak'.
 */
export type LeaveStatus = 'menunggu' | 'diterima' | 'ditolak';

/**
 * Tingkat urgensi hasil analisa AI.
 */
export type AIUrgency = 'rendah' | 'sedang' | 'tinggi';

/**
 * Hasil klasifikasi AI sebagai INFORMASI PENDUKUNG untuk Asisten (FR-21).
 * Kategori izin ditentukan oleh AI dan keputusan akhir mutlak berada di tangan Asisten Praktikum.
 */
export interface AIClassification {
  predictedCategory: string;
  confidence: number; // Skala 0.0 sampai 1.0 (contoh: 0.92 = 92%)
  summary: string;
  urgency: AIUrgency;
  disclaimer: string;
}

/**
 * Entitas pengajuan izin praktikan (FR-16 & FR-21).
 * Kategori izin berasal dari hasil klasifikasi AI (aiClassification.predictedCategory).
 */
export interface LeaveRequest {
  id: string;
  sessionId: string;
  sessionTitle: string;
  courseName: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  reason: string;
  notes?: string;
  submittedAt: string; // Contoh: "14 Nov 2026, 08:30"
  status: LeaveStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNote?: string;
  aiClassification: AIClassification;
}

/**
 * Payload input untuk mengajukan izin (FR-16).
 * Praktikan hanya mengisi alasan (wajib) dan catatan tambahan (opsional).
 */
export interface LeaveInput {
  sessionId: string;
  reason: string;
  notes?: string;
}

/**
 * Profil praktikan yang sedang login.
 */
export interface PraktikanUser {
  id: string;
  nim: string;
  name: string;
  email?: string;
  classGroup?: string;
}

/**
 * Hasil respons presensi (check-in) praktikan (FR-10, FR-11).
 */
export type CheckInResponse =
  | { ok: true; message: string; timestamp: string }
  | { ok: false; message: string; reason?: string };

/**
 * Hasil respons pengajuan izin praktikan (FR-16).
 */
export type LeaveSubmitResponse =
  | { ok: true; message: string; leave: LeaveRequest }
  | { ok: false; message: string; error?: string };
