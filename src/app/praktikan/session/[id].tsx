import { router, useLocalSearchParams } from 'expo-router';

import { SessionDetailScreen } from '@/features/praktikan';

/** FR-10 / FR-11 — detail sesi dan presensi praktikan. */
export default function PraktikanSessionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <SessionDetailScreen sessionId={id} onBack={() => router.back()} />;
}
