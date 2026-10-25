/** Mengembalikan jam lokal dalam format 24 jam, contoh: "08:05". */
export function formatClock(date: Date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}
