// FR-07 (detail sesi) + FR-08 (presensi)
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';
import { CURRENT_STUDENT_ID, checkIn, devSetSessionStatus, useAttendanceStore } from './store';
import { colors } from './theme';
import type { CheckInResult, SessionStatus } from './types';

type Feedback = { kind: 'success' | 'error' | 'info'; text: string } | null;

const REASON_TEXT: Record<Exclude<CheckInResult, { ok: true }>['reason'], string> = {
  not_started: 'Sesi belum dibuka oleh asprak.',
  closed: 'Sesi sudah ditutup, presensi tidak bisa dilakukan.',
  already_present: 'Kamu sudah presensi di sesi ini.',
  not_found: 'Sesi tidak ditemukan.',
};

export function SessionDetailScreen({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const { sessions, attendance } = useAttendanceStore();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    return (
      <View>
        <EmptyState title="Sesi tidak ditemukan" />
        <BackButton onBack={onBack} />
      </View>
    );
  }

  const rec = attendance.find((a) => a.sessionId === sessionId && a.studentId === CURRENT_STUDENT_ID);
  const present = rec?.status === 'present';
  const canCheckIn = session.status === 'ongoing' && !present;

  const handleCheckIn = () => {
    const res = checkIn(sessionId);
    setFeedback(res.ok ? { kind: 'success', text: 'Presensi berhasil dicatat.' } : { kind: 'error', text: REASON_TEXT[res.reason] });
  };

  let helper = '';
  if (present) helper = `Hadir pada pukul ${rec?.checkedInAt ?? '-'}.`;
  else if (session.status === 'scheduled') helper = 'Presensi dibuka setelah asprak membuka sesi.';
  else if (session.status === 'completed') helper = 'Sesi sudah selesai. Presensi terkunci.';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <BackButton onBack={onBack} />

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>{session.title}</Text>
          <StatusBadge status={session.status} />
        </View>
        <Info label="Mata kuliah" value={session.course} />
        <Info label="Tanggal" value={session.date} />
        <Info label="Waktu" value={session.time} />
        <Info label="Ruang" value={session.room} />
        <Info label="Status kehadiranmu" value={present ? 'Hadir' : session.status === 'completed' ? 'Tidak hadir' : 'Belum presensi'} />
      </View>

      {feedback ? (
        <View style={[styles.banner, feedback.kind === 'success' ? styles.bannerOk : styles.bannerErr]} accessibilityLiveRegion="polite">
          <Text style={{ color: feedback.kind === 'success' ? colors.success : colors.danger, fontWeight: '600' }}>{feedback.text}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleCheckIn}
        disabled={!canCheckIn}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canCheckIn }}
        style={[styles.primaryBtn, !canCheckIn && styles.btnDisabled]}
      >
        <Text style={styles.primaryText}>{present ? '✓ Sudah Presensi' : 'Presensi Sekarang'}</Text>
      </Pressable>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}

      {__DEV__ ? <DevPanel sessionId={sessionId} /> : null}
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <Pressable onPress={onBack} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 4 }}>
      <Text style={{ color: colors.primary, fontWeight: '600' }}>← Kembali ke daftar sesi</Text>
    </Pressable>
  );
}

function DevPanel({ sessionId }: { sessionId: string }) {
  const opts: SessionStatus[] = ['scheduled', 'ongoing', 'completed'];
  return (
    <View style={styles.dev}>
      <Text style={styles.devTitle}>Mode dev: ubah status sesi</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {opts.map((o) => (
          <Pressable key={o} onPress={() => devSetSessionStatus(sessionId, o)} style={styles.devBtn}>
            <Text style={{ color: colors.text, fontSize: 12 }}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 13, color: colors.muted },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  banner: { padding: 12, borderRadius: 10 },
  bannerOk: { backgroundColor: colors.successBg },
  bannerErr: { backgroundColor: colors.dangerBg },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: colors.primaryDisabled },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: '700' },
  helper: { textAlign: 'center', color: colors.muted, fontSize: 13 },
  dev: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: 12, gap: 8 },
  devTitle: { fontSize: 12, color: colors.muted },
  devBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.neutralBg },
});