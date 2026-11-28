import { GoogleGenAI } from '@google/genai';

import type { PermitCategory } from '@/types/domain';
import { classifyLeaveReasonLocal } from './local-classifier';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const MODEL_NAME = 'gemini-2.5-flash';

export interface AIClassificationResult {
  category: PermitCategory;
  confidence: number;
  model: string;
  reasoning?: string;
}

/**
 * Fallback jika koneksi internet terputus atau API Gemini mengalami kegagalan/kuota habis.
 * Menggunakan model NLP offline lokal (model-izin.json) yang telah dilatih.
 */
function fallbackClassification(reason: string): AIClassificationResult {
  const localResult = classifyLeaveReasonLocal(reason);
  if (localResult.category !== 'belum-diklasifikasi') {
    return {
      category: localResult.category,
      confidence: localResult.confidence ?? 0.85,
      model: localResult.model,
      reasoning: localResult.reasoning ?? 'Hasil klasifikasi model NLP lokal.',
    };
  }

  const lower = reason.toLowerCase();

  const sakitKeywords = [
    'sakit', 'demam', 'pusing', 'batuk', 'flu', 'mual', 'muntah',
    'opname', 'dokter', 'klinik', 'rumah sakit', 'rs', 'infus',
    'cedera', 'tipes', 'tifus', 'asma', 'maag', 'gigi'
  ];

  const kampusKeywords = [
    'lomba', 'seminar', 'sidang', 'organisasi', 'bem', 'himpunan',
    'dinas', 'delegasi', 'kuliah', 'ujian', 'praktikum lain',
    'workshop', 'pelatihan', 'konferensi', 'acara kampus'
  ];

  const keluargaKeywords = [
    'keluarga', 'orang tua', 'ayah', 'ibu', 'nenek', 'kakek',
    'adik', 'kakak', 'meninggal', 'duka', 'pernikahan', 'wali'
  ];

  if (sakitKeywords.some((kw) => lower.includes(kw))) {
    return {
      category: 'sakit',
      confidence: 0.88,
      model: `${MODEL_NAME} (fallback-heuristic)`,
      reasoning: 'Terdeteksi kondisi medis/kesehatan.',
    };
  }

  if (kampusKeywords.some((kw) => lower.includes(kw))) {
    return {
      category: 'acara-kampus',
      confidence: 0.85,
      model: `${MODEL_NAME} (fallback-heuristic)`,
      reasoning: 'Terdeteksi kegiatan resmi kampus/akademik.',
    };
  }

  if (keluargaKeywords.some((kw) => lower.includes(kw))) {
    return {
      category: 'keluarga',
      confidence: 0.82,
      model: `${MODEL_NAME} (fallback-heuristic)`,
      reasoning: 'Terdeteksi keperluan keluarga mendesak.',
    };
  }

  return {
    category: 'lainnya',
    confidence: 0.7,
    model: `${MODEL_NAME} (fallback-heuristic)`,
    reasoning: 'Alasan umum/tidak masuk kategori utama.',
  };
}

/**
 * Mengirimkan alasan pengajuan izin praktikan ke Gemini AI untuk
 * diklasifikasikan ke dalam 4 kategori kanonikal (FR-17).
 */
export async function classifyLeaveReason(
  reason: string
): Promise<AIClassificationResult> {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    return {
      category: 'belum-diklasifikasi',
      confidence: 0,
      model: MODEL_NAME,
    };
  }

  if (!GEMINI_API_KEY) {
    return fallbackClassification(cleanReason);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `Kamu adalah asisten kecerdasan buatan untuk sistem absensi praktikum di universitas.
Tugasmu adalah menganalisis dan mengklasifikasikan alasan ketidakhadiran/izin mahasiswa berikut:
"${cleanReason}"

Klasifikasikan hanya ke dalam SALAH SATU dari 4 kategori kanonikal ini:
1. "sakit" : Alasan terkait sakit, keluhan medis, kontrol dokter, rawat inap, cedera.
2. "acara-kampus" : Alasan terkait lomba akademik/non-akademik, tugas dinas, konferensi, sidang, ujian, delegasi universitas/fakultas.
3. "keluarga" : Alasan terkait keperluan darurat keluarga, kedukaan/kematian, acara keluarga inti mendesak.
4. "lainnya" : Alasan di luar ketiga kategori di atas (misal: urusan pribadi umum, bangun kesiangan, berlibur, alasan tidak masuk akal, atau tidak jelas).

Jawab HANYA dalam format JSON murni tanpa markdown, tanpa backtick, contoh:
{"category": "sakit", "confidence": 0.95, "reasoning": "Mahasiswa mengalami demam dan harus istirahat."}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text ? response.text.trim() : '';

    // Bersihkan jika ada bungkus markdown ```json ... ```
    const sanitized = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(sanitized);

    const validCategories: PermitCategory[] = [
      'sakit',
      'acara-kampus',
      'keluarga',
      'lainnya',
    ];

    const category: PermitCategory = validCategories.includes(parsed.category)
      ? parsed.category
      : 'lainnya';

    const confidence =
      typeof parsed.confidence === 'number'
        ? Math.min(Math.max(parsed.confidence, 0), 1)
        : 0.9;

    return {
      category,
      confidence,
      model: MODEL_NAME,
      reasoning: parsed.reasoning || undefined,
    };
  } catch (error) {
    console.warn(
      '[gemini-service] Gagal memanggil API Gemini, beralih ke fallback heuristik:',
      error
    );
    return fallbackClassification(cleanReason);
  }
}
