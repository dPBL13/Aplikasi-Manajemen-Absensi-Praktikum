import { useNotification } from '@/context/notification-context';
import { useAuth } from '@/hooks/use-auth';
import { handleNotificationRoute } from '@/utils/notification-deep-link';

import { InAppToast } from './in-app-toast';

/** Menampilkan toast terdepan dari antrean notifikasi foreground. */
export function BannerRenderer() {
  const { activeToast, dismissToast } = useNotification();
  const { userProfile } = useAuth();

  if (!activeToast) return null;

  return (
    <InAppToast
      key={activeToast.id}
      payload={activeToast.payload}
      onDismiss={dismissToast}
      onPress={(payload) => {
        handleNotificationRoute(payload, userProfile?.role ?? null);
      }}
    />
  );
}