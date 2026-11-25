import { router } from 'expo-router';

import { extractNotificationContent, parseNotificationContent } from '@/services/notification';
import type { UserRole } from '@/types/auth';
import type { PushNotificationPayload } from '@/types/domain';

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // Expo Go fallback
}

// Allowlist awalan rute yang sah dalam aplikasi
const ALLOWED_ROUTE_PREFIXES = ['/praktikan/', '/asprak/'];
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

let pendingNavigationScreen: string | null = null;

/** Rute detail sesi praktikan, atau null bila id tidak aman (mencegah path liar). */
export function safeSessionRoute(sessionId?: string): string | null {
  return sessionId && SAFE_ID.test(sessionId) ? `/praktikan/session/${sessionId}` : null;
}

/** Memvalidasi apakah target rute aman dan sesuai dengan role user aktif. */
export function isRouteAllowed(screen: string, role: UserRole | null): boolean {
  if (!screen || typeof screen !== 'string') return false;
  if (screen.includes('..')) return false;
  if (!ALLOWED_ROUTE_PREFIXES.some((prefix) => screen.startsWith(prefix))) return false;
  if (role === 'praktikan' && screen.startsWith('/asprak/')) return false;
  if (role === 'asprak' && screen.startsWith('/praktikan/')) return false;
  return true;
}

/**
 * Menavigasikan pengguna ke layar target dari payload notifikasi.
 * Bila role belum siap (belum login/profil belum dimuat), rute disimpan sebagai pending.
 */
export function handleNotificationRoute(
  payload: PushNotificationPayload,
  role: UserRole | null,
): boolean {
  const targetScreen = payload.data?.screen;
  if (!targetScreen) return false;

  if (!role) {
    pendingNavigationScreen = targetScreen;
    return false;
  }

  const fallback = role === 'praktikan' ? safeSessionRoute(payload.data?.sessionId) : null;

  if (!isRouteAllowed(targetScreen, role)) {
    if (fallback) {
      router.push(fallback as any);
      return true;
    }
    return false;
  }

  try {
    router.push(targetScreen as any);
    return true;
  } catch {
    if (fallback) {
      router.push(fallback as any);
      return true;
    }
    return false;
  }
}

/** Menjalankan navigasi tertunda setelah autentikasi berhasil dimuat. */
export function consumePendingNavigation(role: UserRole | null): void {
  if (!pendingNavigationScreen || !role) return;

  const screen = pendingNavigationScreen;
  pendingNavigationScreen = null;

  if (isRouteAllowed(screen, role)) {
    router.push(screen as any);
  }
}

/**
 * Memasang pendengar ketukan notifikasi (background/foreground) dan membaca
 * ketukan dari kondisi mati (cold start). Mengembalikan fungsi unsubscribe.
 */
export function setupNotificationResponseListener(getRole: () => UserRole | null): () => void {
  if (!Notifications?.addNotificationResponseReceivedListener) {
    return () => {};
  }

  const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
    const payload = parseNotificationContent(extractNotificationContent(response.notification.request));
    if (payload) handleNotificationRoute(payload, getRole());
  });

  Notifications.getLastNotificationResponseAsync()
    .then((last: any) => {
      if (!last) return;
      const payload = parseNotificationContent(extractNotificationContent(last.notification.request));
      if (payload) handleNotificationRoute(payload, getRole());
      // Bersihkan agar tidak memicu navigasi ganda saat re-render.
      Notifications.clearLastNotificationResponseAsync?.()?.catch?.(() => {});
    })
    .catch(() => {});

  return () => {
    subscription.remove();
  };
}