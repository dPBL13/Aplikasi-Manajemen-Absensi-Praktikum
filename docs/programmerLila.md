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