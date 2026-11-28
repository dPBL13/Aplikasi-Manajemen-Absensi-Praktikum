/**
 * GeofenceCircle — visualisasi lingkaran radius dihapus sesuai spesifikasi:
 * hanya marker/pin lab dan posisi pengguna yang ditampilkan di peta.
 *
 * File dipertahankan agar tidak ada missing-module error jika ada impor sisa,
 * tetapi komponen ini merender `null` (tidak terlihat).
 */
import type { Laboratory } from '@/types/domain';

type GeofenceCircleProps = {
  lab: Pick<Laboratory, 'latitude' | 'longitude' | 'radius'>;
  /** true = pengguna di dalam radius (warna sukses), false/undefined = aksen netral. */
  isUserInside?: boolean;
};

/** Overlay lingkaran radius geofencing — saat ini dinonaktifkan (hanya marker yang ditampilkan). */
export function GeofenceCircle(_props: GeofenceCircleProps) {
  return null;
}
