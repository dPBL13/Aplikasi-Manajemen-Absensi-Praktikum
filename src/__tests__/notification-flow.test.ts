/**
 * Script Uji Otomatis & Verifikasi Alur Notifikasi SIPRAK (YG-08)
 *
 * Menguji logika murni:
 * 1. parseNotificationContent (payload parsing)
 * 2. detectSessionOpened & buildSessionOpenedPayload (FR-32, BR-07)
 * 3. detectScheduleChanged & buildScheduleChangedPayload (FR-32)
 * 4. detectPermitDecision & buildPermitDecisionPayload (FR-32, BR-08)
 * 5. resolveSessionRecipientNims (BR-07)
 * 6. isRouteAllowed (Deep link route security whitelist)
 *
 * Jalankan dengan:
 * npx tsx src/__tests__/notification-flow.test.ts
 */

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

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`\x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    failed++;
  }
}

console.log('=== MENJALANKAN PENGUJIAN LOGIKA NOTIFIKASI SIPRAK (YG-08) ===\n');

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
assert(parsed !== null, 'parseNotificationContent berhasil mem-parse data');
assert(parsed?.data.type === 'SESSION_OPENED', 'parseNotificationContent type cocok');
assert(parsed?.data.sessionId === 'session-123', 'parseNotificationContent sessionId cocok');
assert(parsed?.data.params?.sessionId === 'session-123', 'parseNotificationContent deserialisasi string JSON berhasil');

// 2. Uji detectSessionOpened & buildSessionOpenedPayload
const prevSession: PracticumSession = {
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
  ],
};
const nextSessionOpened: PracticumSession = {
  ...prevSession,
  status: 'berlangsung',
};

assert(detectSessionOpened(prevSession, nextSessionOpened) === true, 'detectSessionOpened mendeteksi transisi belum-dibuka -> berlangsung');
assert(detectSessionOpened(nextSessionOpened, nextSessionOpened) === false, 'detectSessionOpened mengabaikan sesi yang sudah berlangsung');

const sessionPayload = buildSessionOpenedPayload(nextSessionOpened);
assert(sessionPayload.data.type === 'SESSION_OPENED', 'buildSessionOpenedPayload type benar');
assert(sessionPayload.body.includes('Lab Komputer 3'), 'buildSessionOpenedPayload mencantumkan ruangan laboratorium');

// 3. Uji resolveSessionRecipientNims
const nims = resolveSessionRecipientNims(nextSessionOpened);
assert(nims.length === 2 && nims.includes('24060120120001') && nims.includes('24060120120002'), 'resolveSessionRecipientNims mengumpulkan semua NIM unik peserta (BR-07)');

// 4. Uji detectScheduleChanged
const sessionScheduleChanged: PracticumSession = {
  ...prevSession,
  startTime: '09:00',
};
assert(detectScheduleChanged(prevSession, sessionScheduleChanged) === true, 'detectScheduleChanged mendeteksi perubahan jam');
assert(detectScheduleChanged(prevSession, prevSession) === false, 'detectScheduleChanged tidak trigger bila tidak ada perubahan');

const schedulePayload = buildScheduleChangedPayload(sessionScheduleChanged);
assert(schedulePayload.data.type === 'SCHEDULE_CHANGED', 'buildScheduleChangedPayload type benar');

// 5. Uji detectPermitDecision & buildPermitDecisionPayload
const prevPermit: Permit = {
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

console.log(`\n================================`);
console.log(`Hasil Pengujian: ${passed} PASS, ${failed} FAIL`);
console.log(`================================`);

if (failed > 0) {
  process.exit(1);
}
