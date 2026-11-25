import { useMemo } from 'react';

import { useNow } from '@/hooks/use-now';
import { useAppData } from '@/services';
import type { Laboratory } from '@/types/domain';
import { getLabActivity, type LabActivity } from './lab-activity-selectors';

export * from './lab-activity-selectors';

/**
 * Aktivitas laboratorium real-time (JH-06, FR-31).
 * `useAppData()` berasal dari onSnapshot, sehingga hasil berubah otomatis saat
 * Asprak membuka/menutup sesi tanpa refresh.
 */
/** Hook realtime: berubah otomatis saat Asprak membuka/menutup sesi. */
export function useLabActivity(lab: Laboratory | null | undefined): LabActivity {
  const { sessions } = useAppData();
  const nowMs = useNow();

  return useMemo(
    () => (lab ? getLabActivity(sessions, lab, new Date(nowMs)) : { ongoing: [], next: null }),
    [sessions, lab, nowMs],
  );
}
