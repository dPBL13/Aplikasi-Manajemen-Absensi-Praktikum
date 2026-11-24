import React from 'react';
import { useNotification } from '@/context/notification-context';
import { InAppToast } from './in-app-toast';
import { handleNotificationRoute } from '@/utils/notification-deep-link';
import { useAuth } from '@/hooks/use-auth';

/**
 * BannerRenderer me-render banner Heads-up Toast saat ada payload notifikasi di state activeToast.
 */
export function BannerRenderer() {
  const { activeToast, dismissToast } = useNotification();
  const { userProfile } = useAuth();

  if (!activeToast) return null;

  return (
    <InAppToast
      payload={activeToast}
      onDismiss={dismissToast}
      onPress={(payload) => {
        handleNotificationRoute(payload, userProfile?.role ?? null);
      }}
    />
  );
}
