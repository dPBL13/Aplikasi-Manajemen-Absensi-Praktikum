import { describe, expect, it, jest } from '@jest/globals';

import { seedLaboratories } from '@/data/seed-labs';
import { getLabActivity, sessionBelongsToLab } from '@/services/lab-activity-selectors';
import {
  LAB_RADIUS_DEFAULT,
  LAB_RADIUS_MAX,
  LAB_RADIUS_MIN,
  validateLaboratoryInput,
  type LaboratoryInput,
} from '@/services/laboratory-contract';
import { createMockLaboratoryService } from '@/services/mock/laboratory-mock';
import type { Laboratory, PracticumSession } from '@/types/domain';

const valid: LaboratoryInput = {
  name: 'Laboratorium Uji',
  code: 'LAB-UJI',
  building: 'Gedung E Lantai 1',
  latitude: -7.0498,
  longitude: 110.4391,
  radius: LAB_RADIUS_DEFAULT,
};

describe('validateLaboratoryInput (BR-06)', () => {
  it('input valid tidak menghasilkan error', () => {
    expect(validateLaboratoryInput(valid)).toEqual({});
  });

  it('radius dibatasi 15–200 m', () => {
    expect(validateLaboratoryInput({ ...valid, radius: LAB_RADIUS_MIN }).radius).toBeUndefined();
    expect(validateLaboratoryInput({ ...valid, radius: LAB_RADIUS_MAX }).radius).toBeUndefined();
    expect(validateLaboratoryInput({ ...valid, radius: LAB_RADIUS_MIN - 1 }).radius).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, radius: LAB_RADIUS_MAX + 1 }).radius).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, radius: Number.NaN }).radius).toBeDefined();
  });

  it('koordinat harus berada di rentang WGS84', () => {
    expect(validateLaboratoryInput({ ...valid, latitude: 91 }).latitude).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, longitude: -181 }).longitude).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, latitude: Number.NaN }).latitude).toBeDefined();
  });

  it('field wajib & kapasitas', () => {
    const errors = validateLaboratoryInput({ ...valid, name: ' ', code: 'ab', building: '' });
    expect(errors.name).toBeDefined();
    expect(errors.code).toBeDefined();
    expect(errors.building).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, capacity: 0 }).capacity).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, capacity: 2.5 }).capacity).toBeDefined();
    expect(validateLaboratoryInput({ ...valid, capacity: 30 }).capacity).toBeUndefined();
  });
});

describe('mock LaboratoryService (JH-01)', () => {
  const make = (sessions: PracticumSession[] = []) =>
    createMockLaboratoryService({
      seed: seedLaboratories,
      getSessions: () => sessions,
      now: () => new Date('2026-11-24T08:00:00.000Z'),
      actor: 'tester',
    });

  it('membaca seed terurut menurut kode dan mencari berdasarkan id', () => {
    const service = make();
    const codes = service.getLaboratories().map((lab) => lab.code);
    expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b)));
    expect(service.getLaboratoryById('lab-rpl')?.code).toBe('LAB-RPL');
    expect(service.getLaboratoryById('tidak-ada')).toBeUndefined();
  });

  it('create: menyimpan, mengisi audit, menormalkan kode, dan memberi tahu subscriber', async () => {
    const service = make();
    const listener = jest.fn();
    service.subscribe(listener);

    const result = await service.createLaboratory({ ...valid, code: 'lab-uji', name: '  Lab Uji ' });
    expect(result.ok).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    const created = service.getLaboratoryById((result as { id: string }).id)!;
    expect(created.code).toBe('LAB-UJI');
    expect(created.name).toBe('Lab Uji');
    expect(created.updatedBy).toBe('tester');
    expect(created.updatedAt).toBe('2026-11-24T08:00:00.000Z');
  });

  it('create: menolak kode duplikat tanpa memandang huruf besar/kecil', async () => {
    const service = make();
    const result = await service.createLaboratory({ ...valid, code: 'lab-rpl' });
    expect(result).toEqual({ ok: false, reason: 'Kode laboratorium sudah dipakai.' });
  });

  it('create/update: menolak input tidak valid dengan pesan Indonesia', async () => {
    const service = make();
    const bad = await service.createLaboratory({ ...valid, radius: 500 });
    expect(bad.ok).toBe(false);
    const upd = await service.updateLaboratory('lab-rpl', { ...valid, code: 'LAB-RPL', radius: 5 });
    expect(upd.ok).toBe(false);
  });

  it('getLaboratories() stabil antar-pembacaan tanpa mutasi (syarat useSyncExternalStore)', () => {
    const service = make();
    expect(service.getLaboratories()).toBe(service.getLaboratories());
  });

  it('update: mengubah koordinat & radius, kode boleh tetap sama milik sendiri', async () => {
    const service = make();
    const before = service.getLaboratoryById('lab-rpl')!;
    const result = await service.updateLaboratory('lab-rpl', {
      ...valid,
      code: before.code,
      latitude: -7.05,
      radius: 75,
    });
    expect(result.ok).toBe(true);
    const after = service.getLaboratoryById('lab-rpl')!;
    expect(after.latitude).toBe(-7.05);
    expect(after.radius).toBe(75);
    expect(after.updatedBy).toBe('tester');
  });

  it('update: id tidak ada → gagal', async () => {
    const result = await make().updateLaboratory('x', valid);
    expect(result).toEqual({ ok: false, reason: 'Laboratorium tidak ditemukan.' });
  });

  it('delete: ditolak bila masih dipakai sesi belum selesai, boleh bila sudah selesai', async () => {
    const base = { laboratoryId: 'lab-rpl' } as PracticumSession;
    const blocked = make([{ ...base, status: 'berlangsung' } as PracticumSession]);
    expect((await blocked.deleteLaboratory('lab-rpl')).ok).toBe(false);

    const allowed = make([{ ...base, status: 'selesai' } as PracticumSession]);
    expect((await allowed.deleteLaboratory('lab-rpl')).ok).toBe(true);
    expect(allowed.getLaboratoryById('lab-rpl')).toBeUndefined();
  });

  it('unsubscribe menghentikan notifikasi', async () => {
    const service = make();
    const listener = jest.fn();
    const off = service.subscribe(listener);
    off();
    await service.deleteLaboratory('lab-rpl');
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('lab-activity (JH-06, FR-31)', () => {
  const lab = seedLaboratories.find((l) => l.id === 'lab-rpl') as Laboratory;
  const other = seedLaboratories.find((l) => l.id === 'lab-aim') as Laboratory;

  const session = (over: Partial<PracticumSession>): PracticumSession => ({
    id: 's',
    classId: 'c',
    courseName: 'PPK',
    classGroup: 'A',
    room: 'Lab RPL',
    dayLabel: 'Selasa',
    dateLabel: '24 November 2026',
    startTime: '10:00',
    endTime: '12:00',
    asprakName: 'Asprak',
    status: 'belum-dibuka',
    participants: [],
    ...over,
  });

  // 24 Nov 2026 09:00 waktu lokal perangkat uji
  const now = new Date(2026, 10, 24, 9, 0, 0);

  it('laboratoryId eksplisit menang atas teks room', () => {
    expect(sessionBelongsToLab(session({ laboratoryId: 'lab-rpl', room: 'Lab AI' }), lab)).toBe(true);
    expect(sessionBelongsToLab(session({ laboratoryId: 'lab-aim', room: 'Lab RPL' }), lab)).toBe(false);
  });

  it('fallback ke teks room untuk sesi lama tanpa laboratoryId', () => {
    expect(sessionBelongsToLab(session({ room: 'Lab RPL (Gedung E)' }), lab)).toBe(true);
    expect(sessionBelongsToLab(session({ room: 'LAB-RPL' }), lab)).toBe(true);
    expect(sessionBelongsToLab(session({ room: 'Lab Komputer 3' }), lab)).toBe(false);
    expect(sessionBelongsToLab(session({ room: '' }), lab)).toBe(false);
  });

  it('ongoing = sesi berlangsung di lab ini saja', () => {
    const sessions = [
      session({ id: 'a', status: 'berlangsung' }),
      session({ id: 'b', status: 'berlangsung', laboratoryId: 'lab-aim' }),
      session({ id: 'c', status: 'selesai' }),
    ];
    expect(getLabActivity(sessions, lab, now).ongoing.map((s) => s.id)).toEqual(['a']);
    expect(getLabActivity(sessions, other, now).ongoing.map((s) => s.id)).toEqual(['b']);
  });

  it('next = sesi terdekat hari ini yang mulai setelah sekarang', () => {
    const sessions = [
      session({ id: 'late', startTime: '14:00' }),
      session({ id: 'soon', startTime: '10:00' }),
      session({ id: 'past', startTime: '08:00' }),
      session({ id: 'tomorrow', dateLabel: '25 November 2026', startTime: '07:00' }),
      session({ id: 'opened', startTime: '09:30', status: 'selesai' }),
    ];
    expect(getLabActivity(sessions, lab, now).next?.id).toBe('soon');
  });

  it('tidak ada aktivitas → ongoing kosong, next null', () => {
    expect(getLabActivity([], lab, now)).toEqual({ ongoing: [], next: null });
  });

  it('format tanggal/jam rusak diabaikan tanpa error', () => {
    const sessions = [session({ id: 'x', dateLabel: 'bukan tanggal' })];
    expect(getLabActivity(sessions, lab, now).next).toBeNull();
  });
});
