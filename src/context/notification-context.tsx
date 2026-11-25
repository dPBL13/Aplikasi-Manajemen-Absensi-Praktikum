import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { notificationService } from '@/services/notification';
import { devicePermissionService } from '@/services/device-permission';
import { registerDeviceToken, startTokenRefreshSync } from '@/services/fcm-token-sync';
import type { PushNotificationPayload } from '@/types/domain';

interface NotificationContextValue {
  token: string | null;
  initialized: boolean;
  activeToast: PushNotificationPayload | null;
  dismissToast: () => void;
  refreshToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeToast, setActiveToast] = useState<PushNotificationPayload | null>(null);

  // Inisialisasi kanal dan handler notifikasi saat provider mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      await notificationService.initialize();
      if (mounted) {
        setInitialized(true);
      }
    }

    init();

    // Listener foreground heads-up banner
    const unsubForeground = notificationService.onForegroundNotification((payload) => {
      setActiveToast(payload);
    });

    return () => {
      mounted = false;
      unsubForeground();
    };
  }, []);

  // Registrasi token FCM saat user login dan permission granted
  useEffect(() => {
    if (!user?.uid || !initialized) {
      return;
    }

    let unsubRefresh: (() => void) | null = null;
    let isCancelled = false;

    async function syncToken() {
      const perm = await devicePermissionService.getStatus('notification');
      if (perm === 'granted') {
        const res = await registerDeviceToken(user!.uid);
        if (res.ok && res.token && !isCancelled) {
          setToken(res.token);
        }
      }
      if (!isCancelled) {
        unsubRefresh = startTokenRefreshSync(user!.uid);
      }
    }

    syncToken();

    return () => {
      isCancelled = true;
      if (unsubRefresh) unsubRefresh();
    };
  }, [user, initialized]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const refreshToken = useCallback(async () => {
    if (user?.uid) {
      const res = await registerDeviceToken(user.uid);
      if (res.ok && res.token) {
        setToken(res.token);
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({
      token: user ? token : null,
      initialized,
      activeToast,
      dismissToast,
      refreshToken,
    }),
    [token, initialized, activeToast, user, dismissToast, refreshToken]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
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
