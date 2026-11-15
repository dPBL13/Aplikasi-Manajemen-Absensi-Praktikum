import type { ClassInput, FieldErrors, ParticipantInput, SessionInput } from './types';

/**
 * Validasi form (FR-23 dipakai bersama). Fungsi murni, tanpa dependency UI —
 * bisa dipakai adapter mock maupun Firestore, dan mudah diuji.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function required(value: string, message: string) {
  return value.trim().length === 0 ? message : undefined;
}

export function validateClassInput(input: ClassInput): FieldErrors {
  const errors: FieldErrors = {};
  const courseName = required(input.courseName, 'Nama praktikum wajib diisi.');
  const code = required(input.code, 'Kode kelas wajib diisi.');
  const classGroup = required(input.classGroup, 'Kelompok kelas wajib diisi.');
  const room = required(input.room, 'Ruang wajib diisi.');

  if (courseName) errors.courseName = courseName;
  if (code) errors.code = code;
  else if (input.code.trim().length < 3) errors.code = 'Kode kelas minimal 3 karakter.';
  if (classGroup) errors.classGroup = classGroup;
  if (room) errors.room = room;

  return errors;
}

export function validateParticipantInput(input: ParticipantInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = required(input.name, 'Nama peserta wajib diisi.');
  const nim = required(input.nim, 'NIM wajib diisi.');

  if (name) errors.name = name;
  if (nim) errors.nim = nim;
  else if (!/^\d{8,15}$/.test(input.nim.trim())) {
    errors.nim = 'NIM harus berupa 8–15 digit angka.';
  }

  return errors;
}

export function validateSessionInput(input: SessionInput): FieldErrors {
  const errors: FieldErrors = {};
  const dayLabel = required(input.dayLabel, 'Hari wajib diisi.');
  const dateLabel = required(input.dateLabel, 'Tanggal wajib diisi.');
  const startTime = required(input.startTime, 'Jam mulai wajib diisi.');
  const endTime = required(input.endTime, 'Jam selesai wajib diisi.');

  if (!input.classId) errors.classId = 'Pilih kelas praktikum.';
  if (dayLabel) errors.dayLabel = dayLabel;
  if (dateLabel) errors.dateLabel = dateLabel;

  if (startTime) errors.startTime = startTime;
  else if (!TIME_PATTERN.test(input.startTime.trim())) {
    errors.startTime = 'Format jam harus HH:MM, contoh 08:00.';
  }

  if (endTime) errors.endTime = endTime;
  else if (!TIME_PATTERN.test(input.endTime.trim())) {
    errors.endTime = 'Format jam harus HH:MM, contoh 10:00.';
  }

  if (
    !errors.startTime &&
    !errors.endTime &&
    input.endTime.trim() <= input.startTime.trim()
  ) {
    errors.endTime = 'Jam selesai harus lebih lambat dari jam mulai.';
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
