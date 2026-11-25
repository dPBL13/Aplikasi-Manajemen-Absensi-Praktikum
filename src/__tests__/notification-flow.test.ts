import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { devicePermissionService, mapPermissionResponse } from '@/services/device-permission';
import {
  extractNotificationContent,
  notificationService,
  parseNotificationContent,
} from '@/services/notification';
import {
  buildPermitDecisionPayload,
  buildScheduleChangedPayload,
  detectPermitDecision,
  detectScheduleChanged,
} from '@/services/triggers/schedule-permit-triggers';
import {
  PRESENSI_ROUTE,
  buildSessionOpenedPayload,
  detectSessionOpened,
  resolveSessionRecipientNims,
} from '@/services/triggers/session-triggers';
import type { Permit, PracticumSession } from '@/types/domain';
import {
  consumePendingNavigation,
  handleNotificationRoute,
  isRouteAllowed,
  safeSessionRoute,
} from '@/utils/notification-deep-link';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));
jest.mock('expo-location', () => ({}));
jest.mock('expo-camera', () => ({}));
jest.mock('@/services/notification', () => ({
  ...jest.requireActual<typeof import('@/services/notification')>('@/services/notification'),
  notificationService: { initialize: jest.fn(async () => ({ ok: true })) },
}));

const baseSession: PracticumSession = {
  id: 'sess-1',
  classId: 'cls-1',
  courseName: 'Praktikum Mobile',
  classGroup: 'Kelas A',
  room: 'Lab Komputer 3',
  dayLabel: 'Senin',
  dateLabel: '24 November 2026',
  startTime: '08:00',
  endTime: '10:00',
  asprakName: 'Johan',
  status: 'belum-dibuka',
  participants: [
    { id: 'p1', classId: 'cls-1', name: 'Budi', nim: '24060120120001' },
    { id: 'p2', classId: 'cls-1', name: 'Siti', nim: '24060120120002' },
    { id: 'p3', classId: 'cls-1', name: 'Dobel', nim: '24060120120002' },
  ],
};
const openedSession: PracticumSession = { ...baseSession, status: 'berlangsung' };

const basePermit: Permit = {
  id: 'prm-1',
  sessionId: 'sess-1',
  classId: 'cls-1',
  participantId: 'p1',
  participantName: 'Budi',
  nim: '24060120120001',
  courseName: 'Praktikum Mobile',
  reason: 'Sakit flu',
  submittedAt: '2026-11-24T07:00:00.000Z',
  aiCategory: 'sakit',
  aiConfidence: 0.95,
  status: 'menunggu',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('parseNotificationContent & extractNotificationContent', () => {
  const raw = {
    title: 'SIPRAK Informatika Undip',
    body: 'Sesi dibuka',
    data: {
      type: 'SESSION_OPENED',
      sessionId: 'sess-1',
      screen: '/praktikan/presensi/sess-1',
      params: JSON.stringify({ sessionId: 'sess-1' }),
    },
  };

  it('mem-parse payload SIPRAK dan mendeserialisasi params JSON', () => {
    const parsed = parseNotificationContent(raw);
    expect(parsed?.data.type).toBe('SESSION_OPENED');
    expect(parsed?.data.params?.sessionId).toBe('sess-1');
  });

  it('menolak notifikasi yang bukan milik SIPRAK', () => {
    expect(parseNotificationContent({ title: 'x', body: 'y', data: { foo: 'bar' } })).toBeNull();
  });

  it('membaca data dari trigger.remoteMessage bila content.data kosong', () => {
    const content = extractNotificationContent({
      content: { title: null, body: null, data: {} },
      trigger: { remoteMessage: { data: raw.data, notification: { title: 'T', body: 'B' } } },
    });
    expect(content.data).toEqual(raw.data);
    expect(content.title).toBe('T');
    expect(parseNotificationContent(content)?.data.screen).toBe('/praktikan/presensi/sess-1');
  });
});

describe('trigger sesi (YG-04)', () => {
  it('mendeteksi belum-dibuka -> berlangsung saja', () => {
    expect(detectSessionOpened(baseSession, openedSession)).toBe(true);
    expect(detectSessionOpened(openedSession, openedSession)).toBe(false);
    expect(detectSessionOpened(undefined, openedSession)).toBe(false);
  });

  it('payload memuat teks FR-32 dan rute presensi', () => {
    const payload = buildSessionOpenedPayload(openedSession);
    expect(payload.body).toBe(
      'Sesi Praktikum Telah Dibuka: Praktikum Mobile (Kelas A). Segera lakukan presensi di Lab Komputer 3!',
    );
    expect(payload.data.screen).toBe(`${PRESENSI_ROUTE}/sess-1`);
  });

  it('penerima = NIM unik peserta kelas (BR-07)', () => {
    expect(resolveSessionRecipientNims(openedSession)).toEqual(['24060120120001', '24060120120002']);
  });
});

describe('trigger jadwal & izin (YG-05)', () => {
  it('mendeteksi perubahan jadwal, mengabaikan sesi baru dan tanpa perubahan', () => {
    expect(detectScheduleChanged(baseSession, { ...baseSession, startTime: '09:00' })).toBe(true);
    expect(detectScheduleChanged(baseSession, { ...baseSession, room: 'Lab 5' })).toBe(true);
    expect(detectScheduleChanged(baseSession, baseSession)).toBe(false);
    expect(detectScheduleChanged(undefined, baseSession)).toBe(false);
  });

  it('payload jadwal mengarah ke detail sesi', () => {
    const payload = buildScheduleChangedPayload(baseSession);
    expect(payload.data.type).toBe('SCHEDULE_CHANGED');
    expect(payload.data.screen).toBe('/praktikan/session/sess-1');
  });

  it('mendeteksi keputusan izin menunggu -> diterima/ditolak saja', () => {
    expect(detectPermitDecision(basePermit, { ...basePermit, status: 'diterima' })).toBe(true);
    expect(detectPermitDecision(basePermit, { ...basePermit, status: 'ditolak' })).toBe(true);
    expect(detectPermitDecision({ ...basePermit, status: 'diterima' }, { ...basePermit, status: 'diterima' })).toBe(false);
    expect(detectPermitDecision(undefined, basePermit)).toBe(false);
  });

  it('payload izin menyebut status dan mengarah ke riwayat', () => {
    const payload = buildPermitDecisionPayload({ ...basePermit, status: 'ditolak' });
    expect(payload.body).toContain('Ditolak');
    expect(payload.data.screen).toBe('/praktikan/riwayat');
    expect(payload.data.permitId).toBe('prm-1');
  });
});

describe('deep link (YG-07)', () => {
  it('allow-list dan pemisahan role', () => {
    expect(isRouteAllowed('/praktikan/session/1', 'praktikan')).toBe(true);
    expect(isRouteAllowed('/asprak/session/1', 'praktikan')).toBe(false);
    expect(isRouteAllowed('/praktikan/session/1', 'asprak')).toBe(false);
    expect(isRouteAllowed('/hacker/inject', 'praktikan')).toBe(false);
    expect(isRouteAllowed('/praktikan/../asprak/x', 'praktikan')).toBe(false);
  });

  it('safeSessionRoute menolak id berbahaya', () => {
    expect(safeSessionRoute('abc_123-X')).toBe('/praktikan/session/abc_123-X');
    expect(safeSessionRoute('../asprak')).toBeNull();
    expect(safeSessionRoute(undefined)).toBeNull();
  });

  it('menyimpan rute saat role belum siap, lalu menjalankannya setelah login', () => {
    const payload = buildSessionOpenedPayload(openedSession);
    expect(handleNotificationRoute(payload, null)).toBe(false);
    expect(router.push).not.toHaveBeenCalled();

    consumePendingNavigation('praktikan');
    expect(router.push).toHaveBeenCalledWith(payload.data.screen);
  });

  it('rute dari luar allow-list memakai fallback detail sesi', () => {
    const payload = buildSessionOpenedPayload(openedSession);
    payload.data.screen = '/hacker/inject';
    expect(handleNotificationRoute(payload, 'praktikan')).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/praktikan/session/sess-1');
  });
});

describe('izin perangkat (YG-02)', () => {
  it('memetakan respons izin ke PermissionState', () => {
    expect(mapPermissionResponse({ status: 'granted', granted: true, canAskAgain: true })).toBe('granted');
    expect(mapPermissionResponse({ status: 'undetermined', granted: false, canAskAgain: true })).toBe('undetermined');
    expect(mapPermissionResponse({ status: 'denied', granted: false, canAskAgain: true })).toBe('denied');
    expect(mapPermissionResponse({ status: 'denied', granted: false, canAskAgain: false })).toBe('blocked');
  });

  it('requestNotification menyiapkan kanal SEBELUM dialog izin OS', async () => {
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
    } as never);

    const state = await devicePermissionService.requestNotification();

    const initOrder = jest.mocked(notificationService.initialize).mock.invocationCallOrder[0];
    const requestOrder = jest.mocked(Notifications.requestPermissionsAsync).mock.invocationCallOrder[0];
    expect(state).toBe('granted');
    expect(initOrder).toBeLessThan(requestOrder);
  });
});