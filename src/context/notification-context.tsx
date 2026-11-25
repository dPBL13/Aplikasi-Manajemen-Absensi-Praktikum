import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { PermissionPrimerDialog } from '@/components/notifications/permission-primer-dialog';
import { useAuth } from '@/hooks/use-auth';
import { devicePermissionService, type PermissionState } from '@/services/device-permission';
import { registerDeviceToken, startTokenRefreshSync } from '@/services/fcm-token-sync';
import { notificationService } from '@/services/notification';
import type { PushNotificationPayload } from '@/types/domain';

export interface ActiveToast {
  id: number;
  payload: PushNotificationPayload;
}

interface NotificationContextValue {
  token: string | null;
  permission: PermissionState;
  initialized: boolean;
  activeToast: ActiveToast | null;
  dismissToast: () => void;
  refreshToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/** Batas antrean toast; yang terlama dibuang bila notifikasi datang beruntun. */
const MAX_QUEUE = 5;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const uid = user?.uid ?? null;
  const isPraktikan = role === 'praktikan';

  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [initialized, setInitialized] = useState(false);
  const [toastQueue, setToastQueue] = useState<ActiveToast[]>([]);
  const [primerVisible, setPrimerVisible] = useState(false);
  const [grantVersion, setGrantVersion] = useState(0);
  const primerAskedRef = useRef(false);
  const toastIdRef = useRef(0);

  // Kanal + handler notifikasi, dan pendengar notifikasi foreground (antrean toast).
  useEffect(() => {
    let mounted = true;

    void notificationService.initialize().then(() => {
      if (mounted) setInitialized(true);
    });

    const unsubForeground = notificationService.onForegroundNotification((payload) => {
      toastIdRef.current += 1;
      const item: ActiveToast = { id: toastIdRef.current, payload };
      setToastQueue((queue) => [...queue, item].slice(-MAX_QUEUE));
    });

    return () => {
      mounted = false;
      unsubForeground();
    };
  }, []);

  // Praktikan login: cek izin → (granted) daftarkan token, (belum) tampilkan dialog edukasi.
  useEffect(() => {
    if (!uid || !initialized || !isPraktikan) {
      if (!uid) primerAskedRef.current = false;
      return;
    }

    const currentUid = uid;
    let cancelled = false;
    let stopRefresh: (() => void) | null = null;

    async function sync() {
      const state = await devicePermissionService.getStatus('notification');
      if (cancelled) return;
      setPermission(state);

      if (state === 'granted') {
        const res = await registerDeviceToken(currentUid);
        if (cancelled) return;
        if (res.ok && res.token) setToken(res.token);
        stopRefresh = startTokenRefreshSync(currentUid);
      } else if ((state === 'undetermined' || state === 'denied') && !primerAskedRef.current) {
        primerAskedRef.current = true;
        setPrimerVisible(true);
      }
    }

    void sync();

    return () => {
      cancelled = true;
      stopRefresh?.();
    };
  }, [uid, initialized, isPraktikan, grantVersion]);

  const handleAllow = useCallback(async () => {
    setPrimerVisible(false);
    const next = await devicePermissionService.requestNotification();
    setPermission(next);
    if (next === 'granted') setGrantVersion((version) => version + 1);
  }, []);

  const handleLater = useCallback(() => setPrimerVisible(false), []);

  const dismissToast = useCallback(() => {
    setToastQueue((queue) => queue.slice(1));
  }, []);

  const refreshToken = useCallback(async () => {
    if (!uid) return;
    const res = await registerDeviceToken(uid);
    if (res.ok && res.token) setToken(res.token);
  }, [uid]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      token: uid ? token : null,
      permission,
      initialized,
      activeToast: toastQueue[0] ?? null,
      dismissToast,
      refreshToken,
    }),
    [uid, token, permission, initialized, toastQueue, dismissToast, refreshToken],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <PermissionPrimerDialog
        visible={primerVisible}
        kind="notification"
        onAllow={handleAllow}
        onLater={handleLater}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}