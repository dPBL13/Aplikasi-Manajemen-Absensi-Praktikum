Kebutuhan Fungsional (FR)
Kode	Deskripsi
FR-01	Pengguna dapat membuat akun baru menggunakan Firebase Authentication.
FR-02	Pengguna dapat masuk ke aplikasi menggunakan akun yang telah terdaftar.
FR-03	Pengguna dapat keluar dari akun dan mengakhiri sesi autentikasi.
FR-04	Aplikasi dapat membedakan pengguna berdasarkan peran Asisten Praktikum dan Praktikan serta membatasi tindakan sesuai kewenangannya.
FR-05	Asisten dapat menambahkan, melihat, mengubah, dan menghapus data kelas praktikum melalui Cloud Firestore.
FR-06	Asisten dapat mengelola data peserta praktikum sesuai kebutuhan kelas.
FR-07	Asisten dapat mengelola jadwal kegiatan praktikum dan Praktikan dapat melihat jadwal yang berkaitan dengan dirinya.
FR-08	Asisten dapat melihat detail, membuka, mengubah informasi, dan menutup sesi praktikum.
FR-09	Pengguna dapat melihat informasi kelas, jadwal, waktu, dan status sesi sesuai dengan hak aksesnya.
FR-10	Praktikan dapat mencatat kehadiran ketika sesi praktikum sedang dibuka.
FR-11	Aplikasi mencegah Praktikan melakukan presensi lebih dari satu kali pada sesi yang sama.
FR-12	Asisten dapat melihat daftar Praktikan beserta status kehadiran pada sesi praktikum.
FR-13	Asisten dapat melihat rekap kehadiran beserta waktu presensi Praktikan.
FR-14	Praktikan dapat melihat riwayat kehadiran pribadinya berdasarkan data yang tersimpan di Firestore.
FR-15	Perubahan status sesi, pencatatan presensi, dan rekap kehadiran dapat diperbarui secara otomatis tanpa perlu menjalankan ulang aplikasi.
FR-16	Praktikan dapat mengajukan izin untuk sesi tertentu dengan mengisi alasan ketidakhadiran.
FR-17	Aplikasi mengirimkan alasan pengajuan izin ke API model AI untuk memperoleh prediksi kategori alasan.
FR-18	Aplikasi menyimpan hasil klasifikasi AI bersama data pengajuan izin di Cloud Firestore.
FR-19	Asisten dapat melihat daftar pengajuan izin beserta alasan ketidakhadiran dan hasil klasifikasi AI.
FR-20	Asisten dapat menerima atau menolak pengajuan izin dan menyimpan keputusan tersebut ke Firestore.
FR-21	Praktikan dapat melihat status pengajuan izin, baik menunggu pemeriksaan, diterima, maupun ditolak.
FR-22	Aplikasi membatasi tindakan berdasarkan role pengguna dan kondisi data, termasuk mencegah presensi ketika sesi belum dibuka atau telah ditutup.
FR-23	Aplikasi melakukan validasi terhadap data yang dimasukkan pengguna, termasuk formulir registrasi dan pengajuan izin.
FR-24	Aplikasi memberikan informasi ketika terjadi kegagalan autentikasi, komunikasi Firestore, atau API AI.
FR-25	Aplikasi menyediakan navigasi dan tampilan halaman yang disesuaikan dengan peran pengguna.
FR-26	Aplikasi memberikan notifikasi atau informasi mengenai keberhasilan dan kegagalan tindakan pengguna.

Laurensius Brian Prayoga
FR-01–FR-04, FR-15, FR-17–FR-18, FR-23–FR-24
Modul Backend dan Integrasi Firebase: Implementasi Firebase Authentication (registrasi, login, dan logout), pengelolaan identitas serta role pengguna, konfigurasi Cloud Firestore, perancangan struktur database, implementasi layanan CRUD Firestore bersama, sinkronisasi data real-time, Firebase Security Rules, integrasi API AI untuk klasifikasi alasan izin, penyimpanan hasil klasifikasi, serta penanganan kesalahan komunikasi layanan.

Johan Reinhart Calvin
FR-05–FR-09, FR-12–FR-13, FR-19–FR-20
Modul Asisten Praktikum: Implementasi dashboard Asisten, menampilkan jadwal dan detail sesi praktikum, pengelolaan data kelas dan sesi praktikum, membuka dan menutup sesi, pemantauan kehadiran secara real-time, menampilkan rekap presensi, melihat daftar pengajuan izin beserta hasil klasifikasi AI, serta menerima atau menolak pengajuan izin.

Aswalila Adha Putri Telaumbanua
FR-07, FR-09–FR-11, FR-14, FR-16, FR-21–FR-22, FR-25–FR-26
Modul Praktikan: Implementasi dashboard Praktikan, menampilkan jadwal dan detail sesi praktikum, melakukan presensi melalui Firestore, validasi agar tidak terjadi presensi ganda, menampilkan riwayat kehadiran, implementasi formulir pengajuan izin, menampilkan hasil klasifikasi AI, memantau status pengajuan izin, serta implementasi validasi tindakan, navigasi, dan umpan balik pada sisi Praktikan.