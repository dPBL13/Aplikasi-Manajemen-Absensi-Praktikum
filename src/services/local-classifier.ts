import model from '../../ai/model-izin.json';

import type { PermitCategory } from '@/types/domain';

/**
 * Klasifikasi alasan izin secara OFFLINE (FR-17/FR-18).
 *
 * Memakai model teks hasil latihan `ai/train_izin.py` (`ai/model-izin.json`).
 * Inferensi ditulis di sini (TypeScript murni, tanpa jaringan dan tanpa dependensi
 * ke `ai/sentiment.js`) dan harus selalu identik dengan `normalize`/`analyzer`
 * di `ai/train_izin.py`. Hasilnya diisikan ke `Permit.aiCategory / aiConfidence /
 * aiModel` oleh `firestore-service.ts`.
 *
 * Gemini (`gemini-service.ts`) sengaja tidak dipakai lagi, tetapi file-nya dibiarkan.
 */

export const LOCAL_MODEL_NAME = 'model-izin-lokal-v1 (offline)';

/**
 * Probabilitas minimum agar kategori dipercaya. Di bawah ini alasan ditandai
 * `belum-diklasifikasi` supaya asprak menilai sendiri.
 */
export const MIN_CONFIDENCE = 0.5;

export interface LocalClassificationResult {
  category: PermitCategory;
  /** Probabilitas 0–1, atau null bila belum diklasifikasi. */
  confidence: number | null;
  model: string;
  reasoning?: string;
}

interface IntentModel {
  schema_version: number;
  labels: string[];
  aliases: Record<string, string>;
  vocabulary: Record<string, number>;
  idf: number[];
  weights: number[][];
  bias: number[];
}

const VALID_CATEGORIES: PermitCategory[] = ['sakit', 'acara-kampus', 'keluarga', 'lainnya'];

const owns = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

/** Skor mentah per label, atau null bila tidak ada kata/frasa yang dikenali model. */
function scoreText(m: IntentModel, text: string): number[] | null {
  const normalized = text
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  const words = (normalized.match(/[a-z0-9]+/g) ?? []).map((word) =>
    owns(m.aliases, word) ? m.aliases[word] : word,
  );
  const grams = words.concat(words.slice(1).map((word, i) => `${words[i]} ${word}`));

  const counts = new Map<number, number>();
  for (const gram of grams) {
    if (owns(m.vocabulary, gram)) {
      const index = m.vocabulary[gram];
      counts.set(index, (counts.get(index) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return null;
  }

  const values = Array.from(counts, ([index, count]): [number, number] => [
    index,
    (1 + Math.log(count)) * m.idf[index],
  ]);
  const norm = Math.sqrt(values.reduce((sum, [, value]) => sum + value ** 2, 0));

  return m.weights.map((weights, c) =>
    values.reduce((score, [index, value]) => score + (weights[index] * value) / norm, m.bias[c]),
  );
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((score) => Math.exp(score - max));
  const total = exps.reduce((sum, value) => sum + value, 0);

  return exps.map((value) => value / total);
}

const UNCLASSIFIED: LocalClassificationResult = {
  category: 'belum-diklasifikasi',
  confidence: null,
  model: LOCAL_MODEL_NAME,
};

export function classifyLeaveReasonLocal(reason: string): LocalClassificationResult {
  const text = reason.trim();
  if (!text) {
    return UNCLASSIFIED;
  }

  const intentModel = model as unknown as IntentModel;
  if (intentModel.schema_version !== 1) {
    console.warn('[local-classifier] Format model alasan izin tidak didukung.');
    return UNCLASSIFIED;
  }

  const scores = scoreText(intentModel, text);

  // Tidak ada satu pun kata yang dikenali model → jangan ditebak.
  if (!scores) {
    return { ...UNCLASSIFIED, reasoning: 'Kata pada alasan tidak dikenali model.' };
  }

  const probabilities = softmax(scores);
  const best = probabilities.indexOf(Math.max(...probabilities));
  const category = intentModel.labels[best] as PermitCategory;
  const confidence = Math.round(probabilities[best] * 100) / 100;

  if (!VALID_CATEGORIES.includes(category) || confidence < MIN_CONFIDENCE) {
    return { ...UNCLASSIFIED, reasoning: 'Keyakinan model rendah, mohon dinilai manual.' };
  }

  return { category, confidence, model: LOCAL_MODEL_NAME };
}
