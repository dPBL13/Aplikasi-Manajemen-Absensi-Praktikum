import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { parseNotificationContent } from '@/services/notification';
import type { PushNotificationPayload } from '@/types/domain';
import type { UserRole } from '@/types/auth';

// Allowlist awalan rute yang sah dalam aplikasi
const ALLOWED_ROUTE_PREFIXES = ['/praktikan/', '/asprak/'];

let pendingNavigationScreen: string | null = null;

/**
 * Memvalidasi apakah target rute aman dan sesuai dengan role user aktif.
 */
export function isRouteAllowed(screen: string, role: UserRole | null): boolean {
  if (!screen || typeof screen !== 'string') return false;

  const isPrefixValid = ALLOWED_ROUTE_PREFIXES.some((prefix) => screen.startsWith(prefix));
  if (!isPrefixValid) return false;

  // Praktikan tidak boleh diarahkan ke rute asprak
  if (role === 'praktikan' && screen.startsWith('/asprak/')) {
    return false;
  }
  // Asprak tidak boleh diarahkan ke rute praktikan
  if (role === 'asprak' && screen.startsWith('/praktikan/')) {
    return false;
  }

  return true;
}

/**
 * Menavigasikan pengguna ke layar target dari payload notifikasi.
 * Jika belum login / role belum siap, rute disimpan di memory pending.
 */
export function handleNotificationRoute(
  payload: PushNotificationPayload,
  role: UserRole | null
): boolean {
  const targetScreen = payload.data?.screen;
  if (!targetScreen) return false;

  if (!role) {
    // Pengguna belum login atau profil belum dimuat; simpan untuk nanti
    pendingNavigationScreen = targetScreen;
    return false;
  }

  if (!isRouteAllowed(targetScreen, role)) {
    // Fallback bila role cocok dengan praktikan tapi rute presensi belum merge
    if (role === 'praktikan' && payload.data?.sessionId) {
      router.push(`/praktikan/session/${payload.data.sessionId}` as any);
      return true;
    }
    return false;
  }

  try {
    router.push(targetScreen as any);
    return true;
  } catch {
    // Jika rute gagal dieksekusi (misal belum terdaftar di Expo Router), fallback ke rute sesi
    if (payload.data?.sessionId && role === 'praktikan') {
      router.push(`/praktikan/session/${payload.data.sessionId}` as any);
      return true;
    }
    return false;
  }
}

/**
 * Menjalankan navigasi tertunda setelah autentikasi berhasil dimuat.
 */
export function consumePendingNavigation(role: UserRole | null): void {
  if (!pendingNavigationScreen || !role) return;

  const screen = pendingNavigationScreen;
  pendingNavigationScreen = null;

  if (isRouteAllowed(screen, role)) {
    router.push(screen as any);
  }
}

/**
 * Memasang pendengar respons interaksi notifikasi (ketukan di drawer/background/quit).
 * Mengembalikan fungsi unsubscribe.
 */
export function setupNotificationResponseListener(
  getRole: () => UserRole | null
): () => void {
  // 1. Tangani ketukan saat aplikasi berjalan di background atau foreground
  const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
    const rawContent = response.notification.request.content;
    const payload = parseNotificationContent(rawContent as any);
    if (payload) {
      handleNotificationRoute(payload, getRole());
    }
  });

  // 2. Tangani ketukan saat aplikasi dibuka dari kondisi mati (cold start / quit)
  Notifications.getLastNotificationResponseAsync()
    .then((lastResponse: any) => {
      if (lastResponse) {
        const rawContent = lastResponse.notification.request.content;
        const payload = parseNotificationContent(rawContent as any);
        if (payload) {
          handleNotificationRoute(payload, getRole());
        }
        // Bersihkan respons terakhir agar tidak memicu navigasi ganda saat re-render
        if (typeof Notifications.clearLastNotificationResponseAsync === 'function') {
          Notifications.clearLastNotificationResponseAsync().catch(() => {});
        }
      }
    })
    .catch(() => {});

  return () => {
    subscription.remove();
  };
}
