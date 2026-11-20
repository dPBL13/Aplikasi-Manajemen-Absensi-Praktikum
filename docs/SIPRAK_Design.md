# Mobile Design System & UI Specification
## Sistem Informasi Manajemen Presensi Praktikum (SIPRAK) Informatika Undip
### Versi Dokumen: 3.0.0 — Sprint 3: Geolocation, Interactive Maps & Push Notifications

---

## 1. Design Tokens (Front Matter)

### 1.1 Color Tokens (Palet Kanonikal)
Palet warna SIPRAK Informatika Undip mengusung karakter akademik yang segar, terpercaya, dan tenang (*Sage & Earth Green*), selaras dengan identitas kampus hijau Universitas Diponegoro dan pedoman visual kanonikal `UI_STYLE_GUIDE.md`.

```typescript
export const Palette = {
  // Brand Background & Surface
  background: '#87A878',       // Layar utama (Latar belakang aplikasi)
  surface: '#C7CCB9',          // Kartu sesi, kartu lab, panel elevasi tingkat 1
  button: '#B0BC98',           // Tombol primer, app header, border terpilih
  mint: '#CAE2BC',             // Permukaan alternatif: modal sheet, filter panel, banner sukses
  lime: '#DBF9B8',             // Aksen interaktif: field pencarian aktif, chip aktif, radar badge
  
  // Tipografi & Netral
  ink: '#1F2A1B',              // Teks utama kontras tinggi pada permukaan terang
  inkSoft: '#3D4B34',          // Teks sekunder, label atribut, deskripsi pembantu
  border: '#6F8A5E',           // Garis pembatas (divider), border kartu, handle modal
  link: '#235C3A',             // Tautan teks, aksi navigasi sekunder
  
  // Status Semantik (Multi-sensori: wajib disandingkan dengan teks & ikon)
  success: '#235C3A',          // Presensi sukses, dalam radius aman
  successSurface: '#CAE2BC',   // Latar badge sukses
  danger: '#8F2D22',           // Presensi ditolak, luar radius, bahaya/destruktif
  dangerSurface: '#F7DAD3',    // Latar badge bahaya/error
  warning: '#8A5A00',          // GPS akurasi rendah, sesi segera berakhir
  warningSurface: '#FFF0D4',   // Latar badge peringatan
  info: '#1B4D66',             // Status menunggu, praktikum mendatang
  infoSurface: '#D2EBF7',      // Latar badge info
  
  // Map & Geofencing Specific Tokens
  mapRadiusFill: 'rgba(135, 168, 120, 0.25)',     // Arsiran lingkaran radius lab
  mapRadiusStroke: '#235C3A',                     // Garis tepi lingkaran radius lab
  userLocationMarker: '#1976D2',                  // Titik live tracking pengguna
  userLocationAccuracy: 'rgba(25, 118, 210, 0.15)' // Lingkaran akurasi GPS
};
```

#### Pemetaan Dark Mode:
Pada mode gelap (*dark scheme*), hierarki kontras dijaga dengan memperdalam nada hijau sehingga teks terang tetap mencapai rasio kontras WCAG AA ($\ge 4.5:1$):
- `background`: `#3C5533`
- `surface`: `#557346`
- `surfaceAlt`: `#44613A`
- `highlight`: `#4A6A3E`
- `text`: `#F2F5F0`
- `textSecondary`: `#D0DBCB`
- `border`: `#6A8B5B`

### 1.2 Spacing & Grid Tokens
Skala spasi matematis berbasis kelipatan 4dp untuk menjamin ritme visual konsisten di seluruh ukuran layar mobile:

| Token | Ukuran (dp) | Penggunaan Utama |
|---|:---:|---|
| `Spacing.half` | 4dp | Jarak antar ikon dan teks kecil, padding chip mini. |
| `Spacing.one` | 8dp | Padding internal badge status, celah antar item berdekatan. |
| `Spacing.two` | 12dp | Padding input field, jarak antar elemen formulir. |
| `Spacing.three` | 16dp | Padding horizontal layar (*gutter*), padding kartu utama. |
| `Spacing.four` | 24dp | Margin antar seksi kartu, padding modal bottom sheet. |
| `Spacing.five` | 32dp | Jarak atas konten dari safe area, margin tombol aksi utama. |
| `Spacing.six` | 48dp | Ruang kosong pada empty state atau header hero. |

### 1.3 Border Radius Tokens
| Token | Ukuran (dp) | Penggunaan |
|---|:---:|---|
| `Radius.sm` | 6dp | Checkbox, badge status kecil, tooltip. |
| `Radius.md` | 8dp | Input text, action button, dropdown container. |
| `Radius.lg` | 16dp | Kartu sesi, kartu lab, floating card pada Maps. |
| `Radius.xl` | 24dp | Top corners pada Interactive Bottom Sheet modal. |
| `Radius.full` | 999dp | Pill status badge, user location dot, circular action buttons. |

### 1.4 Elevation & Shadows
- **Level 0 (Flat):** Permukaan inline, divider, border hairline (1dp).
- **Level 1 (Card Elevation):**
  - Android: `elevation: 2`
  - iOS: `shadowColor: '#1F2A1B'`, `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.08`, `shadowRadius: 4`
- **Level 2 (Floating Action / Bottom Sheet):**
  - Android: `elevation: 6`
  - iOS: `shadowColor: '#1F2A1B'`, `shadowOffset: { width: 0, height: -3 }`, `shadowOpacity: 0.14`, `shadowRadius: 8`

---

## 2. Arah Desain & Prinsip Utama Mobile

1. **Mobile-First & Glanceability:**
   Praktikan sering kali melakukan presensi sembari berjalan menuju laboratorium atau di tengah keramaian koridor. Informasi esensial (nama sesi, batas waktu, dan jarak ke lab) harus dapat dicerna dalam waktu $< 2$ detik.
2. **Kepatuhan Ergonomi Jempol (Thumb Zone):**
   Aksi kritis (tombol "Hadir Sekarang", tombol recenter peta, dan filter bottom sheet) diletakkan pada sepertiga bawah layar (*natural thumb zone*) agar dapat dioperasikan nyaman dengan satu tangan.
3. **Multi-Sensory Status Feedback:**
   Status kehadiran dan status geofencing tidak boleh hanya mengandalkan kode warna (merah/hijau). Setiap status wajib menyertakan ikon intuitif (misal: centang untuk valid, pin silang untuk luar radius) dan label teks eksplisit untuk menjamin aksesibilitas bagi pengguna dengan defisiensi penglihatan warna.
4. **Respon Perangkat Keras Transparan:**
   Saat aplikasi meminta atau memproses data GPS, berikan indikasi visual aktif (animasi radar, indikator spinner akurasi) sehingga pengguna memahami bahwa perangkat sedang bekerja mencari sinyal satelit.

---

## 3. Sistem Tipografi Mobile

Aplikasi menggunakan font sistem native (*San Francisco* pada iOS dan *Roboto* pada Android) untuk performa render maksimal tanpa beban download font web.

| Nama Style | Font Size | Line Height | Weight | Penggunaan |
|---|:---:|:---:|:---:|---|
| **Display Title** | 24sp | 32sp | 700 (Bold) | Header peta lab, judul besar modul presensi. |
| **Heading 1** | 20sp | 28sp | 700 (Bold) | Nama mata kuliah pada kartu detail, nama lab. |
| **Heading 2** | 18sp | 24sp | 600 (SemiBold)| Sub-judul seksi, judul modal bottom sheet. |
| **Subtitle** | 16sp | 22sp | 600 (SemiBold)| Label penting, judul kartu jadwal. |
| **Body Regular** | 14sp | 20sp | 400 (Regular) | Teks isi deskripsi lab, catatan asisten, pesan banner. |
| **Body Medium** | 14sp | 20sp | 500 (Medium) | Teks tombol aksi, input placeholder, info metadata. |
| **Caption** | 12sp | 16sp | 400 (Regular) | Timestamp jam presensi, teks jarak kecil, NIM praktikan. |
| **Badge Label** | 11sp | 14sp | 700 (Bold) | Teks status pill (SEMUA HURUF KAPITAL / UPPERCASE). |

---

## 4. Layout, Navigasi, dan Density Antarmuka

### 4.1 Safe Area & Touch Targets
- **Safe Area Insets:** Seluruh layar wajib dibungkus dalam `SafeAreaView` atau mengonsumsi `useSafeAreaInsets()` dari `react-native-safe-area-context` untuk menghindari *notch*, *dynamic island*, dan bilah navigasi gestur Android.
- **Minimum Touch Target:** Setiap elemen interaktif (tombol, chip, icon button, tab bar item) memiliki area sentuh minimum **44 x 44 dp**. Bila ikon berukuran 20dp, padding penambah minimal 12dp diterapkan secara transparan.

### 4.2 Struktur Navigasi Peran

#### A. Navigasi Praktikan:
- **Bottom Tab Bar (3 Tab):**
  1. `Sesi Saya` (Ikon: *calendar-month*) $\rightarrow$ Menampilkan daftar sesi kelas terdaftar dan countdown sesi aktif.
  2. `Riwayat` (Ikon: *history*) $\rightarrow$ Catatan kehadiran dan riwayat status izin.
  3. `Peta Lab` (Ikon: *map-marker-radius*) $\rightarrow$ Peta interaktif lab Informatika & aktivitasnya.
- **Stack Navigation (Layar Penuh):**
  - `/praktikan/presensi/[sessionId]` $\rightarrow$ Layar khusus presensi geofencing (dibuka dari kartu sesi di tab utama atau dari push notification).
  - `/praktikan/izin/baru` $\rightarrow$ Formulir pengajuan izin dengan klasifikasi AI.

#### B. Navigasi Asisten Praktikum (Asprak):
- **Bottom Tab Bar (5 Tab):**
  1. `Jadwal` (Ikon: *calendar-clock*) $\rightarrow$ Daftar sesi dan kontrol buka/tutup sesi.
  2. `Kelas` (Ikon: *account-group*) $\rightarrow$ Pengelolaan kelas dan daftar praktikan.
  3. `Rekap` (Ikon: *clipboard-check*) $\rightarrow$ Rekap kehadiran beserta jarak presensi praktikan.
  4. `Izin` (Ikon: *email-alert*) $\rightarrow$ Review pengajuan izin & hasil AI.
  5. `Lab` (Ikon: *office-building-marker*) $\rightarrow$ Pengelolaan titik koordinat dan radius lab.

---

## 5. Pola Komponen Spesifik Mobile

### 5.1 Komponen Tombol (Action Button)
- **Primary Action:** Latar `#B0BC98`, teks `#1F2A1B` (Bold), tinggi 48dp, radius 8dp. Digunakan untuk aksi utama seperti "Hadir Sekarang", "Buka Sesi", "Simpan Koordinat".
- **Danger Action:** Latar `#F7DAD3`, teks `#8F2D22`, border `#8F2D22` (1dp). Digunakan untuk "Tutup Sesi", "Hapus Kelas", "Tolak Izin".
- **Secondary / Ghost:** Latar transparan, border `#6F8A5E` (1dp), teks `#1F2A1B`. Digunakan untuk "Batal", "Gunakan Lokasi Saat Ini", "Filter".
- **Disabled State:** Opasitas 0.45, interaksi sentuh dinonaktifkan (`pointerEvents="none"`), teks abu-abu lembut.

### 5.2 Komponen Status Badge (Pill Badge)
Badge status wajib menampilkan ikon pembeda di samping label teks:
- **Status Hadir (Valid):** Background `#CAE2BC`, teks `#235C3A`, Ikon `CheckCircleIcon`.
- **Status Terlambat:** Background `#FFF0D4`, teks `#8A5A00`, Ikon `ClockAlertIcon`.
- **Status Di Luar Radius / Alpa:** Background `#F7DAD3`, teks `#8F2D22`, Ikon `MapMarkerOffIcon`.
- **Status Menunggu Review:** Background `#D2EBF7`, teks `#1B4D66`, Ikon `HourglassIcon`.

```
+------------------------------------+
|  [✓] HADIR • 08:04 (Jarak: 8m)     |  <-- Badge Hadir Valid
+------------------------------------+
|  [!] LUAR RADIUS (Jarak: 85m)      |  <-- Badge Luar Radius
+------------------------------------+
```

### 5.3 Komponen Feedback Banner (Toast / Banner)
- Menggunakan komponen `FeedbackBanner` yang membalut teks dengan latar belakang semantik:
  - Sukses: Latar `mint` (`#CAE2BC`), teks `link` (`#235C3A`).
  - Gagal / Error: Latar `dangerSurface` (`#F7DAD3`), teks `danger` (`#8F2D22`).
- Dapat menutup sendiri (*auto-dismiss*) setelah 4 detik untuk informasi biasa, atau memerlukan aksi manual *Tutup* jika berupa error kritis perangkat keras.

---

## 6. Pola Layar Kunci (Key Screen Patterns)

### 6.1 Layar Presensi Mandiri Praktikan (`/praktikan/presensi/[sessionId]`)

```
+-------------------------------------------------------+
| < Kembali              Presensi Sesi Praktikum        |
+-------------------------------------------------------+
|  MATA KULIAH                                          |
|  Praktikum Pengembangan Platform Khusus (Kelas A)     |
|  Ruang: Lab Rekayasa Perangkat Lunak (Gedung E Lt. 2) |
|                                                       |
|  +-------------------------------------------------+  |
|  | [Status: BERLANGSUNG]  •  Sisa Waktu: 00:24:15  |  |
|  +-------------------------------------------------+  |
|                                                       |
|  VERIFIKASI RADIUS & GEOLOKASI                        |
|  +-------------------------------------------------+  |
|  |                   ((  O  ))                     |  |
|  |             Radar Jarak Presensi                |  |
|  |                                                 |  |
|  |  Posisi Anda: 12 meter dari titik pusat lab     |  |
|  |  Radius Maksimum Diizinkan: 50 meter            |  |
|  |  Akurasi GPS: +/- 4 meter (Sangat Baik)         |  |
|  |                                                 |  |
|  |  [✓] Anda Berada di Dalam Radius Laboratorium   |  |
|  +-------------------------------------------------+  |
|                                                       |
|  [       HADIR SEKARANG (PRESENSI MANDIRI)        ]  |
|                                                       |
|  -- atau --                                           |
|  [   [Scan QR Code] Pindai Kode QR Asisten        ]  |
+-------------------------------------------------------+
```

**Karakteristik Interaksi:**
1. Saat layar dibuka, radar GPS langsung melakukan *pulsing animation*.
2. Jika jarak $\le 50\text{m}$, kotak status berubah menjadi hijau muda (`#CAE2BC`) dengan ikon centang tebal, dan tombol "Hadir Sekarang" menyala hijau siap ditekan.
3. Jika jarak $> 50\text{m}$, kotak status berwarna merah muda (`#F7DAD3`), teks berbunyi: *"Anda berada di luar radius lab (Jarak: 94m / Maks: 50m)"*. Tombol presensi dinonaktifkan.
4. Mengetuk tombol memicu konfirmasi haptic feedback (*Haptics.notificationAsync(Success)*) dan menampilkan animasi centang kehadiran.

### 6.2 Layar Peta Laboratorium Interaktif (`/(shared)/maps`)

```
+-------------------------------------------------------+
| [Cari Lab...]                       (Fokus Undip) (O) |
+-------------------------------------------------------+
|                                                       |
|                     [Lab AI & Multimedia]             |
|                                                       |
|               (•) Posisi Saya                         |
|                                                       |
|                   +------------------+                |
|                   | [Lab RPL]        |                |
|                   | Gedung E Lt. 2   |                |
|                   +------------------+                |
|                      \                                |
|                       \                               |
|                                                       |
+-------------------------------------------------------+
| ^ TARIK KE ATAS UNTUK DETAIL AKTIVITAS                |
| ----------------------------------------------------- |
| LABORATORIUM REKAYASA PERANGKAT LUNAK (Gedung E)     |
| Status Radius: 50 meter                               |
|                                                       |
| [Praktikum Sedang Berlangsung]                        |
| • Pemrograman Mobile (IF-301) - Kelas B               |
|   Asprak: Johan R. Calvin | 08:00 - 10:00             |
|                                                       |
| [Praktikum Berikutnya]                                |
| • Rekayasa Perangkat Lunak (IF-204) - 10:30 - 12:30   |
+-------------------------------------------------------+
```

**Karakteristik Interaksi:**
1. Peta menggunakan tema warna yang selaras dengan palet aplikasi (taman/rumput hijau lembut, bangunan abu-abu netral).
2. Marker laboratorium aktif (yang sedang menyelenggarakan praktikum) memiliki cincin cahaya animasi (*pulse ring*) pembeda.
3. Mengetuk marker menggeser kamera peta secara halus (*animateCamera*) ke titik pusat lab dan memunculkan *Interactive Bottom Sheet* berisi jadwal kegiatan realtime dari Firestore.

### 6.3 Layar Pengelolaan Lokasi Lab oleh Asprak (`/asprak/lab/[id]`)
- Menyediakan peta interaktif mini di bagian atas formulir dengan pin yang dapat digeser (*draggable marker*).
- Menampilkan slider penyesuaian radius (15m s/d 200m) dengan representasi lingkaran transparan yang membesar/mengecil secara real-time di atas peta.
- Tombol cepat: *"Ambil Titik Lokasi Saya Saat Ini"* yang secara otomatis mengisi latitude dan longitude dari posisi GPS asisten saat berada di laboratorium.

---

## 7. Pola Notifikasi Mobile & Dialog Sistem

### 7.1 Push Notification Banner (OS & In-App)
- **Heads-up Notification (Layar Kunci & Drawer):**
  - Judul: `SIPRAK Informatika Undip`
  - Body: `Sesi Praktikum Telah Dibuka: Praktikum Pemrograman Mobile (Kelas A). Segera lakukan presensi di Lab RPL!`
  - Sub-text / Channel: `Pengumuman Sesi Praktikum`
  - Aksi Cepat: `[Buka Presensi]` $\rightarrow$ langsung memicu deep link ke `/praktikan/presensi/[sessionId]`.
- **In-App Toast (Aplikasi Aktif di Foreground):**
  - Muncul melayang dari atas (*slide down* dari batas status bar) dengan latar `#CAE2BC`, border `#235C3A`, menyertakan tombol pintas *"Lihat"*.

### 7.2 Dialog Permintaan Izin Perangkat (Permission Primer)
Sebelum sistem operasi memunculkan dialog native yang kaku, SIPRAK menampilkan dialog pengantar (*in-app pre-permission dialog*):
- Ikon grafis satelit / pin peta.
- Judul: *"Akses Lokasi Diperlukan untuk Presensi"*.
- Pesan: *"Untuk memastikan kejujuran presensi praktikum di laboratorium Informatika Undip, kami memerlukan izin akses lokasi perangkat Anda saat menggunakan aplikasi."*
- Tombol: `[Izinkan Akses Lokasi]` (Memicu prompt sistem) dan `[Nanti Saja]`.

---

## 8. Penanganan State Khusus Mobile

1. **State Loading & Stabilisasi GPS:**
   - Menampilkan skeleton shimmer pada kartu informasi sesi.
   - Pada radar presensi, tampilkan animasi lingkaran memancar bertuliskan: *"Menstabilkan koordinat GPS Anda..."*.
2. **State Izin Lokasi Ditolak:**
   - Layar tidak boleh kosong atau crash.
   - Tampilkan ilustrasi lokasi mati, teks: *"Akses Lokasi Dinonaktifkan"*, dan tombol utama: `[Buka Pengaturan Aplikasi]` yang langsung membuka halaman Settings sistem via `Linking.openSettings()`.
3. **State Offline / Koneksi Terputus:**
   - Muncul pita oranye (*offline ribbon*) di bawah header bertuliskan: *"Anda sedang offline. Presensi membutuhkan koneksi internet aktif."*
   - Tombol submit presensi dinonaktifkan secara otomatis.
4. **Pull-to-Refresh & Keyboard Handling:**
   - Seluruh daftar sesi, rekap, dan riwayat mendukung gestur tarik untuk menyegarkan (*Pull-to-Refresh*) dengan indikator spinner berwarna `#235C3A`.
   - Seluruh form input dibungkus dalam `KeyboardAvoidingView` (behavior: `padding` di iOS, `height` di Android) dengan pendeteksi sentuhan luar untuk menutup keyboard (*TouchableWithoutFeedback onPress={Keyboard.dismiss}*).

---

## 9. Anti-Pattern (Larangan Desain)

- ❌ **DILARANG** mengandalkan warna saja untuk menyampaikan status valid/tidak valid (wajib ada teks dan ikon).
- ❌ **DILARANG** menggunakan tombol dengan tinggi kurang dari 44dp atau area sentuh kurang dari 44x44 dp.
- ❌ **DILARANG** membuat halaman presensi sebagai modal kecil atau tab tersembunyi yang sulit diakses cepat saat sesi dibuka.
- ❌ **DILARANG** menggunakan warna hex acak di luar `src/constants/theme.ts`.
- ❌ **DILARANG** menampilkan dialog error teknis Firebase atau exception stack trace ke layar mahasiswa. Gunakan bahasa Indonesia yang santun dan solutif.
- ❌ **DILARANG** membiarkan proses geotracking berjalan terus-menerus di background saat pengguna menutup aplikasi (boros baterai).

---
*Dokumen Design System ini mengikat seluruh implementasi visual komponen dan layar pada Sprint 3.*
