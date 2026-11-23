const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/** Urutan pilihan hari pada form (Senin lebih dulu). */
export const DAY_PICKER_ORDER = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
] as const;

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

/** Format tanggal menjadi "2 November 2026" (format `dateLabel` pada domain). */
export function formatDateLabel(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Nama hari Indonesia untuk tanggal tertentu. */
export function dayLabelForDate(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

/** Baca "2 November 2026" kembali menjadi Date; null bila format tidak dikenali. */
export function parseDateLabel(label: string): Date | null {
  const match = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(label.trim());

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const monthIndex = MONTH_NAMES.findIndex(
    (month) => month.toLowerCase() === match[2].toLowerCase(),
  );

  if (monthIndex < 0) {
    return null;
  }

  const date = new Date(Number(match[3]), monthIndex, day);

  return date.getDate() === day ? date : null;
}

/** Baca "08:05" menjadi Date hari ini dengan jam tersebut; null bila tidak valid. */
export function parseTimeLabel(label: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date;
}
