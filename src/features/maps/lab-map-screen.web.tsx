import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ScreenScroll } from '@/components/screen-scroll';

/** `react-native-maps` hanya mendukung Android/iOS; web menampilkan keterangan saja. */
export function LabMapScreen() {
  return (
    <ScreenScroll contentContainerStyle={styles.content}>
      <EmptyState
        title="Peta belum tersedia di web"
        hint="Buka aplikasi di Android atau iOS untuk melihat peta laboratorium."
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({ content: { flexGrow: 1 } });
