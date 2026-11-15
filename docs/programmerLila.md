# Master Traceability & Ownership Matrix – Sprint 2 (Programmer Lila)

---

## Pendahuluan
Dokumen ini berisi **Traceability Matrix** yang menghubungkan tugas‑tugas sprint 2 dengan functional requirements (FR) yang harus dipenuhi oleh **programmer Lila**, serta **File Ownership Matrix** yang memastikan setiap berkas proyek hanya memiliki satu *Primary Owner* untuk menghindari konflik penggabungan kode.

---

## 1. Traceability Matrix (Sprint 2 – Praktikan)
| No. | Nama Tugas (Branch) | Functional Requirements (FR) | Deskripsi Singkat | Status |
|-----|----------------------|------------------------------|-------------------|--------|
| 1 | `feat/praktikan-schedule-view` | FR‑07, FR‑09 | Menampilkan jadwal praktikum dan detail sesi untuk praktikan. | TODO |
| 2 | `feat/praktikan-presensi` | FR‑10, FR‑11 | Implementasi presensi (check‑in) pada sesi yang terbuka, dengan pencegahan duplikasi presensi. | IN PROGRESS |
| 3 | `feat/praktikan-riwayat` | FR‑14 | Menampilkan riwayat kehadiran pribadi praktikan. | TODO |
| 4 | `feat/praktikan-izin-form` | FR‑16, FR‑17, FR‑18 | Formulir pengajuan izin (tanpa kolom *notes*), kirim alasan ke API AI, simpan hasil klasifikasi ke Firestore. | TODO |
| 5 | `feat/praktikan-izin-status` | FR‑21, FR‑22 | Menampilkan status pengajuan izin dan menon‑aktifkan presensi jika izin telah diterima. | TODO |
| 6 | `fix/praktikan-validation` | FR‑23 | Tambahkan validasi input pada semua form (registrasi, izin, presensi). | TODO |
| 7 | `feat/praktikan-error-handling` | FR‑24 | Penanganan error terpusat; tampilkan pesan user‑friendly untuk kegagalan autentikasi, Firestore, atau API AI. | TODO |
| 8 | `feat/praktikan-navigation` | FR‑25 | Navigasi UI menyesuaikan peran; hanya pengguna dengan role `praktikan` yang melihat tab Praktikan. | TODO |
| 9 | `feat/praktikan-notifications` | FR‑26 | Notifikasi toast untuk keberhasilan/gagalnya aksi (presensi, izin, dll). | TODO |

> **Catatan:** Setiap tugas diwujudkan dalam *branch* terpisah dengan pola `<type>/<deskripsi>`. Lila harus membuat branch secara lokal, mengimplementasikan fitur, menjalankan `npx tsc --noEmit` serta `npx expo lint`, kemudian membuat Pull Request untuk review.

---

## 2. File Ownership Matrix (Physical File Ownership & No‑Overlap Rule)
| No. | Path Relatif (dari root proyek) | Primary Owner | Keterangan |
|-----|--------------------------------|----------------|------------|
| 1 | `src/app/` | Lila | Semua file screen berada di sini; tidak ada file lain yang meng‑editnya. |
| 2 | `src/components/` | Lila | Komponen UI umum (Button, FeedbackBanner, dll). |
| 3 | `src/constants/` | Lila | Konstanta tema, API keys, dsb. |
| 4 | `src/data/` | Lila | `current-user.ts` (identitas mock) – satu‑satunya pemilik. |
| 5 | `src/features/praktikan/` | Lila | Semua fitur Praktikan (Schedule, Presensi, Izin, Riwayat, dll). |
| 6 | `src/services/` | Lila | Service layer (`dataService`, `validation.ts`, dll). |
| 7 | `src/types/` | Lila | Definisi tipe TypeScript (domain, api response, dsb). |
| 8 | `src/utils/` | Lila | Helper functions yang tidak spesifik fitur. |
| 9 | `app.json` & `app.config.js` | Lila | Konfigurasi Expo & plugin native. |
| 10 | `eas.json` | Lila | Config build EAS. |
| 11 | `babel.config.js`, `tsconfig.json`, `package.json` | Lila | File konfigurasi proyek. |
| 12 | `docs/` | Lila | Dokumentasi internal, termasuk file **programmerLila.md** ini. |

**Aturan No‑Overlap:**
- Setiap berkas **hanya** boleh memiliki **satu Primary Owner** (Lila). 
- Jika perubahan lintas‑modul diperlukan, Lila harus berkoordinasi melalui Pull Request review, bukan mengedit secara langsung di berkas milik orang lain.
- Penambahan atau penghapusan berkas harus selalu di‑track dalam PR, sehingga histori kepemilikan tetap jelas.

---

## 3. Cara Menggunakan Dokumen Ini
1. **Buka file** `docs/programmerLila.md` di editor.
2. Pilih tugas yang akan dikerjakan, buat branch sesuai nama pada kolom *Nama Tugas (Branch)*.
3. Setelah implementasi selesai, ubah kolom *Status* menjadi `DONE`.
4. Pastikan setiap perubahan file mengikuti **File Ownership Matrix** – jangan mengubah berkas yang dimiliki oleh orang lain.
5. Lakukan `npx tsc --noEmit` & `npx expo lint` sebelum mengirim PR.

---

*Dokumen ini dibuat secara otomatis oleh asisten AI Antigravity pada tanggal 15 Nov 2026 dan dapat diperbarui secara manual oleh Lila sesuai kebutuhan sprint.*
# Master Traceability & Ownership Matrix – Sprint 2

**Proyek:** Aplikasi Manajemen Absensi Praktikum (Expo/React Native)
**Sprint:** 2 (fokus pada integrasi backend, UI berbasis peran, dan alur izin)
**Disiapkan untuk:** *Awalila Adha Putri Telaumbanua* (programmer Lila)
**Referensi:** Functional Requirements FR‑01 – FR‑26 (lihat daftar pada percakapan).

---

## 1️⃣  Traceability Matrix (Fungsi ⇢ Tugas ⇢ Pemilik)
| FR | Deskripsi singkat | Tugas Sprint 2 (sub‑tugas) | Pemilik (Daniel) |
|----|-------------------|----------------------------|------------------|
| FR‑01 | Registrasi akun via Firebase Auth | • Implementasi `registerUser(email, password, role)` di `src/services/auth.ts`\n• UI form `RegisterScreen` (validasi)\n• Unit test | Daniel |
| FR‑02 | Login akun | • Implementasi `loginUser(email, password)` di `src/services/auth.ts`\n• UI `LoginScreen` dengan penanganan error\n• Persistensi token di async storage | Daniel |
| FR‑03 | Logout & akhiri sesi | • `logoutUser()` menghapus token & reset data aplikasi\n• Tambahkan tombol logout pada navigation drawer | Daniel |
| FR‑04 | Kontrol akses berbasis peran | • Tambahkan properti `role: 'asprak' | 'praktikan'` pada `AppData`\n• Middleware `requireRole` untuk guard navigation\n• Perbarui aturan keamanan Firestore (lihat tabel) | Daniel |
| FR‑15 | Sinkronisasi real‑time (sesi, presensi, rekap) | • Gunakan listener `onSnapshot` di `src/services/index.ts` untuk `sessions`, `attendance`, `permits`\n• Ekspos hook `useSessions()`, `useAttendance()`, `usePermits()` | Daniel |
| FR‑17 | Kirim alasan izin ke API AI | • Service `classifyReason(reason): Promise<AIClassification>` di `src/services/ai.ts`\n• Implementasi mock untuk mode lokal | Daniel |
| FR‑18 | Simpan hasil AI bersama data izin | • Tambahkan field `aiCategory`, `aiConfidence`, `aiModel` pada skema `LeaveRequest` di Firestore\n• Perbarui `submitLeave` agar menyimpan hasil AI | Daniel |
| FR‑23 | Validasi input (registrasi, izin) | • Reuse utilitas validasi di `src/services/validation.ts` untuk email, password, panjang alasan\n• Tampilkan pesan error inline di UI | Daniel |
| FR‑24 | Informasi kegagalan (auth, Firestore, AI) | • Handler terpusat `handleError(err)` yang mengubah ke pesan user‑friendly\n• Integrasi dengan Toast/FeedbackBanner | Daniel |

> **Catatan:** Semua FR lain (FR‑05 – FR‑14, FR‑16, FR‑19 – FR‑22, FR‑25 – FR‑26) dimiliki oleh tim Asisten & Praktikan, sehingga tidak termasuk dalam ruang lingkup Sprint 2 Daniel.

---

## 2️⃣  Physical File Ownership & No‑Overlap Rule
| File (relative to project root) | Primary Owner | Alasan / Tanggung Jawab |
|--------------------------------|--------------|--------------------------|
| `src/services/auth.ts` | Daniel | Semua panggilan Firebase Authentication (register, login, logout) dan manajemen token. |
| `src/services/ai.ts` | Daniel | Integrasi dengan layanan AI untuk klasifikasi alasan izin, serta fallback mock. |
| `src/services/index.ts` | Daniel | `dataService` pusat yang menyediakan listener real‑time dan helper CRUD, dengan filter berbasis peran. |
| `src/services/validation.ts` | Daniel | Utilitas validasi yang dipakai di form registrasi dan pengajuan izin. |
| `src/components/feedback-banner.tsx` | Daniel | Komponen UI untuk menampilkan pesan sukses / error (digunakan pada alur auth & izin). |
| `src/components/action-button.tsx` | Daniel | Komponen tombol generik dengan tema; dipakai di layar auth dan modal izin. |
| `src/context/auth-context.tsx` | Daniel | Context React yang menyediakan `user`, `role`, dan aksi autentikasi ke seluruh aplikasi. |
| `src/firebase/firestore.rules` | Daniel | Aturan keamanan yang menegakkan kontrol akses berbasis peran (sesuai FR‑04). |
| `src/app/(auth)/login.tsx` | Daniel | UI layar login (routing di `src/app/(auth)`). |
| `src/app/(auth)/register.tsx` | Daniel | UI layar registrasi. |
| `src/app/(auth)/_layout.tsx` | Daniel | Layout wrapper yang mengarahkan pengguna yang sudah terautentikasi. |
| `src/app/(auth)/logout.tsx` | Daniel | Layar sederhana yang memanggil `logoutUser()` saat dimount. |

**Aturan No‑Overlap:**
- Setiap file yang tercantum di atas **hanya boleh** diedit oleh Daniel selama Sprint 2. Jika anggota tim lain perlu mengubah file tersebut, mereka harus membuat **feature branch** dan mengajukan **pull request** untuk review.
- File baru yang muncul untuk tugas Daniel harus langsung ditambahkan ke tabel ini.
- File yang tidak tercantum dimiliki oleh pemilik lain (misalnya `src/features/asprak/*` atau `src/features/praktikan/*`).
- Komponen UI bersama (seperti `ThemedView`, `ThemedText`) berada di tim UI inti dan **read‑only** untuk sprint ini.

---

## 3️⃣  Cara Menggunakan Dokumen Ini
1. **Sebelum menulis kode**, cek tabel di atas untuk memastikan tugas yang akan dikerjakan memang milik Daniel dan file yang akan diubah adalah file yang dimiliki olehnya.
2. **Setelah selesai**, beri tanda pada kolom *Status* di Traceability Matrix dengan catatan singkat (misalnya *"implemented & unit‑tested"*).
3. **Jika menemukan** file yang belum terdaftar, tambahkan baris baru ke tabel *Physical File Ownership* dan komunikasikan perubahan tersebut ke tim.
4. **Selama review kode**, reviewer akan memverifikasi bahwa perubahan mematuhi aturan No‑Overlap.

---

*Dokumen ini disimpan di dalam folder `docs` proyek sebagai `programmerLila.md`. Saat ini belum ditambahkan ke version control; Anda dapat menambahkannya secara manual jika diperlukan.*