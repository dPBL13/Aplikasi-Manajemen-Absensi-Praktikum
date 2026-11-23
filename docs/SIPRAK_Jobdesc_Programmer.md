# Pembagian Kerja & Spesifikasi Tugas Programmer (Job Description)
## Sistem Informasi Manajemen Presensi Praktikum (SIPRAK) Informatika Undip
### Versi Dokumen: 3.0.0 — Sprint 3: Geolocation, Interactive Maps & Push Notifications

---

## 1. Prinsip Pembagian & Strategi Dependensi Rendah

### 1.1 Prinsip Vertical Slice (Domain Ownership End-to-End)
Untuk mengeliminasi hambatan koordinasi (*blocking*) dan konflik penggabungan kode (*merge conflicts*), pembagian kerja pada Sprint 3 diatur dengan prinsip **Vertical Slice Domain Ownership**:
- Setiap programmer memiliki kepemilikan penuh secara horizontal dan vertikal atas domain fiturnya: **skema data Firestore, service logic & kalkulasi, adapter/repository, layar UI (screen), komponen spesifik, hingga pengujian mandiri**.
- Satu task hanya memiliki **tepat satu Primary Owner**.
- Tidak diperbolehkan adanya pembagian kerja berbasis layer teknis (misal: satu programmer hanya membuat UI sementara programmer lain membuat logic untuk layar yang sama), karena terbukti menciptakan *hard dependency* yang tinggi dan saling tunggu.

### 1.2 Ringkasan Kepemilikan Domain Tim Programmer

| Programmer | Kode | Domain Utama | Fokus & Beban Kerja |
|---|:---:|---|---|
| **Johan Reinhart Calvin** | **JH** | **Laboratorium, Interactive Maps & Geofencing Calculator** | Master data laboratorium (`laboratories`), halaman peta interaktif Google Maps, marker live tracking, visualisasi aktivitas lab (ongoing & next), serta penyedia contract kalkulasi jarak (*Haversine*). |
| **Muhammad Hafidz** | **HF** | **Halaman Presensi Mandiri, Validasi Jarak & Rekap Kehadiran** | Halaman khusus presensi mandiri praktikan, alur eksekusi check-in tervalidasi radius geofencing, audit presensi pada rekap asisten, dan fitur presensi alternatif QR Code (opsional). |
| **Laurensius Brian Prayoga** | **YG** | **Push Notification (FCM), Event Triggers & Hardware Permissions** | Infrastruktur FCM v1, sinkronisasi device token, trigger pengiriman notifikasi (sesi dibuka, jadwal diubah, status izin), penanganan deep link, dan orkestrasi perizinan hardware (Location & Notification). |

---

## 2. Strategi Dependensi Minimum & Arsitektur Kontrak

### 2.1 Shared Foundation & Kontrak Antar-Programmer
Seluruh interaksi lintas-domain **HANYA DIPERBOLEHKAN** melalui antarmuka kontrak (*typed TypeScript interface*) yang dibekukan pada awal sprint (Fase 0). Konsumen (*consumer*) berhak dan wajib menggunakan implementasi tiruan (*mock / stub*) selama implementasi riil dari produsen (*owner*) belum selesai.

```
       +-------------------------------------------------------+
       |             SHARED KERNEL (Owner: Yoga / YG)          |
       |  - src/types/domain.ts (Domain Types & Entities)      |
       |  - src/constants/theme.ts (Design Tokens & Colors)    |
       |  - app.json / package.json (Config & Core Plugins)    |
       +-------------------------------------------------------+
                                |
        +-----------------------+-----------------------+
        |                                               |
        v                                               v
+-------------------------------+               +-------------------------------+
|  KONTRAK JOHAN (JH)           |               |  KONTRAK YOGA (YG)            |
|  - LaboratoryService          |               |  - NotificationService        |
|  - GeofencingCalculator       |               |  - DevicePermissionService    |
+-------------------------------+               +-------------------------------+
        |                                               |
        +-----------------------+-----------------------+
                                | (Dikonsumsi oleh)
                                v
                +-------------------------------+
                |  KONTRAK HAFIDZ (HF)          |
                |  - AttendanceLocationService  |
                |  - Presensi Screen & Action   |
                +-------------------------------+
```

### 2.2 Dependency Matrix Antar-Programmer

| Konsumen (Consumer) | Kontrak yang Dibutuhkan | Pemilik Kontrak | Aturan Bila Belum Tersedia (Stub Rule) |
|---|---|:---:|---|
| **Hafidz (HF)** | `GeofencingCalculator.calculateDistance()` | **Johan (JH)** | Konsumsi via stub matematika sederhana di folder mock (`src/services/mock/geofence-stub.ts`). |
| **Hafidz (HF)** | `LaboratoryService.getLaboratoryById()` | **Johan (JH)** | Gunakan data dummy seed laboratorium di `src/data/seed-labs.ts`. |
| **Hafidz (HF)** | `NotificationService.notifySessionOpened()` | **Yoga (YG)** | Panggil method interface yang me-resolve `Promise.resolve({ ok: true })` (no-op). |
| **Johan (JH)** | `DevicePermissionService.requestLocation()` | **Yoga (YG)** | Panggil `expo-location` langsung secara lokal atau gunakan mock izin granted. |
| **Johan (JH)** | `SessionActivitySelector.getLabSessions()` | **Hafidz (HF)** | Gunakan selector data sesi yang membaca data dari `AppData.sessions`. |

> **Analisis Hard Dependency:**
> Jumlah hard dependency lintas-owner adalah **NOL (0)** pada level kompilasi kode, karena semua pihak bekerja terhadap TypeScript Interface murni. Dependency fungsional saat integrasi hanya berjumlah **2 titik koordinasi** (kalkulasi jarak Hafidz $\rightarrow$ Johan, dan trigger notifikasi Hafidz/Johan $\rightarrow$ Yoga).

---

## 3. Rincian Penugasan Programmer (Task Breakdown)

### 3.1 Johan Reinhart Calvin (Kode: JH)
**Domain Scope:** Manajemen Data Laboratorium, Interactive Maps (Google Maps), Live Tracking Marker, Aktivitas Laboratorium Real-time, dan Geofencing Calculator Service.

| Task ID | Nama Task & Deskripsi Teknis | File Fisik Utama yang Dikerjakan | Hard Dependency | Output Kontrak |
|:---:|---|---|:---:|---|
| **JH-01** | **Spesifikasi Skema & Service Laboratorium:** Implementasi CRUD data laboratorium (`laboratories`) di Firestore & Mock. | `src/services/laboratory.ts`<br>`src/types/domain.ts` | Tidak Ada | `LaboratoryService`<br>`Laboratory` |
| **JH-02** | **Kalkulator Geodesi Haversine:** Pembuatan modul kalkulasi jarak presisi tinggi antara 2 koordinat (meter) & deteksi mock GPS. | `src/services/geofence-calculator.ts`<br>`src/utils/haversine.ts` | Tidak Ada | `calculateDistanceHaversine()`<br>`isCoordinateInRadius()` |
| **JH-03** | **Layar Pengelolaan Lab Asprak:** Antarmuka daftar lab, form tambah/edit koordinat lat/lng dan radius slider (15-200m). | `src/app/asprak/(tabs)/lab.tsx`<br>`src/app/asprak/lab/[id].tsx` | JH-01 | UI Kelola Lab |
| **JH-04** | **Setup Google Maps & Marker Interaktif:** Implementasi MapView terpusat area Informatika Undip dengan custom marker lab. | `src/app/(shared)/maps.tsx`<br>`src/components/maps/lab-marker.tsx` | JH-01 | UI Peta Lab |
| **JH-05** | **Live Tracking Marker Pengguna:** Menampilkan posisi pengguna secara realtime (*blue dot pulse*) menggunakan watch position. | `src/components/maps/user-location-marker.tsx`<br>`src/hooks/use-user-location.ts` | YG-02 | Hook `useUserLocation` |
| **JH-06** | **Interactive Bottom Sheet Aktivitas Lab:** Menampilkan praktikum sedang berlangsung & berikutnya saat marker lab diketuk. | `src/components/maps/lab-activity-sheet.tsx`<br>`src/services/lab-activity.ts` | JH-01 | Bottom Sheet Aktivitas |
| **JH-07** | **Visualisasi Radius Geofencing pada Peta:** Render overlay lingkaran transparan radius lab (`<Circle />`) saat lab dipilih. | `src/components/maps/geofence-circle.tsx` | JH-01, JH-02 | Komponen Circle |
| **JH-08** | **Unit & Visual Testing Modul Maps & Lab:** Pengujian perhitungan Haversine dan rendering peta di Android/iOS emulator. | `src/__tests__/haversine.test.ts`<br>`src/__tests__/laboratory.test.ts` | JH-01 s/d JH-07 | Test Suite Passed |

- **Larangan Scope Johan:**
  - ❌ Dilarang menyentuh logika pencatatan presensi praktikan atau mutasi koleksi `attendance`.
  - ❌ Dilarang mengonfigurasi Firebase Cloud Messaging (FCM) credentials atau token listener.

---

### 3.2 Muhammad Hafidz (Kode: HF)
**Domain Scope:** Halaman Presensi Mandiri Terpisah, Eksekusi Check-in dengan Validasi Radius Geofencing, Audit Presensi Asisten, dan Fitur Presensi QR Code.

| Task ID | Nama Task & Deskripsi Teknis | File Fisik Utama yang Dikerjakan | Hard Dependency | Output Kontrak |
|:---:|---|---|:---:|---|
| **HF-01** | **Layar Presensi Khusus Praktikan:** Halaman mandiri terpisah dari detail sesi, memuat info sesi, countdown, dan radar kesiapan. | `src/app/praktikan/presensi/[sessionId].tsx`<br>`src/features/praktikan/presensi-view.tsx` | Tidak Ada (UI Shell) | Layar Presensi Mandiri |
| **HF-02** | **Komponen Radar Status Geofencing:** Visualisasi radar jarak pengguna ke laboratorium (badge hijau dalam radius, merah luar radius). | `src/components/presensi/geofence-radar.tsx`<br>`src/components/presensi/distance-pill.tsx` | JH-02 (Gunakan Stub jika belum selesai) | Komponen Radar Jarak |
| **HF-03** | **Service Validasi & Eksekusi Presensi Lokasi:** Mutasi `checkInWithLocation()` yang memverifikasi BR-01, BR-02, BR-03 ke Firestore. | `src/services/attendance-location.ts`<br>`src/services/types.ts` | JH-01, JH-02 | `checkInWithLocation()` |
| **HF-04** | **Pencegahan Presensi Ganda & Offline Guard:** Menolak idempotensi check-in berulang dan menonaktifkan presensi saat offline. | `src/features/praktikan/attendance-guard.ts` | HF-03 | Guard Middleware |
| **HF-05** | **Rekap Kehadiran Terverifikasi Lokasi (Asprak):** Pembaruan layar rekap asisten untuk menampilkan badge jarak presensi praktikan. | `src/app/asprak/(tabs)/rekap.tsx`<br>`src/components/attendance-audit-row.tsx` | HF-03 | UI Rekap Audit Lokasi |
| **HF-06** | **Generator QR Code Sesi Presensi (Opsional/Pengayaan):** Layar asisten untuk menampilkan QR Code presensi dinamis per sesi praktikum. | `src/app/asprak/session/qr.tsx`<br>`src/components/qr-generator-modal.tsx` | Tidak Ada | UI Tampilkan QR |
| **HF-07** | **Scanner QR Code Praktikan (Opsional/Pengayaan):** Modal kamera pemindai QR code pada layar presensi dengan validasi ganda radius. | `src/components/presensi/qr-scanner-modal.tsx` | HF-01, HF-03 | Komponen Scanner QR |
| **HF-08** | **Integration Testing Alur Presensi Berbasis Lokasi:** Uji skenario dalam radius ($<50$m), luar radius ($>50$m), dan sesi belum dibuka. | `src/__tests__/attendance-location.test.ts` | HF-01 s/d HF-05 | Test Suite Passed |

- **Larangan Scope Hafidz:**
  - ❌ Dilarang mengubah koordinat atau skema master data laboratorium (`laboratories`).
  - ❌ Dilarang menyentuh listener FCM background atau broadcast notification service.

---

### 3.3 Laurensius Brian Prayoga (Kode: YG)
**Domain Scope:** Infrastruktur Push Notification (FCM), Event Broadcast Triggers, Deep Linking Routing, Device Permission Manager, dan Shared Foundation Configuration.

| Task ID | Nama Task & Deskripsi Teknis | File Fisik Utama yang Dikerjakan | Hard Dependency | Output Kontrak |
|:---:|---|---|:---:|---|
| **YG-01** | **Setup Native Push Notification & Channel:** Inisialisasi `@react-native-firebase/messaging`, channel notifikasi Android, permission iOS. | `src/services/notification.ts`<br>`plugins/withNotification.js` | Tidak Ada | `NotificationService` |
| **YG-02** | **Centralized Device Permission Manager:** Service terpadu penanganan izin runtime (Location & Notification) & prompt setting OS. | `src/services/device-permission.ts`<br>`src/hooks/use-app-permissions.ts` | Tidak Ada | `DevicePermissionService` |
| **YG-03** | **Manajemen Device Token FCM:** Pendaftaran token perangkat ke Firestore (`users/{uid}/fcmTokens`) saat login & rotasi token. | `src/services/fcm-token-sync.ts`<br>`src/context/notification-context.tsx` | YG-01 | FCM Token Sync |
| **YG-04** | **Event Trigger Sesi Dibuka:** Broadcast push notification ke praktikan terdaftar saat Asprak membuka sesi (`openSession`). | `src/services/triggers/session-triggers.ts` | YG-01 | Trigger Pembukaan Sesi |
| **YG-05** | **Event Trigger Perubahan Jadwal & Izin:** Pengiriman push notification saat jadwal diubah atau status izin diverifikasi Asprak. | `src/services/triggers/schedule-permit-triggers.ts`| YG-01 | Trigger Jadwal & Izin |
| **YG-06** | **Foreground Heads-up Toast & In-App Handler:** Menampilkan banner notifikasi melayang saat aplikasi aktif di foreground. | `src/components/notifications/in-app-toast.tsx`<br>`src/components/notifications/banner-renderer.tsx`| YG-01 | UI In-App Notification |
| **YG-07** | **Deep Link Notification Router:** Penanganan tap notifikasi di background/quit state untuk navigasi otomatis ke layar target. | `src/utils/notification-deep-link.ts`<br>`src/app/_layout.tsx` | YG-01 | Deep Link Navigator |
| **YG-08** | **E2E Testing Notifikasi & Permission Handling:** Pengujian simulasi payload FCM, trigger background, dan skenario izin ditolak. | `src/__tests__/notification-flow.test.ts` | YG-01 s/d YG-07 | Test Suite Passed |

- **Larangan Scope Yoga:**
  - ❌ Dilarang mengubah UI komponen form presensi atau kalkulasi geodesi geofencing.
  - ❌ Dilarang memodifikasi komponen rendering MapView Google Maps.

---

## 4. Master Traceability Matrix (Sprint 3)

Tabel berikut menghubungkan seluruh User Story, Functional Requirements (FR), Task ID, Pemilik (Owner), Antarmuka Layar / Endpoint, Model Data Firestore, Berkas Fisik, dan Pengujian Terkait.

| User Story | FR | Task ID | Owner | Layar / Endpoint API | Tabel / Model Firestore | Berkas Fisik Utama | Kriteria Pengujian / Acceptance |
|---|:---:|:---:|:---:|---|---|---|---|
| **US-01: Halaman Presensi Mandiri** | FR-27 | **HF-01** | **Hafidz** | `/praktikan/presensi/[sessionId]` | `sessions`, `laboratories` | `src/app/praktikan/presensi/[sessionId].tsx`<br>`src/features/praktikan/presensi-view.tsx` | Layar terpisah dari detail sesi, menampilkan radar, timer countdown, dan tombol presensi responsif. |
| **US-02: Validasi Radius Geofencing** | FR-28 | **HF-03** | **Hafidz** | `checkInWithLocation()` | `sessions/{id}/attendance` | `src/services/attendance-location.ts`<br>`src/features/praktikan/attendance-guard.ts` | Presensi ditolak jika jarak $>50$m. Presensi sukses jika $\le 50$m dengan rekaman jarak & koordinat. |
| **US-02: Kalkulator Geodesi** | FR-28 | **JH-02** | **Johan** | `calculateDistanceHaversine()` | N/A (Utility) | `src/services/geofence-calculator.ts`<br>`src/utils/haversine.ts` | Deviasi kalkulasi jarak $<3$m; mendeteksi flag mock location dari perangkat. |
| **US-03: Kelola Lokasi Laboratorium** | FR-29 | **JH-01**<br>**JH-03** | **Johan** | `/asprak/(tabs)/lab`<br>`/asprak/lab/[id]` | `laboratories` | `src/services/laboratory.ts`<br>`src/app/asprak/lab/[id].tsx` | Asprak berhasil menyimpan koordinat lat/lng dan mengubah radius slider (15-200m). |
| **US-04: Peta Lab Interaktif** | FR-30 | **JH-04**<br>**JH-05** | **Johan** | `/(shared)/maps`<br>`/praktikan/(tabs)/maps-tab` | `laboratories` | `src/app/(shared)/maps.tsx`<br>`src/components/maps/lab-marker.tsx` | Peta Google Maps me-render seluruh marker lab & titik live tracking lokasi pengguna. |
| **US-05: Aktivitas Lab Realtime** | FR-31 | **JH-06**<br>**JH-07** | **Johan** | Bottom Sheet Peta | `sessions`, `classes` | `src/components/maps/lab-activity-sheet.tsx`<br>`src/services/lab-activity.ts` | Memunculkan info praktikum berlangsung & berikutnya saat marker lab diketuk secara realtime. |
| **US-06: Push Notifikasi Sesi** | FR-32 | **YG-04** | **Yoga** | FCM Cloud Messaging | `users/{uid}/fcmTokens` | `src/services/triggers/session-triggers.ts`<br>`src/services/notification.ts` | Notifikasi tiba di perangkat praktikan kelas $<5$ detik saat sesi dibuka asisten. |
| **US-06: Push Notifikasi Jadwal & Izin**| FR-32 | **YG-05** | **Yoga** | FCM Cloud Messaging | `users/{uid}/fcmTokens` | `src/services/triggers/schedule-permit-triggers.ts` | Praktikan menerima notifikasi instan saat jadwal diubah atau pengajuan izin diputuskan. |
| **US-07: Penanganan Izin & Kondisi GPS**| FR-33 | **YG-02** | **Yoga** | Permission Dialog & Guard | N/A (Hardware State) | `src/services/device-permission.ts`<br>`src/hooks/use-app-permissions.ts` | Menampilkan dialog edukatif ramah saat izin ditolak; mendeteksi GPS mati dan membuka Settings OS. |
| **US-08 (Opsional): Presensi QR Code** | FR-34 | **HF-06**<br>**HF-07** | **Hafidz** | `/asprak/session/qr`<br>QR Modal Praktikan | `sessions` (`qrCodeSecret`) | `src/app/asprak/session/qr.tsx`<br>`src/components/presensi/qr-scanner-modal.tsx` | Praktikan dapat memindai QR asisten; presensi tercatat jika berada dalam radius laboratorium. |

---

## 5. Physical File Ownership & No-Overlap Rule

### 5.1 Matriks Kepemilikan Berkas Fisik (Physical File Ownership)
Setiap berkas dalam direktori proyek **HANYA MEMILIKI SATU PEMILIK UTAMA**. Dilarang keras mengedit berkas milik programmer lain tanpa izin tertulis melalui Pull Request review.

```
src/
├── app/
│   ├── _layout.tsx                     --> PRIMARY OWNER: Yoga (YG) [Shared Root Navigator]
│   ├── (shared)/
│   │   └── maps.tsx                    --> PRIMARY OWNER: Johan (JH)
│   ├── asprak/
│   │   ├── (tabs)/
│   │   │   ├── lab.tsx                 --> PRIMARY OWNER: Johan (JH)
│   │   │   └── rekap.tsx               --> PRIMARY OWNER: Hafidz (HF)
│   │   ├── lab/
│   │   │   ├── [id].tsx                --> PRIMARY OWNER: Johan (JH)
│   │   │   └── baru.tsx                --> PRIMARY OWNER: Johan (JH)
│   │   └── session/
│   │       └── qr.tsx                  --> PRIMARY OWNER: Hafidz (HF)
│   └── praktikan/
│       ├── (tabs)/
│       │   └── maps-tab.tsx            --> PRIMARY OWNER: Johan (JH)
│       └── presensi/
│           └── [sessionId].tsx         --> PRIMARY OWNER: Hafidz (HF)
│
├── components/
│   ├── maps/                           --> PRIMARY OWNER: Johan (JH)
│   │   ├── lab-marker.tsx
│   │   ├── user-location-marker.tsx
│   │   ├── lab-activity-sheet.tsx
│   │   └── geofence-circle.tsx
│   ├── presensi/                       --> PRIMARY OWNER: Hafidz (HF)
│   │   ├── geofence-radar.tsx
│   │   ├── distance-pill.tsx
│   │   └── qr-scanner-modal.tsx
│   └── notifications/                  --> PRIMARY OWNER: Yoga (YG)
│       ├── in-app-toast.tsx
│       └── banner-renderer.tsx
│
├── services/
│   ├── laboratory.ts                   --> PRIMARY OWNER: Johan (JH)
│   ├── geofence-calculator.ts          --> PRIMARY OWNER: Johan (JH)
│   ├── attendance-location.ts          --> PRIMARY OWNER: Hafidz (HF)
│   ├── notification.ts                 --> PRIMARY OWNER: Yoga (YG)
│   ├── device-permission.ts            --> PRIMARY OWNER: Yoga (YG)
│   ├── fcm-token-sync.ts               --> PRIMARY OWNER: Yoga (YG)
│   └── triggers/                       --> PRIMARY OWNER: Yoga (YG)
│       ├── session-triggers.ts
│       └── schedule-permit-triggers.ts
│
├── hooks/
│   ├── use-user-location.ts            --> PRIMARY OWNER: Johan (JH)
│   └── use-app-permissions.ts          --> PRIMARY OWNER: Yoga (YG)
│
└── utils/
    ├── haversine.ts                    --> PRIMARY OWNER: Johan (JH)
    └── notification-deep-link.ts       --> PRIMARY OWNER: Yoga (YG)
```

### 5.2 Berkas Bersama Rawan Konflik & Change Request Protocol (CRP)
Berkas-berkas berikut merupakan area bersama yang sensitif terhadap potensi konflik:

| Berkas Rawan Konflik | Primary Gatekeeper | Aturan Perubahan bagi Non-Owner |
|---|:---:|---|
| `src/types/domain.ts` | **Yoga (YG)** | Tipe data baru diajukan melalui PR khusus di Fase 0 (*Contract Freeze*). Dilarang menambah tipe sepihak. |
| `src/app/_layout.tsx` | **Yoga (YG)** | Penambahan provider baru (Notification/Location) hanya dilakukan oleh Yoga. |
| `package.json` & lock | **Yoga (YG)** | Penginstalan library baru wajib menggunakan `npx expo install` dan dikoordinasikan ke Yoga. |
| `app.json` / `eas.json`| **Yoga (YG)** | Konfigurasi native plugins (Google Maps API Key, FCM, Permissions) dikelola penuh oleh Yoga. |
| `src/services/index.ts`| **Hafidz (HF)** | Pendaftaran service method baru ke facade singleton dikoordinasikan ke Hafidz. |

---

## 6. Aturan No-Overlap & Konvensi Git

1. **Aturan 1 Berkas 1 Pemilik (No-Overlap Rule):**
   Tidak ada dua programmer yang melakukan *commit* pada berkas fisik yang sama dalam satu sprint. Jika Anda membutuhkan fungsionalitas dari berkas programmer lain, panggil melalui *interface contract*.
2. **Konvensi Branch:**
   Setiap task wajib dikerjakan pada branch terpisah dengan format:
   - Johan: `feat/jh-<nomor_task>-<deskripsi_singkat>` (contoh: `feat/jh-04-interactive-maps`)
   - Hafidz: `feat/hf-<nomor_task>-<deskripsi_singkat>` (contoh: `feat/hf-01-presensi-screen`)
   - Yoga: `feat/yg-<nomor_task>-<deskripsi_singkat>` (contoh: `feat/yg-01-fcm-setup`)
3. **Prosedur Penambahan Dependency:**
   - Dilarang menjalankan `npm install` langsung untuk paket native. Wajib menggunakan `npx expo install <package_name>` untuk menjamin kecocokan dengan Expo SDK 58.
4. **Protokol "BLOCKED":**
   Bila seorang programmer belum dapat menguji integrasi karena ketergantungan pada modul rekan lain yang belum selesai, programmer tersebut:
   - Dilarang membuat file implementasi duplikat milik rekan lain.
   - Wajib menandai task sebagai `BLOCKED - Menunggu Contract [NamaContract] dari [Owner]`.
   - Menggunakan stub mock lokal pada direktori `__mocks__` atau beralih mengerjakan task mandiri berikutnya.

---

## 7. Urutan Implementasi per Fase (Execution Roadmap)

```
[FASE 0: Contract & Setup] 
├── Yoga: Setup package (react-native-maps, firebase-messaging, expo-location), app.json config.
├── Tim: Finalisasi & Freeze antarmuka TypeScript di src/types/domain.ts & src/services/types.ts.
└── Durasi: Hari ke-1

[FASE 1: Domain Core & Mock Services]
├── Johan: Implementasi Haversine Calculator, Laboratory CRUD, dan Seed Data Lab.
├── Hafidz: Membangun UI Layar Presensi Mandiri & Komponen Radar Geofencing (pakai Haversine Stub).
├── Yoga: Inisialisasi FCM Service, Handler Token Perangkat, dan Device Permission Manager.
└── Durasi: Hari ke-2 s/d Hari ke-4

[FASE 2: Integrasi Komponen & Hardware]
├── Johan: Integrasi Google Maps MapView, Custom Marker Lab, dan Activity Bottom Sheet.
├── Hafidz: Integrasi CheckInWithLocation ke Firestore & Proteksi Anti-Presensi Ganda.
├── Yoga: Hubungkan Event Triggers (Buka Sesi/Jadwal/Izin) ke FCM Service & Deep Link Router.
└── Durasi: Hari ke-5 s/d Hari ke-7

[FASE 3: End-to-End Testing, Hardening & DoD]
├── Seluruh Tim: Verifikasi uji coba di perangkat fisik (Android & iOS).
├── Verifikasi skenario: Masuk radius, keluar radius, GPS mati, airplane mode, notifikasi heads-up.
├── Penegakan Quality Gate: npx tsc --noEmit && npx expo lint bebas error.
└── Durasi: Hari ke-8
```

---

## 8. Definition of Done (DoD)

Sebuah tugas (Task) dinyatakan **DONE** apabila memenuhi seluruh kriteria berikut:
1. **Fungsionalitas Terverifikasi:** Fitur berfungsi sesuai *Acceptance Criteria* pada dokumen SRS tanpa regresi terhadap fitur Sprint 1 & 2.
2. **Pengujian Perangkat Fisik / Emulator Target:** Telah diuji pada emulator Android (API 34/35) dan/atau perangkat fisik Android 10+ serta iOS 15+.
3. **Validasi Geofencing Nyata:** Membuktikan bahwa presensi sukses hanya saat koordinat berada di dalam radius dan gagal dengan pesan jelas saat di luar radius.
4. **Respon Push Notifikasi Terbukti:** Notifikasi berhasil tampil di lockscreen/drawer saat sesi dibuka dan berhasil melakukan deep link ke layar presensi saat diketuk.
5. **Quality Gates Passed:**
   - Eksekusi `npx tsc --noEmit` menghasilkan **0 error** (tidak ada pelanggaran tipe).
   - Eksekusi `npx expo lint` menghasilkan **0 error**.
6. **No Hardcoded Hex:** Tidak ada penggunaan warna heksadesimal baru di luar `src/constants/theme.ts`.
7. **Clean Git PR:** Kode di-merge ke branch `develop` melalui Pull Request dengan minimal 1 persetujuan dari Project Manager / Peer Reviewer tanpa konflik merge.

---
*Dokumen Job Description ini mengikat seluruh programmer tim SIPRAK Informatika Undip pada Sprint 3.*
