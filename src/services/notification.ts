// sprint 3 addition

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications'; //gegara error namespace expo-notif
import { Platform } from 'react-native';

import type { PushNotificationPayload, PushNotificationType } from '@/types/domain';

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
  /** Kontrak untuk modul lain. Pengiriman asli dilakukan relay server, jadi di aplikasi no-op. */
  notifySessionOpened(sessionId: string): Promise<NotificationResult>;
  notifyScheduleChanged(sessionId: string): Promise<NotificationResult>;
  notifyPermitDecision(permitId: string): Promise<NotificationResult>;
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
  if (Platform.OS !== 'android' || initialized) {
    return { ok: true };
  }

  try {
    // Saat aplikasi terbuka, banner sistem ditahan; banner dalam aplikasi (YG-06) yang tampil.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
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
  if (Platform.OS !== 'android') return null;

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
  if (Platform.OS !== 'android') return () => {};

  const subscription = Notifications.addPushTokenListener((token: any) => {
    if (typeof token.data === 'string') listener(token.data);
  });

  return () => subscription.remove();
}

function onForegroundNotification(
  listener: (payload: PushNotificationPayload) => void,
): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification: any) => {
    const payload = parseNotificationContent(notification.request.content);
    if (payload) listener(payload);
  });

  return () => subscription.remove();
}

async function showLocal(payload: PushNotificationPayload): Promise<NotificationResult> {
  const ready = await initialize();
  if (!ready.ok) return ready;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: toDataRecord(payload.data),
      },
      trigger: { channelId: NOTIFICATION_CHANNEL_ID },
    });
    return { ok: true };
  } catch (error) {
    console.warn('[notification] Gagal menampilkan notifikasi lokal:', error);
    return { ok: false, reason: 'Notifikasi tidak dapat ditampilkan.' };
  }
}

const noop = async (): Promise<NotificationResult> => ({ ok: true });

export const notificationService: NotificationService = {
  initialize,
  getDeviceToken,
  onTokenRefresh,
  onForegroundNotification,
  showLocal,
  notifySessionOpened: noop,
  notifyScheduleChanged: noop,
  notifyPermitDecision: noop,
};