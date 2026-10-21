# Aplikasi-Manajemen-Absensi-Praktikum

# Aplikasi Manajemen Absensi Praktikum

## Overview

Aplikasi Manajemen Absensi Praktikum adalah aplikasi yang dirancang untuk membantu proses pengelolaan dan pencatatan kehadiran dalam kegiatan praktikum. Aplikasi ini menyediakan antarmuka bagi Asisten Praktikum (Asprak) untuk mengelola sesi praktikum dan memantau kehadiran, serta bagi Praktikan untuk melihat jadwal dan melakukan presensi dengan mudah.

Aplikasi ini dikembangkan untuk membuat alur presensi praktikum lebih terstruktur, jelas, dan mudah digunakan, mulai dari pembukaan sesi hingga penutupan sesi dan pemeriksaan rekap kehadiran.

## Tujuan

Aplikasi ini bertujuan untuk:

- Mempermudah Asisten Praktikum dalam mengelola sesi praktikum.
- Memudahkan Praktikan dalam melihat jadwal dan melakukan presensi.
- Menyediakan informasi kehadiran yang mudah dipantau.
- Membantu pengguna memeriksa riwayat dan rekap presensi.
- Menyediakan antarmuka yang sederhana, intuitif, dan responsif.

## Pengguna Aplikasi

### 1. Asisten Praktikum (Asprak)

Asisten Praktikum bertanggung jawab mengelola jalannya sesi praktikum melalui aplikasi. Fitur yang tersedia meliputi:

- **Melihat Jadwal Praktikum:** Mengetahui jadwal sesi praktikum yang menjadi tanggung jawabnya.
- **Melihat Detail Sesi:** Memeriksa informasi praktikum, kelas, waktu, dan status sesi.
- **Membuka Sesi Praktikum:** Mengaktifkan sesi agar Praktikan dapat melakukan presensi.
- **Memantau Kehadiran:** Melihat daftar Praktikan beserta status kehadirannya.
- **Melihat Rekap Presensi:** Memeriksa daftar kehadiran beserta waktu presensi.
- **Menutup Sesi Praktikum:** Mengakhiri sesi sehingga presensi tidak dapat dilakukan kembali.

### 2. Praktikan

Praktikan menggunakan aplikasi untuk memperoleh informasi praktikum dan mencatat kehadirannya. Fitur yang tersedia meliputi:

- **Melihat Jadwal Praktikum:** Mengetahui jadwal praktikum yang perlu diikuti.
- **Melihat Detail Sesi:** Memeriksa informasi dan status sesi praktikum.
- **Melakukan Presensi:** Mencatat kehadiran ketika sesi praktikum telah dibuka.
- **Melihat Riwayat Presensi:** Memeriksa catatan kehadiran pribadi beserta informasi waktu presensi.

## Alur Penggunaan

Secara umum, penggunaan aplikasi mengikuti alur berikut:

1. Asisten Praktikum melihat jadwal dan detail sesi yang akan dilaksanakan.
2. Asisten Praktikum membuka sesi praktikum.
3. Praktikan melihat sesi yang tersedia dan melakukan presensi ketika sesi berstatus terbuka.
4. Aplikasi memberikan umpan balik atas tindakan presensi dan mencatat waktu kehadiran.
5. Asisten Praktikum memantau daftar kehadiran dan memeriksa rekap presensi.
6. Setelah praktikum selesai, Asisten Praktikum menutup sesi.
7. Praktikan dapat melihat riwayat presensi pribadinya.

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Manajemen Sesi | Membuka dan menutup sesi praktikum. |
| Informasi Jadwal | Menampilkan jadwal dan detail sesi praktikum. |
| Pencatatan Presensi | Memungkinkan Praktikan mencatat kehadiran pada sesi yang terbuka. |
| Pemantauan Kehadiran | Menampilkan daftar Praktikan yang telah melakukan presensi. |
| Rekap Presensi | Menyediakan ringkasan kehadiran dan waktu presensi. |
| Riwayat Kehadiran | Memungkinkan Praktikan memeriksa catatan presensi pribadi. |
| Umpan Balik | Memberikan informasi mengenai keberhasilan atau kegagalan tindakan pengguna. |
| Antarmuka Responsif | Mendukung tampilan yang nyaman pada desktop dan perangkat mobile. |

## Status Sesi Praktikum

Status sesi digunakan untuk membantu pengguna memahami kondisi praktikum dan tindakan yang dapat dilakukan.

- **Belum Dibuka:** Sesi belum diaktifkan oleh Asisten Praktikum sehingga presensi belum dapat dilakukan.
- **Sedang Berlangsung:** Sesi telah dibuka dan Praktikan dapat melakukan presensi.
- **Selesai:** Sesi telah ditutup sehingga presensi baru tidak dapat dilakukan.

## Teknologi dan Cakupan Pengembangan

Pada tahap pengembangan awal (*Sprint 1*), aplikasi berfokus pada pembuatan antarmuka dan demonstrasi alur utama manajemen absensi praktikum.

Data pengguna, jadwal, sesi, dan presensi menggunakan data dummy atau data lokal selama aplikasi berjalan. Tahap ini belum berfokus pada integrasi basis data, autentikasi pengguna sesungguhnya, maupun sinkronisasi data antarperangkat atau antarpengguna.

Dengan demikian, aplikasi pada tahap ini digunakan untuk menunjukkan alur penggunaan dan interaksi utama sebelum pengembangan fitur lanjutan.

## Manfaat

Dengan adanya aplikasi ini, pengelolaan presensi praktikum diharapkan menjadi lebih terstruktur dan mudah dipahami. Asisten Praktikum dapat memantau kehadiran dengan lebih praktis, sedangkan Praktikan dapat mengetahui jadwal, melakukan presensi, dan memeriksa riwayat kehadirannya melalui satu antarmuka.

## Pengembangan Selanjutnya

Aplikasi dapat dikembangkan lebih lanjut dengan menambahkan:

- Penyimpanan data permanen menggunakan basis data.
- Autentikasi dan pengelolaan akun pengguna.
- Sinkronisasi data kehadiran secara real-time.
- Pengelolaan jadwal praktikum yang lebih lengkap.
- Laporan dan ekspor rekap presensi.
- Integrasi dengan sistem informasi akademik atau praktikum yang sudah digunakan.

