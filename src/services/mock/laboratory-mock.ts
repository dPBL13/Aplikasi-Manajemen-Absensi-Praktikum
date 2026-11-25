import type { Laboratory, PracticumSession } from '@/types/domain';
import {
  firstError,
  normalizeLaboratoryInput,
  sortLaboratories,
  validateLaboratoryInput,
  type LaboratoryInput,
  type LaboratoryService,
} from '../laboratory-contract';
import type { MutationResult } from '../types';

const FAIL = (reason: string): MutationResult => ({ ok: false, reason });

export interface MockLaboratoryOptions {
  seed?: Laboratory[];
  /** Dipakai untuk menolak penghapusan lab yang masih dipakai sesi aktif. */
  getSessions?: () => PracticumSession[];
  now?: () => Date;
  actor?: string;
}

/**
 * Adapter in-memory `LaboratoryService`. Aturan bisnis identik dengan adapter
 * Firestore. Factory (bukan singleton) agar tiap tes memegang state sendiri.
 */
export function createMockLaboratoryService(
  options: MockLaboratoryOptions = {},
): LaboratoryService {
  const { seed = [], getSessions = () => [], now = () => new Date(), actor = 'mock-user' } = options;

  let state: Laboratory[] = sortLaboratories(seed);
  const listeners = new Set<() => void>();
  let counter = 0;

  const commit = (next: Laboratory[]) => {
    state = sortLaboratories(next);
    listeners.forEach((listener) => listener());
  };

  const codeTaken = (code: string, exceptId?: string) =>
    state.some((lab) => lab.id !== exceptId && lab.code.toUpperCase() === code.trim().toUpperCase());

  return {
    getLaboratories: () => state,
    getLaboratoryById: (id) => state.find((lab) => lab.id === id),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async createLaboratory(input: LaboratoryInput) {
      const errors = validateLaboratoryInput(input);
      const error = firstError(errors);
      if (error) return FAIL(error);
      if (codeTaken(input.code)) return FAIL('Kode laboratorium sudah dipakai.');

      counter += 1;
      const id = `lab-mock-${counter}`;
      const lab: Laboratory = {
        id,
        ...normalizeLaboratoryInput(input),
        capacity: input.capacity,
        description: input.description?.trim() || undefined,
        updatedAt: now().toISOString(),
        updatedBy: actor,
      };
      commit([...state, lab]);
      return { ok: true, id };
    },

    async updateLaboratory(id, input) {
      const existing = state.find((lab) => lab.id === id);
      if (!existing) return FAIL('Laboratorium tidak ditemukan.');

      const error = firstError(validateLaboratoryInput(input));
      if (error) return FAIL(error);
      if (codeTaken(input.code, id)) return FAIL('Kode laboratorium sudah dipakai.');

      const updated: Laboratory = {
        ...existing,
        ...normalizeLaboratoryInput(input),
        capacity: input.capacity,
        description: input.description?.trim() || undefined,
        updatedAt: now().toISOString(),
        updatedBy: actor,
      };
      commit(state.map((lab) => (lab.id === id ? updated : lab)));
      return { ok: true };
    },

    async deleteLaboratory(id) {
      if (!state.some((lab) => lab.id === id)) return FAIL('Laboratorium tidak ditemukan.');

      const inUse = getSessions().some(
        (session) => session.laboratoryId === id && session.status !== 'selesai',
      );
      if (inUse) {
        return FAIL('Laboratorium masih dipakai sesi yang belum selesai.');
      }

      commit(state.filter((lab) => lab.id !== id));
      return { ok: true };
    },
  };
}
