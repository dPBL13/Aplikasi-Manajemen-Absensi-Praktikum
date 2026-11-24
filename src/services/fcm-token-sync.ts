import { Platform } from 'react-native';
import { collection, doc, setDoc, deleteDoc } from '@react-native-firebase/firestore';
import { firestore } from '@/services/firebase/config';
import { notificationService } from '@/services/notification';
import type { FcmTokenDoc } from '@/types/domain';

let currentRegisteredToken: string | null = null;
let unsubscribeTokenRefresh: (() => void) | null = null;

/**
 * Mendaftarkan token FCM perangkat aktif ke subkoleksi users/{uid}/fcmTokens/{token}.
 * Dokumen token dibuat dengan ID = token string agar tidak duplikat.
 */
export async function registerDeviceToken(uid: string): Promise<{ ok: boolean; token?: string; reason?: string }> {
  try {
    if (Platform.OS !== 'android') {
      return { ok: true };
    }

    const token = await notificationService.getDeviceToken();
    if (!token) {
      return { ok: false, reason: 'Gagal mendapatkan token FCM perangkat' };
    }

    const deviceModel = (Platform.constants as any)?.Model ?? undefined;

    const tokenDoc: FcmTokenDoc = {
      token,
      platform: 'android',
      deviceModel,
      lastActiveAt: new Date().toISOString(),
    };

    const tokenDocRef = doc(collection(doc(collection(firestore, 'users'), uid), 'fcmTokens'), token);
    await setDoc(tokenDocRef, tokenDoc, { merge: true });

    currentRegisteredToken = token;
    return { ok: true, token };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat sinkronisasi token';
    return { ok: false, reason: message };
  }
}

/**
 * Menghapus token perangkat aktif dari Firestore (BR-09).
 * Dipanggil sebelum user logout agar notifikasi tidak bocor ke user berikutnya di perangkat yang sama.
 */
export async function unregisterDeviceToken(uid: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (unsubscribeTokenRefresh) {
      unsubscribeTokenRefresh();
      unsubscribeTokenRefresh = null;
    }

    const token = currentRegisteredToken || (await notificationService.getDeviceToken());
    if (token && uid) {
      const tokenDocRef = doc(collection(doc(collection(firestore, 'users'), uid), 'fcmTokens'), token);
      await deleteDoc(tokenDocRef);
    }

    currentRegisteredToken = null;
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus token perangkat';
    return { ok: false, reason: message };
  }
}

/**
 * Mulai mendengarkan rotasi/pembaruan token FCM dari sistem Android.
 * Jika ada token baru, token lama dihapus dan token baru disimpan ke Firestore.
 */
export function startTokenRefreshSync(uid: string): () => void {
  if (unsubscribeTokenRefresh) {
    unsubscribeTokenRefresh();
  }

  unsubscribeTokenRefresh = notificationService.onTokenRefresh(async (newToken: string) => {
    try {
      if (!uid || !newToken) return;

      if (currentRegisteredToken && currentRegisteredToken !== newToken) {
        const oldDocRef = doc(collection(doc(collection(firestore, 'users'), uid), 'fcmTokens'), currentRegisteredToken);
        await deleteDoc(oldDocRef).catch(() => {});
      }

      const deviceModel = (Platform.constants as any)?.Model ?? undefined;

      const tokenDoc: FcmTokenDoc = {
        token: newToken,
        platform: 'android',
        deviceModel,
        lastActiveAt: new Date().toISOString(),
      };

      const newDocRef = doc(collection(doc(collection(firestore, 'users'), uid), 'fcmTokens'), newToken);
      await setDoc(newDocRef, tokenDoc, { merge: true });

      currentRegisteredToken = newToken;
    } catch {
      // Non-blocking background sync error
    }
  });

  return () => {
    if (unsubscribeTokenRefresh) {
      unsubscribeTokenRefresh();
      unsubscribeTokenRefresh = null;
    }
  };
}
