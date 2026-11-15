import { commit, createId, getSnapshot, subscribe } from './store';

import { CURRENT_ASPRAK_NAME } from '@/data/current-user';
import type { PracticumClass, PracticumSession, SessionParticipant } from '@/types/domain';
import { formatClock } from '@/utils/format-clock';
import type { ClassInput, DataService, MutationResult, SessionInput } from '../types';
import {
  hasErrors,
  validateClassInput,
  validateParticipantInput,
  validateSessionInput,
} from '../validation';

/**
 * Adapter MOCK dari `DataService`.
 *
 * Semua aturan bisnis sisi data ada di sini supaya layar tetap tipis.
 * Adapter Firestore nanti wajib meniru perilaku & pesan alasan yang sama.
 */

const FAIL = (reason: string): MutationResult => ({ ok: false, reason });

const toSessionParticipants = (practicumClass: PracticumClass): SessionParticipant[] =>
  practicumClass.participants.map((participant) => ({ ...participant }));

export const mockDataService: DataService = {
  getData: getSnapshot,
  subscribeData: subscribe,

  async createClass(input: ClassInput) {
    const errors = validateClassInput(input);

    if (hasErrors(errors)) {
      return FAIL(Object.values(errors)[0]);
    }

    const practicumClass: PracticumClass = {
      id: createId('cls'),
      courseName: input.courseName.trim(),
      code: input.code.trim().toUpperCase(),
      classGroup: input.classGroup.trim(),
      room: input.room.trim(),
      asprakName: CURRENT_ASPRAK_NAME,
      description: input.description?.trim() || undefined,
      createdAt: new Date().toISOString(),
      participants: [],
    };

    commit({ ...getSnapshot(), classes: [...getSnapshot().classes, practicumClass] });

    return { ok: true, id: practicumClass.id };
  },

  async updateClass(id: string, input: ClassInput) {
    const errors = validateClassInput(input);

    if (hasErrors(errors)) {
      return FAIL(Object.values(errors)[0]);
    }

    const state = getSnapshot();
    const existing = state.classes.find((item) => item.id === id);

    if (!existing) {
      return FAIL('Kelas tidak ditemukan.');
    }

    const courseName = input.courseName.trim();
    const classGroup = input.classGroup.trim();
    const room = input.room.trim();

    commit({
      ...state,
      classes: state.classes.map((item) =>
        item.id === id
          ? {
              ...item,
              courseName,
              code: input.code.trim().toUpperCase(),
              classGroup,
              room,
              description: input.description?.trim() || undefined,
            }
          : item,
      ),
      sessions: state.sessions.map((session) =>
        session.classId === id
          ? {
              ...session,
              courseName,
              classGroup,
              room: session.room === existing.room ? room : session.room,
            }
          : session,
      ),
    });

    return { ok: true };
  },

  async deleteClass(id: string) {
    const state = getSnapshot();

    if (!state.classes.some((item) => item.id === id)) {
      return FAIL('Kelas tidak ditemukan.');
    }

    const removedSessionIds = new Set(
      state.sessions.filter((session) => session.classId === id).map((session) => session.id),
    );

    commit({
      classes: state.classes.filter((item) => item.id !== id),
      sessions: state.sessions.filter((session) => session.classId !== id),
      permits: state.permits.filter(
        (permit) => permit.classId !== id && !removedSessionIds.has(permit.sessionId),
      ),
    });

    return { ok: true };
  },

  async addParticipant(classId: string, input: { name: string; nim: string }) {
    const errors = validateParticipantInput(input);

    if (hasErrors(errors)) {
      return FAIL(Object.values(errors)[0]);
    }

    const state = getSnapshot();
    const practicumClass = state.classes.find((item) => item.id === classId);

    if (!practicumClass) {
      return FAIL('Kelas tidak ditemukan.');
    }

    const nim = input.nim.trim();

    if (practicumClass.participants.some((participant) => participant.nim === nim)) {
      return FAIL('NIM tersebut sudah terdaftar di kelas ini.');
    }

    const participant = {
      id: createId('p'),
      classId,
      name: input.name.trim(),
      nim,
    };

    commit({
      ...state,
      classes: state.classes.map((item) =>
        item.id === classId ? { ...item, participants: [...item.participants, participant] } : item,
      ),
      sessions: state.sessions.map((session) =>
        session.classId === classId
          ? { ...session, participants: [...session.participants, { ...participant }] }
          : session,
      ),
    });

    return { ok: true };
  },

  async removeParticipant(classId: string, participantId: string) {
    const state = getSnapshot();
    const practicumClass = state.classes.find((item) => item.id === classId);

    if (!practicumClass) {
      return FAIL('Kelas tidak ditemukan.');
    }

    if (!practicumClass.participants.some((participant) => participant.id === participantId)) {
      return FAIL('Peserta tidak ditemukan pada kelas ini.');
    }

    commit({
      ...state,
      classes: state.classes.map((item) =>
        item.id === classId
          ? {
              ...item,
              participants: item.participants.filter(
                (participant) => participant.id !== participantId,
              ),
            }
          : item,
      ),
      sessions: state.sessions.map((session) =>
        session.classId === classId
          ? {
              ...session,
              participants: session.participants.filter(
                (participant) => participant.id !== participantId,
              ),
            }
          : session,
      ),
      permits: state.permits.filter((permit) => permit.participantId !== participantId),
    });

    return { ok: true };
  },

  async createSession(input: SessionInput) {
    const errors = validateSessionInput(input);

    if (hasErrors(errors)) {
      return FAIL(Object.values(errors)[0]);
    }

    const state = getSnapshot();
    const practicumClass = state.classes.find((item) => item.id === input.classId);

    if (!practicumClass) {
      return FAIL('Kelas tidak ditemukan.');
    }

    const session: PracticumSession = {
      id: createId('ses'),
      classId: practicumClass.id,
      courseName: practicumClass.courseName,
      classGroup: practicumClass.classGroup,
      room: input.room?.trim() || practicumClass.room,
      dayLabel: input.dayLabel.trim(),
      dateLabel: input.dateLabel.trim(),
      startTime: input.startTime.trim(),
      endTime: input.endTime.trim(),
      asprakName: practicumClass.asprakName,
      status: 'belum-dibuka',
      participants: toSessionParticipants(practicumClass),
    };

    commit({ ...state, sessions: [...state.sessions, session] });

    return { ok: true, id: session.id };
  },

  async updateSession(id: string, input: SessionInput) {
    const errors = validateSessionInput(input);

    if (hasErrors(errors)) {
      return FAIL(Object.values(errors)[0]);
    }

    const state = getSnapshot();
    const existing = state.sessions.find((session) => session.id === id);

    if (!existing) {
      return FAIL('Sesi tidak ditemukan.');
    }

    const practicumClass = state.classes.find((item) => item.id === input.classId);

    if (!practicumClass) {
      return FAIL('Kelas tidak ditemukan.');
    }

    const attendanceByParticipant = new Map(
      existing.participants.map((participant) => [participant.id, participant.checkInAt]),
    );

    const participants =
      existing.classId === practicumClass.id
        ? existing.participants
        : toSessionParticipants(practicumClass).map((participant) => ({
            ...participant,
            checkInAt: attendanceByParticipant.get(participant.id),
          }));

    commit({
      ...state,
      sessions: state.sessions.map((session) =>
        session.id === id
          ? {
              ...session,
              classId: practicumClass.id,
              courseName: practicumClass.courseName,
              classGroup: practicumClass.classGroup,
              room: input.room?.trim() || practicumClass.room,
              dayLabel: input.dayLabel.trim(),
              dateLabel: input.dateLabel.trim(),
              startTime: input.startTime.trim(),
              endTime: input.endTime.trim(),
              participants,
            }
          : session,
      ),
    });

    return { ok: true };
  },

  async deleteSession(id: string) {
    const state = getSnapshot();

    if (!state.sessions.some((session) => session.id === id)) {
      return FAIL('Sesi tidak ditemukan.');
    }

    commit({
      ...state,
      sessions: state.sessions.filter((session) => session.id !== id),
      permits: state.permits.filter((permit) => permit.sessionId !== id),
    });

    return { ok: true };
  },

  async openSession(id: string) {
    const state = getSnapshot();
    const session = state.sessions.find((item) => item.id === id);

    if (!session) {
      return FAIL('Sesi tidak ditemukan.');
    }

    if (session.status !== 'belum-dibuka') {
      return FAIL('Hanya sesi yang belum dibuka yang dapat dibuka.');
    }

    commit({
      ...state,
      sessions: state.sessions.map((item) =>
        item.id === id
          ? { ...item, status: 'berlangsung', openedAt: formatClock() }
          : item,
      ),
    });

    return { ok: true };
  },

  async closeSession(id: string, note?: string) {
    const state = getSnapshot();
    const session = state.sessions.find((item) => item.id === id);

    if (!session) {
      return FAIL('Sesi tidak ditemukan.');
    }

    if (session.status !== 'berlangsung') {
      return FAIL('Hanya sesi yang sedang berlangsung yang dapat ditutup.');
    }

    const closingNote = note?.trim();

    commit({
      ...state,
      sessions: state.sessions.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'selesai',
              closedAt: formatClock(),
              closingNote: closingNote || undefined,
            }
          : item,
      ),
    });

    return { ok: true };
  },

  async checkIn(sessionId: string, participantId: string) {
    const state = getSnapshot();
    const session = state.sessions.find((item) => item.id === sessionId);

    if (!session) {
      return FAIL('Sesi tidak ditemukan.');
    }

    if (session.status === 'belum-dibuka') {
      return FAIL('Sesi belum dibuka oleh asisten praktikum.');
    }

    if (session.status === 'selesai') {
      return FAIL('Sesi sudah ditutup, presensi tidak dapat dilakukan.');
    }

    const participant = session.participants.find((item) => item.id === participantId);

    if (!participant) {
      return FAIL('Anda tidak terdaftar pada sesi ini.');
    }

    if (participant.checkInAt) {
      return FAIL('Presensi untuk sesi ini sudah tercatat.');
    }

    commit({
      ...state,
      sessions: state.sessions.map((item) =>
        item.id === sessionId
          ? {
              ...item,
              participants: item.participants.map((entry) =>
                entry.id === participantId ? { ...entry, checkInAt: formatClock() } : entry,
              ),
            }
          : item,
      ),
    });

    return { ok: true };
  },

  async decidePermit(id: string, decision) {
    const state = getSnapshot();
    const permit = state.permits.find((item) => item.id === id);

    if (!permit) {
      return FAIL('Pengajuan izin tidak ditemukan.');
    }

    if (permit.status !== 'menunggu') {
      return FAIL('Pengajuan izin ini sudah diputuskan sebelumnya.');
    }

    commit({
      ...state,
      permits: state.permits.map((item) =>
        item.id === id
          ? {
              ...item,
              status: decision.status,
              decisionNote: decision.note?.trim() || undefined,
              decidedAt: new Date().toISOString(),
              decidedBy: decision.decidedBy,
            }
          : item,
      ),
    });

    return { ok: true };
  },
};
