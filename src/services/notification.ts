// sprint 3 addition

import { Platform } from 'react-native';

import type { Permit, PracticumSession, PushNotificationPayload, PushNotificationType } from '@/types/domain';
import { buildSessionOpenedPayload } from './triggers/session-triggers';
import { buildPermitDecisionPayload, buildScheduleChangedPayload } from './triggers/schedule-permit-triggers';

let Notifications: any = null;
let AndroidImportance: any = { MAX: 5, HIGH: 4, DEFAULT: 3 };

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
  if (Notifications?.AndroidImportance) {
    AndroidImportance = Notifications.AndroidImportance;
  }
} catch {
  // Expo Go (StoreClient) tidak menyertakan modul native ExpoPushTokenManager
}

/** Harus sama dengan `defaultChannel` pada plugin expo-notifications di app.json. */
export const NOTIFICATION_CHANNEL_ID = 'sesi-praktikum';

const VALID_TYPES: PushNotificationType[] = [
  'SESSION_OPENED',
  'SCHEDULE_CHANGED',
  'PERMIT_DECISION',
];

export type NotificationResult = { ok: true } | { ok: false; reason: string };

/** Bentuk minimal isi notifikasi (cocok dengan `request.content` milik expo-notifications). */
export interface RawNotificationContent {
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
}

export interface NotificationService {
  /** Menyiapkan kanal Android + handler foreground. Aman dipanggil berulang. */
  initialize(): Promise<NotificationResult>;
  /** Token FCM perangkat (Android), atau null bila tidak tersedia. */
  getDeviceToken(): Promise<string | null>;
  /** Mendengarkan rotasi token. Mengembalikan fungsi untuk berhenti. */
  onTokenRefresh(listener: (token: string) => void): () => void;
  /** Mendengarkan notifikasi yang tiba saat aplikasi di foreground. */
  onForegroundNotification(listener: (payload: PushNotificationPayload) => void): () => void;
  /** Menampilkan notifikasi lokal (simulasi/uji). */
  showLocal(payload: PushNotificationPayload): Promise<NotificationResult>;
  /** Notifikasi sesi dibuka kepada praktikan. */
  notifySessionOpened(sessionId: string, session?: PracticumSession): Promise<NotificationResult>;
  /** Notifikasi perubahan jadwal sesi kepada praktikan. */
  notifyScheduleChanged(sessionId: string, session?: PracticumSession): Promise<NotificationResult>;
  /** Notifikasi keputusan pengajuan izin kepada praktikan. */
  notifyPermitDecision(permitId: string, permit?: Permit): Promise<NotificationResult>;
}

function parseParams(raw: unknown): Record<string, string> | undefined {
  if (typeof raw !== 'string') return undefined;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return undefined;

    const entries = Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    );
    return Object.fromEntries(entries);
  } catch {
    return undefined;
  }
}

/** Mengubah isi notifikasi mentah menjadi payload bertipe. Null bila bukan notifikasi SIPRAK. */
export function parseNotificationContent(
  content: RawNotificationContent,
): PushNotificationPayload | null {
  const data = content.data ?? {};
  const { type, screen, sessionId, permitId, params } = data;

  if (
    typeof type !== 'string' ||
    !VALID_TYPES.includes(type as PushNotificationType) ||
    typeof screen !== 'string'
  ) {
    return null;
  }

  return {
    title: content.title ?? 'SIPRAK Informatika Undip',
    body: content.body ?? '',
    data: {
      type: type as PushNotificationType,
      screen,
      sessionId: typeof sessionId === 'string' ? sessionId : undefined,
      permitId: typeof permitId === 'string' ? permitId : undefined,
      params: parseParams(params),
    },
  };
}

function toDataRecord(data: PushNotificationPayload['data']): Record<string, string> {
  const record: Record<string, string> = { type: data.type, screen: data.screen };
  if (data.sessionId) record.sessionId = data.sessionId;
  if (data.permitId) record.permitId = data.permitId;
  if (data.params) record.params = JSON.stringify(data.params);
  return record;
}

let initialized = false;

async function initialize(): Promise<NotificationResult> {
  if (Platform.OS !== 'android' || initialized || !Notifications?.setNotificationHandler) {
    return { ok: true };
  }

  try {
    // Handler notifikasi saat aplikasi dibuka (foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Pengumuman Sesi Praktikum',
      importance: AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });

    initialized = true;
    return { ok: true };
  } catch (error) {
    console.warn('[notification] Gagal menyiapkan kanal notifikasi:', error);
    return { ok: false, reason: 'Pengaturan notifikasi gagal disiapkan.' };
  }
}

async function getDeviceToken(): Promise<string | null> {
  if (Platform.OS !== 'android' || !Notifications?.getDevicePushTokenAsync) return null;

  // Android 13+: kanal harus ada sebelum token diminta.
  const ready = await initialize();
  if (!ready.ok) return null;

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' ? token.data : null;
  } catch (error) {
    console.warn('[notification] Gagal mengambil token perangkat:', error);
    return null;
  }
}

function onTokenRefresh(listener: (token: string) => void): () => void {
  if (Platform.OS !== 'android' || !Notifications?.addPushTokenListener) return () => {};

  const subscription = Notifications.addPushTokenListener((token: any) => {
    if (typeof token.data === 'string') listener(token.data);
  });

  return () => subscription.remove();
}

const foregroundListeners = new Set<(payload: PushNotificationPayload) => void>();

function onForegroundNotification(
  listener: (payload: PushNotificationPayload) => void,
): () => void {
  foregroundListeners.add(listener);

  let subscription: any = null;
  if (Notifications?.addNotificationReceivedListener) {
    subscription = Notifications.addNotificationReceivedListener((notification: any) => {
      const payload = parseNotificationContent(notification.request.content);
      if (payload) listener(payload);
    });
  }

  return () => {
    foregroundListeners.delete(listener);
    if (subscription) subscription.remove();
  };
}

async function showLocal(payload: PushNotificationPayload): Promise<NotificationResult> {
  // Langsung picu banner dalam aplikasi
  foregroundListeners.forEach((l) => {
    try {
      l(payload);
    } catch (e) {
      console.warn('[notification] listener error:', e);
    }
  });

  if (!Notifications?.scheduleNotificationAsync) return { ok: true };
  const ready = await initialize();
  if (!ready.ok) return ready;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: toDataRecord(payload.data),
      },
      trigger: Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : null,
    });
    return { ok: true };
  } catch (error) {
    console.warn('[notification] Gagal menampilkan notifikasi lokal:', error);
    return { ok: false, reason: 'Notifikasi tidak dapat ditampilkan.' };
  }
}

async function notifySessionOpened(
  sessionId: string,
  session?: PracticumSession,
): Promise<NotificationResult> {
  if (!session) return { ok: true };
  const payload = buildSessionOpenedPayload(session);
  return showLocal(payload);
}

async function notifyScheduleChanged(
  sessionId: string,
  session?: PracticumSession,
): Promise<NotificationResult> {
  if (!session) return { ok: true };
  const payload = buildScheduleChangedPayload(session);
  return showLocal(payload);
}

async function notifyPermitDecision(
  permitId: string,
  permit?: Permit,
): Promise<NotificationResult> {
  if (!permit) return { ok: true };
  const payload = buildPermitDecisionPayload(permit);
  return showLocal(payload);
}

export const notificationService: NotificationService = {
  initialize,
  getDeviceToken,
  onTokenRefresh,
  onForegroundNotification,
  showLocal,
  notifySessionOpened,
  notifyScheduleChanged,
  notifyPermitDecision,
};