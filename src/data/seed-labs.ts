import type { Laboratory } from '@/types/domain';

/**
 * Data contoh laboratorium Informatika Undip (JH-01). HANYA dipakai adapter
 * mock/fallback di `src/services/` — layar dilarang mengimpor file ini.
 *
 * Koordinat berada di sekitar Departemen Informatika FSM Undip
 * (lat ≈ -7.0498, lng ≈ 110.4391) dan MASIH PERLU DIVERIFIKASI di lapangan
 * lewat tombol "Gunakan Lokasi Saya Saat Ini" pada layar Kelola Lab.
 */
export const seedLaboratories: Laboratory[] = [
  {
    id: 'lab-rpl',
    name: 'Laboratorium Rekayasa Perangkat Lunak',
    code: 'LAB-RPL',
    building: 'Gedung E Lantai 2',
    latitude: -7.049821,
    longitude: 110.43912,
    radius: 50,
    capacity: 40,
    description: 'Lab untuk praktikum pemrograman, rekayasa web, dan mobile',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'seed',
  },
  {
    id: 'lab-jst',
    name: 'Laboratorium Jaringan & Sistem Tertanam',
    code: 'LAB-JST',
    building: 'Gedung E Lantai 2',
    latitude: -7.049702,
    longitude: 110.439305,
    radius: 40,
    capacity: 32,
    description: 'Praktikum jaringan komputer, IoT, dan sistem tertanam',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'seed',
  },
  {
    id: 'lab-kta',
    name: 'Laboratorium Komputasi Terapan',
    code: 'LAB-KTA',
    building: 'Gedung E Lantai 3',
    latitude: -7.049954,
    longitude: 110.439488,
    radius: 50,
    capacity: 36,
    description: 'Praktikum komputasi numerik, basis data, dan analisis data',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'seed',
  },
  {
    id: 'lab-aim',
    name: 'Laboratorium AI & Multimedia',
    code: 'LAB-AIM',
    building: 'Gedung E Lantai 3',
    latitude: -7.049611,
    longitude: 110.439021,
    radius: 60,
    capacity: 30,
    description: 'Praktikum kecerdasan buatan, citra digital, dan multimedia',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'seed',
  },
];

export function getLaboratoryById(id?: string): Laboratory {
  const lab = seedLaboratories.find((l) => l.id === id);
  return lab ?? seedLaboratories[0];
}
