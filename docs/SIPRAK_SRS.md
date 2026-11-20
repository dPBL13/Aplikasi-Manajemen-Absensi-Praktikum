# Software Requirements Specification (SRS)
## Sistem Informasi Manajemen Presensi Praktikum (SIPRAK) Informatika Undip
### Versi Dokumen: 3.0.0 — Sprint 3: Geolocation, Interactive Maps & Push Notifications

---

## 1. Dasar Penyusunan & Pendahuluan

### 1.1 Dasar Penyusunan
Dokumen Software Requirements Specification (SRS) ini disusun sebagai acuan tunggal (*single source of truth*) dalam pengembangan aplikasi mobile **SIPRAK Informatika Undip** pada siklus **Sprint 3**. Dokumen ini memperluas fondasi Sprint 1 (manajemen kelas dan sesi asisten) serta Sprint 2 (integrasi Firebase Auth, sinkronisasi data real-time Firestore, dan klasifikasi perizinan berbasis AI), dengan menambahkan kapabilitas perangkat keras native: **Geolocation & Geofencing**, **Peta Interaktif Laboratorium (Google Maps)**, dan **Rich Push Notifications (Firebase Cloud Messaging - FCM)**.

### 1.2 Tujuan
Tujuan pembangunan SIPRAK Informatika Undip pada Sprint 3 adalah:
1. **Integritas Presensi Berbasis Lokasi Fisik:** Meniadakan kecurangan absensi (*titip presensi* atau presensi jarak jauh) dengan memvalidasi posisi GPS praktikan terhadap koordinat dan radius geofencing laboratorium praktikum yang ditentukan oleh Asisten Praktikum (Asprak).
2. **Visibilitas Fasilitas & Aktivitas Laboratorium:** Menyediakan peta digital interaktif lingkungan Departemen Informatika Universitas Diponegoro yang memetakan sebaran laboratorium komputer beserta pemantauan aktivitas praktikum yang sedang berlangsung (*ongoing*) dan praktikum berikutnya (*upcoming*) secara *real-time*.
3. **Penyampaian Informasi Kritis Proaktif:** Memastikan praktikan dan asisten mendapatkan notifikasi instan langsung ke perangkat (*lockscreen* / *heads-up*) ketika sesi praktikum dibuka, jadwal diubah, atau status pengajuan izin diputuskan tanpa mengharuskan pengguna membuka aplikasi secara berkala.

### 1.3 Gambaran Umum Sistem
SIPRAK Informatika Undip adalah aplikasi *mobile-first* berbasis React Native (Expo SDK 58 & Expo Router) yang dirancang untuk platform Android dan iOS. Sistem mengintegrasikan Cloud Firestore sebagai basis data dokumen *real-time*, Firebase Authentication untuk kontrol akses berbasis peran (RBAC), Firebase Cloud Messaging (FCM) untuk pengiriman push notification lintas-platform, serta Google Maps SDK dan modul Geolocation untuk penentuan koordinat presisi tinggi.

```
+-----------------------------------------------------------------------------------+
|                            SIPRAK Mobile Client (Expo)                            |
|  +--------------------+  +-------------------------+  +------------------------+  |
|  | Modul Praktikan    |  | Modul Asisten (Asprak)  |  | Shared Services        |  |
|  | - Presensi Lokasi  |  | - Kelola Lab & Radius   |  | - Maps & Geofencing    |  |
|  | - Peta Lab & Sesi  |  | - Buka/Tutup Sesi (Push)|  | - Push Notification   |  |
|  | - Pengajuan Izin   |  | - Validasi Presensi Lab |  | - Permission Handler   |  |
|  +--------------------+  +-------------------------+  +------------------------+  |
+-----------------------------------------------------------------------------------+
          |                                  |                             |
          v                                  v                             v
+--------------------+            +--------------------+         +--------------------+
| Firebase Auth &    |            | Google Maps SDK &  |         | Firebase Cloud     |
| Cloud Firestore    |            | Expo Location API  |         | Messaging (FCM v1) |
+--------------------+            +--------------------+         +--------------------+
```

### 1.4 Ruang Lingkup (In-Scope & Out-of-Scope)

#### Ruang Lingkup Masuk (In-Scope — Sprint 3):
1. **Halaman Presensi Khusus & Mandiri:** Antarmuka khusus presensi bagi praktikan yang terpisah dari halaman detail sesi, dilengkapi visualisasi jarak ke laboratorium, status radius, countdown penutupan sesi, dan tombol eksekusi kehadiran.
2. **Validasi Geofencing Presensi:** Verifikasi koordinat GPS pengguna menggunakan algoritma *Haversine* terhadap titik sentroid laboratorium dan radius toleransi (meter). Pencatatan kehadiran ditolak jika pengguna di luar radius atau lokasi palsu (*mock provider*) terdeteksi.
3. **Pengelolaan Master Data Laboratorium:** Fitur bagi Asprak untuk mendefinisikan dan memperbarui nama lab, gedung, lantai, titik koordinat (*latitude*, *longitude*), serta radius toleransi default maupun per-kegiatan praktikum.
4. **Peta Interaktif Laboratorium (Interactive Maps):** Peta wilayah Informatika Undip dengan penanda (*custom marker*) tiap laboratorium dan penanda posisi pengguna (*live tracking marker*) yang terbarui secara berkala.
5. **Informasi Aktivitas Laboratorium Real-time:** Panel detail laboratorium (bottom sheet) saat marker lab dipilih yang menampilkan jadwal kegiatan praktikum yang sedang berlangsung (*active session*) dan praktikum berikutnya (*next session*).
6. **Sistem Push Notification Berbasis Peristiwa:**
   - Pemberitahuan saat Sesi Praktikum dibuka (ditujukan ke seluruh praktikan terdaftar di kelas bersangkutan).
   - Pemberitahuan saat Jadwal Praktikum diubah (ditujukan ke seluruh praktikan kelas bersangkutan).
   - Pemberitahuan saat Pengajuan Izin diterima atau ditolak (ditujukan khusus ke praktikan pengaju).
7. **Manajemen Device Permission & Kondisi Hardware:** Penanganan izin runtime sistem operasi (`ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`, `CAMERA`), deteksi status GPS aktif/nonaktif, mode hemat daya, serta mitigasi koneksi internet terputus.
8. **Fitur Opsional / Pengayaan:** Pemindaian presensi berbasis QR Code dinamis terenkripsi waktu sebagai pelengkap validasi lokasi.

#### Ruang Lingkup Luar (Out-of-Scope):
1. Pembayaran kompensasi praktikum atau denda absensi.
2. Manajemen inventaris perangkat keras laboratorium (PC, switch, router).
3. Integrasi Single Sign-On (SSO) terpusat Universitas Diponegoro (SSO Undip CAS/SAML) — autentikasi menggunakan Firebase Auth email/password.
4. Pembuatan aplikasi versi Web Admin (seluruh kontrol dilakukan via antarmuka mobile khusus Asprak).

---

## 2. Terminologi dan Singkatan

| Istilah / Singkatan | Definisi |
|---|---|
| **SIPRAK** | Sistem Informasi Manajemen Presensi Praktikum Informatika Undip. |
| **Asprak** | Asisten Praktikum; mahasiswa senior atau asisten laboratorium yang mengelola kelas, sesi, jadwal, data laboratorium, dan validasi kehadiran. |
| **Praktikan** | Mahasiswa peserta praktikum yang terdaftar pada satu atau lebih kelas praktikum. |
| **Geofencing** | Batas geografis virtual yang ditentukan oleh koordinat pusat (*latitude*, *longitude*) dan radius jarak tertentu (dalam meter). |
| **Haversine Formula** | Persamaan navigasi matematika untuk menghitung jarak lingkaran besar (*great-circle distance*) antara dua titik koordinat pada permukaan bola bumi. |
| **FCM** | Firebase Cloud Messaging; layanan pengiriman pesan push notification lintas-platform dari Google. |
| **Device Token** | Token pendaftaran unik yang diterbitkan oleh FCM untuk tiap instans instalasi aplikasi pada perangkat fisik pengguna. |
| **Foreground State** | Kondisi aplikasi sedang aktif dibuka dan ditampilkan di layar pengguna. |
| **Background / Quit State** | Kondisi aplikasi berjalan di latar belakang atau telah dihentikan secara penuh oleh sistem operasi / pengguna. |
| **Mock Location** | Fitur pengembang pada sistem operasi mobile yang memalsukan koordinat GPS perangkat fisik. |
| **RBAC** | Role-Based Access Control; pembatasan akses fungsi berdasarkan peran pengguna (`asprak` atau `praktikan`). |

---

## 3. Aktor dan Matriks Kontrol Akses (RBAC)

### 3.1 Identifikasi Aktor
1. **Praktikan:**
   - Melakukan presensi mandiri pada sesi yang dibuka dalam radius lab.
   - Melihat visualisasi sebaran lab dan aktivitasnya pada peta.
   - Menerima push notification terkait pembukaan sesi, perubahan jadwal, dan hasil izin.
   - Melihat riwayat presensi pribadi dan mengajukan izin ketidakhadiran.
2. **Asisten Praktikum (Asprak):**
   - Mengelola kelas, peserta, jadwal, dan sesi praktikum.
   - Menentukan lokasi fisik dan radius toleransi laboratorium.
   - Membuka dan menutup sesi praktikum (memicu push notification otomatis).
   - Memantau rekap presensi beserta metadata kepatuhan lokasi (jarak presensi praktikan).
   - Memeriksa pengajuan izin dan memberikan keputusan (memicu push notification).
3. **Sistem (Background Engine / Trigger Service):**
   - Memvalidasi jarak geofencing sebelum mengizinkan penulisan status kehadiran.
   - Mengirimkan pesan push notification melalui FCM ke target token pengguna.
   - Memantau status GPS dan perizinan perangkat secara reaktif.

### 3.2 Matriks Otorisasi Resource (RBAC Matrix)

| Resource / Fitur | Praktikan | Asisten Praktikum (Asprak) | Aturan Otorisasi Khusus |
|---|:---:|:---:|---|
| **Melihat Peta Laboratorium** | Read Only | Read Only | Publik terautentikasi dapat melihat posisi lab & jadwal. |
| **Kelola Master Data Lab (CRUD)** | ❌ Ditolak | Full Control | Hanya Asprak yang berhak mengubah koordinat & radius lab. |
| **Halaman Presensi Mandiri** | Full (Sesi Miliknya) | Read (Mode Simulasi) | Praktikan hanya bisa membuka presensi untuk kelas yang ia ikuti. |
| **Eksekusi Presensi (Check-in)** | Create (Jika Valid) | ❌ Ditolak | Sesi wajib `berlangsung`, jarak $\le$ radius, belum pernah check-in. |
| **Generate QR Code Presensi** | ❌ Ditolak | Full Control | Hanya Asprak pengampu sesi yang dapat menampilkan QR Code. |
| **Buka / Tutup Sesi Praktikum** | ❌ Ditolak | Full Control | Memicu FCM broadcast ke seluruh praktikan kelas. |
| **Ubah Jadwal Praktikum** | ❌ Ditolak | Full Control | Memicu FCM broadcast pemberitahuan perubahan jadwal. |
| **Pengajuan Izin Sesi** | Create & Read Own | ❌ Ditolak | Praktikan hanya mengajukan izin pada sesi kelasnya sendiri. |
| **Pemeriksaan & Keputusan Izin** | ❌ Ditolak | Full Control | Memicu FCM notification personal ke praktikan pengaju. |
| **Pendaftaran Token FCM Perangkat** | Create/Update Own | Create/Update Own | Pengguna hanya dapat menulis token FCM pada profil miliknya. |

---

## 4. Aturan Bisnis Bernomor (Business Rules)

- **BR-01 (Kondisi Keabsahan Sesi):** Presensi praktikan HANYA DAPAT dicatat jika sesi praktikum berada dalam status `berlangsung` (telah dibuka oleh Asprak dan belum ditutup).
- **BR-02 (Integritas Geofencing):** Praktikan dianggap berada di lokasi laboratorium apabila jarak kalkulasi perangkat terhadap koordinat laboratorium praktikum memenuhi:
  $$\text{Jarak (meter)} \le \text{Radius Toleransi Laboratorium (meter)}$$
  Jika jarak lebih besar dari radius yang ditentukan, sistem wajib menolak presensi dengan alasan eksplisit dan tidak menyimpan catatan kehadiran sebagai 'hadir'.
- **BR-03 (Anti-Presensi Ganda):** Praktikan hanya dapat melakukan presensi sukses sebanyak 1 (satu) kali per sesi praktikum. Percobaan check-in kedua pada sesi yang sama wajib ditolak oleh sistem (*idempotent mutation*).
- **BR-04 (Integritas Lokasi & Anti-Mock GPS):** Aplikasi wajib memeriksa apakah koordinat yang diperoleh berasal dari penyedia lokasi palsu (*mock location provider* / fake GPS). Jika terdeteksi *mock location*, presensi langsung dibatalkan dengan peringatan integritas akademik.
- **BR-05 (Metadata Audit Kehadiran):** Setiap presensi yang berhasil wajib menyimpan rekaman metadata audit: `checkInAt` (waktu lokal), `userLatitude`, `userLongitude`, `distanceMeters` (jarak saat check-in), serta `verificationMethod` (`geofence` atau `qr_geofence`).
- **BR-06 (Penentuan Radius Laboratorium):** Nilai radius laboratorium default adalah **50 meter**. Asprak diizinkan mengubah nilai radius dalam batas aman minimal **15 meter** dan maksimal **200 meter** untuk mengakomodasi struktur gedung bertingkat Informatika.
- **BR-07 (Kebijakan Push Notification Sesi):** Push notification pembukaan sesi hanya dikirimkan kepada praktikan yang terdaftar dalam kelas terkait (`classId`). Praktikan dari kelas lain tidak boleh menerima notifikasi tersebut.
- **BR-08 (Kebijakan Push Notification Izin):** Push notification hasil verifikasi izin (`diterima` atau `ditolak`) bersifat personal dan hanya dikirimkan ke perangkat praktikan yang mengajukan perizinan tersebut.
- **BR-09 (Lifecycle Device Token FCM):** Setiap kali pengguna login atau token FCM mengalami rotasi (*onTokenRefresh*), aplikasi wajib memperbarui dokumen token pengguna di Firestore (`users/{uid}/fcmTokens/{tokenId}`). Saat logout, token perangkat tersebut wajib dinonaktifkan/dihapus agar tidak menerima notifikasi pengguna sebelumnya.
- **BR-10 (Perilaku Offline Graceful):** Jika koneksi data internet terputus saat berada di halaman presensi, aplikasi harus menampilkan status offline visual, menonaktifkan tombol check-in (mencegah desinkronisasi validasi lokasi server), dan tidak melakukan crash.

---

## 5. Alur Utama Sistem (System Workflows)

### 5.1 Alur 1: Presensi Berbasis Geolokasi (End-to-End)
```
[Asprak]                 [Sistem / Firestore]             [Praktikan]
   |                              |                            |
   |--- 1. Buka Sesi Praktikum -->|                            |
   |    (status: 'berlangsung')   |--- 2. FCM Push Notif ----->| (Menerima Heads-up Banner)
   |                              |    "Sesi Praktikum Dibuka" |
   |                              |                            |--- 3. Tap Notif / Buka Screen
   |                              |                            |    Presensi Mandiri
   |                              |                            |--- 4. Request GPS Lokasi
   |                              |                            |--- 5. Hitung Haversine Distance
   |                              |                            |    ke Koordinat Lab
   |                              |                            |
   |                              |<-- 6. Submit Presensi -----| (Kirim Koordinat & Jarak)
   |                              |    (Verifikasi BR-01,02,03)|
   |                              |--- 7. Update Record ------>| (Visualisasi Sukses Presensi)
   |                              |    Kehadiran Firestore     |
   |<-- 8. Real-time Live Recap --|                            |
   |    (Jarak & Status Muncul)   |                            |
```

### 5.2 Alur 2: Eksplorasi Peta & Pemantauan Aktivitas Laboratorium
1. Pengguna (Praktikan/Asprak) membuka tab navigasi **Peta Lab**.
2. Aplikasi meminta izin lokasi perangkat (`ACCESS_FINE_LOCATION`).
3. MapView me-render peta satelit/vektor lingkungan Informatika Undip dengan *custom marker* pada tiap titik laboratorium.
4. Lokasi live pengguna ditampilkan sebagai marker lingkaran biru berkedip (*user location pulse*).
5. Pengguna menekan salah satu marker laboratorium (misal: "Lab Komputer 3").
6. Aplikasi membuka **Interactive Bottom Sheet** yang memuat:
   - Nama Lab, Gedung, Lantai, dan Kapasitas.
   - Radius Geofencing aktif (misal: 50m) dengan visualisasi lingkaran radius pada peta.
   - **Praktikum Berlangsung:** Nama matakuliah, kelas, nama Asprak, jam mulai–selesai, dan status sesi.
   - **Praktikum Berikutnya:** Jadwal sesi praktikum berikutnya di lab tersebut pada hari yang sama.
7. Pengguna dapat menekan tombol *Lihat Detail Sesi* atau *Navigasi ke Lokasi* jika sesi miliknya sedang berlangsung.

### 5.3 Alur 3: Notifikasi Event & Deep Linking
1. Suatu peristiwa terjadi pada data:
   - Skenario A: Asprak membuka sesi praktikum.
   - Skenario B: Asprak mengubah jam/ruang sesi praktikum.
   - Skenario C: Asprak menyetujui/menolak pengajuan izin praktikan.
2. Service pengirim notifikasi mengambil daftar device token FCM milik pengguna target dari Firestore.
3. Notifikasi dikirimkan dengan payload terstruktur memuat data navigasi:
   `{ type: "SESSION_OPENED", sessionId: "...", screen: "/praktikan/presensi/[sessionId]" }`
4. **Saat aplikasi di Background/Quit:** Sistem operasi menampilkan notifikasi di notification drawer / lockscreen. Pengguna melakukan tap notifikasi $\rightarrow$ aplikasi terbuka dan langsung melakukan *deep linking* ke layar target.
5. **Saat aplikasi di Foreground:** In-app Notification Banner (Notifee / custom snackbar) muncul di bagian atas layar dengan opsi "Buka Langsung".

---

## 6. Functional Requirements (FR)

### 6.1 Daftar Kebutuhan Fungsional Sprint 3 (FR-27 s/d FR-33)

#### FR-27: Halaman Presensi Mandiri Terpisah
- **Aktor:** Praktikan
- **Deskripsi:** Pengguna memiliki halaman khusus untuk melakukan presensi yang terpisah dari halaman detail informasi sesi. Halaman ini berfokus pada informasi kesiapan presensi, verifikasi lokasi, dan tombol presensi.
- **Aturan Bisnis:** BR-01, BR-02, BR-03, BR-10.
- **Acceptance Criteria (Dapat Diuji):**
  1. Halaman dapat diakses melalui rute `/praktikan/presensi/[sessionId]` atau tautan cepat pada kartu sesi.
  2. Menampilkan nama mata kuliah, kelas, nama laboratorium, jam sesi, dan sisa waktu pembukaan sesi (*countdown timer*).
  3. Menampilkan status kesiapan lokasi: indikator akurasi GPS, status izin lokasi, jarak terkini ke lab dalam satuan meter, dan keterangan apakah pengguna berada di dalam atau di luar radius.
  4. Tombol presensi ("Hadir Sekarang") berada dalam status *disabled* jika pengguna berada di luar radius atau status sesi bukan `berlangsung`.
  5. Tombol presensi menjadi *active* dengan umpan balik visual ketika seluruh kondisi terpenuhi.

#### FR-28: Validasi Geofencing & Rekam Presensi Berbasis Lokasi
- **Aktor:** Praktikan, Sistem
- **Deskripsi:** Sistem memeriksa posisi geografis aktual perangkat menggunakan algoritma *Haversine* terhadap koordinat laboratorium sebelum mencatat kehadiran praktikan ke Firestore.
- **Aturan Bisnis:** BR-02, BR-04, BR-05.
- **Acceptance Criteria (Dapat Diuji):**
  1. Perhitungan jarak menggunakan formula Haversine dengan akurasi deviasi $< 3$ meter dibandingkan koordinat riil.
  2. Jika $\text{jarak} \le \text{radius}$, request presensi diterima dan dokumen kehadiran tercatat di Firestore dengan `status: 'hadir'`, `distanceMeters`, koordinat latitude/longitude, dan timestamp ISO.
  3. Jika $\text{jarak} > \text{radius}$, request presensi dibatalkan, muncul *FeedbackBanner* berwarna merah dengan pesan: *"Gagal presensi: Anda berada [X] meter di luar radius laboratorium ([Y] meter)"*.
  4. Jika terdeteksi lokasi tiruan (*isMockLocation == true*), aksi ditolak dengan pesan: *"Lokasi palsu terdeteksi. Harap matikan aplikasi Fake GPS"*.

#### FR-29: Pengelolaan Lokasi & Radius Laboratorium
- **Aktor:** Asisten Praktikum (Asprak)
- **Deskripsi:** Asprak dapat melihat, menambah, mengubah koordinat (*latitude*, *longitude*), gedung, lantai, dan radius geofencing laboratorium praktikum melalui aplikasi.
- **Aturan Bisnis:** BR-06.
- **Acceptance Criteria (Dapat Diuji):**
  1. Tersedia daftar seluruh laboratorium Informatika (contoh: Lab RPL, Lab Jaringan & Sistem Tertanam, Lab Komputasi Terapan, Lab AI & Multimedia).
  2. Asprak dapat menekan tombol "Edit Lokasi" dan memasukkan koordinat manual atau menekan tombol "Gunakan Lokasi Saya Saat Ini" (*pinpoint current position*).
  3. Slider / input numerik penyesuaian radius toleransi (15m hingga 200m) dengan pratinjau lingkaran radius visual.
  4. Data yang disimpan langsung terdesentralisasi ke koleksi Firestore `laboratories` dan tersinkronisasi ke seluruh pengguna.

#### FR-30: Peta Laboratorium Interaktif (Interactive Maps)
- **Aktor:** Praktikan, Asisten Praktikum (Asprak)
- **Deskripsi:** Aplikasi menyediakan halaman peta interaktif berbasis Google Maps yang menampilkan seluruh laboratorium Informatika menggunakan pin/marker tematik serta marker posisi live perangkat.
- **Aturan Bisnis:** Tidak bergantung pada status sesi.
- **Acceptance Criteria (Dapat Diuji):**
  1. Halaman `/maps` me-render peta dengan titik fokus awal area Departemen Informatika Fakultas Sains dan Matematika Undip (Lat: `-7.049...`, Lng: `110.439...`).
  2. Marker laboratorium memiliki label nama lab dan ikon visual pembeda.
  3. Peta menampilkan marker lokasi pengguna (*blue pulse*) yang bergerak secara *smooth* saat posisi pengguna berpindah (*watchPositionAsync*).
  4. Terdapat tombol kontrol peta: "Pusatkan ke Lokasi Saya" (*Recenter*) dan "Fokus ke Laboratorium Informatika".
  5. Mengetuk marker laboratorium menampilkan *Callout* atau membuka *Bottom Sheet* informasi lab.

#### FR-31: Informasi Aktivitas Laboratorium Real-time
- **Aktor:** Praktikan, Asisten Praktikum (Asprak)
- **Deskripsi:** Menampilkan informasi jadwal praktikum yang sedang berlangsung dan praktikum berikutnya saat suatu laboratorium dipilih pada peta.
- **Aturan Bisnis:** Data bersumber dari relasi koleksi Firestore `sessions` dan `classes`.
- **Acceptance Criteria (Dapat Diuji):**
  1. Bottom sheet menampilkan kartu "Praktikum Berlangsung" jika ada sesi dengan `status == 'berlangsung'` di lab tersebut pada waktu saat ini.
  2. Jika tidak ada sesi aktif, kartu menampilkan status "Laboratorium Kosong / Tidak Ada Praktikum Aktif".
  3. Menampilkan daftar "Praktikum Berikutnya" yang terjadwal pada hari bersangkutan dengan urutan waktu termuda.
  4. Data aktivitas laboratorium terbarui secara otomatis tanpa me-refresh halaman ketika Asprak membuka/menutup sesi di Firestore (*real-time snapshot*).

#### FR-32: Push Notification Kegiatan & Perubahan Status (FCM)
- **Aktor:** Sistem, Praktikan, Asisten Praktikum
- **Deskripsi:** Pengiriman notifikasi push ke perangkat pengguna yang bersangkutan saat terjadi pembukaan sesi, pembaruan jadwal, atau verifikasi izin.
- **Aturan Bisnis:** BR-07, BR-08, BR-09.
- **Acceptance Criteria (Dapat Diuji):**
  1. Saat Asprak menekan "Buka Sesi", sistem mengirimkan FCM message ke semua device token praktikan terdaftar di kelas tersebut dalam waktu $< 5$ detik.
  2. Saat Asprak mengubah jam atau hari sesi praktikum, sistem mengirimkan notifikasi: *"Pemberitahuan: Jadwal praktikum [Nama Praktikum] mengalami perubahan"*.
  3. Saat Asprak menyetujui atau menolak izin, praktikan pengaju menerima notifikasi: *"Status Izin: Pengajuan izin Anda untuk sesi [Nama Sesi] telah [Diterima/Ditolak]"*.
  4. Mengetuk notifikasi di notification bar mengarahkan pengguna langsung (*deep link*) ke layar yang relevan (Layar Presensi atau Layar Riwayat Izin).

#### FR-33: Manajemen Izin Perangkat & Penanganan Kondisi Hardware
- **Aktor:** Sistem, Pengguna
- **Deskripsi:** Aplikasi menangani alur permintaan izin native (Lokasi & Notifikasi) serta memberikan respon yang informatif saat hardware GPS nonaktif, izin ditolak, atau koneksi terputus.
- **Aturan Bisnis:** BR-10.
- **Acceptance Criteria (Dapat Diuji):**
  1. Saat pertama kali mengakses fitur Lokasi/Peta/Presensi, sistem menampilkan dialog penjelasan izin yang ramah sebelum memicu sistem izin OS.
  2. Jika pengguna menolak izin lokasi, sistem menampilkan *State Banner*: *"Izin Lokasi Dibutuhkan untuk Melakukan Presensi"* dengan tombol langsung *"Buka Pengaturan Perangkat"*.
  3. Jika layanan GPS perangkat dalam kondisi nonaktif (Location Services Off), aplikasi mendeteksi dan menampilkan dialog peringatan: *"Aktifkan GPS perangkat Anda untuk melanjutkan"*.
  4. Aplikasi menangani timeout pencarian sinyal GPS ($>10$ detik) dengan opsi *"Coba Lagi"*.

#### FR-34 (Opsional / Nilai Tambah): Presensi Alternatif Berbasis QR Code
- **Aktor:** Asprak, Praktikan
- **Deskripsi:** Asprak dapat menampilkan QR Code dinamis terenkripsi pada layar perangkatnya, dan Praktikan dapat memindai QR Code tersebut melalui kamera perangkat di dalam radius laboratorium.
- **Aturan Bisnis:** Validasi QR Code tetap wajib menyertakan verifikasi geofencing (double verification).
- **Acceptance Criteria (Dapat Diuji):**
  1. Asprak dapat membuka modal "Tampilkan QR Presensi" pada sesi yang sedang berlangsung.
  2. Praktikan dapat membuka scanner kamera pada halaman presensi dan memindai kode QR.
  3. Presensi langsung tercatat dengan metode `qr_geofence`.

---

## 7. Penanganan Validasi dan Edge Cases

| Kategori | Skenario Edge Case | Perilaku Sistem / Penanganan |
|---|---|---|
| **Lokasi** | Pengguna berada persis di garis batas radius (misal 50.1 meter). | Tampilkan jarak presisi ("51 meter"), status luar radius, tombol disable. Beri petunjuk visual jarak selisih ke batas aman. |
| **Lokasi** | GPS drift / akurasi rendah ($>30$ meter). | Tampilkan peringatan "Akurasi GPS rendah, sedang menstabilkan posisi...". Tombol presensi menunggu hingga akurasi $< 20$ meter. |
| **Hardware** | Pengguna mematikan GPS saat berada di halaman presensi. | Listener status lokasi mendeteksi perubahan; UI langsung berubah ke state error GPS nonaktif. |
| **Koneksi** | Koneksi internet mati sesaat sebelum menekan tombol presensi. | Sistem mendeteksi offline via NetInfo, mencegah pengiriman mutasi, menampilkan banner: *"Koneksi terputus, pastikan Anda terhubung ke internet"*. |
| **Sesi** | Asprak menutup sesi praktikum saat praktikan sedang membuka layar presensi. | Listener real-time Firestore mengubah status sesi menjadi `selesai`. Tombol presensi otomatis berubah menjadi *disabled* secara instan tanpa reload. |
| **Notifikasi** | Token FCM kadaluarsa atau di-refresh oleh OS. | Event listener `messaging().onTokenRefresh` menangkap token baru dan menyimpannya secara otomatis ke Firestore. |
| **Notifikasi** | Notifikasi tiba saat aplikasi sedang aktif dibuka (Foreground). | Sistem menampilkan in-app notification banner (*toast top-bar*) dengan sound & vibration ringan, tidak menginterupsi alur pengguna. |
| **Baterai** | Mode penghemat baterai ekstrem membatasi geolokasi latar belakang. | Geolocation tracking di Maps hanya berjalan saat screen aktif (*foreground geolocation*), otomatis mati saat unmount/pindah tab. |

---

## 8. Non-Functional Requirements (NFR)

1. **Kinerja & Responsivitas:**
   - Waktu inisialisasi peta interaktif pertama kali $< 2.5$ detik pada jaringan 4G.
   - Waktu kalkulasi jarak geofencing $< 200$ ms sejak koordinat GPS diperoleh.
   - Waktu penyampaian push notification (end-to-end latency) $< 5$ detik setelah trigger terjadi di Firestore.
2. **Kebutuhan Platform & Versi OS Minimum:**
   - **Android:** Versi Android 10 (API level 29) ke atas, target SDK Android 15 (API level 35).
   - **iOS:** Versi iOS 15.0 ke atas.
3. **Keamanan & Integritas:**
   - Token otentikasi Firebase dan kredensial sesi disimpan menggunakan media penyimpanan terenkripsi yang aman (*Encrypted SharedPreferences* pada Android / *Keychain* pada iOS via SecureStore).
   - Pencegahan manipulasi lokasi dengan mendeteksi flag `mocked` pada koordinat lokasi Expo.
   - Pengamanan akses Firestore Security Rules: hanya pengguna terautentikasi dan terdaftar yang dapat menulis dokumen presensi miliknya.
4. **Efisiensi Daya & Sumber Daya:**
   - Penjejakan lokasi live (*watchPositionAsync*) dibatasi dengan interval waktu $\ge 3000$ ms atau perpindahan jarak $\ge 5$ meter untuk menghemat daya baterai perangkat.
   - Otomatis menghentikan subscription sensor GPS ketika pengguna keluar dari halaman Maps atau halaman Presensi.
5. **Ketersediaan & Keandalan Offline:**
   - Firestore Offline Persistence aktif untuk membaca data cache laboratorium dan jadwal saat sinyal seluler di dalam gedung laboratorium melemah.

---

## 9. Struktur Layar Aplikasi (Screen Navigation Structure)

Aplikasi menggunakan sistem navigasi berbasis berkas **Expo Router v58** dengan hierarki navigasi terstruktur:

```
src/app/
├── _layout.tsx                     # Root Stack: ThemeProvider, AuthGuard, NotificationProvider
├── index.tsx                       # Redirect Screen / Role Picker (Auth Gate)
├── (auth)/                         # Stack Otentikasi
│   ├── login.tsx                   # Layar Masuk Akun
│   └── register.tsx                # Layar Pendaftaran Akun
├── (shared)/                       # Layar Bersama Lintas Peran
│   └── maps.tsx                    # Layar Peta Laboratorium Interaktif (FR-30, FR-31)
├── asprak/                         # Stack Khusus Asisten Praktikum
│   ├── _layout.tsx                 # Asprak Stack Navigator
│   ├── (tabs)/                     # Asprak Bottom Tab Navigator
│   │   ├── _layout.tsx             # Tab Bar (Jadwal, Kelas, Rekap, Izin, Lab)
│   │   ├── index.tsx               # Jadwal Praktikum Asprak
│   │   ├── kelas.tsx               # Daftar Kelas Praktikum
│   │   ├── rekap.tsx               # Rekap Kehadiran Presensi
│   │   ├── izin.tsx                # Daftar Pengajuan Izin
│   │   └── lab.tsx                 # Manajemen Laboratorium (FR-29)
│   ├── lab/
│   │   ├── [id].tsx                # Form Ubah Koordinat & Radius Lab (FR-29)
│   │   └── baru.tsx                # Form Tambah Lab Baru
│   ├── session/
│   │   ├── [id].tsx                # Detail Sesi + Buka/Tutup + Broadcast Push (FR-32)
│   │   └── qr.tsx                  # Layar Generator QR Code Sesi (FR-34)
│   └── kelas/
│       └── [id].tsx                # Detail Kelas & Anggota
└── praktikan/                      # Stack Khusus Praktikan
    ├── _layout.tsx                 # Praktikan Stack Navigator
    ├── (tabs)/                     # Praktikan Bottom Tab Navigator
    │   ├── _layout.tsx             # Tab Bar (Sesi, Riwayat, Peta Lab)
    │   ├── index.tsx               # Sesi Praktikan Terdaftar
    │   ├── riwayat.tsx             # Riwayat Kehadiran Pribadi
    │   └── maps-tab.tsx            # Shortcut ke Layar Peta Lab (FR-30)
    └── presensi/
        └── [sessionId].tsx         # Halaman Khusus Presensi & Geofencing (FR-27, FR-28)
```

---

## 10. Technical Architecture & Database Design

### 10.1 Skema Data Cloud Firestore (Sprint 3 Extension)

#### 1. Koleksi `laboratories` (Master Data Laboratorium & Geofencing)
```json
{
  "id": "lab-rpl",
  "name": "Laboratorium Rekayasa Perangkat Lunak",
  "code": "LAB-RPL",
  "building": "Gedung E Lantai 2",
  "latitude": -7.049821,
  "longitude": 110.439120,
  "radius": 50,
  "capacity": 40,
  "description": "Lab untuk praktikum pemrograman, rekayasa web, dan mobile",
  "updatedAt": "2026-11-20T10:00:00.000Z",
  "updatedBy": "asprak-uid-123"
}
```

#### 2. Ekstensi Koleksi `sessions` (Penambahan Referensi Lab & Geofence)
```json
{
  "id": "session-401",
  "classId": "class-ppk-a",
  "courseName": "Pengembangan Platform Khusus",
  "classGroup": "Kelas A",
  "laboratoryId": "lab-rpl",
  "room": "Lab RPL (Gedung E)",
  "latitude": -7.049821,
  "longitude": 110.439120,
  "radius": 50,
  "status": "berlangsung",
  "qrCodeSecret": "sec_98a7sd987fa",
  "openedAt": "2026-11-20T08:00:00.000Z",
  "closedAt": null
}
```

#### 3. Ekstensi Sub-Koleksi `sessions/{sessionId}/attendance` (Audit Geolocation)
```json
{
  "participantId": "part-001",
  "nim": "24060122140001",
  "name": "Mahasiswa Praktikan 1",
  "checkInAt": "2026-11-20T08:05:22.000Z",
  "status": "hadir",
  "latitude": -7.049815,
  "longitude": 110.439115,
  "distanceMeters": 6.8,
  "isWithinRadius": true,
  "verificationMethod": "geofence",
  "deviceInfo": "Samsung Galaxy S22 (Android 14)"
}
```

#### 4. Koleksi `users/{uid}/fcmTokens` (Pendaftaran Token FCM Perangkat)
```json
{
  "token": "eF9as...kZ7",
  "platform": "android",
  "deviceModel": "Pixel 7 Pro",
  "lastActiveAt": "2026-11-20T12:00:00.000Z"
}
```

### 10.2 Spesifikasi Kontrak Service Antar-Komponen

```typescript
// Contract Geofencing & Jarak
export interface GeofenceCoordinate {
  latitude: number;
  longitude: number;
}

export interface GeofenceValidationResult {
  distanceMeters: number;
  isWithinRadius: boolean;
  accuracy: number;
  isMocked: boolean;
}

// Contract Notification Service
export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: 'SESSION_OPENED' | 'SCHEDULE_CHANGED' | 'PERMIT_DECISION';
    sessionId?: string;
    permitId?: string;
    screen: string;
    params?: Record<string, string>;
  };
}
```

---

## 11. Open Decisions & Asumsi Teknis

1. **Firebase Cloud Messaging Backend Provider:**
   - *Status:* Disepakati.
   - *Keputusan:* Mengingat arsitektur backend BaaS murni tanpa server terpisah yang kompleks pada tahap ini, pengiriman push notification diinisiasi melalui trigger service client yang memanggil Cloud Functions for Firebase HTTP / FCM v1 REST API menggunakan service account restricted token, dengan fallback local heads-up simulation saat offline.
2. **Kamera QR Code Scanner:**
   - *Status:* Disepakati sebagai fitur pengayaan / opsional (FR-34). Fitur utama validasi kehadiran tetap berfokus 100% pada Geofencing GPS (FR-27 & FR-28).
3. **Penyedia Peta:**
   - *Status:* Disepakati menggunakan `react-native-maps` dengan provider Google Maps untuk Android dan Apple Maps / Google Maps untuk iOS. Google Maps API Key Departemen Informatika Undip disuntikkan melalui `app.json` config plugin.

---
*Dokumen SRS ini telah ditinjau dan disahkan sebagai acuan tunggal pengerjaan Sprint 3.*
