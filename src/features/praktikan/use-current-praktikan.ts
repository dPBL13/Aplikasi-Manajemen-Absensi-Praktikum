import { useAuth } from '@/hooks/use-auth';

/** Identitas praktikan yang sedang login. Ganti pencocokan bila participantId != uid. */
export function useCurrentPraktikan() {
  const { userProfile } = useAuth();
  return {
    id: userProfile?.uid ?? '',
    name: userProfile?.name ?? '',
    nim: userProfile?.nim ?? '',
  };
}