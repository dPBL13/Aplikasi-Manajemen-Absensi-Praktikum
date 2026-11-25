import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { RadiusSlider } from '@/components/maps/radius-slider';
import { Spacing } from '@/constants/theme';
import { requestCurrentCoordinate } from '@/hooks/use-user-location';
import {
  LAB_RADIUS_DEFAULT,
  firstError,
  validateLaboratoryInput,
  type LaboratoryInput,
} from '@/services/laboratory-contract';
import type { FieldErrors, MutationResult } from '@/services/types';

/** State form memakai string untuk koordinat agar pengguna dapat mengetik "-7." dsb. */
type FormValues = {
  name: string;
  code: string;
  building: string;
  latitude: string;
  longitude: string;
  radius: number;
  capacity: string;
  description: string;
};

export const EMPTY_LAB_INPUT: LaboratoryInput = {
  name: '',
  code: '',
  building: '',
  latitude: Number.NaN,
  longitude: Number.NaN,
  radius: LAB_RADIUS_DEFAULT,
};

const toValues = (input: LaboratoryInput): FormValues => ({
  name: input.name,
  code: input.code,
  building: input.building,
  latitude: Number.isFinite(input.latitude) ? String(input.latitude) : '',
  longitude: Number.isFinite(input.longitude) ? String(input.longitude) : '',
  radius: input.radius,
  capacity: input.capacity ? String(input.capacity) : '',
  description: input.description ?? '',
});

/** "-7,049" atau "-7.049" → number; kosong/invalid → NaN. */
const parseNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.trim().replace(',', '.')));

const toInput = (values: FormValues): LaboratoryInput => ({
  name: values.name,
  code: values.code,
  building: values.building,
  latitude: parseNumber(values.latitude),
  longitude: parseNumber(values.longitude),
  radius: values.radius,
  capacity: values.capacity.trim() === '' ? undefined : Number(values.capacity),
  description: values.description,
});

type LabFormProps = {
  initial: LaboratoryInput;
  submitLabel: string;
  onSubmit: (input: LaboratoryInput) => Promise<MutationResult>;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/** Form lab (FR-29): koordinat manual atau "Gunakan Lokasi Saya Saat Ini" + slider radius. */
export function LabForm({ initial, submitLabel, onSubmit, onSuccess, onCancel }: LabFormProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);

  const setField = (key: keyof FormValues) => (value: string | number) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    const result = await requestCurrentCoordinate();
    setLocating(false);

    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.reason });
      return;
    }
    if (result.isMocked) {
      setFeedback({ tone: 'error', message: 'Lokasi palsu terdeteksi. Harap matikan aplikasi Fake GPS' });
      return;
    }

    setValues((previous) => ({
      ...previous,
      latitude: result.coordinate.latitude.toFixed(6),
      longitude: result.coordinate.longitude.toFixed(6),
    }));
    setErrors((previous) => ({ ...previous, latitude: '', longitude: '' }));
    setFeedback({
      tone: 'success',
      message:
        result.accuracy !== null
          ? `Koordinat diisi dari lokasi Anda (akurasi ±${Math.round(result.accuracy)} m).`
          : 'Koordinat diisi dari lokasi Anda.',
    });
  };

  const submit = async () => {
    const input = toInput(values);
    const nextErrors = validateLaboratoryInput(input);
    setErrors(nextErrors);
    if (firstError(nextErrors)) return;

    setBusy(true);
    const result = await onSubmit(input);
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
        label="Nama laboratorium"
        value={values.name}
        onChangeText={setField('name')}
        placeholder="Contoh: Laboratorium Rekayasa Perangkat Lunak"
        error={errors.name}
      />
      <FormField
        label="Kode"
        value={values.code}
        onChangeText={setField('code')}
        placeholder="Contoh: LAB-RPL"
        autoCapitalize="characters"
        error={errors.code}
      />
      <FormField
        label="Gedung & lantai"
        value={values.building}
        onChangeText={setField('building')}
        placeholder="Contoh: Gedung E Lantai 2"
        error={errors.building}
      />

      <ActionButton
        label={locating ? 'Membaca lokasi…' : 'Gunakan Lokasi Saya Saat Ini'}
        tone="secondary"
        disabled={locating || busy}
        onPress={useCurrentLocation}
      />

      <FormField
        label="Latitude"
        value={values.latitude}
        onChangeText={setField('latitude')}
        placeholder="-7.049821"
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        error={errors.latitude}
      />
      <FormField
        label="Longitude"
        value={values.longitude}
        onChangeText={setField('longitude')}
        placeholder="110.439120"
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        error={errors.longitude}
      />

      <RadiusSlider value={values.radius} onChange={setField('radius')} error={errors.radius} />

      <FormField
        label="Kapasitas (opsional)"
        value={values.capacity}
        onChangeText={setField('capacity')}
        placeholder="Contoh: 40"
        keyboardType="number-pad"
        error={errors.capacity}
      />
      <FormField
        label="Deskripsi (opsional)"
        value={values.description}
        onChangeText={setField('description')}
        placeholder="Ringkasan fungsi laboratorium"
        multiline
        maxLength={200}
      />

      {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

      <ActionButton label={busy ? 'Menyimpan…' : submitLabel} onPress={submit} disabled={busy} />
      {onCancel ? <ActionButton label="Batal" tone="secondary" onPress={onCancel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({ form: { gap: Spacing.three } });
