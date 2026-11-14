import { ThemedView } from '@/components/themed-view';
import { PraktikanModule } from '@/features/praktikan';

export default function PraktikanScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <PraktikanModule />
    </ThemedView>
  );
}
