import { router } from 'expo-router';

import { SessionListScreen } from '@/features/praktikan';

/** FR-07 / FR-09 — daftar sesi praktikan. */
export default function PraktikanSessionListScreen() {
  return (
    <SessionListScreen
      onSelect={(sessionId) =>
        router.push({ pathname: '/praktikan/session/[id]', params: { id: sessionId } })
      }
    />
  );
}
