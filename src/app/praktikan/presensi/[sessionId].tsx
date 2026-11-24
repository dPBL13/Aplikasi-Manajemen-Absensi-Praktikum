import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { PresensiView } from '@/features/praktikan/presensi-view';

/**
 * HF-01 & US-01 (FR-27): Rute Khusus Halaman Presensi Mandiri Praktikan.
 * Rute: /praktikan/presensi/[sessionId]
 */
export default function PraktikanPresensiRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  return <PresensiView sessionId={sessionId} onBack={() => router.back()} />;
}
