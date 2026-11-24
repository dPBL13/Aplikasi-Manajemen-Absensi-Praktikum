// sprint 3

import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
    GPS_DISABLED_COPY,
    PERMISSION_COPY,
    type PermissionKind,
} from '@/services/device-permission';

/** Dialog edukatif SEBELUM dialog izin OS muncul (FR-33 butir 1). */
export function PermissionPrimerDialog({
  visible,
  kind,
  onAllow,
  onLater,
}: {
  visible: boolean;
  kind: PermissionKind;
  onAllow: () => void;
  onLater: () => void;
}) {
  const copy = PERMISSION_COPY[kind];
  return (
    <BottomSheetModal
      visible={visible}
      title={copy.title}
      description={copy.message}
      onClose={onLater}>
      <View style={styles.actions}>
        <ActionButton label={copy.allowLabel} onPress={onAllow} />
        <ActionButton label="Nanti Saja" tone="secondary" onPress={onLater} />
      </View>
    </BottomSheetModal>
  );
}

/** Dialog saat layanan GPS perangkat mati (FR-33 butir 3). */
export function GpsDisabledDialog({
  visible,
  onOpenSettings,
  onClose,
}: {
  visible: boolean;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheetModal
      visible={visible}
      title={GPS_DISABLED_COPY.title}
      description={GPS_DISABLED_COPY.message}
      onClose={onClose}>
      <View style={styles.actions}>
        <ActionButton label={GPS_DISABLED_COPY.openSettingsLabel} onPress={onOpenSettings} />
        <ActionButton label="Nanti Saja" tone="secondary" onPress={onClose} />
      </View>
    </BottomSheetModal>
  );
}

/** Banner saat izin ditolak/blocked (FR-33 butir 2). Ikon + teks, bukan warna saja. */
export function PermissionBlockedBanner({
  kind,
  onOpenSettings,
}: {
  kind: PermissionKind;
  onOpenSettings: () => void;
}) {
  const theme = useTheme();
  const copy = PERMISSION_COPY[kind];
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder },
      ]}>
      <ThemedText type="labelLg" style={{ color: theme.danger }}>
        {'⚠  '}
        {copy.deniedTitle}
      </ThemedText>
      <ThemedText type="bodySm" themeColor="onSurface">
        {copy.deniedMessage}
      </ThemedText>
      <ActionButton
        label={GPS_DISABLED_COPY.openSettingsLabel}
        tone="danger"
        onPress={onOpenSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.two },
  banner: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
});