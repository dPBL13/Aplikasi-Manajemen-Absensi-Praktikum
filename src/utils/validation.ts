import type { RegisterInput } from '@/types/auth';

// FR-23: Validasi alasan izin
export const validateReason = (reason: string): { ok: boolean; message?: string } => {
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, message: 'Alasan izin wajib diisi.' };
  if (trimmed.length < 5) return { ok: false, message: 'Alasan izin terlalu singkat (minimum 5 karakter).' };
  return { ok: true };
};



export const validateNIM = (nim: string): boolean => {
  return /^\d{14}$/.test(nim.trim());
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const DEFAULT_ASPRAK_TOKEN = process.env.EXPO_PUBLIC_ASPRAK_SECRET_TOKEN || 'ASPRAK2026';

export const validateAsprakToken = (
  token: string,
  secret: string = DEFAULT_ASPRAK_TOKEN
): boolean => {
  return token.trim() === secret.trim();
};

export interface RegistrationErrors {
  name?: string;
  email?: string;
  nim?: string;
  password?: string;
  asprakToken?: string;
}

export function validateRegistrationInput(input: RegisterInput): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Nama lengkap minimal 2 karakter.';
  }

  if (!input.email || !validateEmail(input.email)) {
    errors.email = 'Format email tidak valid.';
  }

  if (!input.nim || !validateNIM(input.nim)) {
    errors.nim = 'NIM harus berupa 14 digit angka.';
  }

  if (!input.password || !validatePassword(input.password)) {
    errors.password = 'Password minimal 6 karakter.';
  }

  if (input.role === 'asprak') {
    if (!input.asprakToken || !validateAsprakToken(input.asprakToken)) {
      errors.asprakToken = 'Token rahasia asisten tidak valid.';
    }
  }

  return errors;
}
