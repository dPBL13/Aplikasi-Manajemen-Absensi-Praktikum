import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { Spacing } from '@/constants/theme';
import {
  hasErrors,
  validateClassInput,
} from '@/services/validation';
import type { ClassInput, FieldErrors, MutationResult } from '@/services/types';

type ClassFormProps = {
  initial: ClassInput;
  submitLabel: string;
  onSubmit: (input: ClassInput) => Promise<MutationResult>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/** Form kelas praktikum (FR-05). Dipakai layar "Kelas Baru" dan edit di detail kelas. */
export function ClassForm({ initial, submitLabel, onSubmit, onSuccess, onCancel }: ClassFormProps) {
  const [values, setValues] = useState<ClassInput>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const setField = (key: keyof ClassInput) => (value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const submit = async () => {
    const nextErrors = validateClassInput(values);
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
      <FormField
        label="Nama praktikum"
        value={values.courseName}
        onChangeText={setField('courseName')}
        placeholder="Contoh: Praktikum Pemrograman Mobile"
        error={errors.courseName}
      />
      <FormField
        label="Kode kelas"
        value={values.code}
        onChangeText={setField('code')}
        placeholder="Contoh: IF-301"
        autoCapitalize="characters"
        error={errors.code}
      />
      <FormField
        label="Kelompok kelas"
        value={values.classGroup}
        onChangeText={setField('classGroup')}
        placeholder="Contoh: Kelas A"
        error={errors.classGroup}
      />
      <FormField
        label="Ruang"
        value={values.room}
        onChangeText={setField('room')}
        placeholder="Contoh: Lab Komputer 3"
        error={errors.room}
      />
      <FormField
        label="Deskripsi (opsional)"
        value={values.description ?? ''}
        onChangeText={setField('description')}
        placeholder="Ringkasan materi praktikum"
        multiline
        maxLength={200}
      />

      {feedback ? (
        <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} />
      ) : null}

      <ActionButton
        label={busy ? 'Menyimpan…' : submitLabel}
        onPress={submit}
        disabled={busy}
      />
      {onCancel ? <ActionButton label="Batal" tone="secondary" onPress={onCancel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
});
