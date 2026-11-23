import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { DateTimeField } from '@/components/date-time-field';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { SelectField } from '@/components/select-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hasErrors, validateSessionInput } from '@/services/validation';
import type { FieldErrors, MutationResult, SessionInput } from '@/services/types';
import type { PracticumClass } from '@/types/domain';
import {
  DAY_PICKER_ORDER,
  dayLabelForDate,
  formatDateLabel,
  parseDateLabel,
} from '@/utils/date-label';
import { formatClock } from '@/utils/format-clock';

const DAY_OPTIONS = DAY_PICKER_ORDER.map((day) => ({ label: day, value: day }));

type SessionFormProps = {
  classes: PracticumClass[];
  initial: SessionInput;
  submitLabel: string;
  onSubmit: (input: SessionInput) => Promise<MutationResult>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/** Form jadwal sesi (FR-07/FR-08). Dipakai layar "Jadwal Baru" dan edit di detail sesi. */
export function SessionForm({
  classes,
  initial,
  submitLabel,
  onSubmit,
  onSuccess,
  onCancel,
}: SessionFormProps) {
  const theme = useTheme();
  const [values, setValues] = useState<SessionInput>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof SessionInput) => (value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const submit = async () => {
    const nextErrors = validateSessionInput(values);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    setBusy(true);
    const result = await onSubmit(values);
    setBusy(false);

    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.reason });
      return;
    }

    setFeedback(null);
    onSuccess?.();
  };

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <ThemedText type="labelSm" themeColor="onSurface">
          Kelas praktikum
        </ThemedText>
        <View style={styles.chips}>
          {classes.map((practicumClass) => {
            const isActive = values.classId === practicumClass.id;

            return (
              <Pressable
                key={practicumClass.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => {
                  setValues((previous) => ({ ...previous, classId: practicumClass.id }));
                  setErrors((previous) => ({ ...previous, classId: '' }));
                }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: isActive ? theme.accent : theme.surfaceAlt,
                    borderColor: isActive ? theme.accent : theme.accent,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText
                  type="bodySm"
                  style={{ color: isActive ? theme.accentText : theme.onSurface }}>
                  {practicumClass.courseName} · {practicumClass.classGroup}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {errors.classId ? (
          <ThemedText type="bodySm" style={{ color: theme.danger }}>
            {errors.classId}
          </ThemedText>
        ) : null}
        {classes.length === 0 ? (
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Belum ada kelas. Buat kelas terlebih dahulu di tab Kelas.
          </ThemedText>
        ) : null}
      </View>

      <SelectField
        label="Hari"
        value={values.dayLabel}
        placeholder="Pilih hari"
        options={DAY_OPTIONS}
        onSelect={setField('dayLabel')}
        error={errors.dayLabel}
      />
      <DateTimeField
        label="Tanggal"
        mode="date"
        value={values.dateLabel}
        placeholder="Pilih tanggal"
        onChange={(date) => {
          setValues((previous) => ({
            ...previous,
            dateLabel: formatDateLabel(date),
            dayLabel: dayLabelForDate(date),
          }));
          setErrors((previous) => ({ ...previous, dateLabel: '', dayLabel: '' }));
        }}
        onChangeText={(text) => {
          setField('dateLabel')(text);

          const parsed = parseDateLabel(text);

          if (parsed) {
            setField('dayLabel')(dayLabelForDate(parsed));
          }
        }}
        error={errors.dateLabel}
      />
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <DateTimeField
            label="Jam mulai"
            mode="time"
            value={values.startTime}
            placeholder="Pilih jam"
            onChange={(date) => setField('startTime')(formatClock(date))}
            onChangeText={setField('startTime')}
            error={errors.startTime}
          />
        </View>
        <View style={styles.timeField}>
          <DateTimeField
            label="Jam selesai"
            mode="time"
            value={values.endTime}
            placeholder="Pilih jam"
            onChange={(date) => setField('endTime')(formatClock(date))}
            onChangeText={setField('endTime')}
            error={errors.endTime}
          />
        </View>
      </View>
      <FormField
        label="Ruang (opsional)"
        value={values.room ?? ''}
        onChangeText={setField('room')}
        placeholder="Kosongkan untuk memakai ruang kelas"
        hint="Ruang mengikuti kelas bila dikosongkan."
      />

      {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

      <ActionButton label={busy ? 'Menyimpan…' : submitLabel} onPress={submit} disabled={busy} />
      {onCancel ? <ActionButton label="Batal" tone="secondary" onPress={onCancel} /> : null}
    </View>
  );
}

/** Nilai awal form untuk sesi baru milik kelas tertentu. */
export function emptySessionInput(classId: string): SessionInput {
  return {
    classId,
    dayLabel: '',
    dateLabel: '',
    startTime: '08:00',
    endTime: '10:00',
    room: '',
  };
}

export type { SessionInput };

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timeField: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
