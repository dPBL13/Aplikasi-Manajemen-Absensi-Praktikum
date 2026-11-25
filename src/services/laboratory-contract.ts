import type { FieldErrors, MutationResult } from './types';
import type { Laboratory } from '@/types/domain';

/**
 * Kontrak + validasi murni layanan laboratorium (JH-01).
 * Dipisah dari `laboratory.ts` agar bebas dependency Firebase/Expo dan mudah
 * diuji. Selalu impor lewat `@/services/laboratory`, bukan file ini.
 */

/** BR-06 */
export const LAB_RADIUS_MIN = 15;
export const LAB_RADIUS_MAX = 200;
export const LAB_RADIUS_DEFAULT = 50;

export interface LaboratoryInput {
  name: string;
  code: string;
  building: string;
  latitude: number;
  longitude: number;
  radius: number;
  capacity?: number;
  description?: string;
}

export interface LaboratoryService {
  /** Snapshot stabil (objek sama) sampai ada perubahan — syarat useSyncExternalStore. */
  getLaboratories(): Laboratory[];
  getLaboratoryById(id: string): Laboratory | undefined;
  subscribe(listener: () => void): () => void;

  createLaboratory(input: LaboratoryInput): Promise<MutationResult & { id?: string }>;
  updateLaboratory(id: string, input: LaboratoryInput): Promise<MutationResult>;
  deleteLaboratory(id: string): Promise<MutationResult>;
}

/** Ambil pesan error pertama untuk dikembalikan sebagai `MutationResult`. */
export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors).find((message) => message.length > 0);
}

/** Validasi form lab (FR-29, BR-06). Pesan berbahasa Indonesia siap tampil. */
export function validateLaboratoryInput(input: LaboratoryInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name.trim()) errors.name = 'Nama laboratorium wajib diisi.';

  if (!input.code.trim()) errors.code = 'Kode laboratorium wajib diisi.';
  else if (input.code.trim().length < 3) errors.code = 'Kode laboratorium minimal 3 karakter.';

  if (!input.building.trim()) errors.building = 'Gedung/lantai wajib diisi.';

  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) {
    errors.latitude = 'Latitude harus berupa angka antara -90 dan 90.';
  }
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) {
    errors.longitude = 'Longitude harus berupa angka antara -180 dan 180.';
  }

  if (
    !Number.isFinite(input.radius) ||
    input.radius < LAB_RADIUS_MIN ||
    input.radius > LAB_RADIUS_MAX
  ) {
    errors.radius = `Radius harus antara ${LAB_RADIUS_MIN} dan ${LAB_RADIUS_MAX} meter.`;
  }

  if (
    input.capacity !== undefined &&
    (!Number.isInteger(input.capacity) || input.capacity <= 0)
  ) {
    errors.capacity = 'Kapasitas harus berupa bilangan bulat positif.';
  }

  return errors;
}

/** Urutan tampilan stabil: berdasarkan kode lab. */
export function sortLaboratories(labs: Laboratory[]): Laboratory[] {
  return [...labs].sort((a, b) => a.code.localeCompare(b.code));
}

/** Normalisasi input menjadi field dokumen (trim, kode huruf besar, buang undefined). */
export function normalizeLaboratoryInput(input: LaboratoryInput) {
  return {
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    building: input.building.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    radius: Math.round(input.radius),
    capacity: input.capacity ?? null,
    description: input.description?.trim() || null,
  };
}
