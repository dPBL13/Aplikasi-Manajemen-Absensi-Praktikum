/**
 * Deklarasi tipe untuk aset CSS (dipakai web).
 *
 * Expo hanya menulis `expo-env.d.ts` saat typed routes aktif. Karena repo ini
 * mematikan typed routes (lihat AI_CONTEXT.md §2), deklarasi CSS ini disimpan
 * permanen di sini agar `tsc` tetap deterministik di semua mesin.
 */

declare module '*.css';

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
