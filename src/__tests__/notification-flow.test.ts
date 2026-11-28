/**
 * Script Uji Otomatis & Verifikasi Alur Notifikasi SIPRAK (YG-08)
 */

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

import { parseNotificationContent } from '../services/notification';
import {
  detectSessionOpened,
  buildSessionOpenedPayload,
  resolveSessionRecipientNims,
} from '../services/triggers/session-triggers';
import {
  detectScheduleChanged,
  buildScheduleChangedPayload,
  detectPermitDecision,
  buildPermitDecisionPayload,
} from '../services/triggers/schedule-permit-triggers';
import { isRouteAllowed } from '../utils/notification-deep-link';
import type { PracticumSession, Permit } from '../types/domain';

describe('Notification Flow and Triggers (YG-08)', () => {
  it('runs all logic tests and assertions successfully', () => {
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, testName: string) {
      if (condition) {
        passed++;
      } else {
        console.error(`✖ FAIL: ${testName}`);
        failed++;
      }
    }

    // 1. Uji parseNotificationContent
    const rawNotificationContent = {
      title: 'SIPRAK Informatika Undip',
      body: 'Sesi praktikum telah dibuka',
      data: {
        type: 'SESSION_OPENED',
        sessionId: 'session-123',
        screen: '/praktikan/session/session-123',
        params: JSON.stringify({ sessionId: 'session-123' }),
      },
    };
    const parsed = parseNotificationContent(rawNotificationContent);
    assert(parsed !== null, 'parseNotificationContent berhasil mem-parse');
    assert(parsed?.data.type === 'SESSION_OPENED', 'parseNotificationContent memetakan type');
    assert(parsed?.data.sessionId === 'session-123', 'parseNotificationContent memetakan sessionId');
    assert(parsed?.data.screen === '/praktikan/session/session-123', 'parseNotificationContent memetakan screen');
    assert(parsed?.data.params?.sessionId === 'session-123', 'parseNotificationContent mem-parse params');

    const invalidContent = { title: 'Test', data: { type: 'UNKNOWN_TYPE', screen: '/unknown' } };
    assert(parseNotificationContent(invalidContent) === null, 'parseNotificationContent menolak tipe asing');

    // 2. Uji detectSessionOpened & buildSessionOpenedPayload
    const prevSession: PracticumSession = {
      id: 'session-1',
      classId: 'class-1',
      courseName: 'Struktur Data',
      classGroup: 'Kelas A',
      room: 'Lab Komputer 3',
      dayLabel: 'Senin',
      dateLabel: '2026-03-30',
      startTime: '08:00',
      endTime: '10:00',
      asprakName: 'Budi',
      status: 'belum-dibuka',
      participants: [
        { id: 'p1', classId: 'class-1', name: 'Mhs 1', nim: '24060122120001' },
        { id: 'p2', classId: 'class-1', name: 'Mhs 2', nim: '24060122120002' },
      ],
    };
    const nextSessionOpened: PracticumSession = {
      ...prevSession,
      status: 'berlangsung',
      openedAt: '08:05',
    };
    assert(detectSessionOpened(prevSession, nextSessionOpened) === true, 'detectSessionOpened mendeteksi transisi belum-dibuka -> berlangsung');
    assert(detectSessionOpened(nextSessionOpened, nextSessionOpened) === false, 'detectSessionOpened mengabaikan sesi yang sudah berlangsung');

    const sessionPayload = buildSessionOpenedPayload(nextSessionOpened);
    assert(sessionPayload.data.type === 'SESSION_OPENED', 'buildSessionOpenedPayload type benar');
    assert(sessionPayload.body.includes('Lab Komputer 3'), 'buildSessionOpenedPayload mencantumkan ruangan laboratorium');

    // 3. Uji resolveSessionRecipientNims
    const recipientNims = resolveSessionRecipientNims(prevSession);
    assert(recipientNims.length === 2, 'resolveSessionRecipientNims menghasilkan 2 penerima');
    assert(recipientNims.includes('24060122120001'), 'resolveSessionRecipientNims mencakup NIM mahasiswa 1');
    assert(recipientNims.includes('24060122120002'), 'resolveSessionRecipientNims mencakup NIM mahasiswa 2');

    // 4. Uji detectScheduleChanged & buildScheduleChangedPayload
    const sessionRescheduled: PracticumSession = {
      ...prevSession,
      startTime: '09:00',
      endTime: '11:00',
      room: 'Lab Komputer 1',
    };
    assert(detectScheduleChanged(prevSession, sessionRescheduled) === true, 'detectScheduleChanged mendeteksi perubahan jam dan ruangan');
    assert(detectScheduleChanged(prevSession, prevSession) === false, 'detectScheduleChanged tidak mendeteksi sesi yang tidak berubah');

    const schedulePayload = buildScheduleChangedPayload(sessionRescheduled);
    assert(schedulePayload.data.type === 'SCHEDULE_CHANGED', 'buildScheduleChangedPayload type benar');

    // 5. Uji detectPermitDecision & buildPermitDecisionPayload
    const prevPermit: Permit = {
      id: 'permit-1',
      sessionId: 'session-1',
      classId: 'class-1',
      participantId: 'p1',
      participantName: 'Mhs 1',
      nim: '24060122120001',
      courseName: 'Struktur Data',
      reason: 'Sakit tipes',
      submittedAt: '2026-03-30T07:00:00Z',
      aiCategory: 'sakit',
      aiConfidence: 0.95,
      status: 'menunggu',
    };
    const nextPermitAccepted: Permit = {
      ...prevPermit,
      status: 'diterima',
    };
    assert(detectPermitDecision(prevPermit, nextPermitAccepted) === true, 'detectPermitDecision mendeteksi perubahan menunggu -> diterima');
    assert(detectPermitDecision(nextPermitAccepted, nextPermitAccepted) === false, 'detectPermitDecision tidak mendeteksi izin yang sudah diputuskan');

    const permitPayload = buildPermitDecisionPayload(nextPermitAccepted);
    assert(permitPayload.data.type === 'PERMIT_DECISION', 'buildPermitDecisionPayload type benar');
    assert(permitPayload.body.includes('Diterima'), 'buildPermitDecisionPayload menyebut status Diterima');

    // 6. Uji isRouteAllowed
    assert(isRouteAllowed('/praktikan/session/123', 'praktikan') === true, 'isRouteAllowed mengizinkan rute praktikan untuk role praktikan');
    assert(isRouteAllowed('/asprak/session/123', 'praktikan') === false, 'isRouteAllowed menolak rute asprak untuk role praktikan');
    assert(isRouteAllowed('/praktikan/session/123', 'asprak') === false, 'isRouteAllowed menolak rute praktikan untuk role asprak');
    assert(isRouteAllowed('/hacker/inject', 'praktikan') === false, 'isRouteAllowed menolak rute asing di luar allowlist');

    expect(failed).toBe(0);
    expect(passed).toBeGreaterThan(0);
  });
});
