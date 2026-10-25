import type { PracticumSession } from '@/types/session';

export const CURRENT_ASPRAK_NAME = 'Johan Reinhart Calvin';

const participant = (id: string, name: string, nim: string, checkInAt?: string) => ({
  id,
  name,
  nim,
  checkInAt,
});

/**
 * Data dummy Sprint 1. Seluruh sesi di bawah ini adalah sesi yang menjadi
 * tanggung jawab Asprak yang sedang login (FR-01).
 */
export const dummySessions: PracticumSession[] = [
  {
    id: 'sesi-mobile-a',
    courseName: 'Praktikum Pemrograman Mobile',
    classGroup: 'Kelas A',
    room: 'Lab Komputer 3',
    dayLabel: 'Senin',
    dateLabel: '26 Oktober 2026',
    startTime: '08:00',
    endTime: '10:00',
    asprakName: CURRENT_ASPRAK_NAME,
    status: 'berlangsung',
    openedAt: '08:00',
    participants: [
      participant('p1', 'Anisa Rahmawati', '24060122140001', '08:02'),
      participant('p2', 'Bagas Prakoso', '24060122140002', '08:05'),
      participant('p3', 'Citra Lestari', '24060122140003', '08:09'),
      participant('p4', 'Dimas Saputra', '24060122140004', '08:14'),
      participant('p5', 'Eka Putri', '24060122140005', '08:21'),
      participant('p6', 'Fajar Nugroho', '24060122140006'),
      participant('p7', 'Gita Maharani', '24060122140007'),
      participant('p8', 'Hendra Wijaya', '24060122140008'),
    ],
  },
  {
    id: 'sesi-basisdata-b',
    courseName: 'Praktikum Basis Data',
    classGroup: 'Kelas B',
    room: 'Lab Komputer 1',
    dayLabel: 'Selasa',
    dateLabel: '27 Oktober 2026',
    startTime: '10:00',
    endTime: '12:00',
    asprakName: CURRENT_ASPRAK_NAME,
    status: 'belum-dibuka',
    participants: [
      participant('p9', 'Indah Permata', '24060122140101'),
      participant('p10', 'Joko Susilo', '24060122140102'),
      participant('p11', 'Kartika Sari', '24060122140103'),
      participant('p12', 'Lukman Hakim', '24060122140104'),
      participant('p13', 'Maya Anggraini', '24060122140105'),
      participant('p14', 'Naufal Rizki', '24060122140106'),
      participant('p15', 'Olivia Sanjaya', '24060122140107'),
      participant('p16', 'Putra Mahendra', '24060122140108'),
    ],
  },
  {
    id: 'sesi-strukturdata-c',
    courseName: 'Praktikum Struktur Data',
    classGroup: 'Kelas C',
    room: 'Lab Komputer 2',
    dayLabel: 'Rabu',
    dateLabel: '28 Oktober 2026',
    startTime: '13:00',
    endTime: '15:00',
    asprakName: CURRENT_ASPRAK_NAME,
    status: 'selesai',
    openedAt: '13:00',
    closedAt: '15:00',
    closingNote: 'Sesi ditutup tepat waktu.',
    participants: [
      participant('p17', 'Qori Amalia', '24060122140201', '13:03'),
      participant('p18', 'Rangga Pratama', '24060122140202', '13:06'),
      participant('p19', 'Sinta Dewi', '24060122140203', '13:10'),
      participant('p20', 'Taufik Hidayat', '24060122140204', '13:15'),
      participant('p21', 'Umi Kalsum', '24060122140205', '13:24'),
      participant('p22', 'Vino Alfarizi', '24060122140206', '13:31'),
      participant('p23', 'Wulan Sari', '24060122140207', '13:42'),
      participant('p24', 'Yoga Prasetyo', '24060122140208'),
    ],
  },
];
