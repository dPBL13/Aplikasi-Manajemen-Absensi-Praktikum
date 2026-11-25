import { Linking, Platform, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { Card } from '@/components/card';
import { InfoRow } from '@/components/info-row';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useLabActivity } from '@/services/lab-activity';
import type { Laboratory, PracticumSession } from '@/types/domain';

type LabActivitySheetProps = {
  lab: Laboratory | null;
  /** Jarak pengguna ke pusat lab (m); null bila posisi belum tersedia. */
  distanceMeters: number | null;
  onClose: () => void;
  /** Dipanggil layar peta; tujuan rute bergantung peran sehingga bukan urusan sheet. */
  onOpenSession?: (session: PracticumSession) => void;
};

function openDirections(lab: Laboratory) {
  const { latitude, longitude, name } = lab;
  const label = encodeURIComponent(name);
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${label}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
  void Linking.openURL(url);
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

/**
 * Bottom sheet aktivitas lab (JH-06, FR-31): praktikum berlangsung + berikutnya.
 * Data realtime karena `useLabActivity` membaca `useAppData()` (onSnapshot).
 */
export function LabActivitySheet({ lab, distanceMeters, onClose, onOpenSession }: LabActivitySheetProps) {
  const activity = useLabActivity(lab);

  return (
    <BottomSheetModal
      visible={lab !== null}
      title={lab?.name ?? ''}
      description={lab ? `${lab.code} · ${lab.building}` : undefined}
      onClose={onClose}>
      {lab ? (
        <>
          <Card>
            <InfoRow label="Radius geofencing" value={`${lab.radius} m`} />
            {lab.capacity ? <InfoRow label="Kapasitas" value={`${lab.capacity} kursi`} /> : null}
            {distanceMeters !== null ? (
              <InfoRow label="Jarak dari Anda" value={formatDistance(distanceMeters)} />
            ) : null}
          </Card>

          <ThemedText type="labelLg" themeColor="onSurface">
            Praktikum Berlangsung
          </ThemedText>
          {activity.ongoing.length > 0 ? (
            activity.ongoing.map((session) => (
              <SessionSummary key={session.id} session={session} onOpen={onOpenSession} />
            ))
          ) : (
            <Card>
              <ThemedText type="titleMd" themeColor="onSurface">
                Laboratorium Kosong
              </ThemedText>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Tidak ada praktikum aktif saat ini.
              </ThemedText>
            </Card>
          )}

          <ThemedText type="labelLg" themeColor="onSurface">
            Praktikum Berikutnya
          </ThemedText>
          {activity.next ? (
            <SessionSummary session={activity.next} onOpen={onOpenSession} />
          ) : (
            <Card>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Tidak ada praktikum lagi hari ini di laboratorium ini.
              </ThemedText>
            </Card>
          )}

          <View style={styles.actions}>
            <ActionButton label="Navigasi ke Lokasi" tone="secondary" onPress={() => openDirections(lab)} />
          </View>
        </>
      ) : null}
    </BottomSheetModal>
  );
}

function SessionSummary({
  session,
  onOpen,
}: {
  session: PracticumSession;
  onOpen?: (session: PracticumSession) => void;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <ThemedText type="titleMd" themeColor="onSurface" style={styles.title}>
          {session.courseName}
        </ThemedText>
        <SessionStatusBadge status={session.status} />
      </View>
      <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
        {session.classGroup} · {session.dayLabel}, {session.dateLabel}
      </ThemedText>
      <ThemedText type="monoSm" themeColor="onSurface">
        {session.startTime} – {session.endTime}
      </ThemedText>
      <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
        Asprak: {session.asprakName}
      </ThemedText>
      {onOpen ? (
        <ActionButton label="Lihat Detail Sesi" onPress={() => onOpen(session)} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: { flexShrink: 1 },
  actions: { gap: Spacing.two },
});
