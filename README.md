# Aplikasi-Manajemen-Absensi-Praktikum
### Disusun oleh:
### - Laurensius Brian Prayoga - 24060124130077 - @dpbl13
### - Aswalila Adha Putri Telaumbanua - 24060124120014 - @ Aswalilaa
### - Johan Reinhart Calvin - 24060124130076 - @Justm3157
### - Muhamad Hafidz Zulfikar - 24060122140141 - @hafiszulfikar

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

#

# Software Requirements Specification (SRS)

### A. Kebutuhan Fungsional (FR)

| Kode | Nama Kebutuhan | Deskripsi |
|---|---|---|
| FR-01 | Jadwal Asprak | Asprak dapat melihat jadwal sesi praktikum yang menjadi tanggung jawabnya. |
| FR-02 | Detail Sesi | Asprak dapat melihat detail dan status sesi praktikum. |
| FR-03 | Membuka Sesi | Asprak dapat membuka sesi agar Praktikan dapat melakukan presensi. |
| FR-04 | Pemantauan Kehadiran | Asprak dapat melihat daftar dan status kehadiran Praktikan. |
| FR-05 | Rekap Presensi | Asprak dapat melihat rekap kehadiran beserta waktu presensi. |
| FR-06 | Menutup Sesi | Asprak dapat menutup sesi agar presensi baru tidak dapat dilakukan. |
| FR-07 | Jadwal Praktikan | Praktikan dapat melihat jadwal dan detail sesi praktikum. |
| FR-08 | Presensi Praktikan | Praktikan dapat mencatat kehadiran ketika sesi sedang dibuka. |
| FR-09 | Riwayat Presensi | Praktikan dapat melihat riwayat kehadiran pribadinya. |
| FR-10 | Pergantian Perspektif | Pengguna dapat berpindah antara perspektif Asprak dan Praktikan untuk keperluan demonstrasi. |
| FR-11 | Validasi Tindakan | Aplikasi membatasi tindakan berdasarkan status sesi, termasuk mencegah presensi saat sesi belum dibuka atau telah ditutup. |
| FR-12 | Umpan Balik | Aplikasi memberikan notifikasi atau informasi mengenai keberhasilan dan kegagalan tindakan pengguna. |
| FR-13 | Navigasi | Pengguna dapat berpindah halaman melalui navigasi yang jelas. |
| FR-14 | Tampilan Responsif | Antarmuka menyesuaikan ukuran layar desktop dan perangkat mobile. |
| FR-15 | Data Dummy dan Kondisi Kosong | Aplikasi menyediakan data contoh dan tampilan kondisi kosong untuk mendukung demonstrasi alur penggunaan. |

### B. Kebutuhan Nonfungsional (NFR)

| Kode | Nama Kebutuhan | Deskripsi |
|---|---|---|
| NFR-01 | Responsivitas | Antarmuka dapat digunakan dengan nyaman pada desktop dan perangkat mobile. |
| NFR-02 | Kemudahan Penggunaan | Antarmuka memiliki navigasi yang jelas dan alur interaksi yang mudah dipahami. |
| NFR-03 | Konsistensi | Informasi sesi dan status presensi ditampilkan secara konsisten pada halaman terkait. |
| NFR-04 | Keandalan Interaksi | Interaksi utama berjalan dengan baik dan menangani kondisi seperti sesi belum dibuka, sesi selesai, serta presensi yang sudah tercatat. |
| NFR-05 | Kemudahan Pengembangan | Struktur aplikasi dibuat agar mudah dipelihara dan dikembangkan pada sprint berikutnya. |

### C. Kebutuhan Bisnis (BF)

| Kode | Nama Kebutuhan | Deskripsi |
|---|---|---|
| BF-01 | Efisiensi Presensi Praktikum | Menyediakan proses pencatatan kehadiran praktikan yang lebih praktis dan terstruktur. |
| BF-02 | Pengelolaan Sesi Praktikum | Membantu Asisten Praktikum mengelola sesi, mulai dari pembukaan hingga penutupan. |
| BF-03 | Pemantauan Kehadiran | Memudahkan Asisten Praktikum mengetahui praktikan yang sudah dan belum melakukan presensi. |
| BF-04 | Transparansi Informasi | Memudahkan praktikan memperoleh informasi jadwal, detail sesi, dan status praktikum. |
| BF-05 | Akses Riwayat Presensi | Memungkinkan praktikan memeriksa catatan kehadiran pribadinya. |
| BF-06 | Kemudahan Penggunaan | Menyediakan antarmuka yang sederhana dan mudah digunakan oleh Asprak maupun Praktikan. |
| BF-07 | Demonstrasi Alur Praktikum | Menyediakan prototipe interaktif untuk mendemonstrasikan alur manajemen absensi pada Sprint 1 menggunakan data dummy atau lokal. |

### D. Batasan Implementasi Sprint 1

- Data pengguna, jadwal, sesi, dan presensi menggunakan data dummy atau lokal.
- Perubahan data dikelola selama aplikasi berjalan; penyimpanan permanen belum menjadi fokus sprint ini.
- Belum terdapat integrasi basis data, autentikasi pengguna sesungguhnya, atau sinkronisasi data antarperangkat.
- Presensi hanya dapat dilakukan pada sesi yang sedang dibuka dan satu Praktikan tidak dapat melakukan presensi berulang pada sesi yang sama.
- Pergantian perspektif Asprak dan Praktikan digunakan untuk demonstrasi alur aplikasi, bukan sebagai sistem otorisasi pengguna yang sesungguhnya.


# Pembagian Tugas Fitur Sprint 1

| Nama Programmer | Kode SRS | Pembagian Fitur |
|---|---|---|
| Johan | FR-01–FR-06 | **Modul Asprak:** melihat jadwal dan detail sesi, membuka dan menutup sesi praktikum, memantau kehadiran, serta melihat rekap presensi. |
| Aswalila | FR-07–FR-09 | **Modul Praktikan:** melihat jadwal dan detail sesi, melakukan presensi, serta melihat riwayat kehadiran pribadi. |
| Hafidz | FR-10–FR-15 | **Integrasi UI:** pergantian perspektif Asprak/Praktikan, validasi tindakan, notifikasi, navigasi, tampilan responsif, serta data dummy dan kondisi kosong. |
