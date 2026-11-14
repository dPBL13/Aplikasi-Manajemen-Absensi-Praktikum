import type { PermitCategory, PermitStatus, SessionStatus } from '@/types/domain';

/**
 * Label teks semua enum domain. Ubah teks UI di sini, bukan di layar.
 */

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  'belum-dibuka': 'Belum Dibuka',
  berlangsung: 'Sedang Berlangsung',
  selesai: 'Selesai',
};

export const PERMIT_STATUS_LABEL: Record<PermitStatus, string> = {
  menunggu: 'Menunggu',
  diterima: 'Diterima',
  ditolak: 'Ditolak',
};

export const PERMIT_CATEGORY_LABEL: Record<PermitCategory, string> = {
  sakit: 'Sakit',
  'acara-kampus': 'Acara Kampus',
  keluarga: 'Keluarga',
  lainnya: 'Lainnya',
  'belum-diklasifikasi': 'Belum Diklasifikasi',
};
