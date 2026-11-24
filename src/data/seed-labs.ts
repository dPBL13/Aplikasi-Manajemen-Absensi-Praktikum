import type { Laboratory } from '@/types/domain';

/**
 * Data seed master laboratorium Departemen Informatika Universitas Diponegoro.
 * Koordinat sentroid berbasis area Gedung E Departemen Informatika FSM Undip.
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
    updatedBy: 'asprak-001',
  },
  {
    id: 'lab-jarkom',
    name: 'Laboratorium Jaringan & Sistem Tertanam',
    code: 'LAB-JARKOM',
    building: 'Gedung E Lantai 2',
    latitude: -7.0499,
    longitude: 110.4392,
    radius: 50,
    capacity: 35,
    description: 'Lab untuk praktikum jaringan komputer, sistem operasi, dan IoT',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'asprak-001',
  },
  {
    id: 'lab-komputasi',
    name: 'Laboratorium Komputasi Terapan & Basis Data',
    code: 'LAB-KOMPUTASI',
    building: 'Gedung E Lantai 3',
    latitude: -7.04975,
    longitude: 110.43905,
    radius: 50,
    capacity: 45,
    description: 'Lab untuk sistem basis data, algoritma, dan pemrograman lanjut',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'asprak-001',
  },
  {
    id: 'lab-ai',
    name: 'Laboratorium Kecerdasan Buatan & Grafika',
    code: 'LAB-AI',
    building: 'Gedung E Lantai 3',
    latitude: -7.04988,
    longitude: 110.43915,
    radius: 50,
    capacity: 40,
    description: 'Lab untuk kecerdasan buatan, visi komputer, dan multimedia',
    updatedAt: '2026-11-20T10:00:00.000Z',
    updatedBy: 'asprak-001',
  },
];

export function getLaboratoryById(id?: string): Laboratory {
  const lab = seedLaboratories.find((l) => l.id === id);
  return lab ?? seedLaboratories[0];
}
