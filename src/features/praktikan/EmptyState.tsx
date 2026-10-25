import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 32, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  hint: { marginTop: 6, fontSize: 14, color: colors.muted, textAlign: 'center' },
});