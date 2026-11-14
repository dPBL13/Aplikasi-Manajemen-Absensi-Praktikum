# Lapisan Layanan Praktikan (Praktikan Service Layer)

Dokumen ini menjelaskan rancangan arsitektur lapisan layanan (`src/features/praktikan/services/`), asumsi struktur koleksi dan field Firebase Cloud Firestore, serta pemetaan fungsi listener real-time untuk modul Praktikan pada **Sprint 2**.

---

## 1. Arsitektur Layanan & Pemisahan Tanggung Jawab

Modul Praktikan mengisolasi seluruh interaksi data ke dalam lapisan layanan (`praktikan-service.ts`). **Tidak ada komponen antarmuka/layar (UI) yang mengakses atau memanipulasi data secara langsung.**

Semua layar hanya berinteraksi melalui fungsi-fungsi kontrak:
- `getSessions()` & `subscribeSessions(callback)`
- `checkIn(sessionId)`
- `getAttendanceHistory()` & `subscribeAttendance(callback)`
- `submitLeave(leaveInput)` & `subscribeLeaves(callback)`

Setiap fungsi `subscribe*` menerima callback dan mengembalikan fungsi `unsubscribe` (`() => void`), mencerminkan pola `onSnapshot` pada Cloud Firestore SDK. Ketika Firebase Firestore nanti dikonfigurasi, implementasi di dalam file ini cukup diganti dengan panggilan Firestore tanpa merombak layar UI sama sekali.

---

## 2. Praktikan yang Sedang Login (Auth Dummy Seam)

Identitas praktikan yang sedang aktif saat ini dikelola melalui konstanta terpusat:
```ts
export const DUMMY_CURRENT_USER_ID = 'p6';
export const CURRENT_PRAKTIKAN: PraktikanUser = {
  id: DUMMY_CURRENT_USER_ID,
  nim: '24060122140006',
  name: 'Fajar Nugroho',
  email: 'fajar.nugroho@students.undip.ac.id',
  classGroup: 'Kelas A',
};
```
Saat integrasi Firebase Authentication dilakukan, konstanta ini cukup diarahkan ke `auth().currentUser?.uid` atau diambil dari dokumen user di Firestore.

---

## 3. Asumsi Skema Koleksi & Dokumen Firestore

Berikut adalah spesifikasi asumsi struktur koleksi dan field di Firestore yang disepakati untuk modul Praktikan:

### 3.1 Koleksi `sessions` (Sesi Praktikum)
Menyimpan data jadwal dan status sesi praktikum yang dikelola oleh Asisten Praktikum.

| Nama Field | Tipe Data | Deskripsi / Nilai Baku |
|---|---|---|
| `id` | `string` (Document ID) | ID unik sesi (misal: `"sesi-mobile-a"`) |
| `courseName` | `string` | Nama mata kuliah praktikum |
| `classGroup` | `string` | Kelas atau kelompok praktikum (misal: `"Kelas A"`) |
| `room` | `string` | Ruang laboratorium atau lokasi praktikum |
| `dayLabel` | `string` | Hari pelaksanaan (misal: `"Senin"`) |
| `dateLabel` | `string` | Tanggal praktikum (misal: `"26 Oktober 2026"`) |
| `startTime` | `string` | Waktu mulai format 24 jam (misal: `"08:00"`) |
| `endTime` | `string` | Waktu berakhir format 24 jam (misal: `"10:00"`) |
| `asprakName` | `string` | Nama Asisten Praktikum penanggung jawab |
| `status` | `string` | Status sesi: **`'belum-dibuka' \| 'berlangsung' \| 'selesai'`** (wajib mengikuti `src/types/session.ts`) |
| `openedAt` | `string \| null` | Waktu sesi dibuka (misal: `"08:00"`) |
| `closedAt` | `string \| null` | Waktu sesi ditutup (misal: `"10:02"`) |
| `closingNote` | `string \| null` | Catatan penutupan sesi oleh Asprak |
| `participants` | `Array<Participant>` | Daftar peserta terdaftar: `[{ id, name, nim, checkInAt? }]` |

---

### 3.2 Koleksi `attendances` (Catatan Presensi Pribadi)
Menyimpan bukti presensi mandiri yang dilakukan oleh Praktikan ketika sesi berstatus `'berlangsung'`.

| Nama Field | Tipe Data | Deskripsi / Nilai Baku |
|---|---|---|
| `id` | `string` (Document ID) | ID unik presensi |
| `sessionId` | `string` | Referensi ke `sessions.id` |
| `sessionTitle` | `string` | Judul / nama sesi untuk kemudahan tampilan riwayat |
| `courseName` | `string` | Nama mata kuliah praktikum |
| `classGroup` | `string` | Kelompok kelas |
| `room` | `string` | Ruangan praktikum |
| `dateLabel` | `string` | Tanggal pelaksanaan sesi |
| `timeLabel` | `string` | Rentang waktu sesi |
| `studentId` | `string` | UID praktikan (referensi ke `users.id`) |
| `studentName` | `string` | Nama lengkap praktikan |
| `studentNim` | `string` | Nomor Induk Mahasiswa praktikan |
| `status` | `string` | Status kehadiran: **`'hadir' \| 'belum-hadir' \| 'izin'`** |
| `checkInAt` | `string` | Jam presensi tercatat (format HH:MM, misal: `"08:15"`) |
| `notes` | `string` (opsional) | Keterangan tambahan presensi |

**Aturan Integritas Presensi:**
- Presensi hanya dapat dilakukan jika `session.status === 'berlangsung'`.
- Praktikan tidak diperbolehkan melakukan presensi ganda pada sesi yang sama (kombinasi unik `sessionId` + `studentId`).
- Jika sesi `'belum-dibuka'` atau `'selesai'`, presensi terkunci.

---

### 3.3 Koleksi `leave_requests` (Pengajuan Izin Praktikan)
Menyimpan form pengajuan izin untuk sesi tertentu, status verifikasi asisten, dan informasi hasil klasifikasi AI.

| Nama Field | Tipe Data | Deskripsi / Nilai Baku |
|---|---|---|
| `id` | `string` (Document ID) | ID unik pengajuan izin |
| `sessionId` | `string` | Referensi ID sesi praktikum |
| `sessionTitle` | `string` | Nama sesi praktikum |
| `courseName` | `string` | Nama mata kuliah |
| `studentId` | `string` | UID praktikan pengaju izin |
| `studentName` | `string` | Nama lengkap praktikan |
| `studentNim` | `string` | NIM praktikan |
| `category` | `string` | Kategori izin: `'sakit' \| 'akademik' \| 'mendesak' \| 'lainnya'` |
| `reason` | `string` | Alasan izin yang diisi praktikan (wajib diisi, min 5 karakter) |
| `notes` | `string` (opsional) | Catatan tambahan atau referensi dokumen bukti |
| `submittedAt` | `string` | Waktu pengajuan (misal: `"14 Nov 2026, 08:30"`) |
| `status` | `string` | **Status izin baku: `'menunggu' \| 'diterima' \| 'ditolak'`** |
| `reviewedAt` | `string \| null` | Waktu verifikasi oleh Asisten Praktikum |
| `reviewedBy` | `string \| null` | Nama / UID Asisten yang melakukan verifikasi |
| `reviewerNote` | `string \| null` | Catatan persetujuan atau alasan penolakan oleh Asprak |
| `aiClassification` | `map` (object) | Data informasi pendukung klasifikasi AI (lihat rincian di bawah) |

#### Rincian Field `aiClassification`:
```ts
{
  predictedCategory: string; // Misal: "Kesehatan / Medis", "Kegiatan Akademik Resmi"
  confidence: number;        // Skala 0.0 - 1.0 (contoh: 0.94 untuk kepastian 94%)
  summary: string;           // Ringkasan analisa teks alasan izin
  urgency: 'rendah' | 'sedang' | 'tinggi'; // Tingkat urgensi tindak lanjut
  disclaimer: string;        // Penegasan bahwa AI HANYA informasi pendukung
}
```

> **PENTING TENTANG HASIL AI (FR-21):**
> Hasil analisis AI **hanya berfungsi sebagai informasi pendukung** bagi Asisten Praktikum dalam meninjau pengajuan izin.
> Status izin yang baru diajukan **selalu bernilai `'menunggu'`**, dan **TIDAK PERNAH diterima atau ditolak secara otomatis oleh sistem AI**. Hak penerimaan maupun penolakan izin sepenuhnya dipegang oleh Asisten Praktikum.

---

### 3.4 Koleksi `users` (Pengguna Aplikasi)
Menyimpan profil pengguna yang terotentikasi.

| Nama Field | Tipe Data | Deskripsi / Nilai Baku |
|---|---|---|
| `id` | `string` (Document ID) | Firebase Auth UID |
| `nim` | `string` | Nomor Induk Mahasiswa / Nomor identitas |
| `name` | `string` | Nama lengkap |
| `email` | `string` | Alamat email institusi |
| `role` | `string` | Peran pengguna: `'praktikan' \| 'asprak'` |
| `classGroup` | `string` (opsional) | Kelas praktikan (misal: `"Kelas A"`) |
| `enrolledSessions` | `Array<string>` | Daftar ID sesi praktikum yang diikuti |

---

## 4. Panduan Transisi ke Firebase Cloud Firestore

Saat Firebase sudah siap dihubungkan ke repositori, migrasi fungsi pada `praktikan-service.ts` dilakukan dengan:

1. **`subscribeSessions`**:
   ```ts
   return onSnapshot(collection(db, 'sessions'), (snapshot) => {
     const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
     callback(data);
   });
   ```
2. **`checkIn`**:
   ```ts
   // Jalankan Firestore runTransaction untuk mencegah race condition / presensi ganda
   await runTransaction(db, async (transaction) => {
     // 1. Verifikasi status sesi == 'berlangsung'
     // 2. Verifikasi belum ada attendances untuk session + studentId
     // 3. Tambahkan dokumen ke attendances
     // 4. Update checkInAt pada array participants di dokumen session
   });
   ```
3. **`submitLeave`**:
   ```ts
   // Simpan dokumen ke koleksi 'leave_requests' dengan status 'menunggu'
   await addDoc(collection(db, 'leave_requests'), {
     ...leaveData,
     status: 'menunggu',
     aiClassification: await runAIClassification(leaveData.reason),
   });
   ```
4. **`subscribeAttendance` & `subscribeLeaves`**:
   ```ts
   const q = query(collection(db, 'attendances'), where('studentId', '==', currentUserId));
   return onSnapshot(q, (snapshot) => { ... });
   ```
